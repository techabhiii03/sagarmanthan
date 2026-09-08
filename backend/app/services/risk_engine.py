"""
Dynamic Risk Engine — multi-dimensional scores with explanations.
"""

from __future__ import annotations
from typing import Dict, Any
from app.data.ports import get_port
from app.ml.forecast_engine import forecast_engine


def assess_risk(
    origin: str,
    destination: str,
    vessel: str,
    cargo_mt: float = 80000,
) -> Dict[str, Any]:
    fc = forecast_engine.forecast(origin, vessel)
    mape = fc["model_metrics"]["mape"]
    rmse = fc["model_metrics"]["rmse"]
    current = fc["current_rate"]
    vol = (rmse / current * 100) if current else 10

    port_o = get_port(origin) or {}
    port_d = get_port(destination) or {}

    # Freight risk (0-100)
    freight_risk = min(95, 30 + mape * 2.2 + vol * 1.5)
    freight_reason = f"MAPE {mape}% and short-term volatility imply elevated rate risk."

    # Port risk
    cong = (port_o.get("congestion_index", 0.4) + port_d.get("congestion_index", 0.4)) / 2
    wait = (port_o.get("typical_waiting_hrs", 20) + port_d.get("typical_waiting_hrs", 20)) / 2
    port_risk = min(90, 20 + cong * 80 + wait * 0.6)
    port_reason = f"Combined congestion index {cong:.2f}, average waiting ~{wait:.0f} hrs."

    # Vessel availability (proxy)
    vessel_risk = 55 if vessel in ["Panamax", "Supramax"] else 62 if vessel == "Capesize" else 48
    vessel_reason = f"{vessel} segment currently shows moderate supply tightness in demonstration model."

    # Bunker
    bunker_risk = 42  # base; can be overridden by scenario
    bunker_reason = "Bunker price assumed stable at baseline; scenario shocks increase this score."

    # Weather / seasonal (East Coast monsoon proxy)
    weather_risk = 38
    weather_reason = "Seasonal weather risk moderate for current period (demonstration)."

    # Schedule / laycan risk
    schedule_risk = min(85, 40 + wait * 0.8)
    schedule_reason = "Waiting time and berth availability drive schedule uncertainty."

    # Geopolitical / route
    geo_risk = 28 if origin in ["Newcastle", "Gladstone", "Taboneo"] else 45
    geo_reason = "Route risk low-to-moderate for selected origin (demo calibration)."

    scores = {
        "freight": round(freight_risk),
        "port": round(port_risk),
        "vessel": round(vessel_risk),
        "bunker": round(bunker_risk),
        "weather": round(weather_risk),
        "schedule": round(schedule_risk),
        "geopolitical": round(geo_risk),
    }
    weights = {
        "freight": 0.28,
        "port": 0.18,
        "vessel": 0.12,
        "bunker": 0.10,
        "weather": 0.08,
        "schedule": 0.16,
        "geopolitical": 0.08,
    }
    overall = sum(scores[k] * weights[k] for k in scores)
    overall = round(min(95, max(15, overall)))

    level = "LOW" if overall < 40 else "MEDIUM" if overall < 65 else "HIGH"

    explanations = {
        "freight": freight_reason,
        "port": port_reason,
        "vessel": vessel_reason,
        "bunker": bunker_reason,
        "weather": weather_reason,
        "schedule": schedule_reason,
        "geopolitical": geo_reason,
    }

    return {
        "overall": overall,
        "level": level,
        "dimensions": scores,
        "explanations": explanations,
        "top_risks": sorted(scores.items(), key=lambda x: -x[1])[:3],
        "data_provenance": "Weighted multi-factor model on forecast metrics + port congestion (DEMONSTRATION)",
    }
