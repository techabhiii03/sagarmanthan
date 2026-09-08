import type { NewRequirementForm } from '../types';
import { evaluateRequirement, type EvaluationResult } from './evaluationEngine';

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

type BackendDecision = {
  decision: 'BOOK' | 'WAIT' | 'AVOID';
  confidence: number;
  forecast: { forecast_14d: number; rmse: number };
  market_entry: { recommended_entry_window: string; reasons: string[] };
  vessel: { recommended: string; candidates: Array<Record<string, any>> };
  contract: {
    recommended: string;
    recommended_mix: Record<string, number>;
    expected_cost_usd: number;
    projected_savings_vs_spot_usd: number;
    all_strategies: Array<Record<string, any>>;
  };
  risk: { level: 'LOW' | 'MEDIUM' | 'HIGH' };
  explanation: string[];
};

const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
const usdToCr = (usd: number) => Math.round((usd * 83.5) / 1e7);

export async function evaluateRequirementWithBackend(form: NewRequirementForm): Promise<EvaluationResult> {
  const fallback = evaluateRequirement(form);
  const preference = form.riskPreference.toLowerCase();
  const risk = preference.includes('low') ? 'low' : preference.includes('high') ? 'high' : 'medium';

  try {
    const response = await fetch(`${API_BASE}/decision/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: form.loadingPort,
        destination: form.dischargePort.split(' ')[0],
        cargo: form.material.toLowerCase().replace(/\s+/g, '_'),
        cargo_mt: Number(form.quantity),
        laycan_start: form.requiredArrivalDate,
        risk_tolerance: risk,
        num_voyages: Number(form.consignments) || 6,
      }),
    });
    if (!response.ok) throw new Error(`Backend returned ${response.status}`);
    const data = (await response.json()) as BackendDecision;
    const mix = data.contract.recommended_mix || {};
    const candidates = new Map(data.vessel.candidates?.map((candidate) => [candidate.vessel, candidate]) || []);
    const vesselEvaluations = fallback.vesselEvaluations.map((vessel) => {
      const candidate = candidates.get(vessel.vesselClass);
      if (!candidate) return vessel;
      const selected = vessel.vesselClass === data.vessel.recommended;
      const reasons = (candidate.rejection_reasons || []).join('; ');
      return {
        ...vessel,
        voyagesRequired: candidate.voyages_needed ?? vessel.voyagesRequired,
        berthSuitable: Boolean(candidate.feasible),
        draftCompliant: Boolean(candidate.feasible),
        berthNote: candidate.feasible ? 'Compliant with evaluated port constraints' : reasons,
        estimatedCostPerMT: candidate.cost_per_mt ?? vessel.estimatedCostPerMT,
        evaluation: selected ? 'Recommended' as const : candidate.feasible ? 'Feasible – inefficient' as const : 'Not suitable' as const,
        evaluationNote: selected ? 'Lowest feasible total voyage cost under evaluated constraints.' : reasons,
      };
    });
    const spread = Math.max(0.3, data.forecast.rmse || 0.3);
    const f14 = data.forecast.forecast_14d;
    const decisionLabel = data.decision === 'BOOK' ? 'Proceed with fixture'
      : data.decision === 'WAIT' ? 'Wait and review at the recommended window'
        : 'Avoid commitment and review constraints';
    const exposure = (score: number): 'High' | 'Medium' | 'Medium-Low' | 'Low' =>
      score >= 70 ? 'High' : score >= 50 ? 'Medium' : score >= 35 ? 'Medium-Low' : 'Low';

    return {
      ...fallback,
      recommendedVesselClass: data.vessel.recommended,
      bookingDecision: data.decision === 'BOOK' ? 'BOOK NOW' : data.decision,
      bookingDecisionLabel: decisionLabel,
      suitableBookingPeriod: data.market_entry.recommended_entry_window,
      expectedFreightRangeLabel: `$${(f14 - spread).toFixed(2)} – $${(f14 + spread).toFixed(2)}/MT`,
      overallRisk: titleCase(data.risk.level) as EvaluationResult['overallRisk'],
      forecastReliabilityPct: Math.round(data.confidence * 100),
      recommendationNote: data.market_entry.reasons.join(' '),
      vesselEvaluations,
      contract: {
        longTermPct: Math.round((mix['6-voyage'] || 0) * 100),
        mediumTermPct: Math.round((mix['3-voyage'] || 0) * 100),
        spotPct: Math.round((mix.spot || 0) * 100),
        estimatedCostCr: usdToCr(data.contract.expected_cost_usd),
        savingVsAllSpotCr: usdToCr(data.contract.projected_savings_vs_spot_usd),
        options: data.contract.all_strategies.map((strategy) => ({
          arrangement: strategy.name === data.contract.recommended ? `${strategy.name} (recommended)` : strategy.name,
          estimatedCostCr: usdToCr(strategy.expected_cost_usd),
          exposure: exposure(strategy.risk_score),
          notes: `${Math.round(strategy.spot_exposure * 100)}% spot exposure; risk score ${strategy.risk_score}/100.`,
        })),
      },
      basisSections: [
        { id: 'why-decision', title: `Why ${data.decision.toLowerCase()}?`, body: data.market_entry.reasons.join(' ') },
        { id: 'why-vessel', title: `Why ${data.vessel.recommended}?`, body: data.explanation.find((line) => line.startsWith('Selected vessel:')) || data.explanation[0] },
        { id: 'why-constraints', title: 'How were alternatives evaluated?', body: data.explanation.find((line) => line.includes('Feasible alternatives')) || 'Alternatives were filtered by draft, LOA and beam, then ranked by total voyage cost.' },
        { id: 'why-contract', title: 'Why this contract arrangement?', body: data.explanation.find((line) => line.startsWith('Contract recommendation:')) || 'The allocation balances rate protection with operational flexibility.' },
      ],
      engineMode: 'backend',
    };
  } catch (error) {
    console.warn('Backend unavailable; using deterministic local evaluation.', error);
    return fallback;
  }
}
