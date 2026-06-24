"""Script de health check del sistema de agentes NEXUS AI."""
import asyncio
import sys
import json
sys.path.insert(0, '.')

from agents.base_agent import BaseAgent, AgentConfig

async def main():
    config = AgentConfig(name='health_test', description='health check')
    agent = BaseAgent(config)
    status = await agent.health_check()
    print(json.dumps(status, indent=2, ensure_ascii=False))
    await agent.http.aclose()

asyncio.run(main())
