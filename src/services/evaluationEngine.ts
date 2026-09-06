// ─── Evaluation Engine ────────────────────────────────────────────────────────
// All charter evaluation logic lives here, separated from UI components.
// Calculations are deterministic: identical inputs always produce identical outputs.
// This is prototype logic. Production deployment requires licensed market data feeds
// and verified SAIL operational parameters.

import type { NewRequirementForm } from '../types';
import { getBerthConstraint } from '../data/berthData';

// ─── Vessel class specifications (standard class particulars) ─────────────────

interface VesselSpec {
  className: string;
  typicalDwtMT: number;       // representative DWT for one vessel
  usableCargoPct: number;     // fraction of DWT that is usable cargo capacity
  typicalDraftM: number;
  typicalLoaM: number;
  typicalBeamM: number;
  baseRateUsdPerMT: number;   // prototype base freight rate
  rangeLabel: string;         // human-readable DWT range
}

const VESSEL_SPECS: VesselSpec[] = [
  {
    className: 'Handysize',
    typicalDwtMT: 35000,
    usableCargoPct: 1,
    typicalDraftM: 11.0,
    typicalLoaM: 185,
    typicalBeamM: 28,
    baseRateUsdPerMT: 34.0,
    rangeLabel: '25,000 – 40,000 DWT',
  },
  {
    className: 'Supramax',
    typicalDwtMT: 58000,
    usableCargoPct: 1,
    typicalDraftM: 13.2,
    typicalLoaM: 200,
    typicalBeamM: 32,
    baseRateUsdPerMT: 29.4,
    rangeLabel: '52,000 – 58,000 DWT',
  },
  {
    className: 'Panamax',
    typicalDwtMT: 82500,
    usableCargoPct: 1,
    typicalDraftM: 14.5,
    typicalLoaM: 229,
    typicalBeamM: 32.2,
    baseRateUsdPerMT: 26.1,
    rangeLabel: '65,000 – 82,500 DWT',
  },
  {
    className: 'Capesize',
    typicalDwtMT: 182000,
    usableCargoPct: 1,
    typicalDraftM: 18.5,
    typicalLoaM: 290,
    typicalBeamM: 45,
    baseRateUsdPerMT: 38.2,
    rangeLabel: '150,000 – 182,000 DWT',
  },
];

// ─── Market context (prototype dataset) ──────────────────────────────────────
// In production: replace with licensed market data API (e.g. Baltic Exchange).

const MARKET = {
  currentPanamaxRateUsd: 28.10,
  forecast15DayUsd:       25.90,
  bunkerTrend:           'increasing' as 'increasing' | 'stable' | 'decreasing',
  panamaxTonnageSupply:  'moderate' as 'tight' | 'moderate' | 'ample',
};

// ─── Route voyage days (prototype lookup) ────────────────────────────────────

interface RouteTiming {
  loadingPort: string;
  dischargePort: string;
  voyageDaysApprox: number;
}

const ROUTE_TIMINGS: RouteTiming[] = [
  { loadingPort: 'Newcastle',    dischargePort: 'Paradip', voyageDaysApprox: 18 },
  { loadingPort: 'Hay Point',    dischargePort: 'Paradip', voyageDaysApprox: 16 },
  { loadingPort: 'Gladstone',    dischargePort: 'Paradip', voyageDaysApprox: 17 },
  { loadingPort: 'Port Hedland', dischargePort: 'Paradip', voyageDaysApprox: 12 },
  { loadingPort: 'Samarinda',    dischargePort: 'Dhamra',  voyageDaysApprox: 7 },
  { loadingPort: 'Tanjung Bara', dischargePort: 'Dhamra',  voyageDaysApprox: 7 },
  { loadingPort: 'Richards Bay', dischargePort: 'Paradip', voyageDaysApprox: 14 },
  { loadingPort: 'Salalah',      dischargePort: 'Paradip', voyageDaysApprox: 9 },
  { loadingPort: 'Sohar',        dischargePort: 'Paradip', voyageDaysApprox: 9 },
];

function getVoyageDays(loadingPort: string, dischargePort: string): number {
  const match = ROUTE_TIMINGS.find(
    (r) =>
      r.loadingPort.toLowerCase() === loadingPort.toLowerCase() &&
      r.dischargePort.toLowerCase().includes(dischargePort.toLowerCase().split(' ')[0])
  );
  return match?.voyageDaysApprox ?? 14; // default 14 days
}

// ─── Planning period months ───────────────────────────────────────────────────

function parsePlanningMonths(planningPeriod: string): number {
  if (planningPeriod.includes('Q')) return 3;
  if (planningPeriod.includes('H2') || planningPeriod.includes('H1')) return 6;
  if (planningPeriod.includes('FY')) return 12;
  return 6;
}

// ─── Risk preference parsing ──────────────────────────────────────────────────

type RiskLevel = 'Low' | 'Medium' | 'High';

function parseRiskLevel(riskPref: string): RiskLevel {
  const lower = riskPref.toLowerCase();
  if (lower.includes('low') || lower.includes('certainty')) return 'Low';
  if (lower.includes('high') || lower.includes('volatility')) return 'High';
  return 'Medium';
}

// ─── Vessel evaluation ────────────────────────────────────────────────────────

export interface VesselEvalResult {
  vesselClass: string;
  rangeLabel: string;
  typicalDwtMT: number;
  usableCapacityMT: number;
  voyagesRequired: number;
  cargoUtilisationPct: number;
  draftCompliant: boolean;
  berthSuitable: boolean;
  berthNote: string;
  estimatedCostPerMT: number;
  evaluation: 'Recommended' | 'Feasible – inefficient' | 'Not suitable';
  evaluationNote: string;
}

function evaluateVessel(
  spec: VesselSpec,
  quantityMT: number,
  berthKey: string,
  dischargePort: string
): VesselEvalResult {
  const berth = getBerthConstraint(berthKey, dischargePort);

  const usableCapacityMT = Math.floor(spec.typicalDwtMT * spec.usableCargoPct);
  const voyagesRequired = Math.ceil(quantityMT / usableCapacityMT);

  // Cargo carried per voyage is min(cargo remaining, usable capacity)
  const cargoPerVoyage = quantityMT / voyagesRequired;
  // Planning utilisation is parcel size divided by representative class DWT.
  const cargoUtilisationPct = Math.round((cargoPerVoyage / spec.typicalDwtMT) * 100);

  const draftCompliant = spec.typicalDraftM <= berth.maxDraftM;
  const loaCompliant   = spec.typicalLoaM  <= berth.maxLoaM;
  const beamCompliant  = spec.typicalBeamM <= berth.maxBeamM;
  const berthSuitable  = draftCompliant && loaCompliant && beamCompliant;

  let berthNote = 'Compliant with all berth constraints';
  if (!draftCompliant) berthNote = `Draft ${spec.typicalDraftM}m exceeds berth limit ${berth.maxDraftM}m`;
  else if (!loaCompliant) berthNote = `LOA ${spec.typicalLoaM}m exceeds berth limit ${berth.maxLoaM}m`;
  else if (!beamCompliant) berthNote = `Beam ${spec.typicalBeamM}m exceeds berth limit ${berth.maxBeamM}m`;

  // Cost per delivered MT increases with multiple voyages (additional port calls, time charter)
  const voyageCostPremium = voyagesRequired > 1 ? (voyagesRequired - 1) * 1.8 : 0;
  const estimatedCostPerMT = parseFloat(
    (spec.baseRateUsdPerMT + voyageCostPremium).toFixed(2)
  );

  let evaluation: VesselEvalResult['evaluation'];
  let evaluationNote: string;

  if (!berthSuitable) {
    evaluation = 'Not suitable';
    evaluationNote = berthNote;
  } else if (voyagesRequired > 1) {
    evaluation = 'Feasible – inefficient';
    evaluationNote = `${voyagesRequired} voyages required for this parcel size. Higher cost than single-voyage alternative.`;
  } else if (cargoUtilisationPct >= 85) {
    evaluation = 'Recommended';
    evaluationNote = `Cargo utilisation ${cargoUtilisationPct}%. Optimal vessel class for this parcel.`;
  } else {
    evaluation = 'Feasible – inefficient';
    evaluationNote = `Cargo utilisation only ${cargoUtilisationPct}%. Undersized parcel relative to vessel capacity.`;
  }

  return {
    vesselClass: spec.className,
    rangeLabel: spec.rangeLabel,
    typicalDwtMT: spec.typicalDwtMT,
    usableCapacityMT,
    voyagesRequired,
    cargoUtilisationPct,
    draftCompliant,
    berthSuitable,
    berthNote,
    estimatedCostPerMT,
    evaluation,
    evaluationNote,
  };
}

// ─── Booking decision ─────────────────────────────────────────────────────────

export type BookingDecision = 'BOOK NOW' | 'WAIT' | 'MONITOR';

interface BookingAnalysis {
  decision: BookingDecision;
  daysToArrival: number;
  voyageDays: number;
  latestBookingDate: Date;
  suggestedWindowStart: Date;
  suggestedWindowEnd: Date;
  rateTrend: 'decreasing' | 'stable' | 'increasing';
  rateDifferenceUsd: number;
  note: string;
}

function analyseBooking(
  requiredArrivalDate: string,
  loadingPort: string,
  dischargePort: string,
  assessmentDate: Date
): BookingAnalysis {
  const arrival = new Date(requiredArrivalDate);
  const daysToArrival = Math.round(
    (arrival.getTime() - assessmentDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const voyageDays = getVoyageDays(loadingPort, dischargePort);
  // Minimum scheduling buffer: voyage days + 7 days loading + 5 days operational buffer
  const minBuffer = voyageDays + 12;

  const rateDifferenceUsd = parseFloat(
    (MARKET.currentPanamaxRateUsd - MARKET.forecast15DayUsd).toFixed(2)
  );
  const rateTrend: BookingAnalysis['rateTrend'] =
    rateDifferenceUsd > 0.5  ? 'decreasing'
    : rateDifferenceUsd < -0.5 ? 'increasing'
    : 'stable';

  // Latest possible booking date
  const latestBookingDate = new Date(arrival);
  latestBookingDate.setDate(latestBookingDate.getDate() - voyageDays - 7);

  let decision: BookingDecision;
  let note: string;

  if (daysToArrival <= minBuffer + 5) {
    // Too close — must book now
    decision = 'BOOK NOW';
    note = daysToArrival < voyageDays + 7
      ? `Only ${daysToArrival} days remain, while the route requires approximately ${voyageDays} sailing days plus loading and operating time. The requested arrival is not feasible under normal assumptions. Immediate commercial action and a revised delivery date are required.`
      : `Only ${daysToArrival} days remain before the required arrival. Insufficient scheduling buffer to wait. Immediate fixture is advised.`;
  } else if (rateTrend === 'decreasing' && daysToArrival > 45) {
    decision = 'WAIT';
    note = `Current rate ($${MARKET.currentPanamaxRateUsd}/MT) is $${rateDifferenceUsd.toFixed(2)} above the 15-day projection ($${MARKET.forecast15DayUsd}/MT). The ${daysToArrival}-day planning buffer supports a short deferral. Review again in 7 days or immediately if the rate exceeds $${(MARKET.currentPanamaxRateUsd + 0.65).toFixed(2)}/MT.`;
  } else if (rateTrend === 'increasing' && daysToArrival <= 60) {
    decision = 'BOOK NOW';
    note = `Rates are trending upward and the arrival window is narrowing. Early fixture is preferred to avoid further cost exposure.`;
  } else {
    decision = 'MONITOR';
    note = `Rate movement is limited (${rateDifferenceUsd > 0 ? '-' : '+'}$${Math.abs(rateDifferenceUsd).toFixed(2)}/MT vs 15-day projection). Continue to monitor. No immediate action required.`;
  }

  // Suggested booking window: 7–11 days from assessment date
  const suggestedWindowStart = new Date(assessmentDate);
  suggestedWindowStart.setDate(suggestedWindowStart.getDate() + 7);
  const suggestedWindowEnd = new Date(assessmentDate);
  suggestedWindowEnd.setDate(suggestedWindowEnd.getDate() + 11);

  return {
    decision,
    daysToArrival,
    voyageDays,
    latestBookingDate,
    suggestedWindowStart,
    suggestedWindowEnd,
    rateTrend,
    rateDifferenceUsd,
    note,
  };
}

// ─── Contract allocation ──────────────────────────────────────────────────────

export interface ContractAllocationResult {
  longTermPct: number;    // 6-month COA
  mediumTermPct: number;  // 3-month COA
  spotPct: number;
  estimatedCostCr: number;
  savingVsAllSpotCr: number;
  options: {
    arrangement: string;
    estimatedCostCr: number;
    exposure: 'High' | 'Medium' | 'Medium-Low' | 'Low';
    notes: string;
  }[];
}

function deriveContractAllocation(
  monthlyRequirementMT: number,
  planningMonths: number,
  contractPreference: string,
  riskLevel: RiskLevel,
  minimumCommittedVolumeMT: number
): ContractAllocationResult {
  const lower = contractPreference.toLowerCase();
  let longTermPct: number;
  let mediumTermPct: number;
  let spotPct: number;

  // Start with explicit preference
  if (lower.includes('spot')) {
    longTermPct = 0; mediumTermPct = 10; spotPct = 90;
  } else if (lower.includes('6-month') || lower.includes('6 month')) {
    longTermPct = 80; mediumTermPct = 15; spotPct = 5;
  } else if (lower.includes('3-month') || lower.includes('3 month')) {
    longTermPct = 20; mediumTermPct = 65; spotPct = 15;
  } else if (lower.includes('12-month') || lower.includes('12 month')) {
    longTermPct = 90; mediumTermPct = 8; spotPct = 2;
  } else {
    // Mixed or unspecified — use risk preference to calibrate
    if (riskLevel === 'Low')    { longTermPct = 70; mediumTermPct = 25; spotPct = 5; }
    else if (riskLevel === 'High') { longTermPct = 20; mediumTermPct = 25; spotPct = 55; }
    else                         { longTermPct = 60; mediumTermPct = 25; spotPct = 15; }
  }

  // Adjust for risk preference modifier
  if (riskLevel === 'Low' && longTermPct < 60) {
    const shift = Math.min(15, 60 - longTermPct);
    longTermPct += shift;
    spotPct = Math.max(2, spotPct - shift);
  } else if (riskLevel === 'High' && spotPct < 30) {
    const shift = Math.min(15, 30 - spotPct);
    spotPct += shift;
    longTermPct = Math.max(0, longTermPct - shift);
  }

  // Normalise to 100%
  const total = longTermPct + mediumTermPct + spotPct;
  if (total !== 100) {
    const diff = 100 - total;
    mediumTermPct += diff; // absorb rounding in medium-term
  }

  // Cost modelling (prototype, per planning period)
  // A planning portfolio can never cover less cargo than the submitted parcel.
  const totalVolumeForPeriod = Math.max(
    minimumCommittedVolumeMT,
    monthlyRequirementMT > 0 ? monthlyRequirementMT * planningMonths : minimumCommittedVolumeMT
  );

  // Risk-adjusted logistics rate: freight plus common port, waiting and operating provisions.
  const spotRatePerMT = 35.40;
  const longTermRatePerMT = 31.40;
  const mediumTermRatePerMT = 33.40;

  const blendedRate =
    (spotRatePerMT * (spotPct / 100)) +
    (mediumTermRatePerMT * (mediumTermPct / 100)) +
    (longTermRatePerMT * (longTermPct / 100));

  const allSpotCost = totalVolumeForPeriod * spotRatePerMT;
  const estimatedCost = totalVolumeForPeriod * blendedRate;

  // Convert USD → INR Cr (prototype rate: 1 USD = 83.5 INR)
  const usdToInrCr = (usd: number) => parseFloat((usd * 83.5 / 1e7).toFixed(0));

  const estimatedCostCr = usdToInrCr(estimatedCost);
  const allSpotCostCr   = usdToInrCr(allSpotCost);
  const savingVsAllSpotCr = allSpotCostCr - estimatedCostCr;

  const allSpotCostCrFull = usdToInrCr(totalVolumeForPeriod * spotRatePerMT);
  const twoThreeMthCr     = usdToInrCr(totalVolumeForPeriod * ((mediumTermRatePerMT * 0.55) + (spotRatePerMT * 0.45)));
  const oneSixMthCr       = usdToInrCr(totalVolumeForPeriod * longTermRatePerMT);

  return {
    longTermPct,
    mediumTermPct,
    spotPct,
    estimatedCostCr,
    savingVsAllSpotCr,
    options: [
      {
        arrangement: 'Spot fixtures only',
        estimatedCostCr: allSpotCostCrFull,
        exposure: 'High',
        notes: 'Fully exposed to market rate volatility across each shipment.',
      },
      {
        arrangement: 'Two 3-month arrangements',
        estimatedCostCr: twoThreeMthCr,
        exposure: 'Medium',
        notes: 'Rate fixed for two 3-month cycles; partial protection against spikes.',
      },
      {
        arrangement: 'One 6-month arrangement',
        estimatedCostCr: oneSixMthCr,
        exposure: 'Low',
        notes: 'Full coverage for the planning period; lower operational flexibility.',
      },
      {
        arrangement: 'Mixed arrangement (recommended)',
        estimatedCostCr: estimatedCostCr,
        exposure: 'Medium-Low',
        notes: `${longTermPct}% long-term / ${mediumTermPct}% medium-term / ${spotPct}% spot. Balances cost and flexibility.`,
      },
    ],
  };
}

// ─── Overall risk ─────────────────────────────────────────────────────────────

function deriveOverallRisk(
  booking: BookingAnalysis,
  riskLevel: RiskLevel,
  berthSuitable: boolean
): 'Low' | 'Medium' | 'High' {
  if (!berthSuitable) return 'High';
  if (booking.decision === 'BOOK NOW' && booking.daysToArrival < 30) return 'High';
  if (riskLevel === 'High' || booking.rateTrend === 'increasing') return 'High';
  if (riskLevel === 'Low' && booking.decision === 'WAIT') return 'Low';
  return 'Medium';
}

// ─── Freight range calculation ────────────────────────────────────────────────

function deriveFreightRange(booking: BookingAnalysis): { low: number; high: number } {
  const base = booking.decision === 'WAIT'
    ? MARKET.forecast15DayUsd
    : MARKET.currentPanamaxRateUsd;

  const spread = 0.30;
  return {
    low:  parseFloat((base - spread).toFixed(2)),
    high: parseFloat((base + spread).toFixed(2)),
  };
}

// ─── Date formatting helpers ──────────────────────────────────────────────────

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateShort(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Main evaluation output ───────────────────────────────────────────────────

export interface EvaluationResult {
  // Summary
  reference: string;
  material: string;
  quantity: string;
  route: string;
  requiredArrival: string;
  assessmentDate: string;
  assessmentDateTime: string;

  // Recommendation panel
  recommendedVesselClass: string;
  bookingDecision: BookingDecision;
  bookingDecisionLabel: string;
  suitableBookingPeriod: string;
  expectedFreightRangeLabel: string;
  portCompatibility: string;
  expectedWaitingTimeHours: number;
  overallRisk: 'Low' | 'Medium' | 'High';
  forecastReliabilityPct: number;
  recommendationNote: string;

  // Vessel table
  vesselEvaluations: VesselEvalResult[];

  // Contract
  contract: ContractAllocationResult;

  // Basis of recommendation
  basisSections: { id: string; title: string; body: string }[];

  // Calculated or mock flag
  isCalculated: boolean;
}

// ─── Evaluation entry point ───────────────────────────────────────────────────

export function evaluateRequirement(form: NewRequirementForm): EvaluationResult {
  const assessmentDate = new Date('2026-09-02T12:30:00+05:30');
  const assessmentDateTime = '02 Sep 2026, 12:30 IST';

  const quantityMT = parseFloat(form.quantity) || 80000;
  const berthKey = form.preferredBerth || 'Any – as available';
  const berth = getBerthConstraint(berthKey, form.dischargePort);

  // ── Vessel evaluations ──
  const vesselEvals = VESSEL_SPECS.map((spec) =>
    evaluateVessel(spec, quantityMT, berthKey, form.dischargePort)
  );

  // Best vessel = recommended; otherwise lowest-cost suitable
  const recommended =
    vesselEvals
      .filter((v) => v.berthSuitable && v.voyagesRequired === 1)
      .sort((a, b) => a.typicalDwtMT - b.typicalDwtMT)[0] ??
    vesselEvals.filter((v) => v.berthSuitable).sort((a, b) => a.estimatedCostPerMT - b.estimatedCostPerMT)[0] ??
    vesselEvals[2]; // Panamax fallback

  // ── Booking analysis ──
  const booking = analyseBooking(
    form.requiredArrivalDate,
    form.loadingPort,
    form.dischargePort,
    assessmentDate
  );

  // ── Contract ──
  const monthlyMT = parseFloat(form.monthlyRequirement) || 0;
  const planningMonths = parsePlanningMonths(form.planningPeriod);
  const riskLevel = parseRiskLevel(form.riskPreference);
  const contract = deriveContractAllocation(monthlyMT, planningMonths, form.contractPreference, riskLevel, quantityMT);

  // ── Risk & range ──
  const overallRisk = deriveOverallRisk(booking, riskLevel, recommended.berthSuitable);
  const freightRange = deriveFreightRange(booking);

  // ── Booking decision label ──
  let bookingDecisionLabel: string;
  let suggestedPeriod: string;
  if (booking.decision === 'WAIT') {
    bookingDecisionLabel = 'Wait and review after 7 days';
    suggestedPeriod = `${formatDateShort(booking.suggestedWindowStart)} – ${formatDateShort(booking.suggestedWindowEnd)}`;
  } else if (booking.decision === 'BOOK NOW') {
    const scheduleInfeasible = booking.daysToArrival < booking.voyageDays + 7;
    bookingDecisionLabel = scheduleInfeasible
      ? 'Schedule at risk — immediate action required'
      : 'Proceed with immediate fixture';
    suggestedPeriod = scheduleInfeasible
      ? 'Delivery date review required'
      : 'Immediate — within 2 business days';
  } else {
    bookingDecisionLabel = 'Monitor — no immediate action';
    suggestedPeriod = 'Review again in 5 days';
  }

  // ── Forecast reliability: decreases as market uncertainty grows ──
  const forecastReliabilityPct =
    booking.decision === 'WAIT' ? 83
    : booking.decision === 'BOOK NOW' ? 91
    : 75;

  // ── Reference ──
  const reference = 'FR-2026-014'; // single reference in prototype

  const route = `${form.loadingPort} – ${form.dischargePort.split(' ')[0]}`;

  // ── Basis sections ──
  const basisSections = buildBasisSections(
    recommended,
    vesselEvals,
    booking,
    contract,
    form
  );

  return {
    reference,
    material: form.material,
    quantity: `${Number(quantityMT).toLocaleString()} MT`,
    route,
    requiredArrival: form.requiredArrivalDate
      ? formatDate(new Date(form.requiredArrivalDate))
      : '—',
    assessmentDate: formatDate(assessmentDate),
    assessmentDateTime,

    recommendedVesselClass: recommended.vesselClass,
    bookingDecision: booking.decision,
    bookingDecisionLabel,
    suitableBookingPeriod: suggestedPeriod,
    expectedFreightRangeLabel: `$${freightRange.low} – $${freightRange.high}/MT`,
    portCompatibility: berth.port === 'Any'
      ? 'Provisional — berth data required'
      : recommended.berthSuitable ? 'Suitable' : 'Restriction — review berth',
    expectedWaitingTimeHours: berth.waitingHoursTypical,
    overallRisk,
    forecastReliabilityPct,
    recommendationNote: booking.note,

    vesselEvaluations: vesselEvals,
    contract,
    basisSections,
    isCalculated: true,
  };
}

// ─── Basis text builder ───────────────────────────────────────────────────────

function buildBasisSections(
  recommended: VesselEvalResult,
  allVessels: VesselEvalResult[],
  booking: BookingAnalysis,
  contract: ContractAllocationResult,
  form: NewRequirementForm
): { id: string; title: string; body: string }[] {
  const sections = [];

  // Why wait / book / monitor
  const decisionTitle =
    booking.decision === 'WAIT' ? 'Why wait?'
    : booking.decision === 'BOOK NOW' ? 'Why proceed with an immediate fixture?'
    : 'Why monitor?';
  sections.push({ id: 'why-decision', title: decisionTitle, body: booking.note });

  // Why recommended vessel
  const cheaper = allVessels
    .filter((v) => v.vesselClass !== recommended.vesselClass && v.berthSuitable && v.voyagesRequired === 1)
    .sort((a, b) => a.estimatedCostPerMT - b.estimatedCostPerMT);

  const whyVesselBody = recommended.voyagesRequired === 1
    ? `A ${form.quantity} MT ${form.material} cargo aligns with ${recommended.vesselClass} capacity (${recommended.rangeLabel}), yielding ${recommended.cargoUtilisationPct}% cargo utilisation. ` +
      `Estimated cost is $${recommended.estimatedCostPerMT}/MT. ` +
      (cheaper.length > 0
        ? `The next alternative (${cheaper[0].vesselClass}) costs $${cheaper[0].estimatedCostPerMT}/MT with ${cheaper[0].cargoUtilisationPct}% utilisation.`
        : '')
    : `No single vessel class can carry this parcel in one voyage within the selected berth constraints. ${recommended.vesselClass} requires ${recommended.voyagesRequired} voyages.`;

  sections.push({
    id: 'why-vessel',
    title: `Why ${recommended.vesselClass}?`,
    body: whyVesselBody,
  });

  // Why not other vessel classes
  const unsuitable = allVessels.filter(
    (v) => v.vesselClass !== recommended.vesselClass && !v.berthSuitable
  );
  if (unsuitable.length > 0) {
    const notSuitableBody = unsuitable
      .map((v) => `${v.vesselClass}: ${v.berthNote}.`)
      .join(' ');
    sections.push({
      id: 'why-not-others',
      title: 'Why are other vessel classes excluded?',
      body: notSuitableBody,
    });
  }

  // Why this contract arrangement
  const whyContractBody =
    `SAIL's import volume for this material over the ${parsePlanningMonths(form.planningPeriod)}-month planning period ` +
    `supports a mixed contract approach. A ${contract.longTermPct}/${contract.mediumTermPct}/${contract.spotPct} split ` +
    `(6-month / 3-month / spot) is projected to save ₹${contract.savingVsAllSpotCr} Cr compared with all-spot procurement, ` +
    `while retaining ${contract.spotPct}% spot capacity for volume adjustments. ` +
    `Risk preference is ${parseRiskLevel(form.riskPreference).toLowerCase()}, which has been reflected in the allocation.`;

  sections.push({
    id: 'why-contract',
    title: 'Why this contract arrangement?',
    body: whyContractBody,
  });

  return sections;
}
