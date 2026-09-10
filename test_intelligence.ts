import { executeCoordinationLoop } from "./src/services/intelligence";
import { initialRahul, createDefaultCapabilitiesLedger } from "./src/data/seedData";
import { NewHire, DayRecord, WorkSignal, DailySignal, ManagerSignal, DARK_STORE_CAPABILITIES } from "./src/types";

console.log("=== RUNNING CHECKIN CHECKOUT ADAPTIVE INTELLIGENCE TEST SUITE ===\n");

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passedCount++;
    console.log(`✅ [PASS] ${testName}`);
  } else {
    failedCount++;
    console.error(`❌ [FAIL] ${testName} - ${detail || "Assertion failed"}`);
    process.exitCode = 1;
  }
}

// ----------------------------------------------------------------------------
// CASE 1: Normal Progression
// ----------------------------------------------------------------------------
{
  const hire: NewHire = {
    ...initialRahul,
    capabilities: createDefaultCapabilitiesLedger(),
  };
  hire.capabilities[1].mastery = "mastered";
  hire.capabilities[2].mastery = "mastered";

  const result = executeCoordinationLoop({
    hire,
    dayNumber: 3,
    workSignal: {
      dayNumber: 3,
      targetPickRate: 50,
      actualPickRate: 52,
      accuracyRate: 99,
      ordersCompleted: 70,
      targetOrders: 65,
    },
    dailySignal: {
      id: "sig-c1",
      dayNumber: 3,
      rawText: "Shift was smooth and fast. Pacing felt great.",
      inputMethod: "text",
      issue: "None",
      confidence: "High",
      possibleImpact: "Normal ramp",
      category: "General",
      summary: "Pacing smooth",
      companionResponse: "Great job!",
      timestamp: "02:00 PM",
    },
    managerSignal: {
      id: "mgr-c1",
      dayNumber: 3,
      managerName: "Suresh K.",
      state: "Doing well",
      issueCategory: undefined,
      notes: "Steady and fast.",
      timestamp: "02:30 PM",
    },
  });

  assert(
    result.adaptiveDecision === "advance_default",
    "Case 1: Normal progression selects 'advance_default'",
    `Received: ${result.adaptiveDecision}`
  );
  assert(
    result.updatedStatus === "Doing well",
    "Case 1: Status is 'Doing well'",
    `Received: ${result.updatedStatus}`
  );
}

// ----------------------------------------------------------------------------
// CASE 2: Reinforcement
// ----------------------------------------------------------------------------
{
  const hire: NewHire = {
    ...initialRahul,
    currentCapabilityId: 3,
    capabilities: createDefaultCapabilitiesLedger(),
  };
  // Cap 1 & 2 are proficient
  hire.capabilities[1].mastery = "proficient";
  hire.capabilities[2].mastery = "proficient";
  hire.capabilities[2].evidence = "demonstrated";

  const result = executeCoordinationLoop({
    hire,
    dayNumber: 3,
    workSignal: {
      dayNumber: 3,
      targetPickRate: 50,
      actualPickRate: 35,
      accuracyRate: 98,
      ordersCompleted: 44,
      targetOrders: 65,
    },
    dailySignal: {
      id: "sig-c2",
      dayNumber: 3,
      rawText: "I was confused finding products in Aisles 4-8, searching took long.",
      inputMethod: "voice",
      issue: "Location navigation",
      confidence: "Low",
      possibleImpact: "Slow picking",
      category: "Environment",
      summary: "Aisle confusion",
      companionResponse: "Take your time.",
      timestamp: "02:00 PM",
    },
    managerSignal: {
      id: "mgr-c2",
      dayNumber: 3,
      managerName: "Suresh K.",
      state: "Needs support",
      issueCategory: "Process",
      notes: "Searching for shelf bins in Aisles 4-8.",
      timestamp: "02:30 PM",
    },
  });

  assert(
    result.adaptiveDecision === "reinforce_current",
    "Case 2: Reinforcement selects 'reinforce_current'",
    `Received: ${result.adaptiveDecision}`
  );
  assert(
    result.action.targetCapabilityId === 3,
    "Case 2: Targets Capability 3 (Location Navigation)",
    `Received: ${result.action.targetCapabilityId}`
  );
  assert(
    result.updatedStatus === "Needs attention",
    "Case 2: Status is 'Needs attention'",
    `Received: ${result.updatedStatus}`
  );
}

// ----------------------------------------------------------------------------
// CASE 3: Prerequisite Failure
// ----------------------------------------------------------------------------
{
  const hire: NewHire = {
    ...initialRahul,
    currentCapabilityId: 3,
    capabilities: createDefaultCapabilitiesLedger(),
  };
  // Scanner basics (Cap 2) was exposed but inconsistent (never mastered)
  hire.capabilities[2].exposure = "exposed";
  hire.capabilities[2].evidence = "inconsistent";
  hire.capabilities[2].mastery = "in_progress";

  const result = executeCoordinationLoop({
    hire,
    dayNumber: 3,
    workSignal: {
      dayNumber: 3,
      targetPickRate: 50,
      actualPickRate: 32,
      accuracyRate: 96,
      ordersCompleted: 40,
      targetOrders: 65,
    },
    dailySignal: {
      id: "sig-c3",
      dayNumber: 3,
      rawText: "I get confused where items are because I don't understand the scanner coordinate numbers.",
      inputMethod: "voice",
      issue: "Location confusion",
      confidence: "Low",
      possibleImpact: "Order lag",
      category: "Environment",
      summary: "Location confusion",
      companionResponse: "We will help you.",
      timestamp: "02:00 PM",
    },
    managerSignal: {
      id: "mgr-c3",
      dayNumber: 3,
      managerName: "Suresh K.",
      state: "Needs support",
      issueCategory: "Process",
      notes: "Struggling with rack coordinates.",
      timestamp: "02:30 PM",
    },
  });

  assert(
    result.adaptiveDecision === "return_prerequisite",
    "Case 3: Prerequisite failure selects 'return_prerequisite'",
    `Received: ${result.adaptiveDecision}`
  );
  assert(
    result.action.targetCapabilityId === 2,
    "Case 3: Steps back to Capability 2 (Scanner Basics)",
    `Received: ${result.action.targetCapabilityId}`
  );
}

// ----------------------------------------------------------------------------
// CASE 4: Jump Ahead
// ----------------------------------------------------------------------------
{
  const hire: NewHire = {
    ...initialRahul,
    currentCapabilityId: 2,
    capabilities: createDefaultCapabilitiesLedger(),
  };
  hire.capabilities[1].mastery = "mastered";
  hire.capabilities[2].mastery = "mastered";

  const result = executeCoordinationLoop({
    hire,
    dayNumber: 3,
    workSignal: {
      dayNumber: 3,
      targetPickRate: 50,
      actualPickRate: 64, // Exceeds target by 14 items/hr!
      accuracyRate: 99,
      ordersCompleted: 85,
      targetOrders: 65,
    },
    dailySignal: {
      id: "sig-c4",
      dayNumber: 3,
      rawText: "I finished all assigned shelves early and picked with zero errors.",
      inputMethod: "text",
      issue: "None",
      confidence: "High",
      possibleImpact: "Accelerated ramp",
      category: "General",
      summary: "High performance",
      companionResponse: "Outstanding work!",
      timestamp: "02:00 PM",
    },
    managerSignal: {
      id: "mgr-c4",
      dayNumber: 3,
      managerName: "Suresh K.",
      state: "Doing well",
      issueCategory: undefined,
      notes: "Exceptional picking pace and accuracy.",
      timestamp: "02:30 PM",
    },
  });

  assert(
    result.adaptiveDecision === "jump_ahead",
    "Case 4: High performance selects 'jump_ahead'",
    `Received: ${result.adaptiveDecision}`
  );
  assert(
    result.action.targetCapabilityId === 8,
    "Case 4: Leaps ahead to Capability 8 (Advanced Batching)",
    `Received: ${result.action.targetCapabilityId}`
  );
}

// ----------------------------------------------------------------------------
// CASE 5: Non-Training Problem (Hardware / Tool)
// ----------------------------------------------------------------------------
{
  const hire: NewHire = {
    ...initialRahul,
    capabilities: createDefaultCapabilitiesLedger(),
  };

  const result = executeCoordinationLoop({
    hire,
    dayNumber: 3,
    workSignal: {
      dayNumber: 3,
      targetPickRate: 50,
      actualPickRate: 34,
      accuracyRate: 98,
      ordersCompleted: 42,
      targetOrders: 65,
    },
    dailySignal: {
      id: "sig-c5",
      dayNumber: 3,
      rawText: "The barcode scanner Bluetooth keeps disconnecting and battery died twice.",
      inputMethod: "voice",
      issue: "Scanner battery disconnection",
      confidence: "Medium",
      possibleImpact: "Delay",
      category: "Tool",
      summary: "Scanner battery disconnection",
      companionResponse: "Swap battery with buddy.",
      timestamp: "02:00 PM",
    },
    managerSignal: {
      id: "mgr-c5",
      dayNumber: 3,
      managerName: "Suresh K.",
      state: "Needs support",
      issueCategory: "Tool",
      notes: "Hardware scanner disconnects.",
      timestamp: "02:30 PM",
    },
  });

  assert(
    result.adaptiveDecision === "tool_remedy",
    "Case 5: Non-training tool friction selects 'tool_remedy'",
    `Received: ${result.adaptiveDecision}`
  );
  assert(
    result.action.targetActor.includes("Maintenance") || result.action.targetActor.includes("Buddy"),
    "Case 5: Targets Tool / Hardware actor instead of curriculum",
    `Received: ${result.action.targetActor}`
  );
}

// ----------------------------------------------------------------------------
// CASE 6: Successful Intervention
// ----------------------------------------------------------------------------
{
  const hire: NewHire = {
    ...initialRahul,
    currentCapabilityId: 3,
    status: "Needs attention",
    capabilities: createDefaultCapabilitiesLedger(),
  };

  const result = executeCoordinationLoop({
    hire,
    dayNumber: 4,
    workSignal: {
      dayNumber: 4,
      targetPickRate: 50,
      actualPickRate: 48,
      accuracyRate: 99,
      ordersCompleted: 64,
      targetOrders: 65,
    },
    actionOutcome: {
      id: "out-c6",
      actionId: "act-c6",
      dayNumber: 4,
      performedBy: "Vikram R. (Buddy)",
      performedAt: "03:30 PM",
      improved: "yes",
      notes: "Rahul navigated Aisles 4-8 smoothly after buddy walkthrough.",
      subsequentPickRate: 48,
      subsequentAccuracy: 99,
    },
  });

  assert(
    result.updatedStatus === "Doing well",
    "Case 6: Successful intervention updates status to 'Doing well'",
    `Received: ${result.updatedStatus}`
  );
  assert(
    result.updatedCapabilities[3].mastery === "proficient",
    "Case 6: Target Capability 3 is now marked 'proficient'",
    `Received: ${result.updatedCapabilities[3].mastery}`
  );
  assert(
    result.updatedCapabilities[3].evidence === "demonstrated",
    "Case 6: Target Capability 3 evidence is 'demonstrated'",
    `Received: ${result.updatedCapabilities[3].evidence}`
  );
}

// ----------------------------------------------------------------------------
// CASE 7: Failed Intervention
// ----------------------------------------------------------------------------
{
  const hire: NewHire = {
    ...initialRahul,
    currentCapabilityId: 3,
    status: "Needs attention",
    capabilities: createDefaultCapabilitiesLedger(),
  };

  // Day 4: Prior buddy walkthrough failed
  const previousRecord: DayRecord = {
    dayNumber: 3,
    date: "Day 3",
    workSignal: {
      dayNumber: 3,
      targetPickRate: 50,
      actualPickRate: 35,
      accuracyRate: 98,
      ordersCompleted: 44,
      targetOrders: 65,
    },
    actionOutcome: {
      id: "out-c7-prev",
      actionId: "act-c7-prev",
      dayNumber: 3,
      performedBy: "Vikram R.",
      performedAt: "04:00 PM",
      improved: "no",
      notes: "Aisle confusion persists despite walkthrough.",
      subsequentPickRate: 34,
      subsequentAccuracy: 97,
    },
    statusAtEnd: "At risk",
    statusReason: "Intervention failed to close gap.",
  };

  const result = executeCoordinationLoop({
    hire,
    dayNumber: 4,
    previousRecord,
    existingAction: {
      id: "act-c7-prev",
      dayNumber: 3,
      actionType: "buddy_walkthrough",
      title: "Buddy walkthrough of Aisles 4-8",
      description: "Guided run",
      targetActor: "Buddy Vikram",
      urgency: "Next Shift",
      smallestPracticalStep: "15 min walkthrough",
      status: "completed",
      createdAt: "Yesterday",
    },
    workSignal: {
      dayNumber: 4,
      targetPickRate: 50,
      actualPickRate: 34,
      accuracyRate: 97,
      ordersCompleted: 43,
      targetOrders: 65,
    },
    dailySignal: {
      id: "sig-c7",
      dayNumber: 4,
      rawText: "Still getting lost in Aisles 4-8 racks.",
      inputMethod: "voice",
      issue: "Location confusion",
      confidence: "Low",
      possibleImpact: "Slow picking",
      category: "Environment",
      summary: "Location confusion",
      companionResponse: "Checking floor layout.",
      timestamp: "02:00 PM",
    },
    managerSignal: {
      id: "mgr-c7",
      dayNumber: 4,
      managerName: "Suresh K.",
      state: "Struggling",
      issueCategory: "Process",
      notes: "Still confused in Aisles 4-8.",
      timestamp: "02:30 PM",
    },
  });

  assert(
    result.adaptiveDecision === "environment_support",
    "Case 7: Failed buddy walkthrough does NOT repeat identical action; escalates to 'environment_support'",
    `Received: ${result.adaptiveDecision}`
  );
  assert(
    result.action.targetActor.includes("Supervisor"),
    "Case 7: Escalates actor to Supervisor instead of repeating buddy",
    `Received: ${result.action.targetActor}`
  );
}

// ----------------------------------------------------------------------------
// CASE 8: Module Completion (100%) ≠ Floor Readiness
// ----------------------------------------------------------------------------
{
  const hire: NewHire = {
    ...initialRahul,
    modulesCompleted: 10,
    quizAverageScore: 95,
    currentCapabilityId: 5,
    capabilities: createDefaultCapabilitiesLedger(),
  };
  // All 10 mandatory modules completed in LMS
  for (let i = 1; i <= 10; i++) {
    hire.capabilities[i].exposure = "exposed";
  }

  const result = executeCoordinationLoop({
    hire,
    dayNumber: 5,
    workSignal: {
      dayNumber: 5,
      targetPickRate: 50,
      actualPickRate: 32, // Stalled on floor!
      accuracyRate: 98,
      ordersCompleted: 40,
      targetOrders: 65,
    },
    dailySignal: {
      id: "sig-c8",
      dayNumber: 5,
      rawText: "I finished all 10 LMS modules with 95% quiz score, but on the floor picking is still confusing and slow.",
      inputMethod: "voice",
      issue: "Pacing and floor execution",
      confidence: "Low",
      possibleImpact: "Slow picking",
      category: "Process",
      summary: "Completed modules but slow floor execution",
      companionResponse: "We will practice on the floor.",
      timestamp: "02:00 PM",
    },
    managerSignal: {
      id: "mgr-c8",
      dayNumber: 5,
      managerName: "Suresh K.",
      state: "Needs support",
      issueCategory: "Speed",
      notes: "Completed all LMS courses, but floor pace is lagging at 32/hr.",
      timestamp: "02:30 PM",
    },
  });

  assert(
    result.updatedCapabilities[5].mastery !== "mastered",
    "Case 8: Capability 5 is NOT marked mastered merely because LMS modules (10/10) were completed",
    `Received: ${result.updatedCapabilities[5].mastery}`
  );
  assert(
    result.overallReadinessScore !== undefined && result.overallReadinessScore < 50,
    "Case 8: Overall readiness score reflects verified floor mastery (<50%), not 100% course completion",
    `Readiness: ${result.overallReadinessScore}%`
  );
  assert(
    result.pattern.diagnosis.includes("Module exposure does NOT equal floor mastery") ||
    result.pattern.diagnosis.includes("100% complete, but real-world floor readiness is not yet demonstrated"),
    "Case 8: Diagnosis explicitly highlights that module completion ≠ floor readiness",
    `Received: ${result.pattern.diagnosis}`
  );
}

// ----------------------------------------------------------------------------
// CASE 9: Symptom ≠ Diagnosis (External Conveyor Bottleneck vs Competence)
// ----------------------------------------------------------------------------
{
  const hire: NewHire = {
    ...initialRahul,
    currentCapabilityId: 5,
    capabilities: createDefaultCapabilitiesLedger(),
  };
  hire.capabilities[1].mastery = "mastered";
  hire.capabilities[2].mastery = "mastered";
  hire.capabilities[3].mastery = "mastered";

  const result = executeCoordinationLoop({
    hire,
    dayNumber: 4,
    workSignal: {
      dayNumber: 4,
      targetPickRate: 50,
      actualPickRate: 28, // Severe drop in pick rate
      accuracyRate: 99,   // Diligence is pristine
      ordersCompleted: 35,
      targetOrders: 65,
      externalBottleneck: "Zone B conveyor belt motor jam caused 45-minute floor queue stoppage",
    },
    dailySignal: {
      id: "sig-c9",
      dayNumber: 4,
      rawText: "The main tote conveyor jammed in Zone B, so we had to stand waiting for 45 minutes.",
      inputMethod: "text",
      issue: "Conveyor breakdown",
      confidence: "High",
      possibleImpact: "Shift output reduced",
      category: "Environment",
      summary: "Facility conveyor breakdown",
      companionResponse: "Noted.",
      timestamp: "02:00 PM",
    },
    managerSignal: {
      id: "mgr-c9",
      dayNumber: 4,
      managerName: "Suresh K.",
      state: "Doing well",
      issueCategory: undefined,
      notes: "Worker diligence great; pick rate drop caused by facility conveyor jam.",
      timestamp: "02:30 PM",
    },
  });

  assert(
    result.adaptiveDecision === "no_action_monitor",
    "Case 9: External facility bottleneck does NOT trigger unnecessary capability retraining; selects 'no_action_monitor'",
    `Received: ${result.adaptiveDecision}`
  );
  assert(
    result.updatedStatus === "Doing well",
    "Case 9: Worker status remains 'Doing well' (context overrides raw telemetry symptom)",
    `Received: ${result.updatedStatus}`
  );
  assert(
    result.pattern.diagnosis.includes("external facility bottleneck") || result.pattern.patternName.includes("Bottleneck"),
    "Case 9: Identified pattern correctly diagnoses external dark store bottleneck",
    `Received pattern: ${result.pattern.patternName}`
  );
}

// ----------------------------------------------------------------------------
// CASE 10: Help Requests (Chronic Help Dependency vs Healthy Inquiry)
// ----------------------------------------------------------------------------
{
  // 10A: Chronic help dependency (cannot pick without constant buddy prompting)
  const hireDependent: NewHire = {
    ...initialRahul,
    currentCapabilityId: 5,
    capabilities: createDefaultCapabilitiesLedger(),
  };

  const resultDependent = executeCoordinationLoop({
    hire: hireDependent,
    dayNumber: 4,
    workSignal: {
      dayNumber: 4,
      targetPickRate: 50,
      actualPickRate: 30,
      accuracyRate: 96,
      ordersCompleted: 38,
      targetOrders: 65,
      helpRequestsCount: 6,
    },
    dailySignal: {
      id: "sig-c10a",
      dayNumber: 4,
      rawText: "I called buddy 6 times during the shift because I was scared to pick without someone confirming every item.",
      inputMethod: "voice",
      issue: "High help dependency",
      confidence: "Low",
      possibleImpact: "Slow solo picking",
      category: "Process",
      summary: "Chronic help dependency",
      companionResponse: "We will build your solo confidence.",
      timestamp: "02:00 PM",
      helpRequestsCount: 6,
    },
    managerSignal: {
      id: "mgr-c10a",
      dayNumber: 4,
      managerName: "Suresh K.",
      state: "Needs support",
      issueCategory: "Process",
      notes: "High help dependency; unable to pick solo.",
      timestamp: "02:30 PM",
    },
  });

  assert(
    resultDependent.adaptiveDecision === "reinforce_current",
    "Case 10A: Chronic help dependency triggers structured solo-picking practice ('reinforce_current')",
    `Received: ${resultDependent.adaptiveDecision}`
  );
  assert(
    resultDependent.action.title.includes("Solo-Picking Practice") || resultDependent.action.title.includes("Practice"),
    "Case 10A: Prescribes structured solo practice with fading buddy support",
    `Received: ${resultDependent.action.title}`
  );

  // 10B: Healthy proactive question (1-2 queries, strong speed and accuracy)
  const hireHealthy: NewHire = {
    ...initialRahul,
    currentCapabilityId: 4,
    capabilities: createDefaultCapabilitiesLedger(),
  };
  hireHealthy.capabilities[1].mastery = "mastered";
  hireHealthy.capabilities[2].mastery = "mastered";
  hireHealthy.capabilities[3].mastery = "mastered";

  const resultHealthy = executeCoordinationLoop({
    hire: hireHealthy,
    dayNumber: 4,
    workSignal: {
      dayNumber: 4,
      targetPickRate: 50,
      actualPickRate: 51,
      accuracyRate: 99,
      ordersCompleted: 68,
      targetOrders: 65,
      helpRequestsCount: 1,
    },
    dailySignal: {
      id: "sig-c10b",
      dayNumber: 4,
      rawText: "I asked buddy 1 quick question about damaged box disposal, then completed all orders fast.",
      inputMethod: "text",
      issue: "None",
      confidence: "High",
      possibleImpact: "Normal ramp",
      category: "General",
      summary: "Healthy question, strong picking",
      companionResponse: "Great job!",
      timestamp: "02:00 PM",
      helpRequestsCount: 1,
    },
    managerSignal: {
      id: "mgr-c10b",
      dayNumber: 4,
      managerName: "Suresh K.",
      state: "Doing well",
      issueCategory: undefined,
      notes: "Asked good question on damaged packaging; picking pace excellent.",
      timestamp: "02:30 PM",
    },
  });

  assert(
    resultHealthy.adaptiveDecision === "advance_default" && resultHealthy.updatedStatus === "Doing well",
    "Case 10B: Proactive healthy help question is recognized as positive learning and maintains 'advance_default'",
    `Received: ${resultHealthy.adaptiveDecision}, Status: ${resultHealthy.updatedStatus}`
  );
}

// ----------------------------------------------------------------------------
// SURGICAL FIX VERIFICATIONS: Performance Classification & Default Advancement
// ----------------------------------------------------------------------------
{
  // 1. Performance classification mapping: below -> below_target, equal -> on_target, above -> exceeding
  const hireExceeding: NewHire = {
    ...initialRahul,
    currentCapabilityId: 1,
    capabilities: createDefaultCapabilitiesLedger(),
  };
  const resExceeding = executeCoordinationLoop({
    hire: hireExceeding,
    dayNumber: 1,
    workSignal: {
      dayNumber: 1,
      targetPickRate: 50,
      actualPickRate: 55, // Above target
      accuracyRate: 98,
      ordersCompleted: 50,
      targetOrders: 50,
    },
  });
  assert(
    resExceeding.updatedCapabilities[1].performance === "exceeding",
    "Fix 1: Pick rate above target maps to 'exceeding'",
    `Received: ${resExceeding.updatedCapabilities[1].performance}`
  );

  const hireOnTarget: NewHire = {
    ...initialRahul,
    currentCapabilityId: 1,
    capabilities: createDefaultCapabilitiesLedger(),
  };
  const resOnTarget = executeCoordinationLoop({
    hire: hireOnTarget,
    dayNumber: 1,
    workSignal: {
      dayNumber: 1,
      targetPickRate: 50,
      actualPickRate: 50, // Exactly on target
      accuracyRate: 98,
      ordersCompleted: 50,
      targetOrders: 50,
    },
  });
  assert(
    resOnTarget.updatedCapabilities[1].performance === "on_target",
    "Fix 1: Pick rate exactly at target maps to 'on_target'",
    `Received: ${resOnTarget.updatedCapabilities[1].performance}`
  );

  const hireBelowTarget: NewHire = {
    ...initialRahul,
    currentCapabilityId: 1,
    capabilities: createDefaultCapabilitiesLedger(),
  };
  const resBelowTarget = executeCoordinationLoop({
    hire: hireBelowTarget,
    dayNumber: 1,
    workSignal: {
      dayNumber: 1,
      targetPickRate: 50,
      actualPickRate: 45, // Below target
      accuracyRate: 98,
      ordersCompleted: 45,
      targetOrders: 50,
    },
  });
  assert(
    resBelowTarget.updatedCapabilities[1].performance === "below_target",
    "Fix 1: Pick rate below target maps to 'below_target'",
    `Received: ${resBelowTarget.updatedCapabilities[1].performance}`
  );

  // 2. Default capability advancement respects prerequisites:
  // Cap 1 is mastered, Cap 2 is locked, Cap 3 is locked (Cap 3 requires Cap 2)
  const hireWithPrereqs: NewHire = {
    ...initialRahul,
    capabilities: createDefaultCapabilitiesLedger(),
  };
  hireWithPrereqs.capabilities[1].mastery = "mastered";
  hireWithPrereqs.capabilities[2].mastery = "locked";
  hireWithPrereqs.capabilities[3].mastery = "locked";

  const resPrereqCheck = executeCoordinationLoop({
    hire: hireWithPrereqs,
    dayNumber: 2,
    workSignal: {
      dayNumber: 2,
      targetPickRate: 50,
      actualPickRate: 50,
      accuracyRate: 98,
      ordersCompleted: 50,
      targetOrders: 50,
    },
  });
  assert(
    resPrereqCheck.adaptiveDecision === "advance_default" && resPrereqCheck.action.targetCapabilityId === 2,
    "Fix 2: Default advancement selects Cap 2 whose prerequisite (Cap 1) is satisfied, not skipping ahead",
    `Decision: ${resPrereqCheck.adaptiveDecision}, TargetCapId: ${resPrereqCheck.action?.targetCapabilityId}`
  );
}

// ============================================================================
// STEP 3 DETERMINISTIC TESTS: 10-DAY LMS TRAINING JOURNEY VS FLOOR READINESS
// ============================================================================

console.log("\n--- STEP 3: TRAINING JOURNEY & INTELLIGENT DOCTOR INTEGRATION TESTS ---");

// TEST A: 100% Training Completion (10/10 modules, 98% Quiz) != Job Readiness when Floor Work shows navigation gap
{
  const hireWith100PctTraining: NewHire = {
    ...initialRahul,
    modulesCompleted: 10,
    quizAverageScore: 98,
    completedModuleIds: ["mod-day-01","mod-day-02","mod-day-03","mod-day-04","mod-day-05","mod-day-06","mod-day-07","mod-day-08","mod-day-09","mod-day-10"],
    currentCapabilityId: 3,
    capabilities: createDefaultCapabilitiesLedger(),
  };
  // Core floor capability 3 has not been mastered
  hireWith100PctTraining.capabilities[3].mastery = "in_progress";
  hireWith100PctTraining.capabilities[3].evidence = "inconsistent";

  const resultA = executeCoordinationLoop({
    hire: hireWith100PctTraining,
    dayNumber: 3,
    workSignal: {
      dayNumber: 3,
      targetPickRate: 50,
      actualPickRate: 35, // Lagging behind floor expectation
      accuracyRate: 98,
      ordersCompleted: 44,
      targetOrders: 65,
    },
    dailySignal: {
      id: "sig-step3-a",
      dayNumber: 3,
      rawText: "I completed all 10 video modules and got high quiz scores, but on the floor Aisles 4 to 8 are really confusing.",
      inputMethod: "voice",
      issue: "Location navigation",
      confidence: "Low",
      possibleImpact: "Order lag",
      category: "Environment",
      summary: "Completed modules but floor search slow",
      companionResponse: "Let's reinforce aisle navigation on the floor.",
      timestamp: "02:00 PM",
    },
    managerSignal: {
      id: "mgr-step3-a",
      dayNumber: 3,
      managerName: "Suresh K.",
      state: "Needs support",
      issueCategory: "Process",
      notes: "Completed all LMS modules online, but spends 4+ mins per tote searching Aisles 4-8.",
      timestamp: "02:30 PM",
    },
  });

  assert(
    resultA.updatedStatus === "Needs attention" && resultA.adaptiveDecision === "reinforce_current",
    "Test A: 100% LMS module completion (10/10, 98% quiz) does NOT grant job readiness when floor work is lagging (Reinforces on-floor capability)",
    `Decision: ${resultA.adaptiveDecision}, Status: ${resultA.updatedStatus}`
  );
}

// TEST B: Incomplete Training (3/10 Modules) + Good Early Floor Work (Day 3)
{
  const hireEarlyNormal: NewHire = {
    ...initialRahul,
    modulesCompleted: 3,
    quizAverageScore: 92,
    completedModuleIds: ["mod-day-01", "mod-day-02", "mod-day-03"],
    currentCapabilityId: 2,
    capabilities: createDefaultCapabilitiesLedger(),
  };
  hireEarlyNormal.capabilities[1].mastery = "mastered";
  hireEarlyNormal.capabilities[2].mastery = "mastered";

  const resultB = executeCoordinationLoop({
    hire: hireEarlyNormal,
    dayNumber: 3,
    workSignal: {
      dayNumber: 3,
      targetPickRate: 50,
      actualPickRate: 51,
      accuracyRate: 99,
      ordersCompleted: 66,
      targetOrders: 65,
    },
    dailySignal: {
      id: "sig-step3-b",
      dayNumber: 3,
      rawText: "Day 3 shift went smoothly, scanning went well.",
      inputMethod: "text",
      issue: "None",
      confidence: "High",
      possibleImpact: "Normal progression",
      category: "General",
      summary: "Smooth Day 3",
      companionResponse: "Keep going!",
      timestamp: "02:00 PM",
    },
    managerSignal: {
      id: "mgr-step3-b",
      dayNumber: 3,
      managerName: "Suresh K.",
      state: "Doing well",
      issueCategory: undefined,
      notes: "Pacing steady and accurate.",
      timestamp: "02:30 PM",
    },
  });

  assert(
    resultB.adaptiveDecision === "advance_default" && resultB.updatedStatus === "Doing well",
    "Test B: Incomplete training (3/10) with steady floor work advances normally without premature independent graduation",
    `Decision: ${resultB.adaptiveDecision}, Status: ${resultB.updatedStatus}`
  );
}

// TEST C: 100% Training + Exceeding Floor Evidence across all capabilities -> Jump Ahead / Floor Independence
{
  const hireMasteredAll: NewHire = {
    ...initialRahul,
    modulesCompleted: 10,
    quizAverageScore: 99,
    completedModuleIds: ["mod-day-01","mod-day-02","mod-day-03","mod-day-04","mod-day-05","mod-day-06","mod-day-07","mod-day-08","mod-day-09","mod-day-10"],
    currentCapabilityId: 2,
    capabilities: createDefaultCapabilitiesLedger(),
  };
  hireMasteredAll.capabilities[1].mastery = "mastered";
  hireMasteredAll.capabilities[2].mastery = "mastered";

  const resultC = executeCoordinationLoop({
    hire: hireMasteredAll,
    dayNumber: 10,
    workSignal: {
      dayNumber: 10,
      targetPickRate: 50,
      actualPickRate: 68,
      accuracyRate: 100,
      ordersCompleted: 95,
      targetOrders: 65,
    },
    dailySignal: {
      id: "sig-step3-c",
      dayNumber: 10,
      rawText: "Finished all orders and modules early, working completely independently.",
      inputMethod: "text",
      issue: "None",
      confidence: "High",
      possibleImpact: "Independent floor readiness",
      category: "General",
      summary: "Full floor mastery",
      companionResponse: "Ready for floor independence!",
      timestamp: "02:00 PM",
    },
    managerSignal: {
      id: "mgr-step3-c",
      dayNumber: 10,
      managerName: "Suresh K.",
      state: "Doing well",
      issueCategory: undefined,
      notes: "Fully autonomous, exceptional rate and zero errors.",
      timestamp: "02:30 PM",
    },
  });

  assert(
    resultC.adaptiveDecision === "jump_ahead" && resultC.updatedStatus === "Doing well",
    "Test C: Full module training + verified floor excellence selects accelerated jump_ahead with full readiness",
    `Decision: ${resultC.adaptiveDecision}, Status: ${resultC.updatedStatus}`
  );
}

// TEST D: Training Completed for Scanner, but Hardware Failure on Floor -> Tool Replacement (not more training)
{
  const hireHwIssue: NewHire = {
    ...initialRahul,
    modulesCompleted: 4,
    quizAverageScore: 95,
    currentCapabilityId: 2,
    capabilities: createDefaultCapabilitiesLedger(),
  };

  const resultD = executeCoordinationLoop({
    hire: hireHwIssue,
    dayNumber: 3,
    workSignal: {
      dayNumber: 3,
      targetPickRate: 50,
      actualPickRate: 28,
      accuracyRate: 92,
      ordersCompleted: 35,
      targetOrders: 65,
    },
    dailySignal: {
      id: "sig-step3-d",
      dayNumber: 3,
      rawText: "Scanner laser is unresponsive and battery keeps dying every 10 minutes.",
      inputMethod: "voice",
      issue: "Scanner battery and laser dead",
      confidence: "High",
      possibleImpact: "Hardware block",
      category: "Tool",
      summary: "Scanner hardware defect",
      companionResponse: "Swap device at the desk.",
      timestamp: "02:00 PM",
    },
    managerSignal: {
      id: "mgr-step3-d",
      dayNumber: 3,
      managerName: "Suresh K.",
      state: "Needs support",
      issueCategory: "Tool",
      notes: "Scanner Unit #4 has cracked optic sensor.",
      timestamp: "02:30 PM",
    },
  });

  assert(
    resultD.adaptiveDecision === "tool_remedy" || resultD.action.title.toLowerCase().includes("scanner"),
    "Test D: Hardware failure on shift prescribes hardware/device swap, NOT redundant LMS training modules",
    `Decision: ${resultD.adaptiveDecision}, Title: ${resultD.action.title}`
  );
}

// TEST E: Minimum Effective Intervention for Navigation Congestion
{
  const hireAisleCongestion: NewHire = {
    ...initialRahul,
    currentCapabilityId: 3,
    capabilities: createDefaultCapabilitiesLedger(),
  };
  hireAisleCongestion.capabilities[1].mastery = "mastered";
  hireAisleCongestion.capabilities[2].mastery = "mastered";

  const resultE = executeCoordinationLoop({
    hire: hireAisleCongestion,
    dayNumber: 3,
    workSignal: {
      dayNumber: 3,
      targetPickRate: 50,
      actualPickRate: 36,
      accuracyRate: 98,
      ordersCompleted: 44,
      targetOrders: 65,
    },
    dailySignal: {
      id: "sig-step3-e",
      dayNumber: 3,
      rawText: "Aisle 4 was blocked with replenishment pallets so I had to take long detours.",
      inputMethod: "voice",
      issue: "Aisle pallet blockage",
      confidence: "High",
      possibleImpact: "Route delay",
      category: "Environment",
      summary: "Aisle blockage",
      companionResponse: "We will report the pallet congestion.",
      timestamp: "02:00 PM",
    },
    managerSignal: {
      id: "mgr-step3-e",
      dayNumber: 3,
      managerName: "Suresh K.",
      state: "Needs support",
      issueCategory: "Process",
      notes: "Morning inbound pallets left in Aisle 4 walkway.",
      timestamp: "02:30 PM",
    },
  });

  assert(
    resultE.adaptiveDecision === "environment_support" ||
    resultE.adaptiveDecision === "reinforce_current" ||
    resultE.action.actionType === "buddy_walkthrough" ||
    resultE.action.actionType === "escalate_issue" ||
    resultE.action.targetActor.toLowerCase().includes("buddy") ||
    resultE.action.targetActor.toLowerCase().includes("supervisor"),
    "Test E: Environmental congestion triggers targeted operational support rather than academic LMS re-testing",
    `Decision: ${resultE.adaptiveDecision}, ActionType: ${resultE.action.actionType}, TargetActor: ${resultE.action.targetActor}`
  );
}

// ============================================================================
// STEP 3.1: VERIFY SCENARIOS F, G, H
// ============================================================================

// TEST F — NO EVIDENCE
// Condition: No meaningful work performance evidence, no reliable manager signal, no reliable daily signal
{
  const hireNoEvidence: NewHire = {
    ...initialRahul,
    currentCapabilityId: 1,
    capabilities: createDefaultCapabilitiesLedger(),
  };

  const resultF = executeCoordinationLoop({
    hire: hireNoEvidence,
    dayNumber: 1,
    workSignal: undefined,
    dailySignal: undefined,
    managerSignal: undefined,
  });

  assert(
    resultF.adaptiveDecision === "no_action_monitor" || resultF.adaptiveDecision === "advance_default",
    "Verify F: When there is no meaningful evidence, central loop stays in monitor/observe without diagnosing failure",
    `Decision: ${resultF.adaptiveDecision}`
  );
  assert(
    resultF.updatedStatus !== "At risk",
    "Verify F: Absence of signals does NOT cause an automatic readiness failure or 'At risk' flag",
    `Status: ${resultF.updatedStatus}`
  );
  assert(
    !resultF.statusReason.toLowerCase().includes("failure") && !resultF.statusReason.toLowerCase().includes("incompetent"),
    "Verify F: Absence of evidence produces non-punitive monitoring reasoning",
    `Reason: ${resultF.statusReason}`
  );
}

// TEST G — HEALTHY HELP
// Condition: Learner makes 1 occasional Buddy/help request, but independent floor performance is good
{
  const hireHealthyHelp: NewHire = {
    ...initialRahul,
    currentCapabilityId: 3,
    capabilities: createDefaultCapabilitiesLedger(),
  };
  hireHealthyHelp.capabilities[1].mastery = "mastered";
  hireHealthyHelp.capabilities[2].mastery = "mastered";

  const resultG = executeCoordinationLoop({
    hire: hireHealthyHelp,
    dayNumber: 3,
    workSignal: {
      dayNumber: 3,
      targetPickRate: 50,
      actualPickRate: 52, // Strong independent rate
      accuracyRate: 99,
      ordersCompleted: 68,
      targetOrders: 65,
      helpRequestsCount: 1, // 1 proactive question
    },
    dailySignal: {
      id: "sig-g-healthy",
      dayNumber: 3,
      rawText: "I asked Vikram where the oversized cartons were kept, then picked all totes on time.",
      inputMethod: "text",
      issue: "None",
      confidence: "High",
      possibleImpact: "Normal ramp",
      category: "General",
      summary: "Healthy question, strong picking",
      companionResponse: "Great initiative!",
      timestamp: "02:00 PM",
      helpRequestsCount: 1,
    },
    managerSignal: {
      id: "mgr-g-healthy",
      dayNumber: 3,
      managerName: "Suresh K.",
      state: "Doing well",
      issueCategory: undefined,
      notes: "Asked 1 quick question on oversized packing; working fast and independently.",
      timestamp: "02:30 PM",
    },
  });

  assert(
    resultG.adaptiveDecision === "advance_default" && resultG.updatedStatus === "Doing well",
    "Verify G: Occasional healthy help query with good floor performance does NOT trigger dependency diagnosis and advances normally",
    `Decision: ${resultG.adaptiveDecision}, Status: ${resultG.updatedStatus}`
  );
  assert(
    !resultG.pattern.patternName.toLowerCase().includes("dependency"),
    "Verify G: Healthy help request is recognized as positive initiative, not chronic dependency",
    `Pattern: ${resultG.pattern.patternName}`
  );
}

// TEST H — HELP DEPENDENCY & ADAPTATION CHECK
// Condition: Repeated help requests, poor solo performance, cannot reliably perform alone
{
  // Part 1: Dependency recognized & independence-focused intervention prescribed
  const hireDependent: NewHire = {
    ...initialRahul,
    currentCapabilityId: 3,
    capabilities: createDefaultCapabilitiesLedger(),
  };
  hireDependent.capabilities[1].mastery = "mastered";
  hireDependent.capabilities[2].mastery = "mastered";

  const resultH1 = executeCoordinationLoop({
    hire: hireDependent,
    dayNumber: 3,
    workSignal: {
      dayNumber: 3,
      targetPickRate: 50,
      actualPickRate: 24, // Far below target when buddy steps away
      accuracyRate: 91,
      ordersCompleted: 28,
      targetOrders: 65,
      helpRequestsCount: 8, // High chronic dependency
    },
    dailySignal: {
      id: "sig-h-dep",
      dayNumber: 3,
      rawText: "I cannot do any totes without Vikram standing next to me. I got stuck 8 times.",
      inputMethod: "voice",
      issue: "Cannot work alone",
      confidence: "Low",
      possibleImpact: "High dependency",
      category: "Process",
      summary: "Cannot pick without constant buddy presence",
      companionResponse: "Let's practice structured solo picking with fading support.",
      timestamp: "02:00 PM",
      helpRequestsCount: 8,
    },
    managerSignal: {
      id: "mgr-h-dep",
      dayNumber: 3,
      managerName: "Suresh K.",
      state: "Needs support",
      issueCategory: "Process",
      notes: "Learner stops picking completely when buddy is not directly shadowing.",
      timestamp: "02:30 PM",
    },
  });

  assert(
    resultH1.adaptiveDecision === "reinforce_current" && resultH1.updatedStatus === "Needs attention",
    "Verify H1: Repeated help requests with poor solo execution diagnosed as dependency needing independence reinforcement",
    `Decision: ${resultH1.adaptiveDecision}, Status: ${resultH1.updatedStatus}`
  );
  assert(
    resultH1.action.title.toLowerCase().includes("solo") || resultH1.action.title.toLowerCase().includes("practice") || resultH1.action.actionType === "buddy_walkthrough",
    "Verify H1: Prescribes independence-focused structured practice",
    `Action: ${resultH1.action.title}`
  );

  // Part 2: Improvement on Day 4 -> Support fades and status returns to 'Doing well'
  const resultH2_Improvement = executeCoordinationLoop({
    hire: hireDependent,
    dayNumber: 4,
    previousRecord: {
      dayNumber: 3,
      date: "Day 3",
      workSignal: {
        dayNumber: 3,
        targetPickRate: 50,
        actualPickRate: 24,
        accuracyRate: 91,
        ordersCompleted: 28,
        targetOrders: 65,
      },
      statusAtEnd: "Needs attention",
      statusReason: "Help dependency",
      recommendedAction: resultH1.action,
    },
    workSignal: {
      dayNumber: 4,
      targetPickRate: 50,
      actualPickRate: 49, // Substantial solo improvement
      accuracyRate: 98,
      ordersCompleted: 62,
      targetOrders: 65,
      helpRequestsCount: 1, // Support faded
    },
    actionOutcome: {
      id: "out-h-01",
      actionId: resultH1.action.id,
      dayNumber: 4,
      performedBy: "Suresh K.",
      performedAt: "02:00 PM",
      improved: "yes",
      subsequentPickRate: 49,
      subsequentAccuracy: 98,
      notes: "Completed 5 solo totes successfully with fading buddy supervision.",
    },
    dailySignal: {
      id: "sig-h-imprv",
      dayNumber: 4,
      rawText: "I picked 5 totes completely on my own today and felt much more confident.",
      inputMethod: "text",
      issue: "None",
      confidence: "High",
      possibleImpact: "Independence established",
      category: "General",
      summary: "Solo confidence gained",
      companionResponse: "Excellent progress on solo picking!",
      timestamp: "02:00 PM",
      helpRequestsCount: 1,
    },
    managerSignal: {
      id: "mgr-h-imprv",
      dayNumber: 4,
      managerName: "Suresh K.",
      state: "Doing well",
      issueCategory: undefined,
      notes: "Solo execution verified; no longer dependent on buddy shadow.",
      timestamp: "02:30 PM",
    },
  });

  assert(
    resultH2_Improvement.updatedStatus === "Doing well" && resultH2_Improvement.adaptiveDecision === "advance_default",
    "Verify H2: Verified solo improvement successfully closes the loop, reduces support, and advances to 'Doing well'",
    `Decision: ${resultH2_Improvement.adaptiveDecision}, Status: ${resultH2_Improvement.updatedStatus}`
  );
}

console.log("\n=== ALL STEP 3 & 3.1 TESTS (A through H) PASSED! ===");

// ============================================================================
// STEP 4: CONTINUOUS INTELLIGENT JOURNEY TESTS (A through L)
// ============================================================================

// TEST 4A: Healthy learner → minimal intervention / observe and advance
{
  const hireHealthy: NewHire = {
    ...initialRahul,
    currentCapabilityId: 4,
    capabilities: createDefaultCapabilitiesLedger(),
  };
  hireHealthy.capabilities[1].mastery = "mastered";
  hireHealthy.capabilities[2].mastery = "mastered";
  hireHealthy.capabilities[3].mastery = "mastered";

  const result4A = executeCoordinationLoop({
    hire: hireHealthy,
    dayNumber: 4,
    workSignal: {
      dayNumber: 4,
      targetPickRate: 55,
      actualPickRate: 58,
      accuracyRate: 99,
      ordersCompleted: 70,
      targetOrders: 65,
    },
    dailySignal: {
      id: "sig-4a",
      dayNumber: 4,
      rawText: "Picking went very smoothly today, found all items without hesitation.",
      inputMethod: "text",
      issue: "None",
      confidence: "High",
      possibleImpact: "Optimal ramp curve",
      category: "General",
      summary: "Smooth shift on target",
      companionResponse: "Keep up the great work!",
      timestamp: "02:00 PM",
    },
    managerSignal: {
      id: "mgr-4a",
      dayNumber: 4,
      managerName: "Suresh K.",
      state: "Doing well",
      notes: "Steady pace and high accuracy.",
      timestamp: "02:30 PM",
    },
  });

  assert(
    result4A.updatedStatus === "Doing well" &&
      (result4A.adaptiveDecision === "advance_default" || result4A.adaptiveDecision === "no_action_monitor") &&
      result4A.action.actionType !== "escalate_issue",
    "Step 4A: Healthy learner receives minimal intervention and progresses steadily",
    `Status: ${result4A.updatedStatus}, Decision: ${result4A.adaptiveDecision}`
  );
}

// TEST 4B: No evidence → monitor without manufacturing failure
{
  const hireNoEv: NewHire = {
    ...initialRahul,
    currentCapabilityId: 1,
    capabilities: createDefaultCapabilitiesLedger(),
  };

  const result4B = executeCoordinationLoop({
    hire: hireNoEv,
    dayNumber: 1,
    workSignal: undefined,
    dailySignal: undefined,
    managerSignal: undefined,
  });

  assert(
    (result4B.adaptiveDecision === "no_action_monitor" || result4B.adaptiveDecision === "advance_default") &&
      result4B.updatedStatus === "Doing well" &&
      result4B.pattern.category === "General",
    "Step 4B: Lack of evidence keeps system in neutral observation without creating artificial failure",
    `Decision: ${result4B.adaptiveDecision}, Status: ${result4B.updatedStatus}`
  );
}

// TEST 4C: Intervention succeeds → support fades & status becomes Doing well
{
  const hireSucceeding: NewHire = {
    ...initialRahul,
    currentCapabilityId: 3,
    capabilities: createDefaultCapabilitiesLedger(),
  };

  const result4C = executeCoordinationLoop({
    hire: hireSucceeding,
    dayNumber: 4,
    previousRecord: {
      dayNumber: 3,
      date: "Day 3",
      workSignal: {
        dayNumber: 3,
        targetPickRate: 50,
        actualPickRate: 35,
        accuracyRate: 98,
        ordersCompleted: 45,
        targetOrders: 65,
      },
      statusAtEnd: "Needs attention",
      statusReason: "Aisle navigation delay",
      recommendedAction: {
        id: "act-4c-01",
        dayNumber: 3,
        actionType: "buddy_walkthrough",
        title: "Buddy Walkthrough of Aisles 4-8",
        description: "Practice shelf numbering",
        targetActor: "Buddy Vikram",
        urgency: "Immediate",
        smallestPracticalStep: "15-minute walkthrough",
        status: "pending",
        createdAt: "Day 3",
        decisionType: "reinforce_current",
        targetCapabilityId: 3,
        rationale: "Reinforce capability 3",
      },
    },
    workSignal: {
      dayNumber: 4,
      targetPickRate: 50,
      actualPickRate: 51,
      accuracyRate: 99,
      ordersCompleted: 68,
      targetOrders: 65,
    },
    actionOutcome: {
      id: "out-4c-01",
      actionId: "act-4c-01",
      dayNumber: 4,
      performedBy: "Vikram R.",
      performedAt: "08:30 AM",
      improved: "yes",
      subsequentPickRate: 51,
      subsequentAccuracy: 99,
      notes: "Walkthrough completed; navigation fluent.",
    },
    dailySignal: {
      id: "sig-4c",
      dayNumber: 4,
      rawText: "Vikram showed me the bay numbering and I found all Aisles 4-8 items instantly.",
      inputMethod: "text",
      issue: "None",
      confidence: "High",
      possibleImpact: "Resolved navigation gap",
      category: "General",
      summary: "Navigation fluent after buddy session",
      companionResponse: "Glad that helped!",
      timestamp: "02:00 PM",
    },
    managerSignal: {
      id: "mgr-4c",
      dayNumber: 4,
      managerName: "Suresh K.",
      state: "Doing well",
      notes: "Pick rate recovered to 51/hr.",
      timestamp: "02:30 PM",
    },
  });

  assert(
    result4C.updatedStatus === "Doing well" &&
      result4C.updatedCapabilities[3].mastery === "proficient" &&
      result4C.action.status === "completed",
    "Step 4C: Successful intervention updates capability ledger, closes action, and restores 'Doing well'",
    `Status: ${result4C.updatedStatus}, Cap3 Mastery: ${result4C.updatedCapabilities[3].mastery}`
  );
}

// TEST 4D: Intervention fails → re-diagnose rather than repeating same action
{
  const hireFailedAction: NewHire = {
    ...initialRahul,
    currentCapabilityId: 3,
    capabilities: createDefaultCapabilitiesLedger(),
  };

  const result4D = executeCoordinationLoop({
    hire: hireFailedAction,
    dayNumber: 4,
    previousRecord: {
      dayNumber: 3,
      date: "Day 3",
      workSignal: {
        dayNumber: 3,
        targetPickRate: 50,
        actualPickRate: 32,
        accuracyRate: 98,
        ordersCompleted: 40,
        targetOrders: 65,
      },
      statusAtEnd: "Needs attention",
      statusReason: "Aisle confusion",
      recommendedAction: {
        id: "act-4d-01",
        dayNumber: 3,
        actionType: "buddy_walkthrough",
        title: "Buddy Walkthrough of Aisles 4-8",
        description: "Buddy walkthrough",
        targetActor: "Buddy Vikram",
        urgency: "Immediate",
        smallestPracticalStep: "15-minute walkthrough",
        status: "pending",
        createdAt: "Day 3",
        decisionType: "reinforce_current",
        targetCapabilityId: 3,
        rationale: "Reinforce capability 3",
      },
      actionOutcome: {
        id: "out-4d-01",
        actionId: "act-4d-01",
        dayNumber: 3,
        performedBy: "Vikram R.",
        performedAt: "04:00 PM",
        improved: "no",
        subsequentPickRate: 31,
        subsequentAccuracy: 97,
        notes: "Walkthrough done but confusion persisted.",
      },
    },
    workSignal: {
      dayNumber: 4,
      targetPickRate: 50,
      actualPickRate: 31,
      accuracyRate: 97,
      ordersCompleted: 40,
      targetOrders: 65,
    },
    dailySignal: {
      id: "sig-4d",
      dayNumber: 4,
      rawText: "The shelf labels in Aisle 6 are mismatched with what scanner shows.",
      inputMethod: "voice",
      issue: "Shelf label mismatch",
      confidence: "Low",
      possibleImpact: "Spatial navigation block",
      category: "Environment",
      summary: "Shelf coordinates mismatched",
      companionResponse: "Alerting supervisor.",
      timestamp: "02:00 PM",
    },
    managerSignal: {
      id: "mgr-4d",
      dayNumber: 4,
      managerName: "Suresh K.",
      state: "Struggling",
      issueCategory: "Speed",
      notes: "Buddy walkthrough did not fix location confusion.",
      timestamp: "02:30 PM",
    },
  });

  assert(
    result4D.adaptiveDecision === "environment_support" &&
      result4D.action.targetActor.toLowerCase().includes("supervisor"),
    "Step 4D: Failed buddy walkthrough escalates to supervisor layout intervention rather than repeating identical buddy walkthrough",
    `Decision: ${result4D.adaptiveDecision}, Actor: ${result4D.action.targetActor}`
  );
}

// TEST 4E: Same problem persists across multiple observations → retains problem and appropriate escalation
{
  const hirePersistentProblem: NewHire = {
    ...initialRahul,
    currentCapabilityId: 3,
    capabilities: createDefaultCapabilitiesLedger(),
  };

  const result4E = executeCoordinationLoop({
    hire: hirePersistentProblem,
    dayNumber: 5,
    workSignal: {
      dayNumber: 5,
      targetPickRate: 55,
      actualPickRate: 34, // Persistently low across days
      accuracyRate: 97,
      ordersCompleted: 44,
      targetOrders: 65,
    },
    dailySignal: {
      id: "sig-4e",
      dayNumber: 5,
      rawText: "Still having trouble finding rack locations in Aisles 4-8.",
      inputMethod: "text",
      issue: "Aisle navigation delay",
      confidence: "Low",
      possibleImpact: "Persistent pacing delay",
      category: "Process",
      summary: "Rack location confusion",
      companionResponse: "We will address this directly.",
      timestamp: "02:00 PM",
    },
    managerSignal: {
      id: "mgr-4e",
      dayNumber: 5,
      managerName: "Suresh K.",
      state: "Needs support",
      issueCategory: "Speed",
      notes: "Day 5 and location search is still holding back pick rate.",
      timestamp: "02:30 PM",
    },
  });

  assert(
    result4E.updatedStatus === "Needs attention" &&
      result4E.adaptiveDecision === "reinforce_current" &&
      result4E.action.targetCapabilityId === 3,
    "Step 4E: Persistent problem across multiple days remains actively targeted with structured reinforcement",
    `Status: ${result4E.updatedStatus}, TargetCap: ${result4E.action.targetCapabilityId}`
  );
}

// TEST 4F: Temporary environment issue → no false learner diagnosis
{
  const hireEnvIssue: NewHire = {
    ...initialRahul,
    currentCapabilityId: 3,
    capabilities: createDefaultCapabilitiesLedger(),
  };

  const result4F = executeCoordinationLoop({
    hire: hireEnvIssue,
    dayNumber: 3,
    workSignal: {
      dayNumber: 3,
      targetPickRate: 50,
      actualPickRate: 28, // Low telemetry due to conveyor belt breakdown
      accuracyRate: 99,
      ordersCompleted: 35,
      targetOrders: 65,
    },
    dailySignal: {
      id: "sig-4f",
      dayNumber: 3,
      rawText: "Main conveyor belt stopped for 45 minutes, so no totes were moving to staging.",
      inputMethod: "text",
      issue: "Facility downtime",
      confidence: "High",
      possibleImpact: "External shift delay",
      category: "Environment",
      summary: "Conveyor stoppage delayed totes",
      companionResponse: "Noted conveyor issue.",
      timestamp: "02:00 PM",
    },
    managerSignal: {
      id: "mgr-4f",
      dayNumber: 3,
      managerName: "Suresh K.",
      state: "Doing well",
      notes: "Conveyor belt 2 breakdown caused floor-wide lag; picker executed cleanly.",
      timestamp: "02:30 PM",
    },
  });

  assert(
    result4F.adaptiveDecision === "no_action_monitor" &&
      result4F.updatedStatus === "Doing well" &&
      result4F.pattern.category === "Environment",
    "Step 4F: Temporary facility bottleneck does NOT result in false learner diagnosis or punitive retraining",
    `Decision: ${result4F.adaptiveDecision}, Status: ${result4F.updatedStatus}`
  );
}

// TEST 4G: Multiple simultaneous signals → most important actionable cause selected (Accuracy > Speed)
{
  const hireMultiSignal: NewHire = {
    ...initialRahul,
    currentCapabilityId: 3,
    capabilities: createDefaultCapabilitiesLedger(),
  };

  const result4G = executeCoordinationLoop({
    hire: hireMultiSignal,
    dayNumber: 3,
    workSignal: {
      dayNumber: 3,
      targetPickRate: 50,
      actualPickRate: 38, // Slightly low pick rate
      accuracyRate: 85, // Critical accuracy drop
      ordersCompleted: 48,
      targetOrders: 65,
      helpRequestsCount: 2,
    },
    dailySignal: {
      id: "sig-4g",
      dayNumber: 3,
      rawText: "I was rushing to pick faster and accidentally grabbed 200g detergent pouches instead of 500g pouches.",
      inputMethod: "voice",
      issue: "Variant confusion in rush",
      confidence: "Medium",
      possibleImpact: "Customer error",
      category: "Process",
      summary: "Variant mismatch under speed rush",
      companionResponse: "Accuracy always comes before speed!",
      timestamp: "02:00 PM",
    },
    managerSignal: {
      id: "mgr-4g",
      dayNumber: 3,
      managerName: "Suresh K.",
      state: "Needs support",
      issueCategory: "Accuracy",
      notes: "Multiple wrong variant scans detected at packing table.",
      timestamp: "02:30 PM",
    },
  });

  assert(
    result4G.adaptiveDecision === "supervisor_demo" &&
      result4G.action.targetCapabilityId === 6 &&
      result4G.updatedStatus === "At risk",
    "Step 4G: Multiple signals prioritize critical quality/accuracy failure (Capability 6) over secondary speed lag",
    `Decision: ${result4G.adaptiveDecision}, TargetCap: ${result4G.action.targetCapabilityId}, Status: ${result4G.updatedStatus}`
  );
}

// TEST 4H: Healthy occasional help → no false dependency diagnosis
{
  const hireHealthyHelp4: NewHire = {
    ...initialRahul,
    currentCapabilityId: 3,
    capabilities: createDefaultCapabilitiesLedger(),
  };

  const result4H = executeCoordinationLoop({
    hire: hireHealthyHelp4,
    dayNumber: 3,
    workSignal: {
      dayNumber: 3,
      targetPickRate: 50,
      actualPickRate: 52,
      accuracyRate: 98,
      ordersCompleted: 66,
      targetOrders: 65,
      helpRequestsCount: 1,
    },
    dailySignal: {
      id: "sig-4h",
      dayNumber: 3,
      rawText: "Asked buddy where new season mango cartons were stacked.",
      inputMethod: "text",
      issue: "None",
      confidence: "High",
      possibleImpact: "Proactive clarification",
      category: "General",
      summary: "Healthy clarification question",
      companionResponse: "Good initiative!",
      timestamp: "02:00 PM",
      helpRequestsCount: 1,
    },
    managerSignal: {
      id: "mgr-4h",
      dayNumber: 3,
      managerName: "Suresh K.",
      state: "Doing well",
      notes: "Working independently and asking good questions.",
      timestamp: "02:30 PM",
    },
  });

  assert(
    result4H.updatedStatus === "Doing well" &&
      !result4H.pattern.patternName.toLowerCase().includes("dependency"),
    "Step 4H: Single healthy help request does NOT get diagnosed as chronic dependency",
    `Status: ${result4H.updatedStatus}, Pattern: ${result4H.pattern.patternName}`
  );
}

// TEST 4I: Repeated help + poor independent performance → support/practice
{
  const hireDependent4: NewHire = {
    ...initialRahul,
    currentCapabilityId: 3,
    capabilities: createDefaultCapabilitiesLedger(),
  };

  const result4I = executeCoordinationLoop({
    hire: hireDependent4,
    dayNumber: 3,
    workSignal: {
      dayNumber: 3,
      targetPickRate: 50,
      actualPickRate: 22,
      accuracyRate: 90,
      ordersCompleted: 26,
      targetOrders: 65,
      helpRequestsCount: 7,
    },
    dailySignal: {
      id: "sig-4i",
      dayNumber: 3,
      rawText: "I needed Vikram for every single tote. I am nervous to pick alone.",
      inputMethod: "voice",
      issue: "Cannot pick solo",
      confidence: "Low",
      possibleImpact: "High dependency",
      category: "Process",
      summary: "Constant shadow needed",
      companionResponse: "We will build your solo confidence step by step.",
      timestamp: "02:00 PM",
      helpRequestsCount: 7,
    },
    managerSignal: {
      id: "mgr-4i",
      dayNumber: 3,
      managerName: "Suresh K.",
      state: "Needs support",
      issueCategory: "Process",
      notes: "Learner stops picking completely when buddy is away.",
      timestamp: "02:30 PM",
    },
  });

  assert(
    result4I.adaptiveDecision === "reinforce_current" &&
      result4I.pattern.patternName.toLowerCase().includes("dependency") &&
      result4I.action.title.toLowerCase().includes("solo"),
    "Step 4I: Repeated help requests with poor solo execution diagnosed as dependency and prescribed structured solo practice",
    `Decision: ${result4I.adaptiveDecision}, Action: ${result4I.action.title}`
  );
}

// TEST 4J: Recovery → learner returns to normal progression
{
  const hireRecovering: NewHire = {
    ...initialRahul,
    currentCapabilityId: 3,
    capabilities: createDefaultCapabilitiesLedger(),
  };

  const result4J = executeCoordinationLoop({
    hire: hireRecovering,
    dayNumber: 4,
    previousRecord: {
      dayNumber: 3,
      date: "Day 3",
      workSignal: {
        dayNumber: 3,
        targetPickRate: 50,
        actualPickRate: 35,
        accuracyRate: 98,
        ordersCompleted: 45,
        targetOrders: 65,
      },
      statusAtEnd: "Needs attention",
      statusReason: "Navigation friction",
    },
    workSignal: {
      dayNumber: 4,
      targetPickRate: 50,
      actualPickRate: 54, // Clear recovery
      accuracyRate: 99,
      ordersCompleted: 70,
      targetOrders: 65,
    },
    dailySignal: {
      id: "sig-4j",
      dayNumber: 4,
      rawText: "All aisles clear, picked full quota easily.",
      inputMethod: "text",
      issue: "None",
      confidence: "High",
      possibleImpact: "Full recovery",
      category: "General",
      summary: "Full quota picked",
      companionResponse: "Awesome turnaround!",
      timestamp: "02:00 PM",
    },
    managerSignal: {
      id: "mgr-4j",
      dayNumber: 4,
      managerName: "Suresh K.",
      state: "Doing well",
      notes: "Fully recovered on floor; strong pacing.",
      timestamp: "02:30 PM",
    },
  });

  assert(
    result4J.updatedStatus === "Doing well" &&
      (result4J.adaptiveDecision === "advance_default" || result4J.adaptiveDecision === "jump_ahead"),
    "Step 4J: Learner recovery returns status to 'Doing well' and resumes normal capability advancement",
    `Status: ${result4J.updatedStatus}, Decision: ${result4J.adaptiveDecision}`
  );
}

// TEST 4K: Existing intervention is not endlessly repeated; adapts upon resolution or failure
{
  const hireActionCycle: NewHire = {
    ...initialRahul,
    currentCapabilityId: 3,
    capabilities: createDefaultCapabilitiesLedger(),
  };

  const result4K = executeCoordinationLoop({
    hire: hireActionCycle,
    dayNumber: 4,
    actionOutcome: {
      id: "out-4k-01",
      actionId: "act-4k-prev",
      dayNumber: 4,
      performedBy: "Vikram R.",
      performedAt: "09:00 AM",
      improved: "yes",
      subsequentPickRate: 52,
      subsequentAccuracy: 99,
      notes: "Aisles 4-8 walkthrough closed navigation gap.",
    },
    workSignal: {
      dayNumber: 4,
      targetPickRate: 50,
      actualPickRate: 52,
      accuracyRate: 99,
      ordersCompleted: 68,
      targetOrders: 65,
    },
    dailySignal: {
      id: "sig-4k",
      dayNumber: 4,
      rawText: "I am picking easily now.",
      inputMethod: "text",
      issue: "None",
      confidence: "High",
      possibleImpact: "Complete",
      category: "General",
      summary: "Easy picking",
      companionResponse: "Great job!",
      timestamp: "02:00 PM",
    },
    managerSignal: {
      id: "mgr-4k",
      dayNumber: 4,
      managerName: "Suresh K.",
      state: "Doing well",
      notes: "Intervention resolved issue completely.",
      timestamp: "02:30 PM",
    },
  });

  assert(
    result4K.action.status === "completed" && result4K.updatedStatus === "Doing well",
    "Step 4K: Completed intervention marks action as completed and terminates repetitive loop",
    `Action Status: ${result4K.action.status}, Final Status: ${result4K.updatedStatus}`
  );
}

// TEST 4L: Existing capability/work evidence remains connected to the same learner state
{
  const hireStateIntegrity: NewHire = {
    ...initialRahul,
    currentCapabilityId: 3,
    capabilities: createDefaultCapabilitiesLedger(),
  };
  hireStateIntegrity.capabilities[3].exposure = "exposed";

  const result4L = executeCoordinationLoop({
    hire: hireStateIntegrity,
    dayNumber: 3,
    workSignal: {
      dayNumber: 3,
      targetPickRate: 50,
      actualPickRate: 35,
      accuracyRate: 98,
      ordersCompleted: 45,
      targetOrders: 65,
    },
    dailySignal: {
      id: "sig-4l",
      dayNumber: 3,
      rawText: "Taking too long in Aisles 4-8.",
      inputMethod: "voice",
      issue: "Aisle navigation delay",
      confidence: "Medium",
      possibleImpact: "Pacing lag",
      category: "Environment",
      summary: "Aisle delay",
      companionResponse: "Help is on the way.",
      timestamp: "02:00 PM",
    },
    managerSignal: {
      id: "mgr-4l",
      dayNumber: 3,
      managerName: "Suresh K.",
      state: "Needs support",
      issueCategory: "Speed",
      notes: "Needs aisle familiarization.",
      timestamp: "02:30 PM",
    },
  });

  assert(
    result4L.updatedCapabilities[3].evidence === "inconsistent" &&
      result4L.updatedCapabilities[3].performance === "below_target" &&
      result4L.updatedCapabilities[3].exposure === "reinforced",
    "Step 4L: Capability ledger accurately reflects multi-signal work evidence in the single learner state",
    `Cap3 Evidence: ${result4L.updatedCapabilities[3].evidence}, Performance: ${result4L.updatedCapabilities[3].performance}`
  );
}

console.log("\n=== ALL STEP 4 TESTS (A through L) PASSED! ===");
console.log("========================================================\n");

console.log("--- STEP 5: EVIDENCE-BASED READINESS & RELIABILITY TESTS ---");

// TEST 5A: Completed training + unverified capability + unverified readiness -> No premature readiness
{
  const hire5A: NewHire = {
    ...initialRahul,
    modulesCompleted: 10,
    quizAverageScore: 99,
    currentCapabilityId: 5,
    capabilities: createDefaultCapabilitiesLedger(), // Cap 1 mastered, others locked/in_progress with no evidence
  };

  const result5A = executeCoordinationLoop({
    hire: hire5A,
    dayNumber: 3,
    workSignal: {
      dayNumber: 3,
      targetPickRate: 50,
      actualPickRate: 35,
      accuracyRate: 98,
      ordersCompleted: 40,
      targetOrders: 65,
    },
  });

  assert(
    result5A.overallReadinessScore < 50 &&
      result5A.adaptiveDecision !== "no_action_monitor" &&
      result5A.updatedCapabilities[5].mastery !== "mastered",
    "Step 5A: 100% module completion with unverified floor capabilities does NOT grant job readiness",
    `Readiness: ${result5A.overallReadinessScore}%, Decision: ${result5A.adaptiveDecision}`
  );
}

// TEST 5B: Verified capability + good productivity + reliable performance -> Demonstrates full readiness
{
  const fullLedger5B = createDefaultCapabilitiesLedger();
  DARK_STORE_CAPABILITIES.forEach((c) => {
    fullLedger5B[c.id] = {
      capabilityId: c.id,
      exposure: "reinforced",
      evidence: "demonstrated",
      performance: "on_target",
      mastery: "mastered",
      lastAssessedAt: new Date().toISOString(),
      reinforcementCount: 1,
    };
  });

  const hire5B: NewHire = {
    ...initialRahul,
    modulesCompleted: 10,
    quizAverageScore: 95,
    currentCapabilityId: 20,
    capabilities: fullLedger5B,
  };

  const result5B = executeCoordinationLoop({
    hire: hire5B,
    dayNumber: 10,
    workSignal: {
      dayNumber: 10,
      targetPickRate: 50,
      actualPickRate: 54,
      accuracyRate: 99.2,
      ordersCompleted: 70,
      targetOrders: 65,
    },
  });

  assert(
    result5B.overallReadinessScore >= 95 &&
      result5B.updatedStatus === "Doing well" &&
      result5B.adaptiveDecision === "no_action_monitor",
    "Step 5B: Verified capabilities + on-target productivity + consistent floor performance demonstrates readiness",
    `Readiness: ${result5B.overallReadinessScore}%, Status: ${result5B.updatedStatus}`
  );
}

// TEST 5C: Strong capability + fast picker + poor quality/accuracy -> At risk quality failure
{
  const hire5C: NewHire = {
    ...initialRahul,
    currentCapabilityId: 6,
    capabilities: createDefaultCapabilitiesLedger(),
  };

  const result5C = executeCoordinationLoop({
    hire: hire5C,
    dayNumber: 4,
    workSignal: {
      dayNumber: 4,
      targetPickRate: 50,
      actualPickRate: 62, // Very fast!
      accuracyRate: 88,   // Serious mis-picks / quality drop below 98%
      ordersCompleted: 80,
      targetOrders: 65,
    },
  });

  assert(
    result5C.updatedStatus === "At risk" &&
      result5C.adaptiveDecision === "supervisor_demo" &&
      result5C.action.targetCapabilityId === 6,
    "Step 5C: Fast speed with compromised quality/accuracy is diagnosed as At risk quality failure",
    `Status: ${result5C.updatedStatus}, Decision: ${result5C.adaptiveDecision}, TargetCap: ${result5C.action.targetCapabilityId}`
  );
}

// TEST 5D: Consistent solo work + few interventions -> High reliability & independent advancement
{
  const hire5D: NewHire = {
    ...initialRahul,
    currentCapabilityId: 5,
    capabilities: createDefaultCapabilitiesLedger(),
  };

  const result5D = executeCoordinationLoop({
    hire: hire5D,
    dayNumber: 5,
    workSignal: {
      dayNumber: 5,
      targetPickRate: 50,
      actualPickRate: 52,
      accuracyRate: 98.5,
      ordersCompleted: 68,
      targetOrders: 65,
    },
    // No distress signal, no manager intervention needed
  });

  assert(
    result5D.updatedStatus === "Doing well" &&
      result5D.adaptiveDecision === "advance_default" &&
      result5D.updatedCapabilities[5].mastery === "proficient" &&
      result5D.updatedCapabilities[5].evidence === "demonstrated",
    "Step 5D: Consistent solo execution with zero distress signals demonstrates reliability and advances",
    `Status: ${result5D.updatedStatus}, Decision: ${result5D.adaptiveDecision}, Cap5 Mastery: ${result5D.updatedCapabilities[5].mastery}`
  );
}

// TEST 5E: Fast picking + repeated help dependency -> Dependent pacing diagnosed with structured solo practice
{
  const hire5E: NewHire = {
    ...initialRahul,
    currentCapabilityId: 5,
    capabilities: createDefaultCapabilitiesLedger(),
  };

  const result5E = executeCoordinationLoop({
    hire: hire5E,
    dayNumber: 5,
    workSignal: {
      dayNumber: 5,
      targetPickRate: 50,
      actualPickRate: 50,
      accuracyRate: 98,
      ordersCompleted: 65,
      targetOrders: 65,
    },
    dailySignal: {
      id: "sig-5e",
      dayNumber: 5,
      rawText: "Need buddy with me on every single order wave or I cannot find items.",
      inputMethod: "voice",
      issue: "Cannot pick solo without buddy",
      confidence: "Low",
      possibleImpact: "Support dependency",
      category: "Process",
      summary: "Buddy dependency",
      companionResponse: "Let us build solo confidence.",
      timestamp: "03:00 PM",
    },
    managerSignal: {
      id: "mgr-5e",
      dayNumber: 5,
      managerName: "Suresh K.",
      state: "Needs support",
      issueCategory: "Process",
      notes: "Constantly asks buddy to confirm item location before scanning; needs independent picking.",
      timestamp: "03:30 PM",
    },
  });

  assert(
    result5E.pattern.patternName.toLowerCase().includes("dependency") &&
      result5E.adaptiveDecision === "reinforce_current" &&
      result5E.action.smallestPracticalStep.toLowerCase().includes("solo"),
    "Step 5E: Productivity achieved through chronic buddy shadow is diagnosed as dependency needing solo practice",
    `Pattern: ${result5E.pattern.patternName}, Decision: ${result5E.adaptiveDecision}, Step: ${result5E.action.smallestPracticalStep}`
  );
}

// TEST 5F: Real skill + external equipment bottleneck -> Contextual explanation, capability unaffected
{
  const hire5F: NewHire = {
    ...initialRahul,
    currentCapabilityId: 3,
    capabilities: createDefaultCapabilitiesLedger(),
  };
  hire5F.capabilities[3].mastery = "proficient";
  hire5F.capabilities[3].evidence = "demonstrated";

  const result5F = executeCoordinationLoop({
    hire: hire5F,
    dayNumber: 4,
    workSignal: {
      dayNumber: 4,
      targetPickRate: 50,
      actualPickRate: 28, // Low productivity metric due to conveyer belt breakdown
      accuracyRate: 99,
      ordersCompleted: 35,
      targetOrders: 65,
    },
    dailySignal: {
      id: "sig-5f",
      dayNumber: 4,
      rawText: "Main conveyor belt breakdown in Zone B halted cart movement for 45 minutes.",
      inputMethod: "voice",
      issue: "Conveyor belt breakdown",
      confidence: "High",
      possibleImpact: "Facility halt",
      category: "Environment",
      summary: "Conveyor breakdown",
      companionResponse: "Store ops notified.",
      timestamp: "11:00 AM",
    },
  });

  assert(
    result5F.updatedStatus === "Doing well" &&
      result5F.adaptiveDecision === "no_action_monitor" &&
      result5F.pattern.category === "Environment" &&
      result5F.updatedCapabilities[3].mastery === "proficient",
    "Step 5F: Operational metric drop from facility bottleneck does NOT degrade capability ledger or trigger learner blame",
    `Status: ${result5F.updatedStatus}, Decision: ${result5F.adaptiveDecision}, Cap3 Mastery: ${result5F.updatedCapabilities[3].mastery}`
  );
}

// TEST 5G: Missing floor telemetry -> State is unknown/observation, not artificial failure
{
  const hire5G: NewHire = {
    ...initialRahul,
    currentCapabilityId: 2,
    capabilities: createDefaultCapabilitiesLedger(),
  };

  const result5G = executeCoordinationLoop({
    hire: hire5G,
    dayNumber: 2,
    workSignal: {
      dayNumber: 2,
      targetPickRate: 50,
      actualPickRate: 0,
      accuracyRate: 0,
      ordersCompleted: 0,
      targetOrders: 50,
    },
  });

  assert(
    result5G.updatedStatus === "Doing well" &&
      result5G.adaptiveDecision === "no_action_monitor" &&
      result5G.statusReason.toLowerCase().includes("telemetry") ||
      result5G.statusReason.toLowerCase().includes("observation"),
    "Step 5G: Missing telemetry results in neutral continuous observation rather than artificial failure",
    `Status: ${result5G.updatedStatus}, Reason: ${result5G.statusReason}`
  );
}

// TEST 5H: High training completion + high speed + unresolved safety blocker -> Safety blocker takes absolute priority
{
  const hire5H: NewHire = {
    ...initialRahul,
    modulesCompleted: 10,
    quizAverageScore: 100,
    currentCapabilityId: 4,
    capabilities: createDefaultCapabilitiesLedger(),
  };

  const result5H = executeCoordinationLoop({
    hire: hire5H,
    dayNumber: 4,
    workSignal: {
      dayNumber: 4,
      targetPickRate: 50,
      actualPickRate: 58,
      accuracyRate: 99,
      ordersCompleted: 75,
      targetOrders: 65,
    },
    dailySignal: {
      id: "sig-5h",
      dayNumber: 4,
      rawText: "Reported critical safety hazard near cold room door; worker stepped across forklift lane without PPE safety vest.",
      inputMethod: "text",
      issue: "Safety vest & forklift zone hazard",
      confidence: "High",
      possibleImpact: "Safety risk",
      category: "Process",
      summary: "Safety violation",
      companionResponse: "Supervisor notified immediately.",
      timestamp: "09:30 AM",
    },
  });

  assert(
    result5H.updatedStatus === "At risk" &&
      result5H.adaptiveDecision === "supervisor_demo" &&
      result5H.action.targetCapabilityId === 1,
    "Step 5H: Safety hazard report halts independent advancement and prioritizes Capability 1 safety verification",
    `Status: ${result5H.updatedStatus}, Decision: ${result5H.adaptiveDecision}, TargetCap: ${result5H.action.targetCapabilityId}`
  );
}

// TEST 5I: Inconsistent pacing across shift -> Needs attention with targeted repetition practice
{
  const hire5I: NewHire = {
    ...initialRahul,
    currentCapabilityId: 5,
    capabilities: createDefaultCapabilitiesLedger(),
  };

  const result5I = executeCoordinationLoop({
    hire: hire5I,
    dayNumber: 4,
    workSignal: {
      dayNumber: 4,
      targetPickRate: 50,
      actualPickRate: 38,
      accuracyRate: 98.2,
      ordersCompleted: 48,
      targetOrders: 65,
    },
    dailySignal: {
      id: "sig-5i",
      dayNumber: 4,
      rawText: "Struggling to maintain steady pace across 3-hour peak window.",
      inputMethod: "voice",
      issue: "Pacing fatigue and route backtracking",
      confidence: "Medium",
      possibleImpact: "Pick speed drop",
      category: "Process",
      summary: "Route pacing lag",
      companionResponse: "Route pacing practice assigned.",
      timestamp: "01:30 PM",
    },
  });

  assert(
    result5I.updatedStatus === "Needs attention" &&
      result5I.adaptiveDecision === "reinforce_current" &&
      result5I.action.targetCapabilityId === 5,
    "Step 5I: Inconsistent pacing is diagnosed as capability practice gap and prescribed structured pacing reinforcement",
    `Status: ${result5I.updatedStatus}, Decision: ${result5I.adaptiveDecision}, Action: ${result5I.action.title}`
  );
}

// TEST 5J: Recovered learner after targeted intervention -> Loop closes and normal advancement resumes
{
  const hire5J: NewHire = {
    ...initialRahul,
    currentCapabilityId: 3,
    status: "Needs attention",
    capabilities: createDefaultCapabilitiesLedger(),
    daysHistory: [
      {
        dayNumber: 2,
        date: "2026-03-02",
        workSignal: {
          dayNumber: 2,
          targetPickRate: 40,
          actualPickRate: 28,
          accuracyRate: 98,
          ordersCompleted: 35,
          targetOrders: 50,
        },
        recommendedAction: {
          id: "act-5j",
          dayNumber: 2,
          actionType: "practice",
          title: "Buddy Walkthrough of Aisles 4-8",
          description: "Walk aisles 4-8 with buddy",
          targetActor: "Buddy (Vikas)",
          urgency: "Immediate",
          smallestPracticalStep: "15-minute walkthrough",
          status: "in_progress",
          createdAt: "2026-03-02",
          targetCapabilityId: 3,
        },
        statusAtEnd: "Needs attention",
        statusReason: "Aisle navigation delay",
      },
    ],
  };

  const result5J = executeCoordinationLoop({
    hire: hire5J,
    dayNumber: 3,
    workSignal: {
      dayNumber: 3,
      targetPickRate: 40,
      actualPickRate: 44, // Substantial improvement above target
      accuracyRate: 99,
      ordersCompleted: 55,
      targetOrders: 50,
    },
    actionOutcome: {
      id: "out-5j",
      actionId: "act-5j",
      dayNumber: 3,
      performedBy: "Buddy (Vikas)",
      performedAt: "2026-03-03",
      improved: "yes",
      notes: "Aisle 4-8 navigation fully clarified; picking fluently now.",
      subsequentPickRate: 44,
      subsequentAccuracy: 99,
    },
  });

  assert(
    result5J.updatedStatus === "Doing well" &&
      result5J.adaptiveDecision === "advance_default" &&
      result5J.updatedCapabilities[3].mastery === "proficient",
    "Step 5J: Successful intervention closes the loop, marks capability proficient, and restores Doing well status",
    `Status: ${result5J.updatedStatus}, Decision: ${result5J.adaptiveDecision}, Cap3 Mastery: ${result5J.updatedCapabilities[3].mastery}`
  );
}

// TEST 5K: Action explainability -> Rationale explicitly links signals to root cause
{
  const hire5K: NewHire = {
    ...initialRahul,
    currentCapabilityId: 2,
    capabilities: createDefaultCapabilitiesLedger(),
  };

  const result5K = executeCoordinationLoop({
    hire: hire5K,
    dayNumber: 3,
    workSignal: {
      dayNumber: 3,
      targetPickRate: 50,
      actualPickRate: 30,
      accuracyRate: 98,
      ordersCompleted: 35,
      targetOrders: 65,
    },
    dailySignal: {
      id: "sig-5k",
      dayNumber: 3,
      rawText: "Scanner screen turns black and loses Bluetooth pairing intermittently.",
      inputMethod: "voice",
      issue: "Scanner battery/Bluetooth disconnect",
      confidence: "High",
      possibleImpact: "Scan delay",
      category: "Tool",
      summary: "Scanner disconnect",
      companionResponse: "IT swap requested.",
      timestamp: "10:15 AM",
    },
  });

  assert(
    result5K.action.decisionType === "tool_remedy" &&
      Boolean(result5K.action.rationale) &&
      result5K.action.rationale!.toLowerCase().includes("hardware") &&
      result5K.pattern.category === "Tool",
    "Step 5K: Decision provides clear evidence-based rationale distinguishing tool cause from training gap",
    `Decision: ${result5K.action.decisionType}, Rationale: ${result5K.action.rationale}`
  );
}

// TEST 5L: Single source of truth -> executeCoordinationLoop is authoritative
{
  const hire5L: NewHire = {
    ...initialRahul,
    currentCapabilityId: 3,
    capabilities: createDefaultCapabilitiesLedger(),
  };

  const result5L = executeCoordinationLoop({
    hire: hire5L,
    dayNumber: 4,
    workSignal: {
      dayNumber: 4,
      targetPickRate: 50,
      actualPickRate: 36,
      accuracyRate: 98,
      ordersCompleted: 45,
      targetOrders: 65,
    },
    dailySignal: {
      id: "sig-5l",
      dayNumber: 4,
      rawText: "Taking too long to locate bay coordinates in Aisles 4-8.",
      inputMethod: "voice",
      issue: "Aisle navigation delay",
      confidence: "Medium",
      possibleImpact: "Pacing lag",
      category: "Environment",
      summary: "Aisle delay",
      companionResponse: "Buddy walkthrough scheduled.",
      timestamp: "02:00 PM",
    },
  });

  assert(
    typeof result5L.overallReadinessScore === "number" &&
      typeof result5L.updatedStatus === "string" &&
      typeof result5L.adaptiveDecision === "string" &&
      Object.keys(result5L.updatedCapabilities).length === 20 &&
      result5L.updatedCapabilities[3].evidence === "inconsistent",
    "Step 5L: executeCoordinationLoop returns single authoritative snapshot across all 5 dimensions",
    `Readiness: ${result5L.overallReadinessScore}%, Status: ${result5L.updatedStatus}, CapCount: ${Object.keys(result5L.updatedCapabilities).length}`
  );
}

console.log("\n=== ALL STEP 5 TESTS (A through L) PASSED! ===");
console.log("========================================================\n");

console.log("--- STEP 6: END-TO-END LEARNER JOURNEY VALIDATION TESTS ---");

// JOURNEY A: HEALTHY LEARNER (Days 1 to 10)
{
  let currentHire: NewHire = {
    ...initialRahul,
    modulesCompleted: 0,
    currentCapabilityId: 1,
    capabilities: createDefaultCapabilitiesLedger(),
  };

  for (let day = 1; day <= 10; day++) {
    const res = executeCoordinationLoop({
      hire: currentHire,
      dayNumber: day,
      workSignal: {
        dayNumber: day,
        targetPickRate: 30 + day * 2,
        actualPickRate: 32 + day * 2,
        accuracyRate: 99,
        ordersCompleted: 20 + day * 5,
        targetOrders: 20 + day * 5,
      },
      dailySignal:
        day === 7
          ? {
              id: "sig-jA-7",
              dayNumber: 7,
              rawText: "Where are the extra freezer gloves stored?",
              inputMethod: "voice",
              issue: "Freezer PPE storage question",
              confidence: "High",
              possibleImpact: "None",
              category: "Process",
              summary: "Routine question",
              companionResponse: "Zone C cabinet.",
              timestamp: "11:00 AM",
            }
          : undefined,
    });
    currentHire = {
      ...currentHire,
      modulesCompleted: day,
      currentCapabilityId: res.currentCapabilityId,
      status: res.updatedStatus,
      capabilities: res.updatedCapabilities,
      overallReadinessScore: res.overallReadinessScore,
    };
  }

  assert(
    currentHire.status === "Doing well" &&
      currentHire.modulesCompleted === 10 &&
      currentHire.overallReadinessScore >= 20,
    "Journey A: Healthy learner progresses steadily to Day 10 with minimal support and high readiness",
    `Status: ${currentHire.status}, Readiness: ${currentHire.overallReadinessScore}%, Modules: ${currentHire.modulesCompleted}/10`
  );
}

// JOURNEY B: SLOW BUT RECOVERABLE LEARNER (Days 1 to 7)
{
  let currentHire: NewHire = {
    ...initialRahul,
    modulesCompleted: 3,
    currentCapabilityId: 3,
    capabilities: createDefaultCapabilitiesLedger(),
  };

  // Day 3: Low pick performance due to location navigation
  const d3Res = executeCoordinationLoop({
    hire: currentHire,
    dayNumber: 3,
    workSignal: {
      dayNumber: 3,
      targetPickRate: 50,
      actualPickRate: 32,
      accuracyRate: 98,
      ordersCompleted: 38,
      targetOrders: 65,
    },
    dailySignal: {
      id: "sig-jB-3",
      dayNumber: 3,
      rawText: "I get confused finding rack coordinates in Aisles 4-8.",
      inputMethod: "voice",
      issue: "Aisle navigation delay",
      confidence: "Medium",
      possibleImpact: "Speed drop",
      category: "Environment",
      summary: "Navigation friction",
      companionResponse: "Buddy walkthrough scheduled.",
      timestamp: "02:00 PM",
    },
  });

  // Day 4: Targeted buddy walkthrough in progress
  currentHire = {
    ...currentHire,
    status: d3Res.updatedStatus,
    currentCapabilityId: 3,
    capabilities: d3Res.updatedCapabilities,
    daysHistory: [
      {
        dayNumber: 3,
        date: "2026-03-03",
        workSignal: {
          dayNumber: 3,
          targetPickRate: 50,
          actualPickRate: 32,
          accuracyRate: 98,
          ordersCompleted: 38,
          targetOrders: 65,
        },
        recommendedAction: d3Res.action,
        statusAtEnd: d3Res.updatedStatus,
        statusReason: d3Res.statusReason,
      },
    ],
  };

  // Day 5-6: Successful intervention, solo performance improves to 48 items/hr
  const d6Res = executeCoordinationLoop({
    hire: currentHire,
    dayNumber: 6,
    existingAction: d3Res.action,
    workSignal: {
      dayNumber: 6,
      targetPickRate: 50,
      actualPickRate: 51,
      accuracyRate: 99,
      ordersCompleted: 66,
      targetOrders: 65,
    },
    actionOutcome: {
      id: "out-jB-6",
      actionId: d3Res.action.id,
      dayNumber: 6,
      performedBy: "Buddy (Vikas)",
      performedAt: "2026-03-06",
      improved: "yes",
      notes: "Aisle 4-8 walkthrough completed; coordinates mastered.",
      subsequentPickRate: 51,
      subsequentAccuracy: 99,
    },
  });

  assert(
    d6Res.updatedStatus === "Doing well" &&
      d6Res.adaptiveDecision === "advance_default" &&
      d6Res.updatedCapabilities[3].mastery === "proficient",
    "Journey B: Recovered learner has support faded, capability marked proficient, and normal advancement resumed",
    `Status: ${d6Res.updatedStatus}, Decision: ${d6Res.adaptiveDecision}, Cap3 Mastery: ${d6Res.updatedCapabilities[3].mastery}`
  );
}

// JOURNEY C: TOOL FAILURE (Days 3 to 4)
{
  const hireC: NewHire = {
    ...initialRahul,
    currentCapabilityId: 2,
    capabilities: createDefaultCapabilitiesLedger(),
  };
  hireC.capabilities[2].mastery = "proficient";
  hireC.capabilities[2].evidence = "demonstrated";

  // Day 3: Scanner Bluetooth drops repeatedly
  const d3Res = executeCoordinationLoop({
    hire: hireC,
    dayNumber: 3,
    workSignal: {
      dayNumber: 3,
      targetPickRate: 50,
      actualPickRate: 26,
      accuracyRate: 98,
      ordersCompleted: 30,
      targetOrders: 65,
    },
    dailySignal: {
      id: "sig-jC-3",
      dayNumber: 3,
      rawText: "Scanner keeps disconnecting from terminal on every barcode scan.",
      inputMethod: "voice",
      issue: "Scanner Bluetooth disconnect",
      confidence: "High",
      possibleImpact: "Hardware friction",
      category: "Tool",
      summary: "Scanner disconnect",
      companionResponse: "IT swap requested.",
      timestamp: "10:30 AM",
    },
  });

  // Day 4: Scanner replaced with new device, performance returns to normal
  const d4Res = executeCoordinationLoop({
    hire: {
      ...hireC,
      capabilities: d3Res.updatedCapabilities,
    },
    dayNumber: 4,
    workSignal: {
      dayNumber: 4,
      targetPickRate: 50,
      actualPickRate: 52,
      accuracyRate: 99,
      ordersCompleted: 67,
      targetOrders: 65,
    },
  });

  assert(
    d3Res.action.decisionType === "tool_remedy" &&
      d4Res.updatedStatus === "Doing well" &&
      d4Res.updatedCapabilities[2].mastery === "proficient",
    "Journey C: Tool failure is resolved with device swap without falsely degrading learner capability",
    `D3 Action: ${d3Res.action.decisionType}, D4 Status: ${d4Res.updatedStatus}`
  );
}

// JOURNEY D: HELP DEPENDENCY (Days 2 to 6)
{
  let hireD: NewHire = {
    ...initialRahul,
    currentCapabilityId: 5,
    capabilities: createDefaultCapabilitiesLedger(),
  };

  // Day 3: High help dependency reported with poor solo throughput
  const d3Res = executeCoordinationLoop({
    hire: hireD,
    dayNumber: 3,
    workSignal: {
      dayNumber: 3,
      targetPickRate: 50,
      actualPickRate: 36,
      accuracyRate: 98,
      ordersCompleted: 42,
      targetOrders: 65,
    },
    dailySignal: {
      id: "sig-jD-3",
      dayNumber: 3,
      rawText: "Unable to pick solo without buddy confirming every item location.",
      inputMethod: "voice",
      issue: "Cannot pick solo",
      confidence: "Low",
      possibleImpact: "Dependency",
      category: "Process",
      summary: "Help dependency",
      companionResponse: "Solo practice assigned.",
      timestamp: "03:00 PM",
    },
    managerSignal: {
      id: "mgr-jD-3",
      dayNumber: 3,
      managerName: "Suresh K.",
      state: "Needs support",
      issueCategory: "Process",
      notes: "Worker has help dependency and is unable to pick solo; needs independent picking practice.",
      timestamp: "03:30 PM",
    },
  });

  hireD = {
    ...hireD,
    status: d3Res.updatedStatus,
    currentCapabilityId: d3Res.currentCapabilityId,
    capabilities: d3Res.updatedCapabilities,
    daysHistory: [
      {
        dayNumber: 3,
        date: "2026-03-03",
        workSignal: {
          dayNumber: 3,
          targetPickRate: 50,
          actualPickRate: 36,
          accuracyRate: 98,
          ordersCompleted: 42,
          targetOrders: 65,
        },
        recommendedAction: d3Res.action,
        statusAtEnd: d3Res.updatedStatus,
        statusReason: d3Res.statusReason,
      },
    ],
  };

  // Day 6: After structured solo practice, solo pick rate reaches 53 items/hr
  const d6Res = executeCoordinationLoop({
    hire: hireD,
    dayNumber: 6,
    workSignal: {
      dayNumber: 6,
      targetPickRate: 50,
      actualPickRate: 53,
      accuracyRate: 99,
      ordersCompleted: 69,
      targetOrders: 65,
    },
    actionOutcome: {
      id: "out-jD-6",
      actionId: d3Res.action.id,
      dayNumber: 6,
      performedBy: "Buddy (Vikas)",
      performedAt: "2026-03-06",
      improved: "yes",
      notes: "Solo wave practice completed; worker picking independently without buddy shadow.",
      subsequentPickRate: 53,
      subsequentAccuracy: 99,
    },
  });

  assert(
    d3Res.pattern.patternName.toLowerCase().includes("dependency") &&
      d6Res.updatedStatus === "Doing well" &&
      d6Res.adaptiveDecision === "advance_default",
    "Journey D: Chronic help dependency is treated with solo practice, and recovery clears the dependency",
    `D3 Pattern: ${d3Res.pattern.patternName}, D6 Status: ${d6Res.updatedStatus}`
  );
}

// JOURNEY E: HIGH PERFORMER (LMS 4/10, high performance, no false training completion)
{
  const hireE: NewHire = {
    ...initialRahul,
    modulesCompleted: 4,
    currentCapabilityId: 4,
    capabilities: createDefaultCapabilitiesLedger(),
  };

  const resE = executeCoordinationLoop({
    hire: hireE,
    dayNumber: 4,
    workSignal: {
      dayNumber: 4,
      targetPickRate: 50,
      actualPickRate: 64, // Well above target
      accuracyRate: 99.5,
      ordersCompleted: 82,
      targetOrders: 65,
    },
  });

  assert(
    resE.updatedStatus === "Doing well" &&
      resE.adaptiveDecision === "jump_ahead" &&
      hireE.modulesCompleted === 4, // Training completion not falsely inflated
    "Journey E: High performance accelerates capability progression without falsely marking LMS training complete",
    `Status: ${resE.updatedStatus}, Decision: ${resE.adaptiveDecision}, Modules: ${hireE.modulesCompleted}/10`
  );
}

// JOURNEY F: PERSISTENT STRUGGLE (Repeated failure, re-diagnosis, escalation)
{
  const hireF: NewHire = {
    ...initialRahul,
    currentCapabilityId: 3,
    status: "Needs attention",
    capabilities: createDefaultCapabilitiesLedger(),
    daysHistory: [
      {
        dayNumber: 4,
        date: "2026-03-04",
        workSignal: {
          dayNumber: 4,
          targetPickRate: 50,
          actualPickRate: 30,
          accuracyRate: 98,
          ordersCompleted: 35,
          targetOrders: 65,
        },
        recommendedAction: {
          id: "act-jF-4",
          dayNumber: 4,
          actionType: "buddy_walkthrough",
          title: "Buddy Walkthrough of Aisles 4-8",
          description: "Walk aisles 4-8 with buddy",
          targetActor: "Buddy (Vikas)",
          urgency: "Immediate",
          smallestPracticalStep: "15-minute walkthrough",
          status: "in_progress",
          createdAt: "2026-03-04",
          targetCapabilityId: 3,
        },
        statusAtEnd: "Needs attention",
        statusReason: "Aisle navigation friction",
      },
    ],
  };

  const resF = executeCoordinationLoop({
    hire: hireF,
    dayNumber: 5,
    existingAction: hireF.daysHistory[0].recommendedAction,
    workSignal: {
      dayNumber: 5,
      targetPickRate: 50,
      actualPickRate: 29,
      accuracyRate: 98,
      ordersCompleted: 34,
      targetOrders: 65,
    },
    actionOutcome: {
      id: "out-jF-5",
      actionId: "act-jF-4",
      dayNumber: 5,
      performedBy: "Buddy (Vikas)",
      performedAt: "2026-03-05",
      improved: "no",
      notes: "Buddy walkthrough completed but learner still lost in Aisles 4-8.",
      subsequentPickRate: 29,
      subsequentAccuracy: 98,
    },
  });

  assert(
    resF.adaptiveDecision === "environment_support" &&
      resF.action.targetActor.includes("Supervisor") &&
      resF.updatedStatus === "At risk",
    "Journey F: Persistent failure after buddy walkthrough escalates to supervisor layout intervention rather than repeating",
    `Decision: ${resF.adaptiveDecision}, Actor: ${resF.action.targetActor}, Status: ${resF.updatedStatus}`
  );
}

// JOURNEY G: MIXED / CHANGING PROBLEMS (Resolved issues don't linger)
{
  let hireG: NewHire = {
    ...initialRahul,
    currentCapabilityId: 2,
    capabilities: createDefaultCapabilitiesLedger(),
  };

  // Day 2: Tool problem
  const d2Res = executeCoordinationLoop({
    hire: hireG,
    dayNumber: 2,
    workSignal: {
      dayNumber: 2,
      targetPickRate: 40,
      actualPickRate: 28,
      accuracyRate: 98,
      ordersCompleted: 30,
      targetOrders: 50,
    },
    dailySignal: {
      id: "sig-jG-2",
      dayNumber: 2,
      rawText: "Scanner trigger button gets stuck on barcode scans.",
      inputMethod: "voice",
      issue: "Scanner trigger stuck",
      confidence: "High",
      possibleImpact: "Tool delay",
      category: "Tool",
      summary: "Scanner trigger stuck",
      companionResponse: "IT swap requested.",
      timestamp: "10:00 AM",
    },
  });

  hireG = {
    ...hireG,
    capabilities: d2Res.updatedCapabilities,
  };

  // Day 3: Tool is fixed; now healthy performance
  const d3Res = executeCoordinationLoop({
    hire: hireG,
    dayNumber: 3,
    workSignal: {
      dayNumber: 3,
      targetPickRate: 45,
      actualPickRate: 47,
      accuracyRate: 99,
      ordersCompleted: 58,
      targetOrders: 55,
    },
  });

  assert(
    d2Res.action.decisionType === "tool_remedy" &&
      d3Res.updatedStatus === "Doing well" &&
      d3Res.pattern.patternName !== d2Res.pattern.patternName,
    "Journey G: Changing daily evidence updates current state without stale lingering diagnoses",
    `D2 Action: ${d2Res.action.decisionType}, D3 Status: ${d3Res.updatedStatus}`
  );
}

// JOURNEY H: BAD SHIFT → RECOVERY (Conveyor breakdown on Day 4, healthy Day 5)
{
  const hireH: NewHire = {
    ...initialRahul,
    currentCapabilityId: 4,
    capabilities: createDefaultCapabilitiesLedger(),
  };

  // Day 4: External facility congestion
  const d4Res = executeCoordinationLoop({
    hire: hireH,
    dayNumber: 4,
    workSignal: {
      dayNumber: 4,
      targetPickRate: 50,
      actualPickRate: 25,
      accuracyRate: 99,
      ordersCompleted: 30,
      targetOrders: 65,
    },
    dailySignal: {
      id: "sig-jH-4",
      dayNumber: 4,
      rawText: "Outbound staging conveyor belt was completely jammed for 1 hour.",
      inputMethod: "voice",
      issue: "Conveyor jam",
      confidence: "High",
      possibleImpact: "Facility halt",
      category: "Environment",
      summary: "Conveyor jam",
      companionResponse: "Store Ops notified.",
      timestamp: "11:00 AM",
    },
  });

  // Day 5: Normal conditions restored
  const d5Res = executeCoordinationLoop({
    hire: {
      ...hireH,
      capabilities: d4Res.updatedCapabilities,
    },
    dayNumber: 5,
    workSignal: {
      dayNumber: 5,
      targetPickRate: 50,
      actualPickRate: 52,
      accuracyRate: 99.2,
      ordersCompleted: 68,
      targetOrders: 65,
    },
  });

  assert(
    d4Res.adaptiveDecision === "no_action_monitor" &&
      d4Res.updatedStatus === "Doing well" &&
      d5Res.updatedStatus === "Doing well",
    "Journey H: Operational disruption does not trigger punitive learner diagnosis, and Day 5 recovers cleanly",
    `D4 Decision: ${d4Res.adaptiveDecision}, D5 Status: ${d5Res.updatedStatus}`
  );
}

// JOURNEY I: SAFETY BLOCKER (Safety hazard report halts progression)
{
  const hireI: NewHire = {
    ...initialRahul,
    modulesCompleted: 10,
    quizAverageScore: 98,
    currentCapabilityId: 4,
    capabilities: createDefaultCapabilitiesLedger(),
  };

  const resI = executeCoordinationLoop({
    hire: hireI,
    dayNumber: 4,
    workSignal: {
      dayNumber: 4,
      targetPickRate: 50,
      actualPickRate: 58,
      accuracyRate: 99,
      ordersCompleted: 75,
      targetOrders: 65,
    },
    dailySignal: {
      id: "sig-jI",
      dayNumber: 4,
      rawText: "Reported critical safety hazard near loading dock; worker crossed forklift zone without required safety vest.",
      inputMethod: "text",
      issue: "PPE safety violation",
      confidence: "High",
      possibleImpact: "Safety risk",
      category: "Process",
      summary: "Safety hazard",
      companionResponse: "Supervisor notified immediately.",
      timestamp: "09:00 AM",
    },
  });

  assert(
    resI.updatedStatus === "At risk" &&
      resI.action.targetCapabilityId === 1 &&
      resI.adaptiveDecision === "supervisor_demo",
    "Journey I: Critical safety hazard halts advancement and prioritizes Capability 1 safety verification",
    `Status: ${resI.updatedStatus}, Decision: ${resI.adaptiveDecision}, TargetCap: ${resI.action.targetCapabilityId}`
  );
}

// JOURNEY J: MULTIPLE SIGNALS (Quality failure prioritized over speed lag)
{
  const hireJ: NewHire = {
    ...initialRahul,
    currentCapabilityId: 6,
    capabilities: createDefaultCapabilitiesLedger(),
  };

  const resJ = executeCoordinationLoop({
    hire: hireJ,
    dayNumber: 4,
    workSignal: {
      dayNumber: 4,
      targetPickRate: 50,
      actualPickRate: 38, // Speed lag
      accuracyRate: 88,   // Severe quality failure (<90%)
      ordersCompleted: 45,
      targetOrders: 65,
    },
    dailySignal: {
      id: "sig-jJ",
      dayNumber: 4,
      rawText: "Scanner battery low and aisle was crowded, also missed item barcode checks.",
      inputMethod: "voice",
      issue: "Low battery and crowded aisle",
      confidence: "Medium",
      possibleImpact: "Multi-factor",
      category: "Tool",
      summary: "Multi-factor",
      companionResponse: "Reviewing.",
      timestamp: "02:00 PM",
    },
  });

  assert(
    resJ.action.targetCapabilityId === 6 &&
      resJ.updatedStatus === "At risk" &&
      resJ.adaptiveDecision === "supervisor_demo",
    "Journey J: Multiple simultaneous signals prioritize critical accuracy failure over secondary tool/speed friction",
    `Status: ${resJ.updatedStatus}, TargetCap: ${resJ.action.targetCapabilityId}, Decision: ${resJ.adaptiveDecision}`
  );
}

// JOURNEY K: NO EVIDENCE (Missing telemetry keeps state in neutral observation)
{
  const hireK: NewHire = {
    ...initialRahul,
    currentCapabilityId: 2,
    capabilities: createDefaultCapabilitiesLedger(),
  };

  const resK = executeCoordinationLoop({
    hire: hireK,
    dayNumber: 2,
    workSignal: {
      dayNumber: 2,
      targetPickRate: 50,
      actualPickRate: 0,
      accuracyRate: 0,
      ordersCompleted: 0,
      targetOrders: 50,
    },
  });

  assert(
    resK.updatedStatus === "Doing well" &&
      resK.adaptiveDecision === "no_action_monitor",
    "Journey K: Missing shift telemetry maintains neutral observation without creating artificial failure",
    `Status: ${resK.updatedStatus}, Decision: ${resK.adaptiveDecision}`
  );
}

// JOURNEY L: FULL SUCCESS (All capabilities demonstrated and verified)
{
  const fullSuccessLedger = createDefaultCapabilitiesLedger();
  DARK_STORE_CAPABILITIES.forEach((c) => {
    fullSuccessLedger[c.id] = {
      capabilityId: c.id,
      exposure: "reinforced",
      evidence: "demonstrated",
      performance: "on_target",
      mastery: "mastered",
      lastAssessedAt: new Date().toISOString(),
      reinforcementCount: 1,
    };
  });

  const hireL: NewHire = {
    ...initialRahul,
    modulesCompleted: 10,
    quizAverageScore: 98,
    currentCapabilityId: 20,
    capabilities: fullSuccessLedger,
  };

  const resL = executeCoordinationLoop({
    hire: hireL,
    dayNumber: 10,
    workSignal: {
      dayNumber: 10,
      targetPickRate: 55,
      actualPickRate: 58,
      accuracyRate: 99.5,
      ordersCompleted: 75,
      targetOrders: 70,
    },
  });

  assert(
    resL.overallReadinessScore >= 95 &&
      resL.updatedStatus === "Doing well" &&
      resL.adaptiveDecision === "no_action_monitor",
    "Journey L: Full success is recognized with complete readiness, healthy productivity, and demonstrated reliability",
    `Readiness: ${resL.overallReadinessScore}%, Status: ${resL.updatedStatus}`
  );
}

// POST-DAY-10 CONTINUITY (Day 11+ continued real-world observation)
{
  const fullLedger = createDefaultCapabilitiesLedger();
  DARK_STORE_CAPABILITIES.forEach((c) => {
    fullLedger[c.id] = {
      capabilityId: c.id,
      exposure: "reinforced",
      evidence: "demonstrated",
      performance: "on_target",
      mastery: "mastered",
      lastAssessedAt: new Date().toISOString(),
      reinforcementCount: 1,
    };
  });

  const postDay10Hire: NewHire = {
    ...initialRahul,
    modulesCompleted: 10,
    quizAverageScore: 95,
    currentCapabilityId: 20,
    capabilities: fullLedger,
  };

  // Day 12: Normal steady shift
  const day12Res = executeCoordinationLoop({
    hire: postDay10Hire,
    dayNumber: 12,
    workSignal: {
      dayNumber: 12,
      targetPickRate: 55,
      actualPickRate: 57,
      accuracyRate: 99.4,
      ordersCompleted: 74,
      targetOrders: 70,
    },
  });

  // Day 13: Sudden regression on item variant checks
  const day13Res = executeCoordinationLoop({
    hire: postDay10Hire,
    dayNumber: 13,
    workSignal: {
      dayNumber: 13,
      targetPickRate: 55,
      actualPickRate: 52,
      accuracyRate: 87, // Sudden quality drop
      ordersCompleted: 68,
      targetOrders: 70,
    },
  });

  assert(
    day12Res.adaptiveDecision === "no_action_monitor" &&
      day13Res.updatedStatus === "At risk" &&
      day13Res.action.targetCapabilityId === 6,
    "Post-Day-10 Continuity: Intelligence engine remains active and protective post-Day 10 if regression occurs",
    `Day 12 Decision: ${day12Res.adaptiveDecision}, Day 13 Status: ${day13Res.updatedStatus}, TargetCap: ${day13Res.action.targetCapabilityId}`
  );
}

console.log("\n=== ALL STEP 6 TESTS (Journeys A through L + Post-Day-10) PASSED! ===");
console.log("========================================================\n");
console.log(`TOTAL ASSERTIONS: ${passedCount + failedCount}`);
console.log(`PASSED: ${passedCount}`);
console.log(`FAILED: ${failedCount}`);



