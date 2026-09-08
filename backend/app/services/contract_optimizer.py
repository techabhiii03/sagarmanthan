"""
Contract Mix Optimizer — spot vs short/medium multi-voyage.
"""

from __future__ import annotations
from typing import Dict, Any, List
from app.ml.forecast_engine import forecast_engine


def optimize_contract(
    origin: str,
    vessel: str,
    cargo_mt: float,
    num_voyages_planned: int = 6,
    risk_tolerance: str = "medium",
) -> Dict[str, Any]:
    fc = forecast_engine.forecast(origin, vessel)
    current = fc["current_rate"]
    f30 = fc["forecasts"].get("forecast_30d", current)
    f60 = fc["forecasts"].get("forecast_60d", current)
    mape = fc["model_metrics"]["mape"]
    volatility = fc["model_metrics"]["rmse"] / current if current else 0.1

    # expected average rate under different covers
    spot_avg = (current + f30 + f60) / 3
    short_term_rate = current * 0.98  # slight discount for 3-voyage commitment
    medium_rate = current * 0.955  # better discount for 6-voyage

    # risk adjustment
    spot_risk_premium = volatility * current * 1.8
    short_risk = volatility * current * 0.9
    medium_risk = volatility * current * 0.45

    # cost per voyage approx
    def voyage_cost(rate):
        return rate * cargo_mt

    spot_total = voyage_cost(spot_avg + spot_risk_premium) * num_voyages_planned
    # mix strategies
    strategies = []

    # pure spot
    strategies.append(
        {
            "name": "100% Spot",
            "mix": {"spot": 1.0, "3-voyage": 0.0, "6-voyage": 0.0},
            "expected_cost_usd": spot_total,
            "spot_exposure": 1.0,
            "risk_score": 85,
        }
    )

    # 60% medium / 25% short / 15% spot
    mix1_cost = (
        0.60 * voyage_cost(medium_rate) * num_voyages_planned
        + 0.25 * voyage_cost(short_term_rate) * num_voyages_planned
        + 0.15 * voyage_cost(spot_avg + spot_risk_premium) * num_voyages_planned
    )
    strategies.append(
        {
            "name": "Balanced Multi-Voyage",
            "mix": {"spot": 0.15, "3-voyage": 0.25, "6-voyage": 0.60},
            "expected_cost_usd": mix1_cost,
            "spot_exposure": 0.15,
            "risk_score": 48,
        }
    )

    # aggressive medium
    mix2_cost = (
        0.80 * voyage_cost(medium_rate) * num_voyages_planned
        + 0.20 * voyage_cost(short_term_rate) * num_voyages_planned
    )
    strategies.append(
        {
            "name": "Heavy Medium-Term",
            "mix": {"spot": 0.0, "3-voyage": 0.20, "6-voyage": 0.80},
            "expected_cost_usd": mix2_cost,
            "spot_exposure": 0.0,
            "risk_score": 32,
        }
    )

    # short-term heavy
    mix3_cost = (
        0.55 * voyage_cost(short_term_rate) * num_voyages_planned
        + 0.30 * voyage_cost(medium_rate) * num_voyages_planned
        + 0.15 * voyage_cost(spot_avg) * num_voyages_planned
    )
    strategies.append(
        {
            "name": "Short-Term Focused",
            "mix": {"spot": 0.15, "3-voyage": 0.55, "6-voyage": 0.30},
            "expected_cost_usd": mix3_cost,
            "spot_exposure": 0.15,
            "risk_score": 55,
        }
    )

    # choose by risk tolerance
    if risk_tolerance == "low":
        best = min(strategies, key=lambda s: s["risk_score"] * 0.6 + s["expected_cost_usd"] / 1e6 * 0.4)
    elif risk_tolerance == "high":
        best = min(strategies, key=lambda s: s["expected_cost_usd"])
    else:
        best = min(strategies, key=lambda s: s["expected_cost_usd"] * 0.7 + s["risk_score"] * 8000)

    pure_spot = strategies[0]["expected_cost_usd"]
    savings = pure_spot - best["expected_cost_usd"]
    risk_reduction = strategies[0]["risk_score"] - best["risk_score"]

    return {
        "recommended": best["name"],
        "recommended_mix": best["mix"],
        "expected_cost_usd": round(best["expected_cost_usd"], 0),
        "projected_savings_vs_spot_usd": round(max(0, savings), 0),
        "spot_exposure": best["spot_exposure"],
        "risk_reduction_points": risk_reduction,
        "all_strategies": [
            {
                "name": s["name"],
                "mix": s["mix"],
                "expected_cost_usd": round(s["expected_cost_usd"], 0),
                "spot_exposure": s["spot_exposure"],
                "risk_score": s["risk_score"],
            }
            for s in strategies
        ],
        "transition_message": (
            "OLD: Voyage1→Spot, Voyage2→Spot, ... VoyageN→Spot  →  "
            "SAGARMANTHAN: Multi-voyage cover reduces spot exposure and locks rate advantage."
        ),
        "data_provenance": "Calculated from forecast trajectory + volatility-adjusted risk premiums (DEMONSTRATION)",
    }
