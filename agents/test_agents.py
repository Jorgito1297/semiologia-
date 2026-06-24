"""
Test Suite — NEXUS AI Agents
==============================
Tests for all agents in the NEXUS AI system.
Runs without a live Ollama instance where possible by mocking HTTP calls.

Run:
    python agents/test_agents.py
    python agents/test_agents.py -v          # verbose
    python agents/test_agents.py --live      # include tests that need Ollama
"""

import asyncio
import json
import sys
import time
import argparse
import unittest
import hashlib
from pathlib import Path
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch
import logging

sys.path.insert(0, str(Path(__file__).parent.parent))

logging.disable(logging.CRITICAL)

from agents.base_agent import BaseAgent, AgentConfig, AgentMessage
from agents.rag_agent import RAGAgent, CHUNK_SIZE, CHUNK_OVERLAP
from agents.coding_agent import CodingAgent
from agents.research_agent import ResearchAgent
from agents.doc_agent import DocAgent
from agents.orchestrator import OrchestratorAgent, TASK_ROUTING


def _make_mock_http():
    mock_http = AsyncMock()
    mock_chat_response = MagicMock()
    mock_chat_response.status_code = 200
    mock_chat_response.json.return_value = {"message": {"content": "Test response from mock Ollama"}}
    mock_chat_response.raise_for_status = MagicMock()

    mock_embed_response = MagicMock()
    mock_embed_response.status_code = 200
    mock_embed_response.json.return_value = {"embedding": [0.1] * 768}
    mock_embed_response.raise_for_status = MagicMock()

    mock_tags_response = MagicMock()
    mock_tags_response.status_code = 200
    mock_tags_response.json.return_value = {"models": [{"name": "qwen3:8b"}, {"name": "nomic-embed-text"}]}
    mock_tags_response.raise_for_status = MagicMock()

    async def post_side_effect(url, **kwargs):
        if "/api/embeddings" in url:
            return mock_embed_response
        return mock_chat_response

    async def get_side_effect(url, **kwargs):
        return mock_tags_response

    mock_http.post = AsyncMock(side_effect=post_side_effect)
    mock_http.get  = AsyncMock(side_effect=get_side_effect)
    mock_http.aclose = AsyncMock()
    return mock_http


class TestAgentConfig(unittest.TestCase):
    def test_defaults(self):
        cfg = AgentConfig(name="test", description="desc")
        self.assertEqual(cfg.preferred_model, "qwen3:8b")
        self.assertEqual(cfg.temperature, 0.3)
        self.assertEqual(cfg.max_tokens, 4096)
        self.assertEqual(cfg.max_retries, 3)

    def test_custom_values(self):
        cfg = AgentConfig(name="coder", description="code",
                          preferred_model="qwen2.5-coder:7b", temperature=0.1, max_tokens=8192)
        self.assertEqual(cfg.preferred_model, "qwen2.5-coder:7b")
        self.assertEqual(cfg.temperature, 0.1)
        self.assertEqual(cfg.max_tokens, 8192)

    def test_agent_message_has_timestamp(self):
        msg = AgentMessage(role="user", content="hello")
        self.assertIsNotNone(msg.timestamp)
        self.assertEqual(msg.role, "user")


class TestBaseAgent(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.agent = BaseAgent(AgentConfig(name="base_test", description="test"))
        self.agent.http = _make_mock_http()

    async def asyncTearDown(self):
        await self.agent.http.aclose()

    async def test_health_check_returns_dict(self):
        status = await self.agent.health_check()
        self.assertIn("agent", status)
        self.assertIn("ollama", status)

    async def test_health_check_detects_ollama_up(self):
        status = await self.agent.health_check()
        self.assertTrue(status["ollama"])
        self.assertIn("qwen3:8b", status.get("ollama_models", []))

    def test_save_and_recall_memory(self):
        self.agent.save_memory("last_query", "semiologia")
        self.assertEqual(self.agent.recall("last_query"), "semiologia")

    def test_recall_missing_key_returns_none(self):
        self.assertIsNone(self.agent.recall("nonexistent_key_xyz"))

    def test_clear_history(self):
        self.agent.conversation_history.append(AgentMessage(role="user", content="hi"))
        self.agent.clear_history()
        self.assertEqual(len(self.agent.conversation_history), 0)

    async def test_generate_calls_ollama(self):
        result = await self.agent.generate("Test prompt")
        self.assertEqual(result, "Test response from mock Ollama")

    async def test_embed_returns_list(self):
        embedding = await self.agent.embed("some text")
        self.assertIsInstance(embedding, list)
        self.assertEqual(len(embedding), 768)


class TestRAGAgentChunking(unittest.TestCase):
    def setUp(self):
        with patch.object(RAGAgent, "_load_index"):
            self.agent = RAGAgent.__new__(RAGAgent)
            self.agent.index = []
        self.chunk_text = RAGAgent._chunk_text.__get__(self.agent, RAGAgent)
        self.cosine    = RAGAgent._cosine_similarity.__get__(self.agent, RAGAgent)

    def test_chunk_text_basic(self):
        text = " ".join(["word"] * 600)
        chunks = self.chunk_text(text, "test.txt")
        self.assertGreater(len(chunks), 0)
        for c in chunks:
            self.assertLessEqual(c["word_count"], CHUNK_SIZE)

    def test_chunk_text_skips_small(self):
        text = " ".join(["word"] * 10)
        self.assertEqual(len(self.chunk_text(text, "tiny.txt")), 0)

    def test_chunk_ids_are_unique(self):
        text = " ".join(["w"] * 1200)
        ids = [c["id"] for c in self.chunk_text(text, "u.py")]
        self.assertEqual(len(ids), len(set(ids)))

    def test_chunk_source_field(self):
        text = " ".join(["x"] * 100)
        for c in self.chunk_text(text, "src/app/page.tsx"):
            self.assertEqual(c["source"], "src/app/page.tsx")

    def test_cosine_similarity_identical(self):
        v = [1.0, 0.0, 0.0]
        self.assertAlmostEqual(self.cosine(v, v), 1.0, places=5)

    def test_cosine_similarity_orthogonal(self):
        self.assertAlmostEqual(self.cosine([1.0, 0.0], [0.0, 1.0]), 0.0, places=5)

    def test_cosine_similarity_opposite(self):
        self.assertAlmostEqual(self.cosine([1.0, 0.0], [-1.0, 0.0]), -1.0, places=5)

    def test_cosine_similarity_empty(self):
        self.assertEqual(self.cosine([], []), 0.0)

    def test_cosine_similarity_mismatched(self):
        self.assertEqual(self.cosine([1.0, 2.0], [1.0]), 0.0)


class TestRAGAgentRetrieval(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        with patch.object(RAGAgent, "_load_index"):
            self.agent = RAGAgent()
        self.agent.http = _make_mock_http()
        self.agent.index = [
            {"id": "a1", "source": "dashboard.tsx", "chunk_index": 0,
             "text": "dashboard shows patient metrics", "word_count": 5,
             "embedding": [0.9, 0.1, 0.0] + [0.0] * 765},
            {"id": "b2", "source": "rag_agent.py", "chunk_index": 0,
             "text": "RAG retrieval augmented generation", "word_count": 5,
             "embedding": [0.1, 0.9, 0.0] + [0.0] * 765},
            {"id": "c3", "source": "login.tsx", "chunk_index": 0,
             "text": "login firebase authentication", "word_count": 4,
             "embedding": [0.0, 0.0, 1.0] + [0.0] * 765},
        ]

    async def asyncTearDown(self):
        await self.agent.http.aclose()

    async def test_retrieve_returns_top_k(self):
        results = await self.agent.retrieve("query", top_k=2)
        self.assertEqual(len(results), 2)

    async def test_retrieve_has_score_field(self):
        results = await self.agent.retrieve("dashboard")
        for r in results:
            self.assertIn("score", r)

    async def test_retrieve_sorted_by_score(self):
        results = await self.agent.retrieve("anything", top_k=3)
        scores = [r["score"] for r in results]
        self.assertEqual(scores, sorted(scores, reverse=True))

    async def test_retrieve_empty_index(self):
        self.agent.index = []
        self.assertEqual(await self.agent.retrieve("q"), [])

    async def test_query_returns_string(self):
        result = await self.agent.query("What does the dashboard page do?")
        self.assertIsInstance(result, str)
        self.assertGreater(len(result), 0)

    async def test_query_empty_index_fallback(self):
        self.agent.index = []
        result = await self.agent.query("fallback query")
        self.assertIsInstance(result, str)

    async def test_retrieve_skips_no_embedding(self):
        self.agent.index = [{"id": "x", "source": "x.py", "chunk_index": 0,
                              "text": "text", "word_count": 5, "embedding": []}]
        self.assertEqual(await self.agent.retrieve("q"), [])


class TestRAGAgentIngest(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        import tempfile
        with patch.object(RAGAgent, "_load_index"):
            self.agent = RAGAgent()
        self.agent.http = _make_mock_http()
        self.agent.index = []
        self.tmpdir = Path(tempfile.mkdtemp())
        (self.tmpdir / "page.tsx").write_text("export default function Dashboard() { return <div>Metrics</div>; } " * 30, encoding="utf-8")
        (self.tmpdir / "utils.py").write_text("def score(a): return sum(a)/len(a) if a else 0.0\n" * 30, encoding="utf-8")
        (self.tmpdir / "tiny.txt").write_text("too small", encoding="utf-8")

    async def asyncTearDown(self):
        import shutil
        await self.agent.http.aclose()
        shutil.rmtree(self.tmpdir, ignore_errors=True)

    async def test_ingest_returns_count(self):
        with patch.object(self.agent, "_save_index"):
            count = await self.agent.ingest_directory(self.tmpdir)
        self.assertGreater(count, 0)

    async def test_ingest_populates_index(self):
        with patch.object(self.agent, "_save_index"):
            await self.agent.ingest_directory(self.tmpdir)
        self.assertGreater(len(self.agent.index), 0)

    async def test_ingest_skips_tiny_files(self):
        with patch.object(self.agent, "_save_index"):
            await self.agent.ingest_directory(self.tmpdir)
        sources = [c["source"] for c in self.agent.index]
        self.assertFalse(any("tiny.txt" in s for s in sources))

    async def test_ingest_resets_stale_index(self):
        self.agent.index = [{"id": "stale", "source": "old.py", "chunk_index": 0,
                              "text": "old", "word_count": 50, "embedding": []}]
        with patch.object(self.agent, "_save_index"):
            await self.agent.ingest_directory(self.tmpdir)
        self.assertEqual(len([c for c in self.agent.index if c["id"] == "stale"]), 0)


class TestCodingAgent(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.agent = CodingAgent()
        self.agent.http = _make_mock_http()

    async def asyncTearDown(self):
        await self.agent.http.aclose()

    def test_temperature_low(self):
        self.assertLessEqual(self.agent.config.temperature, 0.2)

    async def test_handle_returns_string(self):
        self.assertIsInstance(await self.agent.handle("Generate TypeScript interface"), str)

    async def test_review_returns_string(self):
        self.assertIsInstance(await self.agent.review("const x = 1"), str)

    async def test_generate_tests_returns_string(self):
        self.assertIsInstance(await self.agent.generate_tests("def add(a,b): return a+b", "pytest"), str)

    async def test_explain_returns_string(self):
        self.assertIsInstance(await self.agent.explain("const fn = x => x*2"), str)


class TestResearchAgent(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.agent = ResearchAgent()
        self.agent.http = _make_mock_http()

    async def asyncTearDown(self):
        await self.agent.http.aclose()

    def test_config_name(self):
        self.assertEqual(self.agent.config.name, "research_agent")

    async def test_investigate(self):
        self.assertIsInstance(await self.agent.investigate("semiologia"), str)

    async def test_analyze_architecture(self):
        self.assertIsInstance(await self.agent.analyze_architecture("Next.js + Supabase"), str)

    async def test_compare_options(self):
        self.assertIsInstance(await self.agent.compare_options("A", "B", "medical"), str)


class TestOrchestratorRouting(unittest.TestCase):
    def setUp(self):
        with patch("agents.orchestrator.RAGAgent"), \
             patch("agents.orchestrator.CodingAgent"), \
             patch("agents.orchestrator.ResearchAgent"), \
             patch("agents.orchestrator.DocAgent"), \
             patch.object(BaseAgent, "_load_memory"):
            self.orch = OrchestratorAgent.__new__(OrchestratorAgent)
            self.orch._classify_task = OrchestratorAgent._classify_task.__get__(self.orch, OrchestratorAgent)

    def test_code_keywords(self):
        self.assertEqual(self.orch._classify_task("generate a TypeScript interface"), "code")
        self.assertEqual(self.orch._classify_task("fix the bug in auth.ts"), "code")
        self.assertEqual(self.orch._classify_task("implement OAuth login"), "code")

    def test_research_keywords(self):
        self.assertEqual(self.orch._classify_task("explain the RAG pipeline"), "research")
        self.assertEqual(self.orch._classify_task("analyze the Supabase schema"), "research")
        self.assertEqual(self.orch._classify_task("what is semiologia"), "research")

    def test_rag_keywords(self):
        self.assertEqual(self.orch._classify_task("find the chapter on auscultation"), "rag")
        self.assertEqual(self.orch._classify_task("search for fever in docs"), "rag")
        self.assertEqual(self.orch._classify_task("según el libro"), "rag")

    def test_docs_keywords(self):
        self.assertEqual(self.orch._classify_task("document this function"), "docs")
        self.assertEqual(self.orch._classify_task("generate docs for API"), "docs")

    def test_general_fallback(self):
        self.assertEqual(self.orch._classify_task("hello world"), "general")

    def test_routing_dict_complete(self):
        for cat in ["code", "research", "rag", "docs"]:
            self.assertIn(cat, TASK_ROUTING)


class TestRAGIndexPersistence(unittest.TestCase):
    def setUp(self):
        import tempfile
        self.tmpdir = Path(tempfile.mkdtemp())
        self.index_path = self.tmpdir / "rag_index.json"

    def tearDown(self):
        import shutil
        shutil.rmtree(self.tmpdir, ignore_errors=True)

    def test_save_then_load_roundtrip(self):
        import agents.rag_agent as rag_module
        orig = rag_module.INDEX_FILE
        rag_module.INDEX_FILE = self.index_path
        try:
            with patch.object(RAGAgent, "_load_index"):
                agent = RAGAgent()
            agent.index = [{"id": "t1", "source": "test.py", "chunk_index": 0,
                             "text": "chunk", "word_count": 1, "embedding": [0.5]}]
            agent._save_index()
            agent.index = []
            agent._load_index()
            self.assertEqual(len(agent.index), 1)
            self.assertEqual(agent.index[0]["id"], "t1")
        finally:
            rag_module.INDEX_FILE = orig

    def test_load_missing_file_gives_empty(self):
        import agents.rag_agent as rag_module
        orig = rag_module.INDEX_FILE
        rag_module.INDEX_FILE = self.tmpdir / "missing.json"
        try:
            with patch.object(RAGAgent, "_load_index"):
                agent = RAGAgent()
            agent.index = []
            agent._load_index()
            self.assertEqual(agent.index, [])
        finally:
            rag_module.INDEX_FILE = orig


LIVE = "--live" in sys.argv

@unittest.skipUnless(LIVE, "Skipped — pass --live to run against live Ollama")
class TestLiveOllama(unittest.IsolatedAsyncioTestCase):
    async def test_live_health_check(self):
        async with BaseAgent(AgentConfig(name="live_test", description="live")) as agent:
            status = await agent.health_check()
            self.assertTrue(status["ollama"])

    async def test_live_embed(self):
        async with BaseAgent(AgentConfig(name="live_embed", description="embed")) as agent:
            embedding = await agent.embed("semiologia medica")
            self.assertGreater(len(embedding), 0)

    async def test_live_generate(self):
        async with BaseAgent(AgentConfig(name="live_gen", description="gen")) as agent:
            result = await agent.generate("Respond with exactly one word: OK")
            self.assertIsInstance(result, str)
            self.assertGreater(len(result), 0)


def run_tests():
    loader = unittest.TestLoader()
    suite  = unittest.TestSuite()
    test_classes = [
        TestAgentConfig,
        TestBaseAgent,
        TestRAGAgentChunking,
        TestRAGAgentRetrieval,
        TestRAGAgentIngest,
        TestCodingAgent,
        TestResearchAgent,
        TestOrchestratorRouting,
        TestRAGIndexPersistence,
    ]
    for cls in test_classes:
        suite.addTests(loader.loadTestsFromTestCase(cls))
    if LIVE:
        suite.addTests(loader.loadTestsFromTestCase(TestLiveOllama))

    verbosity = 2 if "-v" in sys.argv or "--verbose" in sys.argv else 1
    runner = unittest.TextTestRunner(verbosity=verbosity, stream=sys.stdout)
    t0 = time.time()
    result = runner.run(suite)
    elapsed = time.time() - t0

    print(f"\n{'─'*60}")
    print(f"Completed in {elapsed:.2f}s")
    print(f"Passed : {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"Failed : {len(result.failures)}")
    print(f"Errors : {len(result.errors)}")
    print("Live Ollama tests: INCLUDED" if LIVE else "Live Ollama tests: SKIPPED (pass --live to enable)")
    print(f"{'─'*60}\n")
    sys.exit(0 if result.wasSuccessful() else 1)


if __name__ == "__main__":
    run_tests()