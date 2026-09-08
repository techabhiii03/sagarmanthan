"""
Idle & Positioning Optimizer — algorithmic comparison of wait / reposition / alternative.
"""

from __future__ import annotations
from typing import Dict, Any
from app.data.vessels import get_vessel
from app.data.ports import get_distance_nm


def optimize_idle(
    vessel_name: str,
    current_port: str,
    next_cargo_origin: str | None = None,
    daily_hire: float | None = None,
    bunker_price: float = 520.0,
) -> Dict[str, Any]:
    vessel = get_vessel(vessel_name)
    if not vessel:
        return {"error": "Unknown vessel"}

    hire = daily_hire or vessel["daily_hire_usd"]
    ballast_cons = vessel["ballast_consumption_mt_day"]

    # Option A: Wait at current port (expected idle from market)
    expected_idle_days = 8.2  # base market expectation (demo calibrated)
    wait_cost = expected_idle_days * hire

    # Option B: Reposition to a liquid loading area
    reposition_targets = {
        "Paradip": "Taboneo",
        "Dhamra": "Taboneo",
        "Visakhapatnam": "Taboneo",
        "Gangavaram": "Taboneo",
        "Newcastle": "Paradip",
        "Gladstone": "Paradip",
    }
    target = reposition_targets.get(current_port, "Taboneo")
    dist = get_distance_nm(current_port, target) if current_port in ["Newcastle", "Gladstone", "Taboneo"] else 1800
    # approx ballast days
    ballast_days = dist / (vessel["speed_kn"] * 24)
    fuel = ballast_days * ballast_cons
    reposition_cost = fuel * bunker_price + ballast_days * hire * 0.4
    idle_after_repo = 2.1
    total_repo_cost = reposition_cost + idle_after_repo * hire

    # Option C: Alternative employment (short fixture)
    alt_idle = 1.4
    alt_contribution = 18500  # net positive contribution USD (demo)
    alt_net = alt_contribution - alt_idle * hire

    # Option D: Take next suitable cargo if known
    next_idle = 3.5
    next_cost = next_idle * hire

    options = [
        {
            "strategy": "Wait at current port",
            "idle_days": expected_idle_days,
            "economic_impact_usd": -wait_cost,
            "description": "Stay idle until next fixture appears in current region.",
        },
        {
            "strategy": "Reposition",
            "idle_days": idle_after_repo + ballast_days * 0.3,
            "economic_impact_usd": -total_repo_cost,
            "description": f"Ballast toward {target} for higher fixture probability.",
        },
        {
            "strategy": "Alternative Employment",
            "idle_days": alt_idle,
            "economic_impact_usd": alt_net,
            "description": "Accept short local / regional employment to cover hire.",
        },
        {
            "strategy": "Next cargo positioning",
            "idle_days": next_idle,
            "economic_impact_usd": -next_cost,
            "description": "Position for the next known requirement.",
        },
    ]

    # best = highest economic impact (least negative or positive)
    best = max(options, key=lambda o: o["economic_impact_usd"])
    baseline = options[0]["economic_impact_usd"]
    benefit = best["economic_impact_usd"] - baseline

    return {
        "current_expected_idle_days": expected_idle_days,
        "best_strategy": best["strategy"],
        "idle_reduced_to_days": round(best["idle_days"], 1),
        "estimated_economic_benefit_usd": round(benefit, 0),
        "options": options,
        "calculation_note": "Costs derived from daily hire + ballast fuel; contribution from alternative employment is demonstration value calibrated to typical short-haul margins.",
        "data_provenance": "DEMONSTRATION / Algorithmic ranking",
    }
