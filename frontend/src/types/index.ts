// ─── Freight Requirement ─────────────────────────────────────────────────────

export type RequirementStatus =
  | 'Under evaluation'
  | 'Rate movement observed'
  | 'No immediate concern'
  | 'Pending'
  | 'Closed';

export interface FreightRequirement {
  reference: string;
  material: string;
  route: string;
  quantity: string;
  requiredBy: string;
  status: RequirementStatus;
}

// ─── Freight Trend ────────────────────────────────────────────────────────────

export interface FreightDataPoint {
  date: string;   // 'DD MMM'
  panamax: number;
  supramax: number;
}

// ─── Vessel ──────────────────────────────────────────────────────────────────

export type VesselEvaluation = 'Recommended' | 'Acceptable' | 'Not suitable';

export interface VesselComparison {
  vesselClass: string;
  capacity: string;
  cargoUtilization: string;
  draftCompliance: string;
  berthSuitability: string;
  estimatedTotalCost: string;
  evaluation: VesselEvaluation;
}

// ─── Contract ────────────────────────────────────────────────────────────────

export type ExposureLevel = 'High' | 'Medium' | 'Medium-Low' | 'Low';

export interface ContractOption {
  arrangement: string;
  estimatedCost: string;
  exposure: ExposureLevel;
  notes: string;
}

export interface ContractAllocation {
  type: string;
  percentage: number;
}

// ─── Recommendation ──────────────────────────────────────────────────────────

export interface RecommendationSummary {
  reference: string;
  material: string;
  quantity: string;
  route: string;
  requiredArrival: string;
  assessmentDate: string;
}

export interface RecommendationPanel {
  vesselClass: string;
  bookingPosition: string;
  suitableBookingPeriod: string;
  expectedFreightRange: string;
  portCompatibility: string;
  expectedWaitingTime: string;
  overallRisk: 'Low' | 'Medium' | 'High';
  forecastReliability: string;
  note: string;
}

// ─── Operational Notice ──────────────────────────────────────────────────────

export interface OperationalNotice {
  id: string;
  level: 'info' | 'warning' | 'alert';
  text: string;
}

// ─── Form ────────────────────────────────────────────────────────────────────

export interface NewRequirementForm {
  // Cargo
  material: string;
  quantity: string;
  tolerance: string;
  consignments: string;
  // Route
  loadingCountry: string;
  loadingPort: string;
  dischargePort: string;
  preferredBerth: string;
  requiredArrivalDate: string;
  // Planning
  planningPeriod: string;
  monthlyRequirement: string;
  contractPreference: string;
  riskPreference: string;
}
