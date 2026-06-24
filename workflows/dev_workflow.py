"""
Dev Workflow — NEXUS AI Automation
=====================================
Automatiza el ciclo de desarrollo: análisis → lint → type-check → test → commit.

Uso:
    python workflows/dev_workflow.py --check    # Solo verifica sin commitear
    python workflows/dev_workflow.py --fix      # Fix automático de lint
    python workflows/dev_workflow.py --commit "feat: descripción"
    python workflows/dev_workflow.py --full     # Ciclo completo
"""

import os
import sys
import subprocess
import asyncio
import argparse
import json
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent.parent))

PROJECT_ROOT = Path(__file__).parent.parent


def run(cmd: list[str], cwd: Path = PROJECT_ROOT, capture: bool = True) -> tuple[int, str, str]:
    """
    Ejecuta un comando y retorna (returncode, stdout, stderr).
    """
    result = subprocess.run(
        cmd,
        cwd=cwd,
        capture_output=capture,
        text=True,
        shell=False
    )
    return result.returncode, result.stdout, result.stderr


def print_step(step: str, icon: str = "▸") -> None:
    """Imprime un paso del workflow con formato."""
    print(f"\n{icon} {step}")
    print("─" * 50)


def print_ok(msg: str) -> None:
    print(f"  ✅ {msg}")


def print_err(msg: str) -> None:
    print(f"  ❌ {msg}")


def print_warn(msg: str) -> None:
    print(f"  ⚠️  {msg}")


# ── CHECKS ──────────────────────────────────────────────────────────────────

def check_lint(fix: bool = False) -> bool:
    """Ejecuta ESLint sobre el proyecto Next.js."""
    print_step("ESLint Check", "🔍")
    cmd = ["npm", "run", "lint"]
    if fix:
        cmd = ["npx", "eslint", "--fix", "src/"]

    code, out, err = run(cmd)
    if code == 0:
        print_ok("ESLint: sin errores")
        return True
    else:
        print_err(f"ESLint encontró problemas:\n{out}\n{err}")
        return False


def check_typescript() -> bool:
    """Verifica tipos TypeScript."""
    print_step("TypeScript Type Check", "📐")
    code, out, err = run(["npx", "tsc", "--noEmit"])
    if code == 0:
        print_ok("TypeScript: tipos correctos")
        return True
    else:
        print_err(f"Errores de tipos:\n{out}\n{err}")
        return False


def check_git_status() -> tuple[bool, list[str]]:
    """Verifica el estado de git y retorna archivos modificados."""
    print_step("Git Status", "📋")
    code, out, _ = run(["git", "status", "--porcelain"])
    if code != 0:
        print_err("No es un repositorio git")
        return False, []

    changed_files = [line.strip() for line in out.strip().split("\n") if line.strip()]
    if changed_files:
        print(f"  📝 {len(changed_files)} archivo(s) modificado(s):")
        for f in changed_files[:10]:
            print(f"     {f}")
        if len(changed_files) > 10:
            print(f"     ... y {len(changed_files) - 10} más")
    else:
        print_warn("No hay cambios pendientes")

    return True, changed_files


def generate_commit_message(changed_files: list[str]) -> str:
    """
    Genera un mensaje de commit conventional basado en los archivos modificados.
    Lógica simple sin IA — para usar IA usar commit_workflow.py
    """
    if not changed_files:
        return "chore: minor updates"

    # Detectar tipo por extensiones y paths
    has_docs = any(f.endswith((".md", ".txt")) for f in changed_files)
    has_tests = any("test" in f.lower() or "spec" in f.lower() for f in changed_files)
    has_config = any(f.endswith((".json", ".yaml", ".yml", ".env")) for f in changed_files)
    has_agents = any("agents/" in f for f in changed_files)
    has_nexus = any("nexus-vault/" in f for f in changed_files)

    if has_agents:
        return "feat(agents): update AI agent system"
    elif has_nexus:
        return "feat(nexus-vault): update enterprise platform"
    elif has_docs:
        return "docs: update documentation"
    elif has_tests:
        return "test: update test suite"
    elif has_config:
        return "chore: update configuration"
    else:
        return "feat: update application logic"


def commit_changes(message: str, add_all: bool = True) -> bool:
    """
    Hace commit de los cambios con el mensaje dado.

    Args:
        message: Mensaje de commit (conventional commits format)
        add_all: Si True, hace `git add -A` antes del commit

    Returns:
        True si el commit fue exitoso
    """
    print_step(f"Git Commit: {message}", "💾")

    if add_all:
        code, _, err = run(["git", "add", "-A"])
        if code != 0:
            print_err(f"Error en git add: {err}")
            return False
        print_ok("git add -A")

    code, out, err = run(["git", "commit", "-m", message])
    if code == 0:
        print_ok(f"Commit exitoso: {out.strip()}")
        return True
    else:
        if "nothing to commit" in out or "nothing to commit" in err:
            print_warn("Nada que commitear")
            return True
        print_err(f"Error en commit: {err}")
        return False


# ── FLUJO COMPLETO ──────────────────────────────────────────────────────────

async def run_full_workflow(commit_msg: str | None = None, auto_fix: bool = False) -> bool:
    """
    Ejecuta el flujo completo de verificación y opcionalmente commitea.

    Returns:
        True si todo pasó correctamente
    """
    print("\n" + "="*60)
    print("🚀 NEXUS AI — Dev Workflow")
    print(f"   {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)

    results = {
        "lint": False,
        "typescript": False,
        "git_status": False,
    }

    # 1. Lint
    results["lint"] = check_lint(fix=auto_fix)

    # 2. TypeScript
    results["typescript"] = check_typescript()

    # 3. Git status
    git_ok, changed_files = check_git_status()
    results["git_status"] = git_ok

    # Resumen
    print_step("Resumen", "📊")
    all_passed = all(results.values())

    for check, passed in results.items():
        if passed:
            print_ok(f"{check}")
        else:
            print_err(f"{check}")

    if all_passed:
        print(f"\n✅ Todos los checks pasaron")
    else:
        print(f"\n❌ Algunos checks fallaron")

    # Commit si se pidió
    if commit_msg is not None and changed_files:
        final_msg = commit_msg or generate_commit_message(changed_files)
        commit_changes(final_msg)
    elif commit_msg == "auto" and changed_files:
        auto_msg = generate_commit_message(changed_files)
        commit_changes(auto_msg)

    return all_passed


# ── Entrypoint ──────────────────────────────────────────────────────────────

async def main():
    parser = argparse.ArgumentParser(description="NEXUS Dev Workflow Automation")
    parser.add_argument("--check", action="store_true", help="Solo verificar (lint + types)")
    parser.add_argument("--fix", action="store_true", help="Fix automático de lint")
    parser.add_argument("--commit", type=str, help="Commitear con este mensaje ('auto' para auto-generar)")
    parser.add_argument("--full", action="store_true", help="Ciclo completo")
    args = parser.parse_args()

    if args.check:
        lint_ok = check_lint()
        ts_ok = check_typescript()
        sys.exit(0 if (lint_ok and ts_ok) else 1)

    elif args.fix:
        check_lint(fix=True)

    elif args.commit:
        _, changed = check_git_status()
        if changed:
            msg = generate_commit_message(changed) if args.commit == "auto" else args.commit
            commit_changes(msg)

    else:
        # Full workflow
        commit_msg = args.commit if args.commit else None
        success = await run_full_workflow(commit_msg, auto_fix=args.fix)
        sys.exit(0 if success else 1)


if __name__ == "__main__":
    asyncio.run(main())
