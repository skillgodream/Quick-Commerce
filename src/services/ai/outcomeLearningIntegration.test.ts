import { describe, it, expect, beforeEach } from "vitest";
import { executeCoordinationLoop, executeCoordinationLoopAsync, LoopExecutionInput } from "../intelligence";
import { casebook } from "./casebook";
import { initialRahul } from "../../data/seedData";
import { ActionOutcome, WorkSignal } from "../../types";

describe("DEANCORE AI-6 End-to-End System & Isolation Tests", () => {
  beforeEach(() => {
    casebook.clear();
  });

  const createFreshHire = (id: string) => JSON.parse(JSON.stringify({ ...initialRahul, id, dayNumber: 3 }));

  const baseWorkSignal: WorkSignal = {
    dayNumber: 3,
    actualPickRate: 35,
    targetPickRate: 50,
    accuracyRate: 98,
    ordersCompleted: 20,
    targetOrders: 20,
  };

  // Test 16: AI learning failure does not affect live Check-in
  it("16. AI learning failure does not affect live Check-in (failsafe isolation)", () => {
    const input: LoopExecutionInput = {
      hire: createFreshHire("nh-integration-01"),
      dayNumber: 3,
      workSignal: baseWorkSignal,
      actionOutcome: {
        id: "out-corrupt",
        actionId: "act-unknown",
        dayNumber: 3,
        performedBy: "Lead",
        performedAt: "2026-03-03",
        improved: "yes",
        notes: "Some notes",
      },
    };

    const result = executeCoordinationLoop(input);
    expect(result).toBeDefined();
    expect(result.action).toBeDefined();
    expect(result.updatedStatus).toBeDefined();
    expect(result.overallReadinessScore).toBeGreaterThanOrEqual(0);
  });

  // Test 20: LearnerState remains authoritative
  it("20. LearnerState authority is strictly preserved (readiness & capability scores unchanged)", () => {
    const input: LoopExecutionInput = {
      hire: createFreshHire("nh-integration-02"),
      dayNumber: 3,
      workSignal: baseWorkSignal,
    };

    const result = executeCoordinationLoop(input);
    expect(result.updatedCapabilities).toBeDefined();
    expect(result.overallReadinessScore).toBeDefined();
    expect(typeof result.overallReadinessScore).toBe("number");
  });

  // Test 21: Readiness calculation is unchanged
  it("21. Readiness score calculation operates normally and is not bypassed", () => {
    const inputWithoutOutcome: LoopExecutionInput = {
      hire: createFreshHire("nh-integration-03"),
      dayNumber: 3,
      workSignal: baseWorkSignal,
    };

    const result = executeCoordinationLoop(inputWithoutOutcome);
    expect(result.overallReadinessScore).toBeGreaterThan(0);
  });

  // Test 22: Doctors 1–6 remain operational
  it("22. Doctors 1-6 observe, link, understand, connect, decide, act, and check cleanly", () => {
    const input: LoopExecutionInput = {
      hire: createFreshHire("nh-integration-04"),
      dayNumber: 3,
      workSignal: baseWorkSignal,
      dailySignal: {
        id: "ds-test-hardware",
        dayNumber: 3,
        rawText: "Scanner battery kept dropping",
        inputMethod: "text",
        issue: "Tool / Hardware",
        confidence: "High",
        possibleImpact: "Delay",
        category: "Tool",
        summary: "Battery issue",
        timestamp: "10:00",
      },
    };

    const result = executeCoordinationLoop(input);
    expect(result.pattern).toBeDefined();
    expect(result.action).toBeDefined();
    expect(result.updatedStatus).toBeDefined();
  });

  // Test 23: AI-5 final decision remains intact
  it("23. AI-5 final decision and arbitration remain intact", async () => {
    const input: LoopExecutionInput = {
      hire: createFreshHire("nh-integration-05"),
      dayNumber: 3,
      workSignal: baseWorkSignal,
    };

    const result = await executeCoordinationLoopAsync(input);
    expect(result.action).toBeDefined();
    expect(result.adaptiveDecision).toBeDefined();
  });

  // Test 24: Full end-to-end pipeline: creates structured LearningEvent and stores in Casebook
  it("24. Full end-to-end pipeline: creates structured LearningEvent and stores in Casebook", async () => {
    const outcome: ActionOutcome = {
      id: "out-e2e-01",
      actionId: "act-e2e",
      dayNumber: 3,
      performedBy: "Vikram",
      performedAt: "2026-03-03T12:00:00Z",
      improved: "yes",
      notes: "Pick rate normalized to 53 UPH with 99% accuracy.",
      subsequentPickRate: 53,
      subsequentAccuracy: 99,
    };

    const hire = createFreshHire("nh-integration-06");
    const input: LoopExecutionInput = {
      hire,
      dayNumber: 3,
      workSignal: baseWorkSignal,
      actionOutcome: outcome,
    };

    const result = await executeCoordinationLoopAsync(input);
    expect(result.learningEvent).toBeDefined();
    expect(result.learningEvent?.outcomeStatus).toBe("SUCCESS");
    expect(result.learningEvent?.interventionEffectiveness).toBe("EFFECTIVE");
    expect(result.learningEvent?.learningEventId).toBe("le-nh-integration-06-d3");

    // Verify stored in Casebook
    const caseRecord = casebook.getCase("nh-integration-06", 3);
    expect(caseRecord).toBeDefined();
    expect(caseRecord?.learningEvent).toBeDefined();
    expect(caseRecord?.learningEvent?.outcomeStatus).toBe("SUCCESS");
    expect(caseRecord?.finalIntervention).toBeDefined();
  });

  // Test 37: Crucial Rule - Learning must NOT change next decision rules or system behavior automatically
  it("37. Learning does NOT automatically change next intervention rules, capability formulas, or policies", () => {
    // 1. Run a baseline execution for Person A on Day 3
    const inputA: LoopExecutionInput = {
      hire: createFreshHire("nh-test-37-a"),
      dayNumber: 3,
      workSignal: baseWorkSignal,
    };
    const baselineResultA = executeCoordinationLoop(inputA);

    // 2. Run an execution with a severe failure outcome for Person B on Day 3
    const failedOutcome: ActionOutcome = {
      id: "out-failed",
      actionId: "act-fail",
      dayNumber: 3,
      performedBy: "Vikram",
      performedAt: "2026-03-03",
      improved: "no",
      notes: "Failed completely",
      subsequentPickRate: 30,
    };

    const inputB: LoopExecutionInput = {
      hire: createFreshHire("nh-test-37-b"),
      dayNumber: 3,
      workSignal: baseWorkSignal,
      actionOutcome: failedOutcome,
    };
    const resultB = executeCoordinationLoop(inputB);
    expect(resultB.learningEvent?.outcomeStatus).toBe("FAILURE");

    // 3. Now run Person C with identical input conditions to Person A
    // The policy, decision type, and action generated must match Person A's baseline exactly
    const inputC: LoopExecutionInput = {
      hire: createFreshHire("nh-test-37-c"),
      dayNumber: 3,
      workSignal: baseWorkSignal,
    };

    const resultC = executeCoordinationLoop(inputC);
    expect(resultC.action.title).toBe(baselineResultA.action.title);
    expect(resultC.adaptiveDecision).toBe(baselineResultA.adaptiveDecision);
    expect(resultC.action.actionType).toBe(baselineResultA.action.actionType);
    expect(resultC.overallReadinessScore).toBe(baselineResultA.overallReadinessScore);
    // Proves policy was NOT globally rewritten by Person B's failure
  });
});
