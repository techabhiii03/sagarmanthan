"""Basic tests for port constraints and decision pipeline."""
import sys
sys.path.insert(0, ".")

from app.services.port_engine import check_vessel_at_port, evaluate_pair
from app.services.decision_engine import evaluate_requirement


def test_capesize_paradip_draft():
    r = check_vessel_at_port("Capesize", "Paradip")
    assert r["feasible"] is False
    assert any("DRAFT" in x.upper() or "draft" in x.lower() for x in r["reasons"])


def test_panamax_paradip_ok():
    r = check_vessel_at_port("Panamax", "Paradip")
    assert r["feasible"] is True


def test_decision_runs():
    res = evaluate_requirement(
        origin="Newcastle",
        destination="Paradip",
        cargo="coking_coal",
        cargo_mt=80000,
    )
    assert res["decision"] in ("BOOK", "WAIT", "AVOID")
    assert res["vessel"]["recommended"] is not None
    assert res["vessel"]["recommended"] == "Panamax"
    assert "forecast" in res
    assert "savings" in res


if __name__ == "__main__":
    test_capesize_paradip_draft()
    test_panamax_paradip_ok()
    test_decision_runs()
    print("All core tests passed.")
