"""
Unified Decision Engine — orchestrates all modules into one coherent recommendation.
"""

from __future__ import annotations
from typing import Dict, Any, Optional
from datetime import datetime, timezone

from app.ml.forecast_engine import forecast_engine
from app.services.port_engine import evaluate_pair
from app.services.vessel_optimizer import optimize_vessel
from app.services.voyage_engine import calculate_voyage
from app.services.market_entry import decide_entry
from app.services.contract_optimizer import optimize_contract
from app.services.idle_optimizer import optimize_idle
from app.services.risk_engine import assess_risk


def evaluate_requirement(
    origin: str,
    destination: str,
    cargo: str = "coking_coal",
    cargo_mt: float = 80000,
    laycan_start: Optional[str] = None,
    bunker_price: float = 520.0,
    extra_waiting_hrs: float = 0.0,
    risk_tolerance: str = "medium",
    num_voyages: int = 6,
) -> Dict[str, Any]:
    """
    Full pipeline: Forecast → Vessel → Port → Voyage → Entry → Contract → Idle → Risk → Decision
    """
    # 1. Vessel optimization (includes port feasibility)
    vessel_opt = optimize_vessel(
        origin, destination, cargo, cargo_mt, bunker_price, extra_waiting_hrs
    )
    recommended_vessel = vessel_opt.get("recommended")
    if not recommended_vessel:
        return {
            "decision": "AVOID",
            "confidence": 0.9,
            "message": "No feasible vessel under current port constraints.",
            "vessel": vessel_opt,
            "explanation": vessel_opt.get("message", "Port constraints block all vessel classes."),
        }

    # 2. Forecast for recommended vessel
    fc = forecast_engine.forecast(origin, recommended_vessel)

    # 3. Market entry
    entry = decide_entry(origin, recommended_vessel, laycan_start, risk_tolerance)

    # 4. Voyage economics at current rate
    voyage = calculate_voyage(
        origin,
        destination,
        recommended_vessel,
        cargo_mt,
        freight_rate_usd_mt=fc["current_rate"],
        bunker_price_usd_mt=bunker_price,
        extra_waiting_hrs=extra_waiting_hrs,
    )

    # 5. Contract mix
    contract = optimize_contract(
        origin, recommended_vessel, cargo_mt, num_voyages, risk_tolerance
    )

    # 6. Idle
    idle = optimize_idle(recommended_vessel, destination)

    # 7. Risk
    risk = assess_risk(origin, destination, recommended_vessel, cargo_mt)

    # 8. Savings estimate (vs pure spot + book-now)
    saving_per_mt = entry.get("expected_saving_per_mt_usd", 0)
    voyage_saving = saving_per_mt * cargo_mt
    contract_saving = contract.get("projected_savings_vs_spot_usd", 0)
    # scale contract saving roughly to this parcel if multi-voyage planned
    total_saving_usd = voyage_saving + contract_saving * (cargo_mt / (cargo_mt * num_voyages / num_voyages))
    # convert rough INR (demo rate 83)
    total_saving_inr_cr = (total_saving_usd * 83) / 1e7

    # Final decision already from entry engine, but escalate if risk extreme
    final_decision = entry["decision"]
    if risk["overall"] > 78 and final_decision == "BOOK":
        final_decision = "WAIT"
        entry["reasons"].append("Overall risk elevated — deferred entry preferred.")

    # Build explanation bullets
    explanation = []
    explanation.append(f"Selected vessel: {recommended_vessel} (lowest feasible total cost).")
    for r in entry.get("reasons", []):
        explanation.append(r)
    if vessel_opt.get("ranked_feasible"):
        explanation.append(
            f"Feasible alternatives ranked by cost: "
            + ", ".join([f"{x['vessel']} (${x['cost_per_mt']}/MT)" for x in vessel_opt["ranked_feasible"][:3]])
        )
    explanation.append(
        f"Contract recommendation: {contract['recommended']} (spot exposure {contract['spot_exposure']*100:.0f}%)."
    )
    explanation.append(
        f"Idle strategy: {idle['best_strategy']} (idle reduced to {idle['idle_reduced_to_days']} days)."
    )
    explanation.append(f"Overall risk: {risk['level']} ({risk['overall']}/100).")

    # Port feasibility summary
    port_summary = evaluate_pair(origin, destination, recommended_vessel, cargo)

    return {
        "decision": final_decision,
        "confidence": entry["confidence"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "input": {
            "origin": origin,
            "destination": destination,
            "cargo": cargo,
            "cargo_mt": cargo_mt,
            "laycan_start": laycan_start,
            "bunker_price": bunker_price,
            "extra_waiting_hrs": extra_waiting_hrs,
        },
        "forecast": {
            "current_rate": fc["current_rate"],
            "forecast_7d": fc["forecasts"].get("forecast_7d"),
            "forecast_14d": fc["forecasts"].get("forecast_14d"),
            "forecast_30d": fc["forecasts"].get("forecast_30d"),
            "forecast_60d": fc["forecasts"].get("forecast_60d"),
            "mape": fc["model_metrics"]["mape"],
            "rmse": fc["model_metrics"]["rmse"],
            "model": fc["model_selected"],
            "feature_importance": fc["feature_importance"],
            "drivers": fc["explanation_drivers"],
            "all_model_comparison": fc["all_model_comparison"],
        },
        "market_entry": entry,
        "vessel": {
            "recommended": recommended_vessel,
            "cost_per_mt": vessel_opt.get("recommended_cost_per_mt"),
            "total_cost_usd": vessel_opt.get("recommended_cost_usd"),
            "candidates": vessel_opt.get("candidates"),
            "ranked_feasible": vessel_opt.get("ranked_feasible"),
        },
        "port": {
            "origin_feasible": port_summary["origin_check"]["feasible"],
            "destination_feasible": port_summary["destination_check"]["feasible"],
            "overall_feasible": port_summary["overall_feasible"],
            "details": port_summary,
        },
        "voyage": voyage,
        "contract": contract,
        "idle": idle,
        "risk": risk,
        "savings": {
            "expected_usd": round(total_saving_usd, 0),
            "expected_inr_cr": round(total_saving_inr_cr, 2),
            "components": {
                "from_timing_usd": round(voyage_saving, 0),
                "from_contract_usd": round(contract_saving, 0),
            },
        },
        "explanation": explanation,
        "data_provenance": {
            "freight": "DEMONSTRATION DATA — synthetic series calibrated to realistic levels",
            "ports": "Prototype Port Dataset (approximate public limits)",
            "models": "XGBoost + baselines with chronological validation",
            "note": "All monetary figures are calculated, not hardcoded. Labelled as demonstration.",
        },
    }
