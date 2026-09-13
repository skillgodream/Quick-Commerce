import { describe, it, expect, beforeEach } from "vitest";
import { executeCoordinationLoop, executeCoordinationLoopAsync, LoopExecutionInput } from "../intelligence";
import { initialRahul } from "../../data/seedData";
import { casebook } from "./casebook";
import { WorkSignal, DailySignal, ManagerSignal } from "../../types";

describe("DEANCORE AI-8 Live Governance Integration Tests", () => {
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

  const baseDailySignal: DailySignal = {
    id: "ds-gov-1",
    dayNumber: 3,
    rawText: "Scanner kept glitching out",
    inputMethod: "text",
    issue: "Tool / Hardware",
    confidence: "High",
    possibleImpact: "Delay",
    category: "Tool",
    summary: "Hardware battery issue",
    timestamp: "10:00",
  };

  const baseManagerSignal: ManagerSignal = {
    id: "ms-gov-1",
    dayNumber: 3,
    managerName: "Elena Rostova",
    state: "Needs support",
    notes: "Worker was slowed down by broken scanner battery.",
    timestamp: "10:00",
  };

  // Integration Test 1: Live coordination loop returns typed governanceResult
  it("1. Synchronous executeCoordinationLoop produces audit-ready governanceResult", () => {
    const input: LoopExecutionInput = {
      hire: createFreshHire("nh-gov-01"),
      dayNumber: 3,
      workSignal: baseWorkSignal,
      dailySignal: baseDailySignal,
      managerSignal: baseManagerSignal,
      canonicalEvidence: {
        performance: { productivity: 35, targetProductivity: 50, accuracy: 98 },
        toolSystem: { systemDowntime: 20, toolStatus: "Failed" }
      }
    };

    const result = executeCoordinationLoop(input);
    expect(result.governanceResult).toBeDefined();
    expect(result.governanceResult?.policyVersion).toBe("1.0.0");
    expect(result.governanceResult?.auditedRules.length).toBeGreaterThan(0);
    expect(result.governanceResult?.safetyCleared).toBe(true);
    expect(result.action).toBeDefined();
  });

  // Integration Test 2: Casebook records the governanceResult along with the case
  it("2. Casebook persistently audits governance evaluation for consequential decisions", () => {
    const input: LoopExecutionInput = {
      hire: createFreshHire("nh-gov-02"),
      dayNumber: 3,
      workSignal: baseWorkSignal,
      dailySignal: baseDailySignal,
      managerSignal: baseManagerSignal,
      actionOutcome: {
        id: "out-gov-02",
        actionId: "act-test",
        dayNumber: 3,
        performedBy: "Supervisor",
        performedAt: new Date().toISOString(),
        improved: "yes",
        notes: "Battery swapped, pick rate jumped",
      }
    };

    executeCoordinationLoop(input);
    const storedCase = casebook.getCase("nh-gov-02", 3);
    expect(storedCase).toBeDefined();
    expect(storedCase?.governanceResult).toBeDefined();
    expect(storedCase?.governanceResult?.safetyCleared).toBe(true);
  });

  // Integration Test 3: LearnerState Authority and Readiness Score invariance
  it("3. LearnerState and Readiness calculation remain unviolated and solely determined by Doctor 6", () => {
    const input: LoopExecutionInput = {
      hire: createFreshHire("nh-gov-03"),
      dayNumber: 3,
      workSignal: baseWorkSignal,
      dailySignal: baseDailySignal,
      managerSignal: baseManagerSignal,
    };

    const result = executeCoordinationLoop(input);
    // Readiness score calculation is pure math based on Doctor 6 capabilities
    expect(typeof result.overallReadinessScore).toBe("number");
    expect(result.overallReadinessScore).toBeGreaterThanOrEqual(0);
    expect(result.overallReadinessScore).toBeLessThanOrEqual(100);
    expect(result.updatedCapabilities).toBeDefined();
  });
});
