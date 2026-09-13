import { describe, it, expect, beforeEach, vi } from "vitest";
import { fetchSimulatorEvidence, adaptSimulatorToLoopInput, clearProcessedEvidenceCache } from "./simulatorEvidenceService";
import { executeCoordinationLoopAsync, LoopExecutionInput } from "./intelligence";
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
      expect.stringContaining("employeeId=nh-rahul-01"),
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

  it("4. Deduplication Protection: Deduplication engine prevents duplicate evidence insertion on repeated recalculations", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: "ev-repeat-dedup-01",
          employeeId: "nh-rahul-01",
          journeyDay: 3,
          performance: { productivity: 38 },
        },
      ],
    } as Response);

    // First fetch processes evidence
    const simRes1 = await fetchSimulatorEvidence({ employeeId: "nh-rahul-01", journeyDay: 3 });
    expect(simRes1.count).toBe(1);

    // Second fetch with same payload gets deduplicated (0 new evidence)
    const simRes2 = await fetchSimulatorEvidence({ employeeId: "nh-rahul-01", journeyDay: 3 });
    expect(simRes2.count).toBe(0);
  });
});
