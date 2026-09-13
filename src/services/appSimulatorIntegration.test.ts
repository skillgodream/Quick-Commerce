import { describe, it, expect, beforeEach, vi } from "vitest";
import { fetchSimulatorEvidence, adaptSimulatorToLoopInput } from "./simulatorEvidenceService";
import { executeCoordinationLoop, executeCoordinationLoopAsync, LoopExecutionInput } from "./intelligence";
import { initialRahul, initialCohort } from "../data/seedData";

describe("DEANCORE App Runtime Simulator Automatic Ingestion Integration", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("1. Automatic Fetch & Pipeline Delivery: Normal Check-in calculation automatically fetches Simulator evidence and reaches executeCoordinationLoopAsync", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: "ev-auto-01",
          employeeId: "emp-1",
          journeyDay: 3,
          category: "work_performance",
          performance: { productivity: 32, accuracy: 96 },
          toolSystem: { toolStatus: "Failed", toolProblem: "Scanner screen blank" },
        },
      ],
    } as Response);

    const baseInput: LoopExecutionInput = {
      hire: initialRahul,
      dayNumber: 3,
      workSignal: {
        dayNumber: 3,
        targetPickRate: 50,
        actualPickRate: 35,
        accuracyRate: 98,
        ordersCompleted: 44,
        targetOrders: 65,
      },
    };

    // Simulate updateHireAndRecalculateAsync behavior
    const simRes = await fetchSimulatorEvidence({
      employeeId: baseInput.hire.id,
      journeyDay: baseInput.dayNumber,
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("employeeId=EMP-001"),
      expect.anything()
    );
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("journeyDay=3"),
      expect.anything()
    );

    let finalInput = baseInput;
    if (simRes.success && simRes.evidence.length > 0) {
      finalInput = adaptSimulatorToLoopInput(baseInput, simRes.evidence[0]);
    }

    // Verify CanonicalEvidence reaches executeCoordinationLoopAsync
    expect(finalInput.canonicalEvidence?.toolSystem?.toolStatus).toBe("Failed");
    expect(finalInput.canonicalEvidence?.toolSystem?.toolProblem).toBe("Scanner screen blank");

    const result = await executeCoordinationLoopAsync(finalInput);
    expect(result.pattern).toBeDefined();
    expect(result.action).toBeDefined();
    expect(result.updatedStatus).toBeDefined();
  });

  it("2. Identity & Journey Day Preservation: Employee ID and Journey Day are preserved during ingestion", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: "ev-priya-d5",
          employeeId: "emp-2",
          journeyDay: 5,
          performance: { productivity: 42 },
        },
      ],
    } as Response);

    const simRes = await fetchSimulatorEvidence({
      employeeId: "nh-priya-02",
      journeyDay: 5,
    });

    expect(simRes.success).toBe(true);
    expect(simRes.evidence[0].employeeId).toBe("nh-priya-02");
    expect(simRes.evidence[0].journeyDay).toBe(5);
  });

  it("3. Fallback on Simulator Failure: Network or API failure falls back cleanly to existing local path", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Simulator offline"));

    const baseInput: LoopExecutionInput = {
      hire: initialRahul,
      dayNumber: 3,
      workSignal: {
        dayNumber: 3,
        targetPickRate: 50,
        actualPickRate: 35,
        accuracyRate: 98,
        ordersCompleted: 44,
        targetOrders: 65,
      },
    };

    let finalInput = baseInput;
    try {
      const simRes = await fetchSimulatorEvidence({
        employeeId: baseInput.hire.id,
        journeyDay: baseInput.dayNumber,
      });
      if (simRes.success && simRes.evidence.length > 0) {
        finalInput = adaptSimulatorToLoopInput(baseInput, simRes.evidence[0]);
      }
    } catch {
      // Fallback
    }

    // Unchanged baseInput
    expect(finalInput.canonicalEvidence).toBeUndefined();

    const result = await executeCoordinationLoopAsync(finalInput);
    expect(result.updatedStatus).toBeDefined();
    expect(result.overallReadinessScore).toBeGreaterThan(0);
  });

  it("4. Deduplication Protection: Batch deduplication prevents duplicate evidence within a single response payload", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: "ev-repeat-dedup-01",
          employeeId: "nh-rahul-01",
          journeyDay: 3,
          performance: { productivity: 38 },
        },
        {
          id: "ev-repeat-dedup-01",
          employeeId: "nh-rahul-01",
          journeyDay: 3,
          performance: { productivity: 38 },
        },
      ],
    } as Response);

    const simRes = await fetchSimulatorEvidence({ employeeId: "nh-rahul-01", journeyDay: 3 });
    expect(simRes.count).toBe(1);
  });

  it("5. Sequential Live Evidence Update Flow (A -> B -> C): Fresh Simulator evidence is fetched and processed on sequential reloads/re-syncs", async () => {
    const baseInput: LoopExecutionInput = {
      hire: initialRahul,
      dayNumber: 3,
      workSignal: {
        dayNumber: 3,
        targetPickRate: 50,
        actualPickRate: 35,
        accuracyRate: 98,
        ordersCompleted: 44,
        targetOrders: 65,
      },
    };

    // A. Initial load with Evidence A (Scanner Failed)
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: "ev-sim-101",
          employeeId: "nh-rahul-01",
          journeyDay: 3,
          toolSystem: { toolStatus: "Failed", toolProblem: "Scanner laser broken" },
        },
      ],
    } as Response);

    const resA = await fetchSimulatorEvidence({ employeeId: "nh-rahul-01", journeyDay: 3 });
    expect(resA.evidence[0].canonicalEvidence?.toolSystem?.toolProblem).toBe("Scanner laser broken");
    const inputA = adaptSimulatorToLoopInput(baseInput, resA.evidence[0]);
    const execA = executeCoordinationLoop(inputA);
    expect(execA.pattern).toBeDefined();

    // B. Simulator updated to Evidence B (New Tool Working)
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: "ev-sim-101",
          employeeId: "nh-rahul-01",
          journeyDay: 3,
          toolSystem: { toolStatus: "Working" },
          performance: { productivity: 48 },
        },
      ],
    } as Response);

    const resB = await fetchSimulatorEvidence({ employeeId: "nh-rahul-01", journeyDay: 3 });
    expect(resB.evidence[0].canonicalEvidence?.toolSystem?.toolStatus).toBe("Working");
    expect(resB.evidence[0].canonicalEvidence?.performance?.productivity).toBe(48);
    const inputB = adaptSimulatorToLoopInput(baseInput, resB.evidence[0]);
    const execB = executeCoordinationLoop(inputB);
    expect(execB.pattern).toBeDefined();

    // C. Simulator updated to Evidence C (Environmental bottleneck)
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: "ev-sim-101",
          employeeId: "nh-rahul-01",
          journeyDay: 3,
          environment: { workloadCondition: "Severe congestion in aisle 4" },
        },
      ],
    } as Response);

    const resC = await fetchSimulatorEvidence({ employeeId: "nh-rahul-01", journeyDay: 3 });
    expect(resC.evidence[0].canonicalEvidence?.environment?.workloadCondition).toBe("Severe congestion in aisle 4");
    const inputC = adaptSimulatorToLoopInput(baseInput, resC.evidence);
    const execC = executeCoordinationLoop(inputC);
    expect(execC.pattern).toBeDefined();
  });

  it("6. END-TO-END VERIFICATION TEST: Priya Day 4 multi-record collection and sequential edits (Productivity 50 -> Accuracy 99 -> Tool Intermittent -> Productivity 70)", async () => {
    const priyaHire = initialCohort.find((h) => h.id === "nh-priya-02") || initialCohort[1];
    const priyaBaseInput: LoopExecutionInput = {
      hire: priyaHire,
      dayNumber: 4,
      workSignal: { dayNumber: 4, targetPickRate: 60, actualPickRate: 40, accuracyRate: 95, ordersCompleted: 50, targetOrders: 70 },
    };

    // Step 1: Save Day 4 with Productivity = 50, Accuracy = 96, Tool = Normal across multiple evidence records
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: "ev-priya-d4-prod",
          employeeId: "EMP-002",
          journeyDay: 4,
          performance: { productivity: 50, accuracy: 96 },
        },
        {
          id: "ev-priya-d4-tool",
          employeeId: "EMP-002",
          journeyDay: 4,
          toolSystem: { toolStatus: "Working", toolProblem: "Normal operation" },
        },
      ],
    } as Response);

    const resA = await fetchSimulatorEvidence({ employeeId: "nh-priya-02", journeyDay: 4 });
    expect(resA.success).toBe(true);
    expect(resA.evidence.length).toBe(2);
    const inputA = adaptSimulatorToLoopInput(priyaBaseInput, resA.evidence);
    expect(inputA.workSignal.actualPickRate).toBe(50);
    expect(inputA.workSignal.accuracyRate).toBe(96);
    expect(inputA.canonicalEvidence?.toolSystem?.toolStatus).toBe("Working");

    // Step 2: Change ONLY Accuracy = 99 and Save
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: "ev-priya-d4-prod",
          employeeId: "EMP-002",
          journeyDay: 4,
          performance: { productivity: 50, accuracy: 99 },
        },
        {
          id: "ev-priya-d4-tool",
          employeeId: "EMP-002",
          journeyDay: 4,
          toolSystem: { toolStatus: "Working", toolProblem: "Normal operation" },
        },
      ],
    } as Response);

    const resB = await fetchSimulatorEvidence({ employeeId: "nh-priya-02", journeyDay: 4 });
    const inputB = adaptSimulatorToLoopInput(priyaBaseInput, resB.evidence);
    expect(inputB.workSignal.actualPickRate).toBe(50); // Retained
    expect(inputB.workSignal.accuracyRate).toBe(99);   // Updated
    expect(inputB.canonicalEvidence?.toolSystem?.toolStatus).toBe("Working");

    // Step 3: Change ONLY Tool Status = Intermittent (Failed) and Save
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: "ev-priya-d4-prod",
          employeeId: "EMP-002",
          journeyDay: 4,
          performance: { productivity: 50, accuracy: 99 },
        },
        {
          id: "ev-priya-d4-tool",
          employeeId: "EMP-002",
          journeyDay: 4,
          toolSystem: { toolStatus: "Failed", toolProblem: "Intermittent scanner dropouts" },
        },
      ],
    } as Response);

    const resC = await fetchSimulatorEvidence({ employeeId: "nh-priya-02", journeyDay: 4 });
    const inputC = adaptSimulatorToLoopInput(priyaBaseInput, resC.evidence);
    expect(inputC.workSignal.actualPickRate).toBe(50); // Retained
    expect(inputC.workSignal.accuracyRate).toBe(99);   // Retained
    expect(inputC.canonicalEvidence?.toolSystem?.toolStatus).toBe("Failed"); // Updated

    // Step 4: Change Productivity = 70 and Save
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: "ev-priya-d4-prod",
          employeeId: "EMP-002",
          journeyDay: 4,
          performance: { productivity: 70, accuracy: 99 },
        },
        {
          id: "ev-priya-d4-tool",
          employeeId: "EMP-002",
          journeyDay: 4,
          toolSystem: { toolStatus: "Failed", toolProblem: "Intermittent scanner dropouts" },
        },
      ],
    } as Response);

    const resD = await fetchSimulatorEvidence({ employeeId: "nh-priya-02", journeyDay: 4 });
    const inputD = adaptSimulatorToLoopInput(priyaBaseInput, resD.evidence);
    expect(inputD.workSignal.actualPickRate).toBe(70); // Updated
    expect(inputD.workSignal.accuracyRate).toBe(99);   // Retained
    expect(inputD.canonicalEvidence?.toolSystem?.toolStatus).toBe("Failed"); // Retained

    // Step 5: Refresh / re-fetch both - latest complete state remains intact
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: "ev-priya-d4-prod",
          employeeId: "EMP-002",
          journeyDay: 4,
          performance: { productivity: 70, accuracy: 99 },
        },
        {
          id: "ev-priya-d4-tool",
          employeeId: "EMP-002",
          journeyDay: 4,
          toolSystem: { toolStatus: "Failed", toolProblem: "Intermittent scanner dropouts" },
        },
      ],
    } as Response);

    const resRefresh = await fetchSimulatorEvidence({ employeeId: "nh-priya-02", journeyDay: 4 });
    const inputRefresh = adaptSimulatorToLoopInput(priyaBaseInput, resRefresh.evidence);
    expect(inputRefresh.workSignal.actualPickRate).toBe(70);
    expect(inputRefresh.workSignal.accuracyRate).toBe(99);
    expect(inputRefresh.canonicalEvidence?.toolSystem?.toolStatus).toBe("Failed");
  });

  it("7. SECOND EMPLOYEE & DAY ISOLATION TEST: Sneha / EMP-004 / Day 3 multi-metric evidence ingestion", async () => {
    const snehaHire = initialCohort.find((h) => h.id === "nh-sneha-04") || initialCohort[3];
    const snehaBaseInput: LoopExecutionInput = {
      hire: snehaHire,
      dayNumber: 3,
      workSignal: { dayNumber: 3, targetPickRate: 55, actualPickRate: 35, accuracyRate: 92, ordersCompleted: 35, targetOrders: 55 },
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: "ev-sneha-d3-perf",
          employeeId: "EMP-004",
          journeyDay: 3,
          performance: { productivity: 68, targetProductivity: 60, accuracy: 97 },
        },
        {
          id: "ev-sneha-d3-supp",
          employeeId: "EMP-004",
          journeyDay: 3,
          support: { helpRequests: 1, supervisorAssistance: true },
        },
      ],
    } as Response);

    const resSneha = await fetchSimulatorEvidence({ employeeId: "nh-sneha-04", journeyDay: 3 });
    expect(resSneha.success).toBe(true);
    expect(resSneha.evidence[0].employeeId).toBe("nh-sneha-04");
    expect(resSneha.evidence[0].journeyDay).toBe(3);

    const inputSneha = adaptSimulatorToLoopInput(snehaBaseInput, resSneha.evidence);
    expect(inputSneha.workSignal?.actualPickRate).toBe(68);
    expect(inputSneha.workSignal?.targetPickRate).toBe(60);
    expect(inputSneha.workSignal?.accuracyRate).toBe(97);
    expect(inputSneha.canonicalEvidence?.support?.helpRequests).toBe(1);
    expect(inputSneha.canonicalEvidence?.support?.supervisorAssistance).toBe(true);
  });

  it("8. CORE DATA-SOURCE RULE INVARIANT TEST: Delete/Reset returns empty evidence array -> Check-in has NO evidence for that employee/day", async () => {
    const priyaHire = initialCohort.find((h) => h.id === "nh-priya-02") || initialCohort[1];
    const priyaBaseInput: LoopExecutionInput = {
      hire: priyaHire,
      dayNumber: 4,
      workSignal: undefined,
    };

    // Case B & D: Empty evidence returned from Simulator API
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as Response);

    const resReset = await fetchSimulatorEvidence({ employeeId: "nh-priya-02", journeyDay: 4 });
    expect(resReset.success).toBe(true);
    expect(resReset.evidence.length).toBe(0);

    const inputReset = adaptSimulatorToLoopInput(priyaBaseInput, resReset.evidence);
    expect(inputReset.workSignal).toBeUndefined();
    expect(inputReset.canonicalEvidence).toBeUndefined();

    // Verify DEANCORE handles undefined evidence safely without errors
    const loopResult = await executeCoordinationLoopAsync(inputReset);
    expect(loopResult).toBeDefined();
    expect(loopResult.updatedStatus).toBeDefined();
  });
});
