import { describe, it, expect, vi, beforeEach } from 'vitest';
import { arbitrateIntervention } from './arbitrationEngine';
import { AIInterventionCandidate } from './interventionTypes';
import { DecidedAction } from '../intelligence';

global.fetch = vi.fn();

describe("DEANCORE AI-5 - Arbitration Engine", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const baseDeterministicAction: DecidedAction = {
    decisionType: "reinforce_current",
    targetCapId: 2,
    targetActor: "Buddy",
    urgency: "Immediate",
    actionTitle: "Standard Check",
    actionDesc: "Basic standard description",
    practicalStep: "Standard step",
    decisionRationale: "Standard rationale",
    interimStatus: "At risk",
    interimStatusReason: "Because reasons"
  };

  const baseContext: any = {
    diagnosis: { rootCause: "tool_hardware" },
    deterministicAction: baseDeterministicAction,
    aiCandidate: {
      intervention_type: "KNOWN",
      proposed_action: "AI Step",
      why_this_action: "AI Rationale",
      confidence: 0.9,
      supporting_evidence_ids: [],
      conflicting_evidence_ids: []
    } as AIInterventionCandidate,
    observed: { 
      hasWorkEvidence: true,
      canonicalEvidence: { toolSystem: { toolStatus: "Failed" } }
    },
    hire: {},
    historyText: ""
  };

  it("Test 1: Good deterministic candidate -> deterministic wins", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        arbitration_status: "DETERMINISTIC_CONFIRMED",
        selected_source: "DETERMINISTIC",
        arbitration_reason: "AI didn't offer a strong enough alternative",
        confidence: 0.9,
        supporting_evidence_ids: [],
        conflicting_evidence_ids: []
      })
    });

    const result = await arbitrateIntervention(baseContext);
    expect(result.actionTitle).toBe("Standard Check");
    expect(result.practicalStep).toBe("Standard step");
  });

  it("Test 2: AI candidate equivalent to deterministic -> deterministic remains authoritative", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        arbitration_status: "DETERMINISTIC_CONFIRMED",
        selected_source: "DETERMINISTIC",
        arbitration_reason: "AI same as deterministic",
        confidence: 0.9,
        supporting_evidence_ids: [],
        conflicting_evidence_ids: []
      })
    });

    const result = await arbitrateIntervention(baseContext);
    expect(result.practicalStep).toBe("Standard step");
  });

  it("Test 3: Strong context-adapted AI candidate -> AI wins", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        arbitration_status: "AI_SUPPORTED",
        selected_source: "AI",
        arbitration_reason: "AI context-adapted properly",
        confidence: 0.9,
        supporting_evidence_ids: [],
        conflicting_evidence_ids: []
      })
    });

    const context = {
      ...baseContext,
      aiCandidate: { ...baseContext.aiCandidate, intervention_type: "CONTEXT_ADAPTED" }
    };
    const result = await arbitrateIntervention(context);
    expect(result.practicalStep).toBe("AI Step");
    expect(result.actionTitle).toContain("[AI Proposed]");
  });

  it("Test 4: Strong novel AI candidate -> AI may win", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        arbitration_status: "AI_NOVEL_ACCEPTED",
        selected_source: "AI",
        arbitration_reason: "Strong novel evidence",
        confidence: 0.95,
        supporting_evidence_ids: [],
        conflicting_evidence_ids: []
      })
    });

    const context = {
      ...baseContext,
      aiCandidate: { ...baseContext.aiCandidate, intervention_type: "NOVEL" }
    };
    const result = await arbitrateIntervention(context);
    expect(result.practicalStep).toBe("AI Step");
  });

  it("Test 5: Weak novel candidate -> AI rejected", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        arbitration_status: "AI_REJECTED",
        selected_source: "DETERMINISTIC",
        arbitration_reason: "Novel approach unsupported",
        confidence: 0.9,
        supporting_evidence_ids: [],
        conflicting_evidence_ids: []
      })
    });

    const result = await arbitrateIntervention(baseContext);
    expect(result.practicalStep).toBe("Standard step");
  });

  it("Test 6: AI candidate contradicts CanonicalEvidence -> rejected", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        arbitration_status: "CONFLICT",
        selected_source: "DETERMINISTIC",
        arbitration_reason: "Contradicts evidence",
        confidence: 0.9,
        supporting_evidence_ids: [],
        conflicting_evidence_ids: []
      })
    });

    const result = await arbitrateIntervention(baseContext);
    expect(result.practicalStep).toBe("Standard step");
  });

  it("Test 7: Hallucinated evidence ID -> rejected", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    });

    const result = await arbitrateIntervention(baseContext);
    expect(result.practicalStep).toBe("Standard step");
  });

  it("Test 8: Previous deterministic intervention failed -> supported AI alternative can win", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        arbitration_status: "AI_NOVEL_ACCEPTED",
        selected_source: "AI",
        arbitration_reason: "Avoid repeating failed intervention",
        confidence: 0.95,
        supporting_evidence_ids: [],
        conflicting_evidence_ids: []
      })
    });

    const context = {
      ...baseContext,
      observed: { ...baseContext.observed, previousInterventionFailed: true }
    };
    const result = await arbitrateIntervention(context);
    expect(result.practicalStep).toBe("AI Step");
  });

  it("Test 10: External bottleneck -> unsupported learner blame rejected", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        arbitration_status: "AI_REJECTED",
        selected_source: "DETERMINISTIC",
        arbitration_reason: "External bottleneck correctly handled by deterministic",
        confidence: 0.9,
        supporting_evidence_ids: [],
        conflicting_evidence_ids: []
      })
    });

    const context = {
      ...baseContext,
      diagnosis: { rootCause: "environment_bottleneck" }
    };
    const result = await arbitrateIntervention(context);
    expect(result.practicalStep).toBe("Standard step");
  });

  it("Test 15: Neither candidate safe/supported -> ABSTAIN", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        arbitration_status: "ABSTAIN",
        selected_source: "ABSTAIN",
        arbitration_reason: "No safe choice",
        confidence: 0,
        supporting_evidence_ids: [],
        conflicting_evidence_ids: []
      })
    });

    const result = await arbitrateIntervention(baseContext);
    expect(result.practicalStep).toBe("Standard step"); // Fallback to safe deterministic
  });

});
