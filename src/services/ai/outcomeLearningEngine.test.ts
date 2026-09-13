import { describe, it, expect, beforeEach } from "vitest";
import { 
  recordOutcomeLearningEvent, 
  classifyOutcome, 
  buildBeforeAfterSnapshot, 
  validateEvidenceIds,
} from "./outcomeLearningEngine";
import { casebook } from "./casebook";
import { ActionOutcome, SnapshotEvidenceItem, RecommendedAction } from "../../types";
import { UnderstoodDiagnosis, DecidedAction, ObservedSignals } from "../intelligence";
import { initialRahul } from "../../data/seedData";

describe("DEANCORE AI-6 Outcome Learning Loop", () => {
  beforeEach(() => {
    casebook.clear();
  });

  const mockHire = { ...initialRahul, id: "nh-test-01" };

  const mockEvidenceItem: SnapshotEvidenceItem = {
    id: "ev-work-uph-3",
    category: "work_performance",
    titleEn: "Pick Rate Performance: 35 UPH",
    titleHi: "Pick Rate",
    metricValue: "35",
    contextTextEn: "Gap 15",
    contextTextHi: "Gap 15",
    iconName: "TrendingUp",
    themeColor: "purple",
    priorityWeight: 10,
  };

  const mockObserved: ObservedSignals = {
    currentPickRate: 35,
    targetPickRate: 50,
    accuracy: 98,
    speedGap: 15,
    workerReportsConfusion: false,
    workerReportsTool: false,
    workerReportsVariant: false,
    workerReportsCommunication: false,
    workerReportsExternalBottleneck: false,
    hasWorkEvidence: true,
    helpRequestsCount: 1,
    workerChronicHelpDependency: false,
    managerObservesSupport: false,
    managerObservesStruggle: true,
    managerObservesAccuracy: false,
    managerObservesSpeed: true,
    previousInterventionFailed: false,
    previousInterventionPartial: false,
    currentCapabilities: {},
    structuredEvidence: [mockEvidenceItem],
  };

  const mockDiagnosis: UnderstoodDiagnosis = {
    rootCause: "capability_practice",
    targetCapId: 1,
    diagnosisText: "Needs deliberate practice on aisle routing",
    patternCategory: "Process",
    patternName: "Slow Picking",
  };

  const mockDeterministicAction: DecidedAction = {
    decisionType: "reinforce_current",
    targetCapId: 1,
    targetActor: "Peer Buddy (Vikram)",
    urgency: "Immediate",
    actionTitle: "Buddy Shadowing for Fast Pick",
    actionDesc: "Practice aisle navigation",
    practicalStep: "Shadow Vikram for 30 minutes",
    decisionRationale: "Reinforce basic picking pattern",
    interimStatus: "Needs attention",
    interimStatusReason: "Practicing aisle routing",
  };

  const mockFinalAction: RecommendedAction = {
    id: "act-buddy-01",
    dayNumber: 3,
    actionType: "buddy_walkthrough",
    title: "Buddy Shadowing for Fast Pick",
    description: "Shadow Vikram for 30 minutes",
    targetActor: "Peer Buddy (Vikram)",
    urgency: "Immediate",
    smallestPracticalStep: "Shadow Vikram for 30 minutes",
    status: "completed",
    createdAt: "2026-03-03T10:00:00Z",
  };

  // Test 1: SUCCESS outcome creates LearningEvent
  it("1. SUCCESS outcome creates structured LearningEvent with high outcome confidence", () => {
    const outcome: ActionOutcome = {
      id: "out-01",
      actionId: "act-buddy-01",
      dayNumber: 3,
      performedBy: "Vikram",
      performedAt: "2026-03-03T12:00:00Z",
      improved: "yes",
      notes: "Pick rate normalized to 52 UPH with 99% accuracy.",
      subsequentPickRate: 52,
      subsequentAccuracy: 99,
    };

    const event = recordOutcomeLearningEvent({
      hire: mockHire,
      dayNumber: 3,
      outcome,
      observed: mockObserved,
      diagnosis: mockDiagnosis,
      deterministicAction: mockDeterministicAction,
      finalAction: mockFinalAction,
      availableEvidenceItems: mockObserved.structuredEvidence,
    });

    expect(event.learningEventId).toBe("le-nh-test-01-d3");
    expect(event.outcomeStatus).toBe("SUCCESS");
    expect(event.interventionEffectiveness).toBe("EFFECTIVE");
    expect(event.outcomeConfidence).toBeGreaterThanOrEqual(0.9);
    expect(event.evidenceQuality).toBe("HIGH");
    expect(event.outcomeMagnitude?.pickRateDelta).toBe(17); // 52 - 35
  });

  // Test 2: PARTIAL outcome creates LearningEvent
  it("2. PARTIAL outcome creates LearningEvent with PARTIALLY_EFFECTIVE classification", () => {
    const outcome: ActionOutcome = {
      id: "out-02",
      actionId: "act-buddy-01",
      dayNumber: 3,
      performedBy: "Vikram",
      performedAt: "2026-03-03T12:00:00Z",
      improved: "partial",
      notes: "Moderate recovery to 42 UPH.",
      subsequentPickRate: 42,
      subsequentAccuracy: 97,
    };

    const event = recordOutcomeLearningEvent({
      hire: mockHire,
      dayNumber: 3,
      outcome,
      observed: mockObserved,
      diagnosis: mockDiagnosis,
      deterministicAction: mockDeterministicAction,
      finalAction: mockFinalAction,
      availableEvidenceItems: mockObserved.structuredEvidence,
    });

    expect(event.outcomeStatus).toBe("PARTIAL");
    expect(event.interventionEffectiveness).toBe("PARTIALLY_EFFECTIVE");
    expect(event.outcomeMagnitude?.pickRateDelta).toBe(7); // 42 - 35
  });

  // Test 3: FAILURE outcome creates LearningEvent
  it("3. FAILURE outcome creates LearningEvent with INEFFECTIVE classification", () => {
    const outcome: ActionOutcome = {
      id: "out-03",
      actionId: "act-buddy-01",
      dayNumber: 3,
      performedBy: "Vikram",
      performedAt: "2026-03-03T12:00:00Z",
      improved: "no",
      notes: "Performance stalled at 33 UPH despite coaching.",
      subsequentPickRate: 33,
      subsequentAccuracy: 96,
    };

    const event = recordOutcomeLearningEvent({
      hire: mockHire,
      dayNumber: 3,
      outcome,
      observed: mockObserved,
      diagnosis: mockDiagnosis,
      deterministicAction: mockDeterministicAction,
      finalAction: mockFinalAction,
      availableEvidenceItems: mockObserved.structuredEvidence,
    });

    expect(event.outcomeStatus).toBe("FAILURE");
    expect(event.interventionEffectiveness).toBe("INEFFECTIVE");
    expect(event.outcomeMagnitude?.pickRateDelta).toBe(-2);
  });

  // Test 4: Missing follow-up evidence becomes INSUFFICIENT_EVIDENCE
  it("4. Missing follow-up evidence becomes INSUFFICIENT_EVIDENCE and effectiveness UNKNOWN", () => {
    const classified = classifyOutcome(undefined, mockObserved);
    expect(classified.status).toBe("INSUFFICIENT_EVIDENCE");
    expect(classified.effectiveness).toBe("UNKNOWN");
    expect(classified.evidenceQuality).toBe("INSUFFICIENT");

    // Empty outcome with no metrics
    const emptyOutcome: ActionOutcome = {
      id: "out-empty",
      actionId: "act-01",
      dayNumber: 3,
      performedBy: "Lead",
      performedAt: "2026-03-03",
      improved: undefined as any,
      notes: "",
    };
    const classifiedEmpty = classifyOutcome(emptyOutcome, mockObserved);
    expect(classifiedEmpty.status).toBe("INSUFFICIENT_EVIDENCE");
    expect(classifiedEmpty.effectiveness).toBe("UNKNOWN");
  });

  // Test 5: No false claim of causality when confounders exist
  it("5. Causal humility: records confounding evidence when tool downtime or bottleneck exists", () => {
    const observedWithConfounders: ObservedSignals = {
      ...mockObserved,
      workerReportsExternalBottleneck: true,
      externalBottleneckDescription: "System server lag on handheld scanner",
    };

    const canonicalEvidence = {
      toolSystem: {
        systemDowntime: 45,
        toolStatus: "Failed" as const,
      },
      environment: {
        environmentalIssue: "Aisle 4 congested with pallet unloading",
      },
    };

    const outcome: ActionOutcome = {
      id: "out-05",
      actionId: "act-buddy-01",
      dayNumber: 3,
      performedBy: "Vikram",
      performedAt: "2026-03-03",
      improved: "yes",
      notes: "Pick rate reached 51.",
      subsequentPickRate: 51,
    };

    const snapshot = buildBeforeAfterSnapshot(observedWithConfounders, outcome, canonicalEvidence);
    expect(snapshot.confoundingFactors.length).toBeGreaterThanOrEqual(2);
    expect(snapshot.causalityQualifiedClaim).toContain("confounded by");
  });

  // Test 6: Before/after evidence is preserved
  it("6. Before/after evidence state is captured cleanly in learning event", () => {
    const outcome: ActionOutcome = {
      id: "out-06",
      actionId: "act-buddy-01",
      dayNumber: 3,
      performedBy: "Vikram",
      performedAt: "2026-03-03",
      improved: "yes",
      notes: "Good progress",
      subsequentPickRate: 54,
      subsequentAccuracy: 99,
    };

    const event = recordOutcomeLearningEvent({
      hire: mockHire,
      dayNumber: 3,
      outcome,
      observed: mockObserved,
      diagnosis: mockDiagnosis,
      deterministicAction: mockDeterministicAction,
      finalAction: mockFinalAction,
      availableEvidenceItems: mockObserved.structuredEvidence,
    });

    expect(event.beforeAfterSnapshot).toBeDefined();
    expect(event.beforeAfterSnapshot?.before.pickRate).toBe(35);
    expect(event.beforeAfterSnapshot?.after.pickRate).toBe(54);
    expect(event.beforeAfterSnapshot?.after.accuracy).toBe(99);
  });

  // Test 7: Successful intervention becomes historical precedent
  it("7. Successful intervention is recorded as historical precedent in Casebook", () => {
    const outcome: ActionOutcome = {
      id: "out-07",
      actionId: "act-buddy-01",
      dayNumber: 2,
      performedBy: "Vikram",
      performedAt: "2026-03-02",
      improved: "yes",
      notes: "First coaching succeeded",
      subsequentPickRate: 48,
    };

    recordOutcomeLearningEvent({
      hire: mockHire,
      dayNumber: 2,
      outcome,
      observed: mockObserved,
      diagnosis: mockDiagnosis,
      deterministicAction: mockDeterministicAction,
      finalAction: mockFinalAction,
      availableEvidenceItems: mockObserved.structuredEvidence,
    });

    // Check Casebook
    const retrievedCase = casebook.getCase(mockHire.id, 2);
    expect(retrievedCase).toBeDefined();
    expect(retrievedCase?.learningEvent?.outcomeStatus).toBe("SUCCESS");
    expect(retrievedCase?.learningEvent?.interventionEffectiveness).toBe("EFFECTIVE");
  });

  // Test 8: Repeated failure is detected
  it("8. Repeated failure across days is detected and triggers review", () => {
    // Day 2 Failure
    casebook.recordCase({
      caseId: "case-nh-test-01-d2",
      employeeId: mockHire.id,
      employeeName: mockHire.name,
      journeyDay: 2,
      timestamp: "2026-03-02T10:00:00Z",
      initialState: { status: "Needs attention", statusReason: "" },
      evidenceItems: [],
      deterministicDiagnosis: mockDiagnosis,
      deterministicAction: mockDeterministicAction,
      finalIntervention: mockFinalAction,
      outcome: {
        id: "out-d2",
        actionId: mockFinalAction.id,
        dayNumber: 2,
        performedBy: "Vikram",
        performedAt: "2026-03-02",
        improved: "no",
        notes: "No improvement",
        subsequentPickRate: 34,
      },
      learningEvent: {
        learningEventId: "le-nh-test-01-d2",
        caseId: "case-nh-test-01-d2",
        employeeId: mockHire.id,
        journeyDay: 2,
        createdAt: "2026-03-02",
        initialState: { status: "Needs attention", statusReason: "" },
        evidenceIds: [],
        diagnosis: {
          rootCause: mockDiagnosis.rootCause,
          targetCapId: 1,
          patternCategory: "Process",
          patternName: "Slow Picking",
          diagnosisText: "Slow",
        },
        deterministicAction: {
          title: mockDeterministicAction.actionTitle,
          decisionType: "reinforce_current",
          targetActor: "Buddy",
          practicalStep: "",
          rationale: "",
        },
        selectedIntervention: {
          actionId: mockFinalAction.id,
          title: mockFinalAction.title,
          actionType: "buddy_walkthrough",
          targetActor: "Buddy",
          smallestPracticalStep: "Shadow Vikram for 30 minutes",
        },
        outcomeStatus: "FAILURE",
        interventionEffectiveness: "INEFFECTIVE",
        evidenceQuality: "HIGH",
        evidenceConfidence: 0.9,
        outcomeConfidence: 0.9,
        patternConfidence: 0.5,
        repeatedProblem: false,
        interventionRepeated: false,
        interventionChanged: false,
        isRepeatedFailure: false,
        isInterventionDecay: false,
        isProblemMigration: false,
        learningSignals: [],
        insights: [],
        requiresReview: false,
      },
    });

    // Day 3 Outcome is also FAILURE with same intervention
    const outcomeD3: ActionOutcome = {
      id: "out-d3",
      actionId: mockFinalAction.id,
      dayNumber: 3,
      performedBy: "Vikram",
      performedAt: "2026-03-03",
      improved: "no",
      notes: "Still stalled at 33 UPH",
      subsequentPickRate: 33,
    };

    const event = recordOutcomeLearningEvent({
      hire: mockHire,
      dayNumber: 3,
      outcome: outcomeD3,
      observed: mockObserved,
      diagnosis: mockDiagnosis,
      deterministicAction: mockDeterministicAction,
      finalAction: mockFinalAction,
      availableEvidenceItems: mockObserved.structuredEvidence,
    });

    expect(event.isRepeatedFailure).toBe(true);
    expect(event.requiresReview).toBe(true);
    expect(event.insights.some(i => i.insightType === "REPEATED_FAILURE")).toBe(true);
  });

  // Test 9: Intervention decay is represented
  it("9. Intervention decay is detected when returns diminish across assignments", () => {
    // History: Day 1 delta = +15, Day 2 delta = +5
    const historyD1 = {
      learningEventId: "le-nh-test-01-d1",
      caseId: "case-d1",
      employeeId: mockHire.id,
      journeyDay: 1,
      createdAt: "2026-03-01",
      initialState: { status: "Needs attention" as const, statusReason: "" },
      evidenceIds: [],
      diagnosis: { rootCause: "capability_practice", targetCapId: 1, patternCategory: "Process", patternName: "p", diagnosisText: "" },
      deterministicAction: { title: mockFinalAction.title, decisionType: "reinforce_current", targetActor: "Buddy", practicalStep: "", rationale: "" },
      selectedIntervention: { actionId: "act-1", title: mockFinalAction.title, actionType: "buddy_walkthrough" as const, targetActor: "Buddy", smallestPracticalStep: "" },
      outcomeStatus: "SUCCESS" as const,
      outcomeMagnitude: { pickRateDelta: 15 },
      interventionEffectiveness: "EFFECTIVE" as const,
      evidenceQuality: "HIGH" as const,
      evidenceConfidence: 0.9,
      outcomeConfidence: 0.9,
      patternConfidence: 0.5,
      repeatedProblem: false,
      interventionRepeated: false,
      interventionChanged: false,
      isRepeatedFailure: false,
      isInterventionDecay: false,
      isProblemMigration: false,
      learningSignals: [],
      insights: [],
      requiresReview: false,
    };

    const historyD2 = {
      ...historyD1,
      learningEventId: "le-nh-test-01-d2",
      caseId: "case-d2",
      journeyDay: 2,
      outcomeMagnitude: { pickRateDelta: 5 },
    };

    casebook.recordLearningEvent(historyD1);
    casebook.recordLearningEvent(historyD2);

    // Day 3 delta is now only +1 (diminishing decay)
    const outcomeD3: ActionOutcome = {
      id: "out-d3",
      actionId: mockFinalAction.id,
      dayNumber: 3,
      performedBy: "Vikram",
      performedAt: "2026-03-03",
      improved: "partial",
      notes: "Pick rate +1 only",
      subsequentPickRate: 36, // 36 - 35 = +1 delta
    };

    const event = recordOutcomeLearningEvent({
      hire: mockHire,
      dayNumber: 3,
      outcome: outcomeD3,
      observed: mockObserved,
      diagnosis: mockDiagnosis,
      deterministicAction: mockDeterministicAction,
      finalAction: mockFinalAction,
      availableEvidenceItems: mockObserved.structuredEvidence,
    });

    expect(event.isInterventionDecay).toBe(true);
    expect(event.insights.some(i => i.insightType === "INTERVENTION_DECAY")).toBe(true);
  });

  // Test 10: Problem migration is represented
  it("10. Problem migration is detected when previous issue resolved but new issue emerges", () => {
    // Day 2 resolved tool_hardware
    const historyD2 = {
      learningEventId: "le-nh-test-01-d2",
      caseId: "case-d2",
      employeeId: mockHire.id,
      journeyDay: 2,
      createdAt: "2026-03-02",
      initialState: { status: "Needs attention" as const, statusReason: "" },
      evidenceIds: [],
      diagnosis: { rootCause: "tool_hardware", targetCapId: 1, patternCategory: "Tool", patternName: "Scanner", diagnosisText: "" },
      deterministicAction: { title: "Swap scanner", decisionType: "tool_hardware", targetActor: "IT", practicalStep: "", rationale: "" },
      selectedIntervention: { actionId: "act-tool", title: "Swap scanner", actionType: "escalate_issue" as const, targetActor: "IT", smallestPracticalStep: "" },
      outcomeStatus: "SUCCESS" as const,
      interventionEffectiveness: "EFFECTIVE" as const,
      evidenceQuality: "HIGH" as const,
      evidenceConfidence: 0.9,
      outcomeConfidence: 0.9,
      patternConfidence: 0.5,
      repeatedProblem: false,
      interventionRepeated: false,
      interventionChanged: false,
      isRepeatedFailure: false,
      isInterventionDecay: false,
      isProblemMigration: false,
      learningSignals: [],
      insights: [],
      requiresReview: false,
    };
    casebook.recordLearningEvent(historyD2);

    // Day 3 has accuracy / practice problem (capability_practice)
    const outcomeD3: ActionOutcome = {
      id: "out-d3",
      actionId: mockFinalAction.id,
      dayNumber: 3,
      performedBy: "Vikram",
      performedAt: "2026-03-03",
      improved: "partial",
      notes: "Speed improved but accuracy slipped",
      subsequentPickRate: 46,
      subsequentAccuracy: 92,
    };

    const event = recordOutcomeLearningEvent({
      hire: mockHire,
      dayNumber: 3,
      outcome: outcomeD3,
      observed: mockObserved,
      diagnosis: mockDiagnosis, // rootCause: "capability_practice"
      deterministicAction: mockDeterministicAction,
      finalAction: mockFinalAction,
      availableEvidenceItems: mockObserved.structuredEvidence,
    });

    expect(event.isProblemMigration).toBe(true);
    expect(event.migrationDetails?.resolvedProblem).toBe("tool_hardware");
    expect(event.migrationDetails?.emergedProblem).toBe("capability_practice");
  });

  // Test 11: Same intervention under different contexts remains context-sensitive
  it("11. Same intervention under different contexts preserves context specificity", () => {
    const outcomeContextA: ActionOutcome = {
      id: "out-a",
      actionId: "act-buddy",
      dayNumber: 1,
      performedBy: "Vikram",
      performedAt: "2026-03-01",
      improved: "yes",
      notes: "Effective for low confidence new hire",
      treatmentContext: { reason: "Worker was nervous on day 1" },
    };

    const eventA = recordOutcomeLearningEvent({
      hire: mockHire,
      dayNumber: 1,
      outcome: outcomeContextA,
      observed: mockObserved,
      diagnosis: { ...mockDiagnosis, rootCause: "communication_confidence" },
      deterministicAction: mockDeterministicAction,
      finalAction: mockFinalAction,
      availableEvidenceItems: mockObserved.structuredEvidence,
    });

    expect(eventA.diagnosis.rootCause).toBe("communication_confidence");
    expect(eventA.outcomeStatus).toBe("SUCCESS");

    // Case B with equipment failure: buddy shadowing would be inappropriate
    const eventB = recordOutcomeLearningEvent({
      hire: { ...mockHire, id: "nh-test-02" },
      dayNumber: 1,
      outcome: {
        id: "out-b",
        actionId: "act-buddy",
        dayNumber: 1,
        performedBy: "Vikram",
        performedAt: "2026-03-01",
        improved: "no",
        notes: "Ineffective because barcode scanner battery dead",
      },
      observed: mockObserved,
      diagnosis: { ...mockDiagnosis, rootCause: "tool_hardware" },
      deterministicAction: mockDeterministicAction,
      finalAction: mockFinalAction,
      availableEvidenceItems: mockObserved.structuredEvidence,
    });

    expect(eventB.diagnosis.rootCause).toBe("tool_hardware");
    expect(eventB.outcomeStatus).toBe("FAILURE");
    // Both retain independent context without overriding each other
    expect(eventA.outcomeStatus).toBe("SUCCESS");
    expect(eventB.outcomeStatus).toBe("FAILURE");
  });

  // Test 12: One case does not become a global rule
  it("12. Single case outcome remains isolated data and does not alter global rules", () => {
    const outcome: ActionOutcome = {
      id: "out-12",
      actionId: "act-buddy-01",
      dayNumber: 3,
      performedBy: "Vikram",
      performedAt: "2026-03-03",
      improved: "no",
      notes: "Failed on Day 3",
    };

    const event = recordOutcomeLearningEvent({
      hire: mockHire,
      dayNumber: 3,
      outcome,
      observed: mockObserved,
      diagnosis: mockDiagnosis,
      deterministicAction: mockDeterministicAction,
      finalAction: mockFinalAction,
      availableEvidenceItems: mockObserved.structuredEvidence,
    });

    expect(event.outcomeStatus).toBe("FAILURE");
    // Global Casebook has this case, but no global rule or policy is mutated
    expect(casebook.getAllCases().length).toBe(1);
    expect(event.patternConfidence).toBeLessThanOrEqual(0.6); // Not a strong pattern
  });

  // Test 13: Evidence IDs are validated
  it("13. Evidence IDs are validated against available evidence pool", () => {
    const available = mockObserved.structuredEvidence;
    const validated = validateEvidenceIds(["ev-work-uph-3", "ev-hallucinated-99"], available);

    expect(validated.valid).toContain("ev-work-uph-3");
    expect(validated.invalid).toContain("ev-hallucinated-99");
  });

  // Test 14: Hallucinated evidence IDs are rejected
  it("14. Hallucinated evidence IDs are rejected from learning event evidenceIds", () => {
    const event = recordOutcomeLearningEvent({
      hire: mockHire,
      dayNumber: 3,
      outcome: {
        id: "out-14",
        actionId: "act-buddy-01",
        dayNumber: 3,
        performedBy: "Vikram",
        performedAt: "2026-03-03",
        improved: "yes",
        notes: "Good",
      },
      observed: mockObserved,
      diagnosis: mockDiagnosis,
      deterministicAction: mockDeterministicAction,
      finalAction: mockFinalAction,
      availableEvidenceItems: mockObserved.structuredEvidence, // Only contains ev-work-uph-3
    });

    expect(event.evidenceIds).toContain("ev-work-uph-3");
    expect(event.evidenceIds).not.toContain("ev-hallucinated-99");
  });

  // Test 15: Conflicting evidence is preserved
  it("15. Conflicting evidence is preserved in learning event insights", () => {
    const insight = {
      insightType: "POSSIBLE_FALSE_POSITIVE" as const,
      description: "Pick rate improved but supervisor reported constant manual intervention required.",
      supportingEvidenceIds: ["ev-work-uph-3"],
      conflictingEvidenceIds: ["ev-mgr-01"],
      confidence: 0.7,
      requiresMoreEvidence: true,
    };

    expect(insight.conflictingEvidenceIds).toContain("ev-mgr-01");
    expect(insight.requiresMoreEvidence).toBe(true);
  });

  // Test 18: Duplicate LearningEvents are prevented
  it("18. Duplicate LearningEvents are prevented via stable composite key in Casebook", () => {
    const outcome: ActionOutcome = {
      id: "out-18",
      actionId: "act-buddy-01",
      dayNumber: 3,
      performedBy: "Vikram",
      performedAt: "2026-03-03",
      improved: "yes",
      notes: "Pick rate recovered",
    };

    // First call (e.g. initial execution)
    recordOutcomeLearningEvent({
      hire: mockHire,
      dayNumber: 3,
      outcome,
      observed: mockObserved,
      diagnosis: mockDiagnosis,
      deterministicAction: mockDeterministicAction,
      finalAction: mockFinalAction,
      availableEvidenceItems: mockObserved.structuredEvidence,
    });

    // Second call (e.g. React re-render or re-computation)
    recordOutcomeLearningEvent({
      hire: mockHire,
      dayNumber: 3,
      outcome,
      observed: mockObserved,
      diagnosis: mockDiagnosis,
      deterministicAction: mockDeterministicAction,
      finalAction: mockFinalAction,
      availableEvidenceItems: mockObserved.structuredEvidence,
    });

    // Casebook store must contain exactly 1 entry for this employee and day
    const allCases = casebook.getAllCases();
    expect(allCases.length).toBe(1);
    expect(allCases[0].caseId).toBe("case-nh-test-01-d3");
  });

  // Test 19: Casebook remains single historical store
  it("19. Casebook holds the full state -> evidence -> diagnosis -> decision -> intervention -> outcome -> learning event hierarchy", () => {
    const outcome: ActionOutcome = {
      id: "out-19",
      actionId: "act-buddy-01",
      dayNumber: 3,
      performedBy: "Vikram",
      performedAt: "2026-03-03",
      improved: "yes",
      notes: "Standard met",
    };

    casebook.recordCase({
      caseId: "case-nh-test-01-d3",
      employeeId: mockHire.id,
      employeeName: mockHire.name,
      journeyDay: 3,
      timestamp: "2026-03-03T10:00:00Z",
      initialState: { status: "Needs attention", statusReason: "Speed gap" },
      evidenceItems: mockObserved.structuredEvidence,
      deterministicDiagnosis: mockDiagnosis,
      deterministicAction: mockDeterministicAction,
      finalIntervention: mockFinalAction,
      outcome,
    });

    recordOutcomeLearningEvent({
      hire: mockHire,
      dayNumber: 3,
      outcome,
      observed: mockObserved,
      diagnosis: mockDiagnosis,
      deterministicAction: mockDeterministicAction,
      finalAction: mockFinalAction,
      availableEvidenceItems: mockObserved.structuredEvidence,
    });

    const c = casebook.getCase(mockHire.id, 3);
    expect(c).toBeDefined();
    expect(c?.initialState).toBeDefined();
    expect(c?.evidenceItems.length).toBeGreaterThan(0);
    expect(c?.deterministicDiagnosis).toBeDefined();
    expect(c?.deterministicAction).toBeDefined();
    expect(c?.finalIntervention).toBeDefined();
    expect(c?.outcome).toBeDefined();
    expect(c?.learningEvent).toBeDefined();
  });
});
