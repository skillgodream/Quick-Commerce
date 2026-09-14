import {
  NewHire,
  OrganizationSummary,
  DARK_STORE_CAPABILITIES,
  CapabilityState,
  DayRecord,
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

export function buildRahulLedger(): Record<number, CapabilityState> {
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
    evidence: "demonstrated",
    performance: "on_target",
    mastery: "proficient",
    lastAssessedAt: "Day 4",
    reinforcementCount: 1,
    notes: "Completed Aisles 4-8 walkthrough with Vikram. Navigation confident and fast.",
  };
  ledger[4] = {
    capabilityId: 4,
    exposure: "exposed",
    evidence: "demonstrated",
    performance: "on_target",
    mastery: "proficient",
    lastAssessedAt: "Day 2",
    reinforcementCount: 0,
  };
  ledger[5] = {
    capabilityId: 5,
    exposure: "exposed",
    evidence: "demonstrated",
    performance: "on_target",
    mastery: "in_progress",
    lastAssessedAt: "Day 4",
    reinforcementCount: 0,
    notes: "Single item pick velocity steady at 46 items/hr.",
  };
  ledger[6] = {
    capabilityId: 6,
    exposure: "exposed",
    evidence: "demonstrated",
    performance: "on_target",
    mastery: "in_progress",
    lastAssessedAt: "Day 4",
    reinforcementCount: 0,
    notes: "Pouch and pack variant checking accurate.",
  };
  return ledger;
}

function buildPriyaLedger(): Record<number, CapabilityState> {
  const ledger = createDefaultCapabilitiesLedger();
  for (let i = 1; i <= 15; i++) {
    ledger[i] = {
      capabilityId: i,
      exposure: "exposed",
      evidence: "demonstrated",
      performance: i <= 10 ? "exceeding" : "on_target",
      mastery: i <= 10 ? "mastered" : "proficient",
      lastAssessedAt: "Day 4",
      reinforcementCount: 0,
    };
  }
  ledger[16] = {
    capabilityId: 16,
    exposure: "exposed",
    evidence: "demonstrated",
    performance: "on_target",
    mastery: "proficient",
    lastAssessedAt: "Day 4",
    reinforcementCount: 0,
  };
  return ledger;
}

function buildAmitLedger(): Record<number, CapabilityState> {
  const ledger = createDefaultCapabilitiesLedger();
  ledger[1] = { capabilityId: 1, exposure: "exposed", evidence: "demonstrated", performance: "on_target", mastery: "proficient", lastAssessedAt: "Day 1", reinforcementCount: 0 };
  ledger[2] = { capabilityId: 2, exposure: "exposed", evidence: "demonstrated", performance: "on_target", mastery: "proficient", lastAssessedAt: "Day 2", reinforcementCount: 0 };
  ledger[3] = { capabilityId: 3, exposure: "exposed", evidence: "demonstrated", performance: "on_target", mastery: "proficient", lastAssessedAt: "Day 3", reinforcementCount: 0 };
  ledger[5] = { capabilityId: 5, exposure: "exposed", evidence: "demonstrated", performance: "on_target", mastery: "proficient", lastAssessedAt: "Day 3", reinforcementCount: 0 };
  ledger[6] = {
    capabilityId: 6,
    exposure: "exposed",
    evidence: "demonstrated",
    performance: "on_target",
    mastery: "in_progress",
    lastAssessedAt: "Day 4",
    reinforcementCount: 1,
    notes: "Variant rush mastered after supervisor demonstration.",
  };
  return ledger;
}

function buildSnehaLedger(): Record<number, CapabilityState> {
  const ledger = createDefaultCapabilitiesLedger();
  ledger[1] = { capabilityId: 1, exposure: "exposed", evidence: "demonstrated", performance: "on_target", mastery: "proficient", lastAssessedAt: "Day 1", reinforcementCount: 0 };
  ledger[2] = { capabilityId: 2, exposure: "exposed", evidence: "demonstrated", performance: "on_target", mastery: "proficient", lastAssessedAt: "Day 2", reinforcementCount: 0 };
  ledger[3] = { capabilityId: 3, exposure: "exposed", evidence: "demonstrated", performance: "on_target", mastery: "proficient", lastAssessedAt: "Day 3", reinforcementCount: 0 };
  ledger[4] = { capabilityId: 4, exposure: "exposed", evidence: "demonstrated", performance: "on_target", mastery: "proficient", lastAssessedAt: "Day 4", reinforcementCount: 0 };
  return ledger;
}

function buildNehaLedger(): Record<number, CapabilityState> {
  const ledger = createDefaultCapabilitiesLedger();
  ledger[1] = { capabilityId: 1, exposure: "exposed", evidence: "demonstrated", performance: "on_target", mastery: "proficient", lastAssessedAt: "Day 1", reinforcementCount: 0 };
  ledger[2] = { capabilityId: 2, exposure: "exposed", evidence: "demonstrated", performance: "on_target", mastery: "proficient", lastAssessedAt: "Day 2", reinforcementCount: 0 };
  ledger[3] = { capabilityId: 3, exposure: "exposed", evidence: "demonstrated", performance: "on_target", mastery: "proficient", lastAssessedAt: "Day 3", reinforcementCount: 0 };
  ledger[4] = { capabilityId: 4, exposure: "exposed", evidence: "demonstrated", performance: "on_target", mastery: "proficient", lastAssessedAt: "Day 4", reinforcementCount: 0 };
  return ledger;
}

// 5 Complete Days of Realistic Dark Store Operations History for Rahul
export const rahulDaysHistory: DayRecord[] = [
  {
    dayNumber: 1,
    date: "2026-09-01",
    statusAtEnd: "Doing well",
    statusReason: "Day 1 orientation completed. Safety gear verified, scanner pairing practiced.",
    dailySignal: {
      id: "sig-r-d1",
      dayNumber: 1,
      rawText: "First day completed orientation. Safety shoe and high-vis vest check done, paired Bluetooth ring scanner.",
      inputMethod: "voice",
      issue: "None",
      confidence: "High",
      possibleImpact: "Smooth start",
      category: "Environment",
      summary: "Completed Day 1 safety and device onboarding.",
      timestamp: "15:30",
    },
    managerSignal: {
      id: "mgr-r-d1",
      dayNumber: 1,
      managerName: "Suresh K.",
      state: "Doing well",
      notes: "Attended safety briefing on time. Good attitude.",
      timestamp: "16:00",
    },
    recommendedAction: {
      id: "act-r-d1",
      dayNumber: 1,
      actionType: "practice",
      title: "Scanner Barcode Aiming",
      description: "Practice barcode aiming and battery docking at closeout.",
      targetActor: "Rahul Sharma",
      urgency: "Monitor",
      smallestPracticalStep: "Pair ring scanner 3 times without assistance.",
      status: "completed",
      createdAt: "16:15",
    },
  },
  {
    dayNumber: 2,
    date: "2026-09-02",
    statusAtEnd: "Doing well",
    statusReason: "Solo snacks picking underway. Navigating Aisles 1–3 smoothly.",
    dailySignal: {
      id: "sig-r-d2",
      dayNumber: 2,
      rawText: "Picked snack totes solo today. Aisles 1 to 3 are easy to find.",
      inputMethod: "voice",
      issue: "None",
      confidence: "High",
      possibleImpact: "Good progress",
      category: "Process",
      summary: "Snack aisle navigation comfortable.",
      timestamp: "15:30",
    },
    managerSignal: {
      id: "mgr-r-d2",
      dayNumber: 2,
      managerName: "Suresh K.",
      state: "Doing well",
      notes: "Steady pace on ambient snacks aisle.",
      timestamp: "16:00",
    },
    workSignal: {
      dayNumber: 2,
      targetPickRate: 35,
      actualPickRate: 34,
      accuracyRate: 99,
      ordersCompleted: 28,
      targetOrders: 30,
      hasWorkEvidence: true,
    },
    recommendedAction: {
      id: "act-r-d2",
      dayNumber: 2,
      actionType: "no_action",
      title: "Continue Solo Picking",
      description: "Maintain current accuracy and prepare for back grocery aisles.",
      targetActor: "Rahul Sharma",
      urgency: "Monitor",
      smallestPracticalStep: "Keep 99% accuracy on tomorrow's grocery shift.",
      status: "completed",
      createdAt: "16:15",
    },
  },
  {
    dayNumber: 3,
    date: "2026-09-03",
    statusAtEnd: "Needs attention",
    statusReason: "Bottleneck in Aisles 4-8 (Beverages/Bulk). Backtracking caused pick velocity drop.",
    dailySignal: {
      id: "sig-r-d3",
      dayNumber: 3,
      rawText: "Bhaiya, Aisles 4 to 8 shelf codes are confusing. Lost 15 minutes finding juice racks.",
      inputMethod: "voice",
      issue: "Aisle navigation confusion",
      confidence: "Medium",
      possibleImpact: "Pick rate lag",
      category: "Environment",
      summary: "Aisles 4-8 shelf coordinates confusing.",
      timestamp: "15:30",
    },
    managerSignal: {
      id: "mgr-r-d3",
      dayNumber: 3,
      managerName: "Suresh K.",
      state: "Needs support",
      issueCategory: "Speed",
      notes: "Pacing slowed down in beverage aisles due to coordinate searching.",
      timestamp: "16:00",
    },
    workSignal: {
      dayNumber: 3,
      targetPickRate: 45,
      actualPickRate: 31,
      accuracyRate: 98,
      ordersCompleted: 26,
      targetOrders: 40,
      gapIdentified: "Aisles 4-8 navigation delay",
      hasWorkEvidence: true,
    },
    identifiedPattern: {
      id: "pat-r-d3",
      dayNumber: 3,
      patternName: "Coordinate Navigation Friction",
      patternConfidence: "High",
      diagnosis: "Confusion with Bay-Shelf coordinate numbering in back aisles.",
      category: "Environment",
      connectedSignalSummary: ["Learner voice report: Aisles 4-8 shelf codes confusing", "Pick rate 31/hr vs 45 target"],
      detectedAt: "16:05",
    },
    recommendedAction: {
      id: "act-r-d3",
      dayNumber: 3,
      actionType: "buddy_walkthrough",
      title: "Buddy Floor Walkthrough in Aisles 4–8",
      description: "Vikram to walk Rahul through Bay-Shelf coordinate reading in Aisles 4–8.",
      targetActor: "Vikram R. (Buddy)",
      urgency: "Immediate",
      smallestPracticalStep: "15-minute floor walkthrough at start of Day 4 shift.",
      status: "completed",
      targetCapabilityId: 3,
      decisionType: "buddy_support",
      whyThisAction: "Direct hands-on navigation coaching quickly resolves shelf numbering confusion.",
      createdAt: "16:15",
    },
    actionOutcome: {
      id: "out-r-d3",
      actionId: "act-r-d3",
      dayNumber: 3,
      performedBy: "Vikram R.",
      performedAt: "Day 4 07:30",
      improved: "yes",
      notes: "Walkthrough completed! Rahul now understands rack-bay coordinate layout perfectly.",
      subsequentPickRate: 46,
      subsequentAccuracy: 99,
    },
  },
  {
    dayNumber: 4,
    date: "2026-09-04",
    statusAtEnd: "Doing well",
    statusReason: "Post-walkthrough recovery: pick velocity surged to 46 items/hr with 99.2% accuracy.",
    dailySignal: {
      id: "sig-r-d4",
      dayNumber: 4,
      rawText: "Vikram bhaiya explained the shelf numbers in Aisle 6. Picked 42 orders easily today!",
      inputMethod: "voice",
      issue: "None",
      confidence: "High",
      possibleImpact: "Rapid turnaround",
      category: "Process",
      summary: "Aisle navigation mastered after buddy walkthrough.",
      timestamp: "15:30",
    },
    managerSignal: {
      id: "mgr-r-d4",
      dayNumber: 4,
      managerName: "Suresh K.",
      state: "Doing well",
      notes: "Great comeback. Pick speed up to 46 items/hr.",
      timestamp: "16:00",
    },
    workSignal: {
      dayNumber: 4,
      targetPickRate: 45,
      actualPickRate: 46,
      accuracyRate: 99,
      ordersCompleted: 42,
      targetOrders: 42,
      hasWorkEvidence: true,
    },
    recommendedAction: {
      id: "act-r-d4",
      dayNumber: 4,
      actionType: "practice",
      title: "Fragile Produce Handling Practice",
      description: "Practice cushioning eggs and soft fruits at top of pick tote.",
      targetActor: "Rahul Sharma",
      urgency: "Next Shift",
      smallestPracticalStep: "Pack 5 mixed totes adhering to heavy-at-bottom rule.",
      status: "completed",
      targetCapabilityId: 8,
      decisionType: "advance_default",
      createdAt: "16:15",
    },
  },
  {
    dayNumber: 5,
    date: "2026-09-05",
    statusAtEnd: "Doing well",
    statusReason: "Level 2 consistency demonstrated. 48 items/hr sustained over full 8-hour shift.",
    dailySignal: {
      id: "sig-r-d5",
      dayNumber: 5,
      rawText: "Shift was great! Zero broken items and finished all 48 orders ahead of SLA countdown.",
      inputMethod: "voice",
      issue: "None",
      confidence: "High",
      possibleImpact: "Level 2 unlocked",
      category: "Process",
      summary: "Sustained high velocity and perfect tote cushioning.",
      timestamp: "15:30",
    },
    managerSignal: {
      id: "mgr-r-d5",
      dayNumber: 5,
      managerName: "Suresh K.",
      state: "Doing well",
      notes: "Consistently exceeding 45 items/hr. Ready for cold room training next week.",
      timestamp: "16:00",
    },
    workSignal: {
      dayNumber: 5,
      targetPickRate: 45,
      actualPickRate: 48,
      accuracyRate: 99.4,
      ordersCompleted: 48,
      targetOrders: 45,
      hasWorkEvidence: true,
    },
    recommendedAction: {
      id: "act-r-d5",
      dayNumber: 5,
      actionType: "no_action",
      title: "Maintain Steady Rhythm",
      description: "Continue high-accuracy picking; scheduled for Cold Room certification on Day 6.",
      targetActor: "Rahul Sharma",
      urgency: "Monitor",
      smallestPracticalStep: "Complete digital micro-module on Cold Chain prior to shift.",
      status: "in_progress",
      targetCapabilityId: 7,
      decisionType: "advance_default",
      createdAt: "16:15",
    },
  },
];

export const initialRahul: NewHire = {
  id: "nh-rahul-01",
  name: "Rahul Sharma",
  roleId: "quick_commerce_picker",
  roleTitle: "Dark Store Picker",
  storeLocation: "Dark Store #104 (Indiranagar Central)",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  startDate: "2026-09-01",
  currentDay: rahulDaysHistory[rahulDaysHistory.length - 1]?.dayNumber ?? 1,
  shift: "Morning (07:00 - 15:30)",
  supervisor: "Suresh K. (Shift In-charge)",
  buddy: "Vikram R. (Senior Picker)",
  status: "Doing well",
  statusReason: "Day 4 on floor: Pick rate surged to 46 items/hr with 99% accuracy after buddy walkthrough.",
  recommendedActionSnippet: "Fragile Produce Handling Practice",
  modulesCompleted: 4,
  quizAverageScore: 94,
  completedModuleIds: ["lms-mod-01", "lms-mod-02", "lms-mod-03", "lms-mod-04"],
  currentCapabilityId: 4,
  overallReadinessScore: 45,
  capabilities: buildRahulLedger(),
  daysHistory: rahulDaysHistory,
};

const priyaHistory = rahulDaysHistory.map(d => ({
  ...d,
  workSignal: {
    dayNumber: d.dayNumber,
    targetPickRate: 45,
    actualPickRate: 50 + d.dayNumber,
    accuracyRate: 99.5,
    ordersCompleted: 45 + d.dayNumber * 2,
    targetOrders: 42,
    hasWorkEvidence: true,
  }
}));

const amitHistory = rahulDaysHistory.slice(0, 4);

const snehaHistory = rahulDaysHistory.slice(0, 4).map((d) => ({
  ...d,
  workSignal: {
    dayNumber: d.dayNumber,
    targetPickRate: 50,
    actualPickRate: 54 + d.dayNumber,
    accuracyRate: 98,
    ordersCompleted: 46 + d.dayNumber * 2,
    targetOrders: 45,
    hasWorkEvidence: true,
  },
}));

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
    currentDay: priyaHistory[priyaHistory.length - 1]?.dayNumber ?? 1,
    shift: "Evening (14:00 - 22:30)",
    supervisor: "Suresh K.",
    buddy: "Anita M.",
    status: "Doing well",
    statusReason: "Fast velocity (52 items/hr). Top performer candidate for peer trainer.",
    recommendedActionSnippet: "Multi-Zone Fast Dispatch",
    modulesCompleted: 8,
    quizAverageScore: 98,
    completedModuleIds: ["lms-mod-01", "lms-mod-02", "lms-mod-03", "lms-mod-04", "lms-mod-05", "lms-mod-06", "lms-mod-07", "lms-mod-08"],
    currentCapabilityId: 16,
    overallReadinessScore: 82,
    capabilities: buildPriyaLedger(),
    daysHistory: priyaHistory,
  },
  {
    id: "nh-amit-03",
    name: "Amit Verma",
    roleId: "quick_commerce_picker",
    roleTitle: "Dark Store Picker",
    storeLocation: "Dark Store #104 (Indiranagar Central)",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    startDate: "2026-08-31",
    currentDay: amitHistory[amitHistory.length - 1]?.dayNumber ?? 1,
    shift: "Morning (07:00 - 15:30)",
    supervisor: "Suresh K.",
    buddy: "Vikram R.",
    status: "Needs attention",
    statusReason: "Variant rush confusion on 200g vs 500g pouches. Practice assigned.",
    recommendedActionSnippet: "Product Variant Barcode Double-Check",
    modulesCompleted: 3,
    quizAverageScore: 88,
    completedModuleIds: ["lms-mod-01", "lms-mod-02", "lms-mod-03"],
    currentCapabilityId: 6,
    overallReadinessScore: 38,
    capabilities: buildAmitLedger(),
    daysHistory: amitHistory,
  },
  {
    id: "nh-sneha-04",
    name: "Sneha Patel",
    roleId: "quick_commerce_picker",
    roleTitle: "Dark Store Picker",
    storeLocation: "Dark Store #104 (Indiranagar Central)",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    startDate: "2026-09-01",
    currentDay: snehaHistory[snehaHistory.length - 1]?.dayNumber ?? 1,
    shift: "Morning (07:00 - 15:30)",
    supervisor: "Suresh K.",
    buddy: "Anita M.",
    status: "Doing well",
    statusReason: "High-velocity picker with consistent 97%+ accuracy across Aisles 1-6.",
    recommendedActionSnippet: "Cold Room Protocols & Chilled Pick Prep",
    modulesCompleted: 4,
    quizAverageScore: 92,
    completedModuleIds: ["lms-mod-01", "lms-mod-02", "lms-mod-03", "lms-mod-04"],
    currentCapabilityId: 4,
    overallReadinessScore: 48,
    capabilities: buildSnehaLedger(),
    daysHistory: snehaHistory,
  },
  {
    id: "nh-neha-05",
    name: "Neha Gupta",
    roleId: "quick_commerce_picker",
    roleTitle: "Dark Store Picker",
    storeLocation: "Dark Store #104 (Indiranagar Central)",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    startDate: "2026-09-01",
    currentDay: rahulDaysHistory[rahulDaysHistory.length - 1]?.dayNumber ?? 1,
    shift: "Morning (07:00 - 15:30)",
    supervisor: "Suresh K.",
    buddy: "Vikram R.",
    status: "Doing well",
    statusReason: "Consistent pacing across aisles 1-4 with 99% accuracy.",
    recommendedActionSnippet: "Batch Sorting Refinement",
    modulesCompleted: 4,
    quizAverageScore: 91,
    completedModuleIds: ["lms-mod-01", "lms-mod-02", "lms-mod-03", "lms-mod-04"],
    currentCapabilityId: 4,
    overallReadinessScore: 50,
    capabilities: buildNehaLedger(),
    daysHistory: rahulDaysHistory.slice(0, 4),
  },
];

export const mockNewHire: NewHire = initialRahul;

export const initialOrgSummary: OrganizationSummary = {
  id: "org-qc-bengaluru",
  name: "FastCart Dark Store Operations",
  storeName: "Dark Store #104 (Indiranagar Central)",
  totalNewHires: 5,
  doingWellCount: 3,
  needsAttentionCount: 1,
  atRiskCount: 0,
  commonProblems: [
    { problem: "Coordinate Navigation in Aisles 4-8", count: 2, impact: "Pick rate lag" },
    { problem: "Product Variant Confusion (Grammage)", count: 1, impact: "QC check delay" }
  ],
  emergingPatterns: [
    { pattern: "Buddy Walkthrough Rapid Recovery", trend: "Positive", impactedCount: 2 }
  ],
  urgentAttentionIds: ["nh-amit-03"],
};
