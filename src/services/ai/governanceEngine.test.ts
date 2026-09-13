import { describe, it, expect, beforeEach } from "vitest";
import { governDecision } from "./governanceEngine";
import { 
  GovernanceEvaluationInput, 
  CURRENT_GOVERNANCE_POLICY_VERSION 
} from "./governanceTypes";
import { DecidedAction, UnderstoodDiagnosis, ObservedSignals } from "../intelligence";
import { initialRahul } from "../../data/seedData";
import { casebook } from "./casebook";
import { SnapshotEvidenceItem } from "../../types";

describe("DEANCORE AI-8 Governance & Policy Authority Tests", () => {
  beforeEach(() => {
    casebook.clear();
  });

  const baseEvidence: SnapshotEvidenceItem[] = [
    {
      id: "ev-work-uph",
      category: "work_performance",
      titleEn: "Pick Rate Telemetry",
      titleHi: "Pick Rate",
      metricValue: "35 UPH",
      contextTextEn: "Target 50",
      contextTextHi: "Target 50",
      iconName: "TrendingUp",
      themeColor: "amber",
      priorityWeight: 80,
    },
    {
      id: "ev-mgr-obs",
      category: "environment_problem",
      titleEn: "Supervisor Floor Walk",
      titleHi: "Supervisor Walk",
      metricValue: "Struggle noted",
      contextTextEn: "Observed hesitation in aisles 4-8",
      contextTextHi: "Observed hesitation",
      iconName: "UserCheck",
      themeColor: "blue",
      priorityWeight: 60,
    },
  ];

  const baseObserved: ObservedSignals = {
    hasWorkEvidence: true,
    currentPickRate: 35,
    targetPickRate: 50,
    accuracy: 98,
    speedGap: 15,
    workerReportsConfusion: false,
    workerReportsTool: false,
    workerReportsVariant: false,
    workerReportsCommunication: false,
    workerReportsExternalBottleneck: false,
    helpRequestsCount: 0,
    workerChronicHelpDependency: false,
    managerObservesSupport: false,
    managerObservesStruggle: true,
    managerObservesAccuracy: false,
    managerObservesSpeed: true,
    previousInterventionFailed: false,
    previousInterventionPartial: false,
    structuredEvidence: baseEvidence,
    currentCapabilities: JSON.parse(JSON.stringify(initialRahul.capabilities)),
  };

  const baseDiagnosis: UnderstoodDiagnosis = {
    rootCause: "environment_spatial",
    targetCapId: 2,
    diagnosisText: "Spatial & Rack Coordinate Navigation friction",
    patternCategory: "Environment",
    patternName: "Aisle Navigation Delay",
  };

  const baseDeterministicAction: DecidedAction = {
    decisionType: "buddy_support",
    targetCapId: 2,
    targetActor: "Buddy (Senior Picker)",
    urgency: "Next Shift",
    actionTitle: "Buddy Walkthrough of Aisles 4-8",
    actionDesc: "Pair with Senior Picker for 15 minutes of guided rack navigation.",
    practicalStep: "Spend 15 mins walking Aisles 4-8 before peak order rush.",
    decisionRationale: "Doctor 5 deterministic action.",
    interimStatus: "Needs attention",
    interimStatusReason: "Targeted buddy intervention",
  };

  const baseInput: GovernanceEvaluationInput = {
    hire: JSON.parse(JSON.stringify(initialRahul)),
    dayNumber: 3,
    observed: baseObserved,
    availableEvidenceItems: baseEvidence,
    diagnosis: baseDiagnosis,
    deterministicAction: baseDeterministicAction,
    arbitrationResult: {
      arbitration_status: "DETERMINISTIC_CONFIRMED",
      selected_source: "DETERMINISTIC",
      arbitration_reason: "Standard baseline confirm",
      supporting_evidence_ids: ["ev-work-uph"],
      conflicting_evidence_ids: [],
      confidence: 0.9,
    },
    proposedFinalAction: baseDeterministicAction,
  };

  // 1. Safety Override (Highest Priority)
  it("1. Safety Override: Prohibits actions violating warehouse safety constraints", () => {
    const unsafeAction: DecidedAction = {
      ...baseDeterministicAction,
      actionTitle: "Speed up and run in warehouse to hit target rate",
      actionDesc: "Instruct worker to run in warehouse between aisles.",
      practicalStep: "Run in warehouse aisles without regard to safety lanes.",
    };

    const result = governDecision({
      ...baseInput,
      proposedFinalAction: unsafeAction,
    });

    expect(result.safetyCleared).toBe(false);
    expect(result.governanceVerdict).toBe("REJECTED");
    expect(result.riskTier).toBe("CRITICAL");
    expect(result.rejectedReasons.length).toBeGreaterThan(0);
    expect(result.governedAction.actionTitle).toContain("SAFETY OVERRIDE");
    expect(result.governedAction.targetActor).toBe("Shift Safety Lead");
  });

  // 2. Worker-Blame Protection
  it("2. Worker-Blame Protection: Prevents penalizing worker when external tool/system downtime exists", () => {
    const externalConstraintEvidence: SnapshotEvidenceItem[] = [
      ...baseEvidence,
      {
        id: "ev-tool-downtime",
        category: "tool_problem",
        titleEn: "Scanner Network Down",
        titleHi: "Network Down",
        metricValue: "25 min downtime",
        contextTextEn: "Scanner down for 25 minutes",
        contextTextHi: "Scanner down",
        iconName: "Wrench",
        themeColor: "rose",
        priorityWeight: 90,
      }
    ];

    // Dean/AI mistakenly attempts to diagnose capability practice or disciplinary warning
    const blamingDiagnosis: UnderstoodDiagnosis = {
      ...baseDiagnosis,
      rootCause: "capability_practice",
    };

    const blamingAction: DecidedAction = {
      ...baseDeterministicAction,
      decisionType: "reinforce_current",
      actionTitle: "Written Performance Warning for Slow Speed",
      actionDesc: "Penalize worker for failing to meet 50 UPH target.",
      practicalStep: "Issue formal speed reprimand.",
    };

    const result = governDecision({
      ...baseInput,
      availableEvidenceItems: externalConstraintEvidence,
      canonicalEvidence: {
        toolSystem: {
          systemDowntime: 25,
          toolStatus: "Failed",
        }
      },
      diagnosis: blamingDiagnosis,
      proposedFinalAction: blamingAction,
    });

    expect(result.workerBlameProtected).toBe(true);
    expect(result.governedAction.actionTitle).toContain("Hardware & Station Diagnostics Verification");
    expect(result.governedAction.targetActor).toContain("IT Support");
    expect(result.governedAction.decisionRationale).toContain("Worker-blame protection enforced");
  });

  // 3. Evidence Sufficiency: Insufficient evidence causes ABSTAIN
  it("3. Evidence Sufficiency: Insufficient evidence forces ABSTAIN verdict", () => {
    const emptyObserved: ObservedSignals = {
      ...baseObserved,
      hasWorkEvidence: false,
      currentPickRate: 0,
      structuredEvidence: [],
    };

    const result = governDecision({
      ...baseInput,
      observed: emptyObserved,
      availableEvidenceItems: [],
    });

    expect(result.evidenceSufficiency).toBe("INSUFFICIENT");
    expect(result.governanceVerdict).toBe("ABSTAIN");
    expect(result.governedAction.actionTitle).toContain("Evidence Verification");
  });

  // 4. Conflicting Evidence Governance
  it("4. Conflicting Evidence: Correctly classifies conflicting signals without silent resolution", () => {
    const conflictingResult = governDecision({
      ...baseInput,
      arbitrationResult: {
        ...baseInput.arbitrationResult,
        arbitration_status: "CONFLICT",
        arbitration_reason: "Manager reports speed struggle but worker reports terminal lockup",
      },
    });

    expect(conflictingResult.evidenceSufficiency).toBe("CONFLICTING");
    const conflictAudit = conflictingResult.auditedRules.find(r => r.ruleCode === "EVIDENCE_CONFLICTING");
    expect(conflictAudit).toBeDefined();
    expect(conflictAudit?.passed).toBe(false);
  });

  // 5. Evidence Grounding & Traceability: Flags ungrounded / hallucinated IDs
  it("5. Evidence Grounding: Flags hallucinated evidence IDs and enforces deterministic fallback", () => {
    const result = governDecision({
      ...baseInput,
      arbitrationResult: {
        ...baseInput.arbitrationResult,
        supporting_evidence_ids: ["ev-hallucinated-999"],
      },
    });

    expect(result.traceableEvidenceIds).not.toContain("ev-hallucinated-999");
    const groundingAudit = result.auditedRules.find(r => r.ruleCode === "EVIDENCE_UNGROUNDED");
    expect(groundingAudit?.passed).toBe(false);
    expect(groundingAudit?.description).toContain("ev-hallucinated-999");
  });

  // 6. AI Novelty Governance: Novel interventions require human approval if confidence < 0.85
  it("6. AI Novelty Governance: Unverified novel interventions mandate REQUIRE_HUMAN_APPROVAL", () => {
    const novelAction: DecidedAction = {
      ...baseDeterministicAction,
      actionTitle: "[AI Adapted] Experimental Bin Re-Mapping Protocol",
    };

    const result = governDecision({
      ...baseInput,
      proposedFinalAction: novelAction,
      aiCandidate: {
        intervention_type: "NOVEL",
        target_problem: "Aisle congestion",
        proposed_action: "Rearrange pick path dynamically",
        why_this_action: "Experimental AI proposal",
        expected_effect: "Improved speed",
        required_evidence: ["ev-work-uph"],
        supporting_evidence_ids: ["ev-work-uph"],
        conflicting_evidence_ids: [],
        confidence: 0.65, // Below 0.85 threshold
      },
      arbitrationResult: {
        ...baseInput.arbitrationResult,
        arbitration_status: "AI_NOVEL_ACCEPTED",
      },
    });

    expect(result.requiresHumanApproval).toBe(true);
    expect(result.governanceVerdict).toBe("REQUIRE_HUMAN_APPROVAL");
    expect(result.humanApprovalReason).toContain("Novel intervention proposed without high-tier evidence");
  });

  // 7. Systemic Escalation: Technical hardware breakdown requires facility/IT escalation
  it("7. Escalation: Facility equipment or severe system downtime triggers REQUIRE_ESCALATION", () => {
    const result = governDecision({
      ...baseInput,
      canonicalEvidence: {
        toolSystem: {
          systemDowntime: 45,
          toolStatus: "Failed",
        },
      },
    });

    expect(result.requiresEscalation).toBe(true);
    expect(result.governanceVerdict).toBe("REQUIRE_ESCALATION");
    expect(result.escalationTarget).toBe("IT / Facility Operations");
    expect(result.escalationReason).toContain("45m");
  });

  // 8. Repeated Failure Gatekeeper: Historical failures in Casebook mandate human sign-off
  it("8. Repeated Failure Gatekeeper: Multiple historical failures in Casebook trigger human approval", () => {
    // Record 2 previous failures in Casebook for this learner
    casebook.recordCase({
      caseId: `case-${initialRahul.id}-d1`,
      employeeId: initialRahul.id,
      employeeName: initialRahul.name,
      journeyDay: 1,
      timestamp: new Date().toISOString(),
      initialState: { status: "Needs attention", statusReason: "Speed" },
      evidenceItems: baseEvidence,
      deterministicDiagnosis: baseDiagnosis,
      deterministicAction: baseDeterministicAction,
      finalIntervention: {
        id: "act-1",
        dayNumber: 1,
        title: "Walkthrough 1",
        actionType: "buddy_walkthrough",
        targetActor: "Buddy (Senior Picker)",
        urgency: "Next Shift",
        description: "Walkthrough",
        smallestPracticalStep: "Step",
        status: "completed",
        createdAt: new Date().toISOString(),
      },
      outcome: {
        id: "out-1",
        actionId: "act-1",
        dayNumber: 1,
        performedBy: "Buddy",
        performedAt: new Date().toISOString(),
        improved: "no",
        notes: "No change in speed",
      },
      learningEvent: {
        learningEventId: "le-1",
        caseId: `case-${initialRahul.id}-d1`,
        employeeId: initialRahul.id,
        journeyDay: 1,
        createdAt: new Date().toISOString(),
        initialState: { status: "Needs attention", statusReason: "Speed" },
        evidenceIds: ["ev-work-uph"],
        diagnosis: { rootCause: "environment_spatial", targetCapId: 2, patternCategory: "tool", patternName: "Tool", diagnosisText: "Diag" },
        deterministicAction: { title: "D", decisionType: "D", targetActor: "A", practicalStep: "P", rationale: "R" },
        selectedIntervention: { actionId: "act-1", title: "Walkthrough 1", actionType: "buddy_walkthrough", targetActor: "Buddy", smallestPracticalStep: "Step" },
        outcomeStatus: "FAILURE",
        interventionEffectiveness: "INEFFECTIVE",
        evidenceQuality: "HIGH",
        evidenceConfidence: 0.9,
        outcomeConfidence: 0.9,
        patternConfidence: 0.8,
        repeatedProblem: false,
        interventionRepeated: false,
        interventionChanged: false,
        isRepeatedFailure: false,
        isInterventionDecay: false,
        isProblemMigration: false,
        learningSignals: [],
        insights: [],
        requiresReview: false,
      }
    });

    casebook.recordCase({
      caseId: `case-${initialRahul.id}-d2`,
      employeeId: initialRahul.id,
      employeeName: initialRahul.name,
      journeyDay: 2,
      timestamp: new Date().toISOString(),
      initialState: { status: "Needs attention", statusReason: "Speed" },
      evidenceItems: baseEvidence,
      deterministicDiagnosis: baseDiagnosis,
      deterministicAction: baseDeterministicAction,
      finalIntervention: {
        id: "act-2",
        dayNumber: 2,
        title: "Walkthrough 2",
        actionType: "buddy_walkthrough",
        targetActor: "Buddy (Senior Picker)",
        urgency: "Next Shift",
        description: "Walkthrough",
        smallestPracticalStep: "Step",
        status: "completed",
        createdAt: new Date().toISOString(),
      },
      outcome: {
        id: "out-2",
        actionId: "act-2",
        dayNumber: 2,
        performedBy: "Buddy",
        performedAt: new Date().toISOString(),
        improved: "no",
        notes: "No change in speed",
      },
      learningEvent: {
        learningEventId: "le-2",
        caseId: `case-${initialRahul.id}-d2`,
        employeeId: initialRahul.id,
        journeyDay: 2,
        createdAt: new Date().toISOString(),
        initialState: { status: "Needs attention", statusReason: "Speed" },
        evidenceIds: ["ev-work-uph"],
        diagnosis: { rootCause: "environment_spatial", targetCapId: 2, patternCategory: "tool", patternName: "Tool", diagnosisText: "Diag" },
        deterministicAction: { title: "D", decisionType: "D", targetActor: "A", practicalStep: "P", rationale: "R" },
        selectedIntervention: { actionId: "act-2", title: "Walkthrough 2", actionType: "buddy_walkthrough", targetActor: "Buddy", smallestPracticalStep: "Step" },
        outcomeStatus: "FAILURE",
        interventionEffectiveness: "INEFFECTIVE",
        evidenceQuality: "HIGH",
        evidenceConfidence: 0.9,
        outcomeConfidence: 0.9,
        patternConfidence: 0.8,
        repeatedProblem: true,
        interventionRepeated: true,
        interventionChanged: false,
        isRepeatedFailure: true,
        isInterventionDecay: false,
        isProblemMigration: false,
        learningSignals: [],
        insights: [],
        requiresReview: true,
      }
    });

    const result = governDecision(baseInput);

    expect(result.requiresHumanApproval).toBe(true);
    expect(result.riskTier).toBe("HIGH");
    expect(result.humanApprovalReason).toContain("Repeated intervention failure observed across 2 historical episodes");
  });

  // 9. Fault Tolerance & Deterministic Fallback: AI Timeout enforces fallback
  it("9. AI Timeout / Unavailable: Gracefully enforces deterministic Doctor 5 action", () => {
    const result = governDecision({
      ...baseInput,
      isAiTimeoutOrUnavailable: true,
      proposedFinalAction: {
        ...baseDeterministicAction,
        actionTitle: "[AI Proposed] Stale unverified proposal",
      },
    });

    expect(result.governedAction.actionTitle).toBe(baseDeterministicAction.actionTitle);
    const fallbackAudit = result.auditedRules.find(r => r.ruleCode === "DETERMINISTIC_FALLBACK_ENFORCED");
    expect(fallbackAudit).toBeDefined();
    expect(fallbackAudit?.description).toContain("timeout/unavailability");
  });

  // 10. Policy Versioning & Immutability Audit
  it("10. Policy Versioning: Adheres to CURRENT_GOVERNANCE_POLICY_VERSION and verifies policy immutability", () => {
    const result = governDecision(baseInput);

    expect(result.policyVersion).toBe(CURRENT_GOVERNANCE_POLICY_VERSION);
    expect(result.policyVersion).toBe("1.0.0");
    const immutabilityAudit = result.auditedRules.find(r => r.ruleCode === "LONGITUDINAL_POLICY_DRIFT_BLOCKED");
    expect(immutabilityAudit).toBeDefined();
    expect(immutabilityAudit?.passed).toBe(true);
  });
});
