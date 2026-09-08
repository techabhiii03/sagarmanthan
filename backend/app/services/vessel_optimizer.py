"""
Vessel Type Optimization — minimize total landed cost among feasible vessels.
"""

from __future__ import annotations
from typing import Dict, Any, List
from app.data.vessels import list_vessels
from app.services.port_engine import evaluate_pair
from app.services.voyage_engine import calculate_voyage
from app.ml.forecast_engine import forecast_engine


def optimize_vessel(
    origin: str,
    destination: str,
    cargo: str,
    cargo_mt: float,
    bunker_price: float = 520.0,
    extra_waiting_hrs: float = 0.0,
) -> Dict[str, Any]:
    candidates = []
    for v in list_vessels():
        name = v["name"]
        port_eval = evaluate_pair(origin, destination, name, cargo)
        if not port_eval["overall_feasible"]:
            candidates.append(
                {
                    "vessel": name,
                    "feasible": False,
                    "rejection_reasons": port_eval["rejection_reasons"],
                    "total_cost_usd": None,
                    "cost_per_mt": None,
                    "voyages_needed": None,
                }
            )
            continue

        # use current rate for ranking (forecast can be layered later)
        voyage = calculate_voyage(
            origin,
            destination,
            name,
            cargo_mt,
            bunker_price_usd_mt=bunker_price,
            extra_waiting_hrs=extra_waiting_hrs,
        )
        candidates.append(
            {
                "vessel": name,
                "feasible": True,
                "rejection_reasons": [],
                "total_cost_usd": voyage["total_voyage_cost_usd"],
                "cost_per_mt": voyage["cost_per_mt_usd"],
                "voyages_needed": voyage["voyages_needed"],
                "freight_rate": voyage["freight_rate_usd_mt"],
                "bunker_cost": voyage["bunker_cost_usd"],
                "waiting_cost": voyage["waiting_cost_usd"],
                "voyage_detail": voyage,
            }
        )

    feasible = [c for c in candidates if c["feasible"]]
    if not feasible:
        return {
            "recommended": None,
            "candidates": candidates,
            "message": "No vessel class is feasible under current port constraints.",
        }

    # objective: min total cost (already accounts for multi-voyage if needed)
    best = min(feasible, key=lambda x: x["total_cost_usd"])
    # rank
    ranked = sorted(feasible, key=lambda x: x["total_cost_usd"])

    return {
        "recommended": best["vessel"],
        "recommended_cost_usd": best["total_cost_usd"],
        "recommended_cost_per_mt": best["cost_per_mt"],
        "candidates": candidates,
        "ranked_feasible": [
            {
                "vessel": r["vessel"],
                "total_cost_usd": r["total_cost_usd"],
                "cost_per_mt": r["cost_per_mt"],
                "voyages_needed": r["voyages_needed"],
            }
            for r in ranked
        ],
        "objective": "Minimize total voyage cost (freight + bunker + port + waiting + demurrage + deadhead) subject to port feasibility",
    }
