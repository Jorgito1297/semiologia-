"""
AI Commit Workflow — NEXUS AI System
=====================================
Generates smart conventional commit messages using qwen3:8b
by analyzing git diff output.

Usage:
    python workflows/commit_workflow.py              # Generate message + commit
    python workflows/commit_workflow.py --dry-run    # Only show the message
    python workflows/commit_workflow.py --push       # Commit + git push
"""
import asyncio
import subprocess
import sys
import argparse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from agents.base_agent import BaseAgent, AgentConfig


def get_git_diff() -> str:
    """Get the staged diff (or all changes if nothing staged)."""
    # Try staged first
    result = subprocess.run(
        ['git', 'diff', '--staged', '--stat'],
        capture_output=True, text=True
    )
    if result.stdout.strip():
        # Get full staged diff (truncated to 3000 chars to fit context)
        diff = subprocess.run(
            ['git', 'diff', '--staged'],
            capture_output=True, text=True
        )
        return diff.stdout[:3000]

    # Fall back to unstaged
    result = subprocess.run(
        ['git', 'diff', '--stat'],
        capture_output=True, text=True
    )
    return result.stdout[:3000]


def get_changed_files() -> list[str]:
    """Get list of changed files."""
    result = subprocess.run(
        ['git', 'status', '--porcelain'],
        capture_output=True, text=True
    )
    return [line.strip() for line in result.stdout.split('\n') if line.strip()]


async def generate_commit_message(diff: str, files: list[str]) -> str:
    """Use qwen3:8b to generate a conventional commit message."""
    config = AgentConfig(
        name='commit_gen',
        description='commit message generator',
        preferred_model='qwen3:8b',
        temperature=0.2,
        max_tokens=150,
    )
    agent = BaseAgent(config)

    files_summary = '\n'.join(files[:15])
    prompt = (
        f"Generate ONE conventional commit message for these changes.\n\n"
        f"Changed files:\n{files_summary}\n\n"
        f"Git diff summary:\n{diff[:2000]}\n\n"
        "Rules:\n"
        "- Format: type(scope): description\n"
        "- Types: feat, fix, docs, style, refactor, test, chore, ci\n"
        "- Max 72 characters total\n"
        "- Imperative mood (add, fix, update — not added/fixed/updated)\n"
        "- In English\n"
        "- Output ONLY the commit message, nothing else"
    )

    system = (
        "You are a git commit message generator. "
        "Output ONLY the conventional commit message on a single line. "
        "No explanations, no quotes, no markdown."
    )

    result = await agent.generate(prompt, system_prompt=system)
    await agent.http.aclose()

    # Clean up response (remove any surrounding text)
    lines = [l.strip() for l in result.strip().split('\n') if l.strip()]
    return lines[0] if lines else 'chore: update project files'


async def main():
    parser = argparse.ArgumentParser(description='AI-powered commit workflow')
    parser.add_argument('--dry-run', action='store_true', help='Only show message')
    parser.add_argument('--push', action='store_true', help='Also git push')
    args = parser.parse_args()

    files = get_changed_files()
    if not files:
        print('Nothing to commit.')
        return

    print(f'📝 Analyzing {len(files)} changed file(s)...')
    diff = get_git_diff()
    message = await generate_commit_message(diff, files)

    print(f'\n💡 Suggested commit message:')
    print(f'   {message}')

    if args.dry_run:
        return

    # Stage all and commit
    subprocess.run(['git', 'add', '-A'], check=True)
    result = subprocess.run(
        ['git', 'commit', '-m', message],
        capture_output=True, text=True
    )
    if result.returncode == 0:
        print(f'✅ Committed: {result.stdout.strip()}')
        if args.push:
            push = subprocess.run(['git', 'push'], capture_output=True, text=True)
            if push.returncode == 0:
                print('✅ Pushed to remote')
            else:
                print(f'❌ Push failed: {push.stderr}')
    else:
        print(f'❌ Commit failed: {result.stderr}')


if __name__ == '__main__':
    asyncio.run(main())
