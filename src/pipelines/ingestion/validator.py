# Validator module for MED-228 Ingestion Pipeline
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")))

from src.ai.compliance.academic_compliance_agent import validate_chunk

def validate_chunk_compliance(chunk_payload: dict) -> dict:
    """Wraps academic compliance check."""
    res = validate_chunk(chunk_payload)
    return {
        "success": res.success,
        "is_active": res.is_active,
        "status": res.status,
        "reason": res.reason
    }

if __name__ == "__main__":
    # Test suite for validator
    res = validate_chunk_compliance({
        "topic": "Historia Clínica",
        "week": 1,
        "block": "block_1",
        "cg_competencies": ["CG6"],
        "validated_by": "Dr. Angel Augusto Tusen Madrigal",
        "content_type": "theoretical",
        "memory_domain": "semantic"
    })
    assert res["success"] is True, f"Failed validation: {res}"
    print("✅ Todos los tests pasaron")
