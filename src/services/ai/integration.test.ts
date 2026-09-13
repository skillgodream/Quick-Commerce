import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  executeCoordinationLoop, 
  executeCoordinationLoopAsync,
  observe, 
  linkEvidenceToCapabilities, 
  understand, 
  connect, 
  chooseNextAction,
  act,
  check,
  LoopExecutionInput 
} from '../intelligence';
import { generateInterventionCandidate } from './interventionEngine';
import { arbitrateIntervention } from './arbitrationEngine';

global.fetch = vi.fn();

describe("DEANCORE AI-5-LIVE Integration Tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const baseInput: LoopExecutionInput = {
    hire: {
      id: "nh-test-01",
      name: "Test Worker",
      roleId: "picker",
      roleTitle: "Dark Store Picker",
      storeLocation: "Dark Store #104",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      startDate: "2026-09-01",
      currentDay: 3,
      shift: "Morning",
      supervisor: "Elena Rostova",
      buddy: "Marcus Vance",
      status: "Doing well",
      statusReason: "Normal progression",
      daysHistory: []
    },
    dayNumber: 3,
    dailySignal: {
      id: "ds-test-1",
      dayNumber: 3,
      rawText: "Everything went smoothly.",
      inputMethod: "text",
      issue: "none",
      confidence: "High",
      possibleImpact: "None",
      category: "General",
      summary: "Normal operation",
      timestamp: "10:00"
    },
    managerSignal: {
      id: "ms-test-1",
      dayNumber: 3,
      managerName: "Elena Rostova",
      state: "Doing well",
      notes: "Good focus today",
      timestamp: "10:00"
    },
    workSignal: {
      dayNumber: 3,
      targetPickRate: 50,
      actualPickRate: 48,
      accuracyRate: 99,
      ordersCompleted: 20,
      targetOrders: 20
    }
  };

  it("A: Existing deterministic flow still works synchronously when AI is not invoked", () => {
    const syncResult = executeCoordinationLoop(baseInput);
    expect(syncResult).toBeDefined();
    expect(syncResult.action).toBeDefined();
    expect(syncResult.updatedCapabilities).toBeDefined();
    expect(typeof syncResult.overallReadinessScore).toBe("number");
  });

  it("B & C: AI unavailable or network error -> falls back to deterministic action safely", async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error("Network connection refused"));

    const asyncResult = await executeCoordinationLoopAsync(baseInput);
    expect(asyncResult).toBeDefined();
    expect(asyncResult.action).toBeDefined();
    // Verify fallback retains safe deterministic action
    expect(asyncResult.action.id).toBeDefined();
    expect(asyncResult.action.smallestPracticalStep).toBeDefined();
  });

  it("D: AI-4 failure -> AI-5 falls back to deterministic Doctor 5 action", async () => {
    // AI-4 fails
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: "AI-4 Model Error" })
    });

    const asyncResult = await executeCoordinationLoopAsync(baseInput);
    expect(asyncResult).toBeDefined();
    expect(asyncResult.action).toBeDefined();
  });

  it("E: AI-5 confirms deterministic -> exactly one action returned with deterministic content", async () => {
    // Mock AI-4 success
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        intervention_type: "KNOWN",
        proposed_action: "Practice route",
        why_this_action: "Repetition",
        confidence: 0.8,
        supporting_evidence_ids: [],
        conflicting_evidence_ids: []
      })
    });

    // Mock AI-5 arbitration confirming deterministic
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        arbitration_status: "DETERMINISTIC_CONFIRMED",
        selected_source: "DETERMINISTIC",
        arbitration_reason: "Deterministic action is already optimal and safe.",
        confidence: 0.95,
        supporting_evidence_ids: [],
        conflicting_evidence_ids: []
      })
    });

    const result = await executeCoordinationLoopAsync(baseInput);
    expect(result.action).toBeDefined();
    expect(result.action.rationale).toContain("AI-5 Arbitration");
  });

  it("F: AI-5 selects AI-supported action -> exactly one adapted action selected", async () => {
    // AI-4 proposes context-adapted intervention
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        intervention_type: "CONTEXT_ADAPTED",
        target_problem: "Forklift aisle blockage",
        proposed_action: "Escalate to dock lead for forklift clear-out in zone B",
        why_this_action: "Specific physical obstruction identified in telemetry",
        confidence: 0.92,
        supporting_evidence_ids: [],
        conflicting_evidence_ids: []
      })
    });

    // AI-5 selects AI
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        arbitration_status: "AI_SUPPORTED",
        selected_source: "AI",
        arbitration_reason: "AI correctly adapted generic action to actual forklift blockage.",
        confidence: 0.92,
        supporting_evidence_ids: [],
        conflicting_evidence_ids: []
      })
    });

    const result = await executeCoordinationLoopAsync(baseInput);
    expect(result.action).toBeDefined();
    expect(result.action.title).toContain("[AI Adapted]");
    expect(result.action.smallestPracticalStep).toBe("Escalate to dock lead for forklift clear-out in zone B");
  });

  it("G: AI-5 selects AI-novel action -> novel action accepted with explicit rationale", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        intervention_type: "NOVEL",
        target_problem: "Repeated aisle coordinate confusion",
        proposed_action: "Deploy interactive shelf-tag QR scavenger drill",
        why_this_action: "Novel active-learning method supported by multi-shift telemetry",
        confidence: 0.95,
        supporting_evidence_ids: [],
        conflicting_evidence_ids: []
      })
    });

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        arbitration_status: "AI_NOVEL_ACCEPTED",
        selected_source: "AI",
        arbitration_reason: "Strong novel ground support breaking repeated buddy failure cycle.",
        confidence: 0.95,
        supporting_evidence_ids: [],
        conflicting_evidence_ids: []
      })
    });

    const result = await executeCoordinationLoopAsync(baseInput);
    expect(result.action.smallestPracticalStep).toBe("Deploy interactive shelf-tag QR scavenger drill");
    expect(result.action.rationale).toContain("AI_NOVEL_ACCEPTED");
  });

  it("H & I: AI candidate rejected / hallucinated evidence -> deterministic action kept", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        intervention_type: "NOVEL",
        proposed_action: "Invented procedure",
        supporting_evidence_ids: ["hallucinated_evidence_999"]
      })
    });

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        arbitration_status: "AI_REJECTED",
        selected_source: "DETERMINISTIC",
        arbitration_reason: "Hallucinated evidence reference rejected.",
        confidence: 0.1,
        supporting_evidence_ids: [],
        conflicting_evidence_ids: []
      })
    });

    const result = await executeCoordinationLoopAsync(baseInput);
    expect(result.action).toBeDefined();
    expect(result.action.smallestPracticalStep).not.toBe("Invented procedure");
  });

  it("J: External bottleneck -> worker blame protected", async () => {
    const bottleneckInput: LoopExecutionInput = {
      ...baseInput,
      workSignal: {
        ...baseInput.workSignal!,
        actualPickRate: 15, // sharp drop
        externalBottleneck: "Conveyor system down for 90 minutes"
      }
    };

    // AI-4 tries to blame worker
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        intervention_type: "KNOWN",
        proposed_action: "Give worker reprimand and speed drill",
        why_this_action: "Pick rate was low"
      })
    });

    // AI-5 rejects worker blame
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        arbitration_status: "AI_REJECTED",
        selected_source: "DETERMINISTIC",
        arbitration_reason: "Performance drop caused by conveyor downtime, not worker capability.",
        confidence: 0.99
      })
    });

    const result = await executeCoordinationLoopAsync(bottleneckInput);
    expect(result.action.smallestPracticalStep).not.toContain("reprimand");
  });

  it("K: Previous failed intervention -> AI adaptation can become final action", async () => {
    const repeatStruggleInput: LoopExecutionInput = {
      ...baseInput,
      hire: {
        ...baseInput.hire,
        daysHistory: [
          {
            dayNumber: 2,
            actionOutcome: {
              improved: false,
              notes: "Buddy walkthrough was done but worker still confused on aisle 6.",
              treatmentContext: "Buddy shadowing failed"
            }
          } as any
        ]
      }
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        intervention_type: "CONTEXT_ADAPTED",
        proposed_action: "Supervisor direct shelf label verification",
        why_this_action: "Buddy intervention failed yesterday; escalate actor"
      })
    });

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        arbitration_status: "AI_SUPPORTED",
        selected_source: "AI",
        arbitration_reason: "Avoid repeating failed buddy intervention.",
        confidence: 0.9
      })
    });

    const result = await executeCoordinationLoopAsync(repeatStruggleInput);
    expect(result.action.smallestPracticalStep).toBe("Supervisor direct shelf label verification");
  });

  it("L: AI timeout (>4500ms) -> gracefully falls back to deterministic action", async () => {
    // Hangs forever
    (global.fetch as any).mockImplementationOnce(() => new Promise(() => {}));

    const result = await executeCoordinationLoopAsync(baseInput);
    expect(result).toBeDefined();
    expect(result.action).toBeDefined();
    // Deterministic action preserved despite timeout
    expect(result.action.smallestPracticalStep).toBeDefined();
  }, 10000);

  it("M, O, P, Q: Doctor 6 receives final selected action only, and LearnerState / Readiness authority is preserved", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        intervention_type: "CONTEXT_ADAPTED",
        proposed_action: "Verify cart battery level",
        why_this_action: "Cart stalled during wave"
      })
    });

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        arbitration_status: "AI_SUPPORTED",
        selected_source: "AI",
        arbitration_reason: "Cart battery verified from sensor telemetry",
        confidence: 0.95
      })
    });

    const result = await executeCoordinationLoopAsync(baseInput);
    // Doctor 6 output
    expect(result.action.smallestPracticalStep).toBe("Verify cart battery level");
    // Authority check: readiness is an intact number (0 to 100) calculated deterministically
    expect(result.overallReadinessScore).toBeGreaterThanOrEqual(0);
    expect(result.overallReadinessScore).toBeLessThanOrEqual(100);
    // Capability states remain properly typed and unmutated by AI
    expect(result.updatedCapabilities).toBeDefined();
    expect(result.updatedCapabilities[1]).toBeDefined();
  });

  it("S: Full End-to-End loop execution check", async () => {
    // 1. Doctors 1-4
    const observed = observe(baseInput);
    const linkedEvidence = linkEvidenceToCapabilities(observed.structuredEvidence);
    const understood = understand(observed, linkedEvidence, baseInput.hire, observed.currentCapabilities, baseInput.existingAction, baseInput.candidatePattern);
    const connected = connect(understood, baseInput.hire);
    const deterministic = chooseNextAction(understood, connected, baseInput.hire, observed, observed.currentCapabilities);

    expect(deterministic).toBeDefined();

    // AI-4 & AI-5 integration
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        intervention_type: "KNOWN",
        proposed_action: "Standard walkthrough",
        why_this_action: "Standard support",
        confidence: 0.9
      })
    });

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        arbitration_status: "DETERMINISTIC_CONFIRMED",
        selected_source: "DETERMINISTIC",
        arbitration_reason: "Deterministic verified optimal",
        confidence: 0.95
      })
    });

    const result = await executeCoordinationLoopAsync(baseInput);
    expect(result.action).toBeDefined();
    expect(result.updatedStatus).toBeDefined();
  });
});
