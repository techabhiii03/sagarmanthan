"""
Market Entry Engine — BOOK / WAIT / AVOID based on forecast trajectory + uncertainty.
"""

from __future__ import annotations
from typing import Dict, Any
from datetime import datetime, timedelta
from app.ml.forecast_engine import forecast_engine


def decide_entry(
    origin: str,
    vessel: str,
    laycan_start: str | None = None,
    risk_tolerance: str = "medium",
) -> Dict[str, Any]:
    fc = forecast_engine.forecast(origin, vessel)
    current = fc["current_rate"]
    f7 = fc["forecasts"].get("forecast_7d", current)
    f14 = fc["forecasts"].get("forecast_14d", current)
    f30 = fc["forecasts"].get("forecast_30d", current)
    mape = fc["model_metrics"]["mape"]
    rmse = fc["model_metrics"]["rmse"]

    # expected change
    delta_14 = f14 - current
    delta_30 = f30 - current
    uncertainty = max(rmse * 1.5, current * mape / 100)

    # decision logic (transparent)
    decision = "BOOK"
    reason_parts = []
    confidence = 0.75

    if delta_14 < -1.0 and abs(delta_14) > uncertainty * 0.6:
        decision = "WAIT"
        reason_parts.append(
            f"14-day forecast shows decline of ${abs(delta_14):.2f}/MT (>{uncertainty * 0.6:.2f} uncertainty threshold)."
        )
        confidence = min(0.92, 0.7 + abs(delta_14) / (current * 0.15))
    elif delta_14 > 1.2 and abs(delta_14) > uncertainty * 0.7:
        decision = "BOOK"
        reason_parts.append(
            f"14-day forecast shows rise of ${delta_14:.2f}/MT. Booking now locks lower rate."
        )
        confidence = min(0.90, 0.68 + abs(delta_14) / (current * 0.12))
    elif abs(delta_14) < uncertainty * 0.4:
        decision = "BOOK" if risk_tolerance == "low" else "WAIT"
        reason_parts.append(
            "Forecast change within uncertainty band — limited edge. Prefer locking if risk-averse."
        )
        confidence = 0.62
    else:
        decision = "WAIT"
        reason_parts.append("Mild expected decline; waiting for clearer signal is preferred.")
        confidence = 0.68

    # AVOID if extreme volatility or very high forecast band
    if mape > 18 or (fc["upper_bounds"].get("upper_14d", current) - fc["lower_bounds"].get("lower_14d", current)) > current * 0.35:
        if decision != "BOOK":
            decision = "AVOID"
            reason_parts.append("High forecast uncertainty / volatility — consider delaying commitment or using shorter cover.")
            confidence = 0.55

    # entry window (if WAIT)
    today = datetime(2026, 9, 7)
    if decision == "WAIT":
        # simple: optimal around day 9-13 if decline, else sooner
        best_start = today + timedelta(days=8)
        best_end = today + timedelta(days=13)
        latest_safe = today + timedelta(days=18)
        if laycan_start:
            try:
                lc = datetime.fromisoformat(laycan_start[:10])
                latest_safe = min(latest_safe, lc - timedelta(days=12))
            except Exception:
                pass
        entry_window = f"{best_start.strftime('%d %b')} – {best_end.strftime('%d %b')}"
        latest_str = latest_safe.strftime("%d %b %Y")
    else:
        entry_window = "Immediate"
        latest_str = (today + timedelta(days=3)).strftime("%d %b %Y")

    # expected savings if WAIT vs BOOK now (per MT * volume later)
    expected_saving_per_mt = max(0.0, current - f14) if decision == "WAIT" else 0.0

    return {
        "decision": decision,
        "confidence": round(confidence, 2),
        "current_rate": current,
        "forecast_7d": f7,
        "forecast_14d": f14,
        "forecast_30d": f30,
        "delta_14d": round(delta_14, 2),
        "uncertainty_band": round(uncertainty, 2),
        "recommended_entry_window": entry_window,
        "latest_safe_booking_date": latest_str,
        "expected_saving_per_mt_usd": round(expected_saving_per_mt, 2),
        "reasons": reason_parts,
        "model": fc["model_selected"],
        "mape": mape,
        "data_provenance": fc["data_provenance"],
    }
