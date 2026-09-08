"""
Port Constraint Engine — explicit feasibility checks with reasons.
"""

from __future__ import annotations
from typing import Dict, Any, List
from app.data.ports import get_port, list_ports
from app.data.vessels import get_vessel, list_vessels


def check_vessel_at_port(vessel_name: str, port_name: str) -> Dict[str, Any]:
    vessel = get_vessel(vessel_name)
    port = get_port(port_name)
    if not vessel or not port:
        return {
            "feasible": False,
            "reasons": [f"Unknown vessel or port: {vessel_name} / {port_name}"],
            "checks": {},
        }

    checks = {
        "draft": {
            "required_m": vessel["draft_laden_m"],
            "port_limit_m": port["max_draft_m"],
            "ok": vessel["draft_laden_m"] <= port["max_draft_m"] + 0.05,
        },
        "loa": {
            "required_m": vessel["loa_m"],
            "port_limit_m": port["max_loa_m"],
            "ok": vessel["loa_m"] <= port["max_loa_m"] + 0.5,
        },
        "beam": {
            "required_m": vessel["beam_m"],
            "port_limit_m": port["max_beam_m"],
            "ok": vessel["beam_m"] <= port["max_beam_m"] + 0.3,
        },
    }

    reasons = []
    for k, v in checks.items():
        if not v["ok"]:
            reasons.append(
                f"{k.upper()} violation: required {v['required_m']} m > port limit {v['port_limit_m']} m"
            )

    return {
        "vessel": vessel_name,
        "port": port_name,
        "feasible": len(reasons) == 0,
        "checks": checks,
        "reasons": reasons if reasons else ["All physical constraints satisfied"],
        "port_congestion": port["congestion_index"],
        "typical_waiting_hrs": port["typical_waiting_hrs"],
        "cargo_handling_mt_day": port["cargo_handling_mt_day"],
    }


def evaluate_pair(
    origin: str, destination: str, vessel_name: str, cargo: str
) -> Dict[str, Any]:
    origin_check = check_vessel_at_port(vessel_name, origin)
    dest_check = check_vessel_at_port(vessel_name, destination)
    vessel = get_vessel(vessel_name)
    port_o = get_port(origin)
    port_d = get_port(destination)

    cargo_ok = True
    cargo_reasons = []
    if vessel and cargo not in vessel.get("suitable_for", []):
        cargo_ok = False
        cargo_reasons.append(f"Vessel class not typically used for {cargo}")
    if port_d and cargo not in port_d.get("compatible_cargo", []):
        cargo_ok = False
        cargo_reasons.append(f"Destination port does not commonly handle {cargo}")

    overall = origin_check["feasible"] and dest_check["feasible"] and cargo_ok
    reasons = []
    if not origin_check["feasible"]:
        reasons.extend([f"ORIGIN ({origin}): {r}" for r in origin_check["reasons"]])
    if not dest_check["feasible"]:
        reasons.extend([f"DESTINATION ({destination}): {r}" for r in dest_check["reasons"]])
    reasons.extend(cargo_reasons)

    return {
        "origin_check": origin_check,
        "destination_check": dest_check,
        "cargo_compatible": cargo_ok,
        "overall_feasible": overall,
        "rejection_reasons": reasons if not overall else ["Feasible at both ends"],
        "waiting_hrs_origin": origin_check.get("typical_waiting_hrs", 0),
        "waiting_hrs_destination": dest_check.get("typical_waiting_hrs", 0),
        "congestion_origin": origin_check.get("port_congestion", 0),
        "congestion_destination": dest_check.get("port_congestion", 0),
    }
