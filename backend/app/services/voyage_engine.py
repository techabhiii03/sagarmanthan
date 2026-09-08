"""
Voyage Economics Engine — transparent cost calculation.
Fuel = days × consumption; bunker = fuel × price.
"""

from __future__ import annotations
from typing import Dict, Any
from app.data.ports import get_distance_nm, get_port
from app.data.vessels import get_vessel
from app.data.freight_generator import get_current_rate
import math


def calculate_voyage(
    origin: str,
    destination: str,
    vessel_name: str,
    cargo_mt: float,
    freight_rate_usd_mt: float | None = None,
    bunker_price_usd_mt: float = 520.0,
    demurrage_usd_day: float | None = None,
    extra_waiting_hrs: float = 0.0,
) -> Dict[str, Any]:
    vessel = get_vessel(vessel_name)
    if not vessel:
        return {"error": f"Unknown vessel {vessel_name}"}

    # Planning capacity uses the upper bound of the class, with a small
    # operational allowance. This lets an 80,000 MT parcel fit a modern
    # Panamax design while preserving multi-voyage logic for smaller classes.
    capacity = vessel["dwt_max"] * 0.98
    voyages_needed = max(1, math.ceil(cargo_mt / capacity))

    distance_nm = get_distance_nm(origin, destination)
    speed = vessel["speed_kn"]
    sailing_days = distance_nm / (speed * 24)  # one way laden approx
    # round voyage approximation: laden + ballast (assume 90% ballast distance for simplicity)
    ballast_factor = 0.85
    total_sailing_days = sailing_days * (1 + ballast_factor)

    laden_cons = vessel["laden_consumption_mt_day"]
    ballast_cons = vessel["ballast_consumption_mt_day"]
    fuel_mt = sailing_days * laden_cons + (sailing_days * ballast_factor) * ballast_cons
    bunker_cost = fuel_mt * bunker_price_usd_mt * voyages_needed

    if freight_rate_usd_mt is None:
        freight_rate_usd_mt = get_current_rate(origin, vessel_name)

    freight_cost = freight_rate_usd_mt * cargo_mt

    port_o = get_port(origin) or {}
    port_d = get_port(destination) or {}
    waiting_hrs = (
        port_o.get("typical_waiting_hrs", 15)
        + port_d.get("typical_waiting_hrs", 20)
        + extra_waiting_hrs
    )
    waiting_days = waiting_hrs / 24.0
    daily_hire = vessel["daily_hire_usd"]
    waiting_cost = waiting_days * daily_hire * voyages_needed

    # cargo handling time
    handle_rate = min(
        port_o.get("cargo_handling_mt_day", 40000),
        port_d.get("cargo_handling_mt_day", 40000),
    )
    handling_days = (cargo_mt / handle_rate) * 2  # load + discharge
    handling_cost = handling_days * daily_hire * 0.3  # partial

    port_charges = vessel["port_charges_usd"] * 2 * voyages_needed  # both ends, each voyage

    if demurrage_usd_day is None:
        demurrage_usd_day = daily_hire * 1.25
    # assume some demurrage risk proportional to congestion
    cong = (port_o.get("congestion_index", 0.4) + port_d.get("congestion_index", 0.4)) / 2
    demurrage_days = waiting_days * 0.35 * cong
    demurrage_cost = demurrage_days * demurrage_usd_day * voyages_needed

    # deadheading / repositioning placeholder (small)
    deadhead_cost = distance_nm * 0.15 * voyages_needed  # very light proxy

    total_cost = (
        freight_cost
        + bunker_cost
        + port_charges
        + waiting_cost
        + handling_cost
        + demurrage_cost
        + deadhead_cost
    )
    cost_per_mt = total_cost / cargo_mt if cargo_mt > 0 else 0

    return {
        "origin": origin,
        "destination": destination,
        "vessel": vessel_name,
        "cargo_mt": cargo_mt,
        "distance_nm": round(distance_nm, 0),
        "sailing_days_oneway": round(sailing_days, 2),
        "total_sailing_days_approx": round(total_sailing_days * voyages_needed, 2),
        "fuel_mt": round(fuel_mt * voyages_needed, 1),
        "bunker_price_usd_mt": bunker_price_usd_mt,
        "bunker_cost_usd": round(bunker_cost, 0),
        "freight_rate_usd_mt": round(freight_rate_usd_mt, 2),
        "freight_cost_usd": round(freight_cost, 0),
        "port_charges_usd": round(port_charges, 0),
        "waiting_hrs": round(waiting_hrs, 1),
        "waiting_cost_usd": round(waiting_cost, 0),
        "handling_days": round(handling_days, 2),
        "handling_cost_usd": round(handling_cost, 0),
        "demurrage_cost_usd": round(demurrage_cost, 0),
        "deadhead_cost_usd": round(deadhead_cost, 0),
        "total_voyage_cost_usd": round(total_cost, 0),
        "cost_per_mt_usd": round(cost_per_mt, 2),
        "vessel_capacity_mt": round(capacity, 0),
        "voyages_needed": voyages_needed,
        "breakdown": {
            "freight_pct": round(freight_cost / total_cost * 100, 1) if total_cost else 0,
            "bunker_pct": round(bunker_cost / total_cost * 100, 1) if total_cost else 0,
            "port_pct": round(port_charges / total_cost * 100, 1) if total_cost else 0,
            "waiting_pct": round(waiting_cost / total_cost * 100, 1) if total_cost else 0,
            "other_pct": round((handling_cost + demurrage_cost + deadhead_cost) / total_cost * 100, 1)
            if total_cost
            else 0,
        },
        "data_provenance": {
            "bunker_model": "Fuel = sailing_days × daily_consumption (laden + ballast)",
            "distance_source": "Prototype route table (approx NM)",
            "note": "DEMONSTRATION CALCULATION",
        },
    }
