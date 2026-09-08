// ─── Berth Constraint Database ────────────────────────────────────────────────
// Prototype database. Production deployment requires verified SAIL operational data.

export interface BerthConstraint {
  berthKey: string;       // identifier used in form options
  displayName: string;
  port: string;
  maxDraftM: number;      // metres
  maxLoaM: number;        // metres
  maxBeamM: number;       // metres
  maxDwtApprox: number;   // approximate DWT ceiling given draft
  waitingHoursTypical: number;
  notes: string;
}

export const berthDatabase: BerthConstraint[] = [
  {
    berthKey: 'EQ-I (Paradip)',
    displayName: 'EQ-I',
    port: 'Paradip',
    maxDraftM: 13.5,
    maxLoaM: 225,
    maxBeamM: 32,
    maxDwtApprox: 65000,
    waitingHoursTypical: 10,
    notes: 'Suitable for Handysize and smaller Supramax.',
  },
  {
    berthKey: 'EQ-II (Paradip)',
    displayName: 'EQ-II',
    port: 'Paradip',
    maxDraftM: 15.0,
    maxLoaM: 260,
    maxBeamM: 40,
    maxDwtApprox: 80000,
    waitingHoursTypical: 12,
    notes: 'Suitable for full Supramax and Panamax.',
  },
  {
    berthKey: 'New Coal Import Berth (Paradip)',
    displayName: 'New Coal Import Berth',
    port: 'Paradip',
    maxDraftM: 16.5,
    maxLoaM: 300,
    maxBeamM: 45,
    maxDwtApprox: 90000,
    waitingHoursTypical: 14,
    notes: 'Prototype planning limits for a Paradip coal-import berth. Suitable for Panamax; verify operational limits before production use.',
  },
  {
    berthKey: 'Dhamra – Coal Berth',
    displayName: 'Dhamra Coal Berth',
    port: 'Dhamra',
    maxDraftM: 17.5,
    maxLoaM: 310,
    maxBeamM: 50,
    maxDwtApprox: 120000,
    waitingHoursTypical: 8,
    notes: 'Capable of larger Panamax and post-Panamax.',
  },
  {
    berthKey: 'Vizag – Coal Berth 1',
    displayName: 'Coal Berth 1',
    port: 'Vizag',
    maxDraftM: 14.5,
    maxLoaM: 250,
    maxBeamM: 38,
    maxDwtApprox: 75000,
    waitingHoursTypical: 16,
    notes: 'Suitable for Supramax and smaller Panamax.',
  },
  {
    // fallback when no berth is nominated
    berthKey: 'Any – as available',
    displayName: 'Any available',
    port: 'Any',
    maxDraftM: 14.5,   // conservative default
    maxLoaM: 250,
    maxBeamM: 38,
    maxDwtApprox: 75000,
    waitingHoursTypical: 12,
    notes: 'Conservative default constraints applied.',
  },
];

export function getBerthConstraint(berthKey: string, dischargePort: string): BerthConstraint {
  // First match on exact berth key
  const exact = berthDatabase.find((b) => b.berthKey === berthKey);
  if (exact) return exact;

  // Match by port if no berth nominated
  const byPort = berthDatabase.find(
    (b) => b.port.toLowerCase() === dischargePort.toLowerCase()
  );
  return byPort ?? berthDatabase[berthDatabase.length - 1]; // fallback to 'Any'
}
