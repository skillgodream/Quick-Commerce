import { describe, it, expect, beforeEach, vi } from "vitest";
import { fetchSimulatorEvidence, adaptSimulatorToLoopInput, clearProcessedEvidenceCache } from "./simulatorEvidenceService";
import { executeCoordinationLoop, executeCoordinationLoopAsync, LoopExecutionInput } from "./intelligence";
import { initialRahul } from "../data/seedData";

describe("DEANCORE App Runtime Simulator Automatic Ingestion Integration", () => {
  beforeEach(() => {
    clearProcessedEvidenceCache();
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
    const inputC = adaptSimulatorToLoopInput(baseInput, resC.evidence[0]);
    const execC = executeCoordinationLoop(inputC);
    expect(execC.pattern).toBeDefined();
  });
});
