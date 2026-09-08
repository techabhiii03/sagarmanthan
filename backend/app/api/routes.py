from fastapi import APIRouter, HTTPException
from typing import Any, Dict

from app.models.schemas import (
    ForecastRequest,
    VesselOptimizeRequest,
    PortCheckRequest,
    VoyageCostRequest,
    ContractRequest,
    IdleRequest,
    RiskRequest,
    DecisionRequest,
    ScenarioRequest,
)
from app.ml.forecast_engine import forecast_engine
from app.services.port_engine import evaluate_pair, check_vessel_at_port
from app.services.vessel_optimizer import optimize_vessel
from app.services.voyage_engine import calculate_voyage
from app.services.market_entry import decide_entry
from app.services.contract_optimizer import optimize_contract
from app.services.idle_optimizer import optimize_idle
from app.services.risk_engine import assess_risk
from app.services.decision_engine import evaluate_requirement
from app.data.ports import list_ports, get_port, PORTS
from app.data.vessels import list_vessels
from app.data.berths import list_berths, get_berth, best_berth_for_port

router = APIRouter()


@router.get("/health")
def health():
    return {"status": "ok", "service": "SagarManthan API", "version": "1.0.0-sih2026"}


@router.get("/ports")
def get_ports(type: str | None = None):
    return list_ports(type)


@router.get("/ports/{name}")
def get_port_detail(name: str):
    p = get_port(name)
    if not p:
        raise HTTPException(404, f"Port {name} not found")
    # attach berths for this port
    berths = list_berths(name)
    return {**p, "berths": berths}


@router.get("/vessels")
def get_vessels():
    return list_vessels()


@router.get("/berths")
def get_berths(port: str | None = None):
    return list_berths(port)


@router.get("/berths/{port}/best")
def get_best_berth(port: str):
    b = best_berth_for_port(port)
    if not b:
        raise HTTPException(404, f"No berth data for {port}")
    return b


@router.post("/forecast")
def api_forecast(req: ForecastRequest):
    try:
        return forecast_engine.forecast(req.origin, req.vessel, req.horizons)
    except Exception as e:
        raise HTTPException(500, str(e))


@router.post("/vessel/optimize")
def api_vessel(req: VesselOptimizeRequest):
    return optimize_vessel(
        req.origin, req.destination, req.cargo, req.cargo_mt, req.bunker_price, req.extra_waiting_hrs
    )


@router.post("/port/check")
def api_port(req: PortCheckRequest):
    return evaluate_pair(req.origin, req.destination, req.vessel, req.cargo)


@router.post("/voyage/cost")
def api_voyage(req: VoyageCostRequest):
    return calculate_voyage(
        req.origin,
        req.destination,
        req.vessel,
        req.cargo_mt,
        req.freight_rate,
        req.bunker_price,
        extra_waiting_hrs=req.extra_waiting_hrs,
    )


@router.post("/contract/optimize")
def api_contract(req: ContractRequest):
    return optimize_contract(
        req.origin, req.vessel, req.cargo_mt, req.num_voyages, req.risk_tolerance
    )


@router.post("/idle/optimize")
def api_idle(req: IdleRequest):
    return optimize_idle(req.vessel, req.current_port)


@router.post("/risk")
def api_risk(req: RiskRequest):
    return assess_risk(req.origin, req.destination, req.vessel, req.cargo_mt)


@router.post("/decision/evaluate")
def api_decision(req: DecisionRequest):
    """Main orchestration endpoint used by Decision Center."""
    try:
        return evaluate_requirement(
            origin=req.origin,
            destination=req.destination,
            cargo=req.cargo,
            cargo_mt=req.cargo_mt,
            laycan_start=req.laycan_start,
            bunker_price=req.bunker_price,
            extra_waiting_hrs=req.extra_waiting_hrs,
            risk_tolerance=req.risk_tolerance,
            num_voyages=req.num_voyages,
        )
    except Exception as e:
        raise HTTPException(500, f"Decision evaluation failed: {str(e)}")


@router.post("/scenario")
def api_scenario(req: ScenarioRequest):
    """What-if: apply shocks and re-run decision."""
    base = req.base
    cargo_mt = req.cargo_mt_override if req.cargo_mt_override is not None else base.cargo_mt
    dest = req.destination_override or base.destination
    bunker = base.bunker_price * (1 + req.bunker_pct_change / 100)
    waiting = base.extra_waiting_hrs + req.extra_waiting_hrs

    result = evaluate_requirement(
        origin=base.origin,
        destination=dest,
        cargo=base.cargo,
        cargo_mt=cargo_mt,
        laycan_start=base.laycan_start,
        bunker_price=bunker,
        extra_waiting_hrs=waiting,
        risk_tolerance=base.risk_tolerance,
        num_voyages=base.num_voyages,
    )
    # apply freight shock post-hoc for display
    if req.freight_pct_change != 0 and result.get("forecast"):
        factor = 1 + req.freight_pct_change / 100
        result["forecast"]["current_rate"] = round(result["forecast"]["current_rate"] * factor, 2)
        for k in ["forecast_7d", "forecast_14d", "forecast_30d", "forecast_60d"]:
            if result["forecast"].get(k) is not None:
                result["forecast"][k] = round(result["forecast"][k] * factor, 2)
        result["scenario_applied"] = {
            "freight_pct_change": req.freight_pct_change,
            "bunker_pct_change": req.bunker_pct_change,
            "extra_waiting_hrs": req.extra_waiting_hrs,
            "cargo_mt_override": req.cargo_mt_override,
            "destination_override": req.destination_override,
        }
    return result
