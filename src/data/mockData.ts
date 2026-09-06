import type {
  FreightRequirement,
  FreightDataPoint,
  VesselComparison,
  ContractOption,
  ContractAllocation,
  RecommendationSummary,
  RecommendationPanel,
  OperationalNotice,
} from '../types';

// ─── Overview ────────────────────────────────────────────────────────────────

export const requirementsAttention: FreightRequirement[] = [
  {
    reference: 'FR-2026-014',
    material: 'Coking Coal',
    route: 'Newcastle – Paradip',
    quantity: '80,000 MT',
    requiredBy: '15 Nov 2026',
    status: 'Under evaluation',
  },
  {
    reference: 'FR-2026-015',
    material: 'Thermal Coal',
    route: 'Indonesia – Dhamra',
    quantity: '65,000 MT',
    requiredBy: '28 Nov 2026',
    status: 'Rate movement observed',
  },
  {
    reference: 'FR-2026-016',
    material: 'Limestone',
    route: 'Oman – Paradip',
    quantity: '50,000 MT',
    requiredBy: '10 Dec 2026',
    status: 'No immediate concern',
  },
];

export const kpiPanels = [
  { label: 'Panamax Route Indication', value: '$28.10/MT', sub: 'Newcastle–Paradip' },
  { label: '15-Day Assessment', value: '$25.90/MT', sub: 'Projected trend' },
  { label: 'Paradip Waiting Estimate', value: '14 hours', sub: 'Current port estimate' },
  { label: 'Available Panamax Tonnage', value: 'Moderate', sub: 'Near Australia region' },
];

export const operationalNotices: OperationalNotice[] = [
  {
    id: 'ON-001',
    level: 'warning',
    text: 'Panamax availability near Australia is below the 30-day average.',
  },
  {
    id: 'ON-002',
    level: 'info',
    text: 'Paradip waiting time remains within the normal operating range.',
  },
  {
    id: 'ON-003',
    level: 'warning',
    text: 'Bunker prices have increased during the last seven days.',
  },
];

// ─── Freight Trend ────────────────────────────────────────────────────────────

export const freightTrendData: FreightDataPoint[] = [
  { date: '04 Aug', panamax: 24.2, supramax: 21.8 },
  { date: '06 Aug', panamax: 24.8, supramax: 22.1 },
  { date: '08 Aug', panamax: 25.1, supramax: 22.4 },
  { date: '10 Aug', panamax: 25.6, supramax: 22.9 },
  { date: '12 Aug', panamax: 26.0, supramax: 23.2 },
  { date: '14 Aug', panamax: 26.4, supramax: 23.5 },
  { date: '16 Aug', panamax: 27.1, supramax: 23.9 },
  { date: '18 Aug', panamax: 27.8, supramax: 24.3 },
  { date: '20 Aug', panamax: 28.3, supramax: 24.6 },
  { date: '22 Aug', panamax: 28.0, supramax: 24.4 },
  { date: '24 Aug', panamax: 27.6, supramax: 24.1 },
  { date: '26 Aug', panamax: 27.2, supramax: 23.8 },
  { date: '28 Aug', panamax: 26.8, supramax: 23.6 },
  { date: '30 Aug', panamax: 26.3, supramax: 23.3 },
  { date: '01 Sep', panamax: 25.9, supramax: 23.1 },
  { date: '02 Sep', panamax: 25.4, supramax: 22.8 },
];

// ─── Recommendation ──────────────────────────────────────────────────────────

export const recommendationSummary: RecommendationSummary = {
  reference: 'FR-2026-014',
  material: 'Coking Coal',
  quantity: '80,000 MT',
  route: 'Newcastle – Paradip',
  requiredArrival: '15 November 2026',
  assessmentDate: '2 September 2026',
};

export const recommendationPanel: RecommendationPanel = {
  vesselClass: 'Panamax',
  bookingPosition: 'Wait and review after 7 days',
  suitableBookingPeriod: '9 – 13 September 2026',
  expectedFreightRange: '$25.80 – $26.40/MT',
  portCompatibility: 'Suitable',
  expectedWaitingTime: '14 hours',
  overallRisk: 'Medium',
  forecastReliability: '83%',
  note: 'Based on the present freight movement, available planning buffer and estimated vessel position, an immediate booking is not preferred. The requirement should be reviewed after seven days or earlier if the indicated rate exceeds $28.75/MT.',
};

// ─── Vessel Comparison ───────────────────────────────────────────────────────

export const vesselComparisons: VesselComparison[] = [
  {
    vesselClass: 'Supramax',
    capacity: '52,000 – 58,000 DWT',
    cargoUtilization: '72%',
    draftCompliance: 'Yes',
    berthSuitability: 'Yes',
    estimatedTotalCost: '$29.40/MT',
    evaluation: 'Acceptable',
  },
  {
    vesselClass: 'Panamax',
    capacity: '65,000 – 80,000 DWT',
    cargoUtilization: '100%',
    draftCompliance: 'Yes',
    berthSuitability: 'Yes',
    estimatedTotalCost: '$26.10/MT',
    evaluation: 'Recommended',
  },
  {
    vesselClass: 'Capesize',
    capacity: '150,000 – 180,000 DWT',
    cargoUtilization: '47%',
    draftCompliance: 'No',
    berthSuitability: 'No – draft exceeds limit',
    estimatedTotalCost: '$38.20/MT',
    evaluation: 'Not suitable',
  },
];

// ─── Contract Comparison ─────────────────────────────────────────────────────

export const contractOptions: ContractOption[] = [
  {
    arrangement: 'Six spot fixtures',
    estimatedCost: '₹142 Cr',
    exposure: 'High',
    notes: 'Fully exposed to market rate volatility across each shipment.',
  },
  {
    arrangement: 'Two 3-month arrangements',
    estimatedCost: '₹135 Cr',
    exposure: 'Medium',
    notes: 'Rate fixed for two 3-month cycles; partial protection against spikes.',
  },
  {
    arrangement: 'One 6-month arrangement',
    estimatedCost: '₹132 Cr',
    exposure: 'Low',
    notes: 'Full coverage for the planning period; lower flexibility.',
  },
  {
    arrangement: 'Mixed arrangement',
    estimatedCost: '₹130 Cr',
    exposure: 'Medium-Low',
    notes: 'Combines long-term and spot; balances cost and operational flexibility.',
  },
];

export const contractAllocations: ContractAllocation[] = [
  { type: '6-month arrangement', percentage: 60 },
  { type: '3-month arrangement', percentage: 25 },
  { type: 'Spot fixtures', percentage: 15 },
];

export const potentialSaving =
  'Estimated saving compared with repeated spot fixtures: ₹12 Cr';

// ─── Basis of Recommendation ─────────────────────────────────────────────────

export const basisSections = [
  {
    id: 'why-wait',
    title: 'Why wait?',
    body: 'Current Panamax indicative rates are at $28.10/MT, which is above the 15-day projected level of $25.90/MT. The 11-week planning buffer before the required arrival date provides adequate time to capitalise on an expected rate softening. An immediate booking at prevailing rates would represent an avoidable cost premium.',
  },
  {
    id: 'why-panamax',
    title: 'Why Panamax?',
    body: 'An 80,000 MT Coking Coal cargo aligns precisely with Panamax capacity (65,000–80,000 DWT), yielding 100% cargo utilisation. Panamax vessels comply with Paradip berth draft requirements. The estimated freight cost of $26.10/MT is significantly lower than a Supramax split-cargo arrangement at $29.40/MT.',
  },
  {
    id: 'why-not-capesize',
    title: 'Why not Capesize?',
    body: 'Capesize vessels (150,000–180,000 DWT) would result in only 47% cargo utilisation for this parcel. More critically, their draft exceeds Paradip berth limits, making a direct call impossible without lightering — an option that introduces additional cost, time and operational risk.',
  },
  {
    id: 'why-mixed',
    title: 'Why use a mixed contract arrangement?',
    body: 'SAIL\'s annual Coking Coal import volume supports a combination of long-term and spot procurement. A 60/25/15 split across 6-month, 3-month and spot fixtures locks in a base cost advantage (₹12 Cr saving over all-spot), while retaining 15% spot capacity for volume adjustments and opportunistic bookings during rate dips.',
  },
];

// ─── Form Dropdown Options ────────────────────────────────────────────────────

export const materialOptions = [
  'Coking Coal',
  'Thermal Coal',
  'Limestone',
  'Iron Ore',
  'Manganese Ore',
  'Rock Phosphate',
  'Gypsum',
];

export const loadingCountryOptions = [
  'Australia',
  'Indonesia',
  'South Africa',
  'Russia',
  'United States',
  'Canada',
  'Oman',
  'Brazil',
];

export const loadingPortOptions: Record<string, string[]> = {
  Australia: ['Newcastle', 'Hay Point', 'Gladstone', 'Port Hedland'],
  Indonesia: ['Samarinda', 'Tanjung Bara', 'Kaltim Prima', 'Bunati'],
  'South Africa': ['Richards Bay', 'Durban'],
  Russia: ['Vanino', 'Vostochny'],
  'United States': ['Norfolk', 'Baltimore', 'New Orleans'],
  Canada: ['Vancouver', 'Prince Rupert'],
  Oman: ['Salalah', 'Sohar'],
  Brazil: ['Tubarao', 'Ponta da Madeira'],
};

export const dischargePortOptions = [
  'Paradip',
  'Dhamra',
  'Vizag (Visakhapatnam)',
  'Haldia',
  'Gangavaram',
  'Ennore',
  'Mormugao',
];

export const preferredBerthOptions = [
  'EQ-I (Paradip)',
  'EQ-II (Paradip)',
  'COT Berth (Paradip)',
  'Dhamra – Coal Berth',
  'Vizag – Coal Berth 1',
  'Any – as available',
];

export const contractPreferenceOptions = [
  'Spot',
  '3-month COA',
  '6-month COA',
  '12-month COA',
  'Mixed arrangement',
];

export const riskPreferenceOptions = [
  'Low – prioritise rate certainty',
  'Medium – balance cost and flexibility',
  'High – willing to accept spot volatility',
];

export const planningPeriodOptions = [
  'Q4 2026 (Oct – Dec)',
  'Q1 2027 (Jan – Mar)',
  'H2 2026 (Jul – Dec)',
  'FY 2026–27',
  'FY 2027–28',
];
