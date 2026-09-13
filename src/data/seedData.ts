import {
  NewHire,
  OrganizationSummary,
  DARK_STORE_CAPABILITIES,
  CapabilityState,
} from "../types";

export function createDefaultCapabilitiesLedger(): Record<number, CapabilityState> {
  const ledger: Record<number, CapabilityState> = {};
  for (const cap of DARK_STORE_CAPABILITIES) {
    ledger[cap.id] = {
      capabilityId: cap.id,
      exposure: "not_exposed",
      evidence: "none",
      performance: "unknown",
      mastery: "locked",
      lastAssessedAt: "Not started",
      reinforcementCount: 0,
    };
  }
  return ledger;
}

function buildRahulLedger(): Record<number, CapabilityState> {
  const ledger = createDefaultCapabilitiesLedger();
  ledger[1] = {
    capabilityId: 1,
    exposure: "exposed",
    evidence: "demonstrated",
    performance: "on_target",
    mastery: "proficient",
    lastAssessedAt: "Day 1",
    reinforcementCount: 0,
    notes: "Adheres to PPE and zone safety.",
  };
  ledger[2] = {
    capabilityId: 2,
    exposure: "exposed",
    evidence: "demonstrated",
    performance: "on_target",
    mastery: "proficient",
    lastAssessedAt: "Day 1",
    reinforcementCount: 0,
    notes: "Comfortable with handheld terminal and Bluetooth ring scanner.",
  };
  ledger[3] = {
    capabilityId: 3,
    exposure: "exposed",
    evidence: "inconsistent",
    performance: "below_target",
    mastery: "in_progress",
    lastAssessedAt: "Day 3",
    reinforcementCount: 1,
    notes: "Confused by Aisles 4-8 shelf coordinates. Requires buddy walkthrough.",
  };
  ledger[4] = {
    capabilityId: 4,
    exposure: "exposed",
    evidence: "none",
    performance: "unknown",
    mastery: "in_progress",
    lastAssessedAt: "Day 2",
    reinforcementCount: 0,
  };
  ledger[5] = {
    capabilityId: 5,
    exposure: "exposed",
    evidence: "emerging",
    performance: "below_target",
    mastery: "in_progress",
    lastAssessedAt: "Day 2",
    reinforcementCount: 0,
    notes: "Picks solo snacks orders, but multi-aisle grocery slows pace.",
  };
  return ledger;
}

function buildPriyaLedger(): Record<number, CapabilityState> {
  const ledger = createDefaultCapabilitiesLedger();
  // Capabilities 1 to 15 fully mastered or proficient
  for (let i = 1; i <= 15; i++) {
    ledger[i] = {
      capabilityId: i,
      exposure: "exposed",
      evidence: "demonstrated",
      performance: i <= 10 ? "exceeding" : "on_target",
      mastery: i <= 10 ? "mastered" : "proficient",
      lastAssessedAt: "Day 8",
      reinforcementCount: 0,
    };
  }
  ledger[16] = {
    capabilityId: 16,
    exposure: "exposed",
    evidence: "demonstrated",
    performance: "on_target",
    mastery: "proficient",
    lastAssessedAt: "Day 8",
    reinforcementCount: 0,
  };
  ledger[20] = {
    capabilityId: 20,
    exposure: "exposed",
    evidence: "emerging",
    performance: "on_target",
    mastery: "in_progress",
    lastAssessedAt: "Day 8",
    reinforcementCount: 0,
    notes: "Sustaining 54 items/hr across all zones. Candidate for mentor.",
  };
  return ledger;
}

function buildAmitLedger(): Record<number, CapabilityState> {
  const ledger = createDefaultCapabilitiesLedger();
  ledger[1] = {
    capabilityId: 1,
    exposure: "exposed",
    evidence: "demonstrated",
    performance: "on_target",
    mastery: "proficient",
    lastAssessedAt: "Day 1",
    reinforcementCount: 0,
  };
  ledger[2] = {
    capabilityId: 2,
    exposure: "exposed",
    evidence: "demonstrated",
    performance: "on_target",
    mastery: "proficient",
    lastAssessedAt: "Day 2",
    reinforcementCount: 0,
  };
  ledger[3] = {
    capabilityId: 3,
    exposure: "exposed",
    evidence: "demonstrated",
    performance: "on_target",
    mastery: "proficient",
    lastAssessedAt: "Day 3",
    reinforcementCount: 0,
  };
  ledger[5] = {
    capabilityId: 5,
    exposure: "exposed",
    evidence: "demonstrated",
    performance: "on_target",
    mastery: "proficient",
    lastAssessedAt: "Day 3",
    reinforcementCount: 0,
  };
  ledger[6] = {
    capabilityId: 6,
    exposure: "exposed",
    evidence: "inconsistent",
    performance: "below_target",
    mastery: "in_progress",
    lastAssessedAt: "Day 4",
    reinforcementCount: 1,
    notes: "Variant rush: confused 200g vs 500g pouches; 3 mis-picks at QC.",
  };
  return ledger;
}

export const initialRahul: NewHire = {
  id: "nh-rahul-01",
  name: "Rahul Sharma",
  roleId: "quick_commerce_picker",
  roleTitle: "Dark Store Picker",
  storeLocation: "Dark Store #104 (Indiranagar Central)",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  startDate: "2026-09-01",
  currentDay: 1,
  shift: "Morning (07:00 - 15:30)",
  supervisor: "Suresh K. (Shift In-charge)",
  buddy: "Vikram R. (Senior Picker)",
  status: "Doing well",
  statusReason: "Day 1 Orientation. Awaiting Simulator evidence.",
  recommendedActionSnippet: "Awaiting Simulator evidence",
  modulesCompleted: 0,
  quizAverageScore: 0,
  completedModuleIds: [],
  currentCapabilityId: 1,
  overallReadinessScore: 0,
  capabilities: createDefaultCapabilitiesLedger(),
  daysHistory: [],
};

export const initialCohort: NewHire[] = [
  initialRahul,
  {
    id: "nh-priya-02",
    name: "Priya Sundaram",
    roleId: "quick_commerce_picker",
    roleTitle: "Dark Store Picker",
    storeLocation: "Dark Store #104 (Indiranagar Central)",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    startDate: "2026-08-27",
    currentDay: 1,
    shift: "Evening (14:00 - 22:30)",
    supervisor: "Suresh K.",
    buddy: "Anita M.",
    status: "Doing well",
    statusReason: "Day 1 Orientation. Awaiting Simulator evidence.",
    recommendedActionSnippet: "Awaiting Simulator evidence",
    modulesCompleted: 0,
    quizAverageScore: 0,
    completedModuleIds: [],
    currentCapabilityId: 1,
    overallReadinessScore: 0,
    capabilities: createDefaultCapabilitiesLedger(),
    daysHistory: [],
  },
  {
    id: "nh-amit-03",
    name: "Amit Verma",
    roleId: "quick_commerce_picker",
    roleTitle: "Dark Store Picker",
    storeLocation: "Dark Store #104 (Indiranagar Central)",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    startDate: "2026-08-31",
    currentDay: 1,
    shift: "Morning (07:00 - 15:30)",
    supervisor: "Suresh K.",
    buddy: "Vikram R.",
    status: "Doing well",
    statusReason: "Day 1 Orientation. Awaiting Simulator evidence.",
    recommendedActionSnippet: "Awaiting Simulator evidence",
    modulesCompleted: 0,
    quizAverageScore: 0,
    completedModuleIds: [],
    currentCapabilityId: 1,
    overallReadinessScore: 0,
    capabilities: createDefaultCapabilitiesLedger(),
    daysHistory: [],
  },
];

export const mockNewHire: NewHire = initialRahul;

export const initialOrgSummary: OrganizationSummary = {
  id: "org-qc-bengaluru",
  name: "FastCart Dark Store Operations",
  storeName: "Dark Store #104 (Indiranagar Central)",
  totalNewHires: 3,
  doingWellCount: 3,
  needsAttentionCount: 0,
  atRiskCount: 0,
  commonProblems: [],
  emergingPatterns: [],
  urgentAttentionIds: [],
};
