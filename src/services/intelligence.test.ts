import { describe, it, expect } from "vitest";
import {
  executeCoordinationLoop,
  LoopExecutionInput,
  evaluateDay10Outcome,
  assessReadiness,
} from "./intelligence";
import { adaptGoogleFormFeedRow, DEMO_FEED_PRESETS } from "./googleFormFeedAdapter";
import { initialRahul, initialCohort } from "../data/seedData";

describe("Step 4 — Prove Six Doctors Across Real Conditions", () => {
  const baseHire = initialRahul; // Rahul Sharma, Day 3

  it("Scenario 1: Navigation / Spatial Capability Problem", () => {
    const preset = DEMO_FEED_PRESETS.find((p) => p.id === "scenario-1-navigation")!;
    const adapted = adaptGoogleFormFeedRow(preset.payload, initialCohort);

    const input: LoopExecutionInput = {
      hire: baseHire,
      dayNumber: 3,
      workSignal: adapted.workSignal,
      dailySignal: adapted.dailySignal,
      managerSignal: adapted.managerSignal,
    };

    const result = executeCoordinationLoop(input);

    expect(result.pattern.category).toBe("Environment");
    expect(result.pattern.patternName).toContain("Dark Store Spatial");
    expect(result.action.targetCapabilityId).toBe(3); // DSP-03-ZONE-NAVIGATION / DSP-04-AISLE-COORDINATES
    expect(result.action.decisionType).toBe("reinforce_current");
    expect(result.action.targetActor).toContain("Buddy");
    expect(result.action.smallestPracticalStep).toContain("walkthrough");
    expect(result.updatedStatus).toBe("Needs attention");
  });

  it("Scenario 2: Scanner / Tool Hardware Problem", () => {
    const preset = DEMO_FEED_PRESETS.find((p) => p.id === "scenario-2-scanner-tool")!;
    const adapted = adaptGoogleFormFeedRow(preset.payload, initialCohort);

    const input: LoopExecutionInput = {
      hire: baseHire,
      dayNumber: 3,
      workSignal: adapted.workSignal,
      dailySignal: adapted.dailySignal,
      managerSignal: adapted.managerSignal,
    };

    const result = executeCoordinationLoop(input);

    expect(result.pattern.category).toBe("Tool");
    expect(result.pattern.patternName).toContain("Hardware / Barcode Scanner Friction");
    expect(result.action.decisionType).toBe("tool_remedy");
    expect(result.action.targetCapabilityId).toBe(2);
    expect(result.action.targetActor).toContain("Maintenance");
    expect(result.action.title).toContain("Scanner Hardware Check");
  });

  it("Scenario 3: Training / Process Gap Problem", () => {
    const preset = DEMO_FEED_PRESETS.find((p) => p.id === "scenario-3-training-process")!;
    const adapted = adaptGoogleFormFeedRow(preset.payload, initialCohort);

    const input: LoopExecutionInput = {
      hire: baseHire,
      dayNumber: 3,
      workSignal: adapted.workSignal,
      dailySignal: adapted.dailySignal,
      managerSignal: adapted.managerSignal,
    };

    const result = executeCoordinationLoop(input);

    expect(result.pattern.category).toBe("Process");
    expect(result.action.decisionType).toBe("reinforce_current");
    expect(result.action.targetActor).toContain("Buddy");
    expect(result.updatedStatus).toBe("Needs attention");
  });

  it("Scenario 4: Dependency / Independence Problem", () => {
    const preset = DEMO_FEED_PRESETS.find((p) => p.id === "scenario-4-dependency")!;
    const adapted = adaptGoogleFormFeedRow(preset.payload, initialCohort);

    const input: LoopExecutionInput = {
      hire: baseHire,
      dayNumber: 3,
      workSignal: adapted.workSignal,
      dailySignal: adapted.dailySignal,
      managerSignal: adapted.managerSignal,
    };

    const result = executeCoordinationLoop(input);

    expect(result.pattern.category).toBe("Process");
    expect(result.pattern.patternName).toContain("Floor Independence & Help Dependency Gap");
    expect(result.action.title).toContain("Solo-Picking");
    expect(result.action.targetActor).toContain("Buddy");
    expect(result.updatedStatus).toBe("Needs attention");
  });

  it("Scenario 5: Safety Problem (Safety Overrides Productivity)", () => {
    const preset = DEMO_FEED_PRESETS.find((p) => p.id === "scenario-5-safety")!;
    const adapted = adaptGoogleFormFeedRow(preset.payload, initialCohort);

    const input: LoopExecutionInput = {
      hire: baseHire,
      dayNumber: 3,
      workSignal: adapted.workSignal,
      dailySignal: adapted.dailySignal,
      managerSignal: adapted.managerSignal,
    };

    const result = executeCoordinationLoop(input);

    expect(result.pattern.patternName).toContain("Critical Floor Safety Protocol Blocker");
    expect(result.action.targetCapabilityId).toBe(1); // Store Safety & PPE
    expect(result.action.decisionType).toBe("supervisor_demo");
    expect(result.action.targetActor).toContain("Supervisor");
    expect(result.action.urgency).toBe("Immediate");
    expect(result.updatedStatus).toBe("At risk");
  });

  it("Recovery Test 1: Navigation Recovery (Closed Loop Succeeded)", () => {
    const recoveryPreset = DEMO_FEED_PRESETS.find((p) => p.id === "scenario-recovery-nav")!;
    const adapted = adaptGoogleFormFeedRow(recoveryPreset.payload, initialCohort);

    const input: LoopExecutionInput = {
      hire: baseHire,
      dayNumber: 4,
      workSignal: adapted.workSignal,
      dailySignal: adapted.dailySignal,
      managerSignal: adapted.managerSignal,
      actionOutcome: adapted.actionOutcome,
    };

    const result = executeCoordinationLoop(input);

    expect(result.pattern.patternName).toContain("Steady Ramp Progression");
    expect(result.updatedStatus).toBe("Doing well");
    expect(result.action.decisionType).toBe("advance_default");
    // Capability 3 should be marked proficient/mastered after recovery
    const cap3 = result.updatedCapabilities[3];
    expect(cap3.evidence).toBe("demonstrated");
    expect(cap3.mastery).toMatch(/proficient|mastered/);
  });

  it("Failure Path & Treatment Memory Test: Buddy Walkthrough Failed -> Supervisor Layout Escalation", () => {
    const failurePreset = DEMO_FEED_PRESETS.find((p) => p.id === "journey-failure-memory")!;
    const adapted = adaptGoogleFormFeedRow(failurePreset.payload, initialCohort);

    const existingWalkthroughAction = {
      id: "act-prev-walkthrough",
      dayNumber: 3,
      actionType: "buddy_walkthrough" as const,
      targetCapabilityId: 3,
      targetActor: "Buddy (Vikram R.)",
      urgency: "Next Shift" as const,
      decisionType: "reinforce_current" as const,
      title: "Buddy Walkthrough of Aisles 4-8",
      description: "Vikram does a 15-minute walkthrough of Aisles 4-8.",
      smallestPracticalStep: "15-minute walkthrough before Shift Wave 2",
      whyThisAction: "Friction with aisle locations",
      status: "in_progress" as const,
      createdAt: "Day 3",
    };

    const input: LoopExecutionInput = {
      hire: baseHire,
      dayNumber: 4,
      workSignal: adapted.workSignal,
      dailySignal: adapted.dailySignal,
      managerSignal: adapted.managerSignal,
      actionOutcome: adapted.actionOutcome,
      existingAction: existingWalkthroughAction,
    };

    const result = executeCoordinationLoop(input);

    // CRITICAL PROOF: System remembers that Buddy Walkthrough already failed!
    // It does NOT repeat "Buddy Walkthrough". It escalates!
    expect(["environment_support", "escalate_manager"]).toContain(result.action.decisionType);
    expect(result.action.targetActor).toContain("Supervisor");
    expect(result.action.title).toContain("Floor Layout & Shelf");
    expect(["Needs attention", "At risk"]).toContain(result.updatedStatus);
    expect(result.action.whyThisAction).toContain("walkthrough failed");
  });

  it("Multiple-Problem Test: Quality Floor takes precedence over hardware & pacing", () => {
    const multiPreset = DEMO_FEED_PRESETS.find((p) => p.id === "scenario-multi-problem")!;
    const adapted = adaptGoogleFormFeedRow(multiPreset.payload, initialCohort);

    const input: LoopExecutionInput = {
      hire: baseHire,
      dayNumber: 3,
      workSignal: adapted.workSignal,
      dailySignal: adapted.dailySignal,
      managerSignal: adapted.managerSignal,
    };

    const result = executeCoordinationLoop(input);

    // Accuracy is 91% (<95% threshold) despite scanner tool notes and pacing
    expect(result.pattern.category).toBe("Process");
    expect(result.pattern.patternName).toContain("Variant Differentiation");
    expect(result.action.targetCapabilityId).toBe(6); // DSP-06-VARIANT-CHECK
    expect(result.action.decisionType).toBe("supervisor_demo");
  });

  it("Training vs Work Test A: High Speed (56 UPH) does NOT override incomplete mandatory training", () => {
    const incompletePreset = DEMO_FEED_PRESETS.find((p) => p.id === "scenario-training-incomplete")!;
    const adapted = adaptGoogleFormFeedRow(incompletePreset.payload, initialCohort);

    const hireWithLowTraining = {
      ...baseHire,
      modulesCompleted: 2, // only 2 of 10 modules completed
    };

    const input: LoopExecutionInput = {
      hire: hireWithLowTraining,
      dayNumber: 2,
      workSignal: adapted.workSignal,
      dailySignal: adapted.dailySignal,
      managerSignal: adapted.managerSignal,
    };

    const result = executeCoordinationLoop(input);

    // Overall readiness must be capped (<= 85%) because mandatory training is incomplete
    expect(result.overallReadinessScore).toBeLessThanOrEqual(85);
    expect(result.action.decisionType).not.toBe("jump_ahead"); // Foundation training guard prevents premature jump
  });

  it("Training vs Work Test B: 100% Modules Complete does NOT equal readiness when floor work is weak", () => {
    const weakFloorPreset = DEMO_FEED_PRESETS.find((p) => p.id === "scenario-training-complete-weak")!;
    const adapted = adaptGoogleFormFeedRow(weakFloorPreset.payload, initialCohort);

    const hireWithFullTraining = {
      ...baseHire,
      modulesCompleted: 10, // 10/10 modules completed on LMS
    };

    const input: LoopExecutionInput = {
      hire: hireWithFullTraining,
      dayNumber: 5,
      workSignal: adapted.workSignal,
      dailySignal: adapted.dailySignal,
      managerSignal: adapted.managerSignal,
    };

    const result = executeCoordinationLoop(input);

    // Even with 10/10 training, poor floor execution (31 UPH, 92% acc) means NOT job ready
    expect(["Needs attention", "At risk"]).toContain(result.updatedStatus);
    expect(result.action.decisionType).toMatch(/supervisor_demo|reinforce_current/);
  });

  it("External Problem Test: Conveyor Breakdown diagnoses facility bottleneck with zero blame", () => {
    const externalPreset = DEMO_FEED_PRESETS.find((p) => p.id === "scenario-external-blocker")!;
    const adapted = adaptGoogleFormFeedRow(externalPreset.payload, initialCohort);

    const input: LoopExecutionInput = {
      hire: baseHire,
      dayNumber: 4,
      workSignal: adapted.workSignal,
      dailySignal: adapted.dailySignal,
      managerSignal: adapted.managerSignal,
    };

    const result = executeCoordinationLoop(input);

    expect(result.pattern.category).toBe("Environment");
    expect(result.pattern.patternName).toContain("Facility Bottleneck");
    expect(result.action.decisionType).toBe("no_action_monitor");
    expect(result.action.targetActor).toContain("Operations");
    expect(result.action.whyThisAction).toContain("External environmental disruption does not require capability retraining");
  });

  it("No-Evidence Test: Awaiting Telemetry observes without inventing fabricated diagnosis", () => {
    const noEvidencePreset = DEMO_FEED_PRESETS.find((p) => p.id === "scenario-no-evidence")!;
    const adapted = adaptGoogleFormFeedRow(noEvidencePreset.payload, initialCohort);

    const input: LoopExecutionInput = {
      hire: baseHire,
      dayNumber: 1,
      workSignal: adapted.workSignal,
      dailySignal: adapted.dailySignal,
      managerSignal: adapted.managerSignal,
    };

    const result = executeCoordinationLoop(input);

    expect(result.pattern.patternName).toContain("Awaiting Floor Work Telemetry");
    expect(result.action.decisionType).toBe("no_action_monitor");
    expect(result.action.whyThisAction).toContain("No evidence does not equal poor performance");
  });

  it("Day 10 Outcome: Proves Certified Job Ready vs Not Ready with Active Blocker", () => {
    const readyPreset = DEMO_FEED_PRESETS.find((p) => p.id === "scenario-day10-ready")!;
    const adaptedReady = adaptGoogleFormFeedRow(readyPreset.payload, initialCohort);

    // Hire with all capabilities demonstrated
    const readyHire = {
      ...baseHire,
      modulesCompleted: 10,
      capabilities: { ...baseHire.capabilities },
    };
    // mark core capabilities demonstrated
    Object.keys(readyHire.capabilities).forEach((k) => {
      readyHire.capabilities[Number(k)] = {
        capabilityId: Number(k),
        exposure: "reinforced",
        evidence: "demonstrated",
        performance: "on_target",
        mastery: "proficient",
        lastAssessedAt: "Day 10",
        reinforcementCount: 1,
      };
    });

    const readyInput: LoopExecutionInput = {
      hire: readyHire,
      dayNumber: 10,
      workSignal: adaptedReady.workSignal,
      dailySignal: adaptedReady.dailySignal,
      managerSignal: adaptedReady.managerSignal,
    };

    const readyResult = executeCoordinationLoop(readyInput);
    expect(readyResult.updatedStatus).toBe("Doing well");
    expect(readyResult.overallReadinessScore).toBeGreaterThanOrEqual(85);
    expect(readyResult.day10Evaluation?.isReady).toBe(true);
    expect(readyResult.day10Evaluation?.status).toBe("Job Ready");

    // Verify 7 criteria via evaluateDay10Outcome
    const readyEval = evaluateDay10Outcome(
      readyHire,
      adaptedReady.workSignal,
      adaptedReady.dailySignal,
      adaptedReady.managerSignal
    );
    expect(readyEval.isReady).toBe(true);
    expect(readyEval.status).toBe("Job Ready");
    expect(readyEval.unresolvedBlockers.length).toBe(0);

    // Unready case with active blockers
    const notReadyPreset = DEMO_FEED_PRESETS.find((p) => p.id === "scenario-day10-not-ready")!;
    const adaptedNotReady = adaptGoogleFormFeedRow(notReadyPreset.payload, initialCohort);

    const notReadyInput: LoopExecutionInput = {
      hire: baseHire,
      dayNumber: 10,
      workSignal: adaptedNotReady.workSignal,
      dailySignal: adaptedNotReady.dailySignal,
      managerSignal: adaptedNotReady.managerSignal,
    };

    const notReadyResult = executeCoordinationLoop(notReadyInput);
    expect(["Needs attention", "At risk"]).toContain(notReadyResult.updatedStatus);
    expect(notReadyResult.day10Evaluation?.isReady).toBe(false);
    expect(notReadyResult.day10Evaluation?.status).toBe("Not Ready");

    const notReadyEval = evaluateDay10Outcome(
      baseHire,
      adaptedNotReady.workSignal,
      adaptedNotReady.dailySignal,
      adaptedNotReady.managerSignal
    );
    expect(notReadyEval.isReady).toBe(false);
    expect(notReadyEval.status).toBe("Not Ready");
    expect(notReadyEval.unresolvedBlockers.length).toBeGreaterThan(0);
  });
});

describe("Step 11A — Overall Readiness Consistency Regression Tests", () => {
  const baseHire = initialRahul;

  it("Test A — Single readiness authority and Test C — Different metrics remain independent", () => {
    // Assert that the different metrics for baseHire (Rahul) are independent
    expect(baseHire.quizAverageScore).toBe(94); // Quiz Average
    expect(baseHire.overallReadinessScore).toBe(35); // Overall Readiness is 35
    expect(baseHire.daysHistory[0].workSignal?.accuracyRate).toBe(99); // Scan Accuracy is 99%
    expect(baseHire.daysHistory[0].workSignal?.actualPickRate).toBe(22); // Scan Rate (Pick speed) is 22

    // Prove that they are distinct values
    expect(baseHire.overallReadinessScore).not.toBe(baseHire.daysHistory[0].workSignal?.accuracyRate);
    expect(baseHire.overallReadinessScore).not.toBe(baseHire.quizAverageScore);
  });

  it("Test B — No artificial fallback in overall readiness calculation", () => {
    // If overallReadinessScore is not a number, but capabilities exist, we calculate dynamically via assessReadiness.
    // If capabilities are empty/unavailable, it should not invent a 74% or 65% fallback.
    const emptyHire = {
      ...baseHire,
      overallReadinessScore: undefined as any,
      capabilities: {}
    };
    const computedReadiness = assessReadiness(emptyHire.capabilities, emptyHire);
    // Calculated readiness for a profile with absolutely no capabilities completed must be 0 or dynamic, NEVER 74 or 65.
    expect(computedReadiness).not.toBe(74);
    expect(computedReadiness).not.toBe(65);
    expect(computedReadiness).toBe(0);
  });

  it("Test D — Intelligence unchanged (same-day divergence test)", () => {
    // Two hires on Day 3 with different evidence must still produce different intelligent outcomes.
    const presetNav = DEMO_FEED_PRESETS.find((p) => p.id === "scenario-1-navigation")!;
    const adaptedNav = adaptGoogleFormFeedRow(presetNav.payload, initialCohort);

    const inputNav: LoopExecutionInput = {
      hire: baseHire,
      dayNumber: 3,
      workSignal: adaptedNav.workSignal,
      dailySignal: adaptedNav.dailySignal,
      managerSignal: adaptedNav.managerSignal,
    };
    const resultNav = executeCoordinationLoop(inputNav);

    const presetScanner = DEMO_FEED_PRESETS.find((p) => p.id === "scenario-2-scanner-tool")!;
    const adaptedScanner = adaptGoogleFormFeedRow(presetScanner.payload, initialCohort);

    const inputScanner: LoopExecutionInput = {
      hire: baseHire,
      dayNumber: 3,
      workSignal: adaptedScanner.workSignal,
      dailySignal: adaptedScanner.dailySignal,
      managerSignal: adaptedScanner.managerSignal,
    };
    const resultScanner = executeCoordinationLoop(inputScanner);

    // Nav has a Spatial bottleneck, Scanner has a Tool bottleneck -> different outcomes!
    expect(resultNav.action.targetCapabilityId).not.toBe(resultScanner.action.targetCapabilityId);
    expect(resultNav.action.decisionType).toBe("reinforce_current");
    expect(resultScanner.action.decisionType).toBe("tool_remedy");
  });

  it("Test E — Closed loop unchanged", () => {
    // Verify that evidence -> intelligence -> recommendation -> intervention -> ActionOutcome -> re-evaluation works exactly as before.
    const recoveryPreset = DEMO_FEED_PRESETS.find((p) => p.id === "scenario-recovery-nav")!;
    const adapted = adaptGoogleFormFeedRow(recoveryPreset.payload, initialCohort);

    const input: LoopExecutionInput = {
      hire: baseHire,
      dayNumber: 4,
      workSignal: adapted.workSignal,
      dailySignal: adapted.dailySignal,
      managerSignal: adapted.managerSignal,
      actionOutcome: adapted.actionOutcome,
    };

    const result = executeCoordinationLoop(input);
    expect(result.updatedStatus).toBe("Doing well");
    expect(result.action.decisionType).toBe("advance_default");
    expect(result.updatedCapabilities[3].evidence).toBe("demonstrated");
  });
});
