import { ActionOutcome, NewHire, RecommendedAction, DayRecord, SnapshotEvidenceItem } from "../../types";
import { 
  CanonicalEvidence, 
  UnderstoodDiagnosis, 
  DecidedAction, 
  ObservedSignals
} from "../intelligence";
import { AIInterventionCandidate } from "./interventionTypes";
import { AIArbitrationResult } from "./arbitrationTypes";
import { 
  LearningEvent, 
  OutcomeClassification, 
  InterventionEffectiveness, 
  LearningInsight, 
  BeforeAfterSnapshot 
} from "./casebookTypes";
import { casebook } from "./casebook";

export interface OutcomeLearningInput {
  caseId?: string;
  hire: NewHire;
  dayNumber: number;
  outcome?: ActionOutcome;
  previousRecord?: DayRecord;
  observed: ObservedSignals;
  diagnosis: UnderstoodDiagnosis;
  deterministicAction: DecidedAction;
  aiCandidate?: AIInterventionCandidate;
  arbitrationResult?: AIArbitrationResult;
  finalAction: RecommendedAction;
  canonicalEvidence?: CanonicalEvidence;
  availableEvidenceItems: SnapshotEvidenceItem[];
  historyText?: string;
}

/**
 * Validates that an evidence ID exists in known observed/canonical evidence.
 * Unknown or fabricated IDs are filtered out to prevent hallucination poisoning.
 */
export function validateEvidenceIds(
  ids: string[], 
  availableEvidence: SnapshotEvidenceItem[]
): { valid: string[]; invalid: string[] } {
  const validSet = new Set(availableEvidence.map(e => e.id));
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const id of ids) {
    if (validSet.has(id)) {
      valid.push(id);
    } else {
      invalid.push(id);
    }
  }

  return { valid, invalid };
}

/**
 * Deterministic classifier for ActionOutcome into controlled OutcomeClassification
 */
export function classifyOutcome(
  outcome: ActionOutcome | undefined,
  observed: ObservedSignals,
  canonicalEvidence?: CanonicalEvidence
): {
  status: OutcomeClassification;
  effectiveness: InterventionEffectiveness;
  evidenceQuality: "HIGH" | "MODERATE" | "LOW" | "INSUFFICIENT";
  evidenceConfidence: number;
  outcomeConfidence: number;
} {
  // If no outcome is provided or no evidence of follow-up
  if (!outcome) {
    return {
      status: "INSUFFICIENT_EVIDENCE",
      effectiveness: "UNKNOWN",
      evidenceQuality: "INSUFFICIENT",
      evidenceConfidence: 0.1,
      outcomeConfidence: 0.1,
    };
  }

  const hasSubsequentPickRate = outcome.subsequentPickRate !== undefined && outcome.subsequentPickRate > 0;
  const hasSubsequentAccuracy = outcome.subsequentAccuracy !== undefined && outcome.subsequentAccuracy > 0;
  const hasNotes = Boolean(outcome.notes && outcome.notes.trim().length > 3);
  const targetPickRate = observed.targetPickRate || 50;

  // Check if we only have subjective notes with zero metrics and unverified improvement
  if (!hasSubsequentPickRate && !hasSubsequentAccuracy && !hasNotes && !outcome.improved) {
    return {
      status: "INSUFFICIENT_EVIDENCE",
      effectiveness: "UNKNOWN",
      evidenceQuality: "INSUFFICIENT",
      evidenceConfidence: 0.2,
      outcomeConfidence: 0.2,
    };
  }

  let evidenceQuality: "HIGH" | "MODERATE" | "LOW" | "INSUFFICIENT" = "LOW";
  let evidenceConfidence = 0.5;

  if (hasSubsequentPickRate && hasSubsequentAccuracy) {
    evidenceQuality = "HIGH";
    evidenceConfidence = 0.95;
  } else if (hasSubsequentPickRate || hasSubsequentAccuracy) {
    evidenceQuality = "MODERATE";
    evidenceConfidence = 0.8;
  } else if (hasNotes) {
    evidenceQuality = "LOW";
    evidenceConfidence = 0.5;
  }

  // Outcome status determination
  let status: OutcomeClassification = "INSUFFICIENT_EVIDENCE";
  let effectiveness: InterventionEffectiveness = "UNKNOWN";
  let outcomeConfidence = 0.5;

  if (outcome.improved === "yes") {
    status = "SUCCESS";
    effectiveness = "EFFECTIVE";
    outcomeConfidence = evidenceQuality === "HIGH" ? 0.95 : 0.75;
  } else if (outcome.improved === "partial") {
    status = "PARTIAL";
    effectiveness = "PARTIALLY_EFFECTIVE";
    outcomeConfidence = evidenceQuality === "HIGH" ? 0.9 : 0.7;
  } else if (outcome.improved === "no") {
    // Check if performance was measured and actually flat vs regressed
    if (hasSubsequentPickRate && observed.previousPickRate !== undefined && outcome.subsequentPickRate === observed.previousPickRate) {
      status = "NO_MEANINGFUL_CHANGE";
      effectiveness = "INEFFECTIVE";
    } else {
      status = "FAILURE";
      effectiveness = "INEFFECTIVE";
    }
    outcomeConfidence = evidenceQuality === "HIGH" ? 0.9 : 0.7;
  } else {
    // Rely on telemetry if improved flag wasn't explicitly set
    if (hasSubsequentPickRate) {
      if (outcome.subsequentPickRate! >= targetPickRate - 4 && (outcome.subsequentAccuracy || 100) >= 95) {
        status = "SUCCESS";
        effectiveness = "EFFECTIVE";
        outcomeConfidence = 0.85;
      } else if (observed.previousPickRate !== undefined && outcome.subsequentPickRate! > observed.previousPickRate) {
        status = "PARTIAL";
        effectiveness = "PARTIALLY_EFFECTIVE";
        outcomeConfidence = 0.8;
      } else {
        status = "FAILURE";
        effectiveness = "INEFFECTIVE";
        outcomeConfidence = 0.8;
      }
    } else {
      status = "INSUFFICIENT_EVIDENCE";
      effectiveness = "UNKNOWN";
      outcomeConfidence = 0.3;
    }
  }

  return {
    status,
    effectiveness,
    evidenceQuality,
    evidenceConfidence,
    outcomeConfidence,
  };
}

/**
 * Builds before/after comparison with causal humility guarding.
 * Detects confounding factors like environmental issues or tool downtime.
 */
export function buildBeforeAfterSnapshot(
  observed: ObservedSignals,
  outcome: ActionOutcome | undefined,
  canonicalEvidence?: CanonicalEvidence
): BeforeAfterSnapshot {
  const confoundingFactors: string[] = [];

  if (observed.workerReportsExternalBottleneck || observed.externalBottleneckDescription) {
    confoundingFactors.push(`External bottleneck present: ${observed.externalBottleneckDescription || "bottleneck reported"}`);
  }
  if (canonicalEvidence?.toolSystem?.systemDowntime && canonicalEvidence.toolSystem.systemDowntime > 0) {
    confoundingFactors.push(`System downtime: ${canonicalEvidence.toolSystem.systemDowntime} mins`);
  }
  if (canonicalEvidence?.environment?.environmentalIssue) {
    confoundingFactors.push(`Environmental condition: ${canonicalEvidence.environment.environmentalIssue}`);
  }

  const beforePickRate = observed.previousPickRate ?? observed.currentPickRate;
  const afterPickRate = outcome?.subsequentPickRate ?? observed.currentPickRate;

  let causalityClaim = "No follow-up comparison available.";
  if (outcome) {
    if (confoundingFactors.length > 0) {
      causalityClaim = `Improvement/change observed after intervention, but confounded by ${confoundingFactors.length} environmental factor(s): ${confoundingFactors.join(", ")}.`;
    } else if (afterPickRate > beforePickRate) {
      causalityClaim = "Improvement observed after intervention without recorded environmental confounders.";
    } else if (afterPickRate === beforePickRate) {
      causalityClaim = "No performance change observed following intervention.";
    } else {
      causalityClaim = "Performance decline observed following intervention.";
    }
  }

  return {
    before: {
      pickRate: beforePickRate,
      targetPickRate: observed.targetPickRate,
      accuracy: observed.accuracy,
      helpRequests: observed.helpRequestsCount,
      systemDowntime: canonicalEvidence?.toolSystem?.systemDowntime,
      externalBottleneck: observed.externalBottleneckDescription,
      supervisorNote: observed.managerSignal?.notes,
      workerNote: observed.dailySignal?.rawText,
    },
    after: {
      pickRate: afterPickRate,
      targetPickRate: observed.targetPickRate,
      accuracy: outcome?.subsequentAccuracy ?? observed.accuracy,
      helpRequests: outcome ? 0 : observed.helpRequestsCount,
      systemDowntime: 0,
      supervisorNote: outcome?.notes,
    },
    confoundingFactors,
    causalityQualifiedClaim: causalityClaim,
  };
}

/**
 * Analyzes historical cases in the casebook to detect patterns:
 * - Repeated Success
 * - Repeated Failure
 * - Intervention Decay
 * - Problem Migration
 * - Context-Dependent outcomes
 */
export function analyzeLongitudinalLearningSignals(
  hire: NewHire,
  currentDay: number,
  currentOutcomeStatus: OutcomeClassification,
  currentInterventionTitle: string,
  currentRootCause: string,
  currentPickRateDelta?: number
): {
  isRepeatedFailure: boolean;
  isInterventionDecay: boolean;
  isProblemMigration: boolean;
  migrationDetails?: { resolvedProblem?: string; emergedProblem?: string };
  signals: string[];
  insights: LearningInsight[];
  patternConfidence: number;
} {
  const history = casebook.getHistoryForEmployee(hire.id).filter(c => c.journeyDay < currentDay);
  const signals: string[] = [];
  const insights: LearningInsight[] = [];
  let patternConfidence = 0.4;

  let priorFailuresWithSameIntervention = 0;
  const sameInterventionHistory: { day: number; outcomeStatus: OutcomeClassification; pickRateDelta?: number }[] = [];

  for (const c of history) {
    if (c.learningEvent) {
      const le = c.learningEvent;
      const sameAction = le.selectedIntervention.title === currentInterventionTitle ||
                         le.selectedIntervention.smallestPracticalStep === currentInterventionTitle;
      if (sameAction) {
        sameInterventionHistory.push({
          day: le.journeyDay,
          outcomeStatus: le.outcomeStatus,
          pickRateDelta: le.outcomeMagnitude?.pickRateDelta,
        });
        if (le.outcomeStatus === "FAILURE" || le.outcomeStatus === "NO_MEANINGFUL_CHANGE") {
          priorFailuresWithSameIntervention++;
        }
      }
    }
  }

  // 1. Repeated Failure Detection
  let isRepeatedFailure = false;
  if (currentOutcomeStatus === "FAILURE" && priorFailuresWithSameIntervention >= 1) {
    isRepeatedFailure = true;
    signals.push(`Repeated intervention failure: "${currentInterventionTitle}" failed ${priorFailuresWithSameIntervention + 1} times for employee.`);
    insights.push({
      insightType: "REPEATED_FAILURE",
      description: `Intervention "${currentInterventionTitle}" has failed across multiple shifts without closing the capability gap.`,
      supportingEvidenceIds: [],
      conflictingEvidenceIds: [],
      confidence: 0.9,
      requiresMoreEvidence: false,
    });
    patternConfidence = 0.85;
  }

  // 2. Intervention Decay Detection
  // e.g. Day 1: +15, Day 2: +6, Day 3: +1 or flat
  let isInterventionDecay = false;
  if (sameInterventionHistory.length >= 2) {
    const deltas = sameInterventionHistory.map(h => h.pickRateDelta).filter((d): d is number => d !== undefined);
    if (currentPickRateDelta !== undefined) deltas.push(currentPickRateDelta);
    if (deltas.length >= 3) {
      let isStrictlyDecaying = true;
      for (let i = 1; i < deltas.length; i++) {
        if (deltas[i] >= deltas[i - 1]) {
          isStrictlyDecaying = false;
          break;
        }
      }
      if (isStrictlyDecaying && deltas[deltas.length - 1] <= 2) {
        isInterventionDecay = true;
        signals.push(`Intervention decay detected: efficacy of "${currentInterventionTitle}" diminished across consecutive shifts.`);
        insights.push({
          insightType: "INTERVENTION_DECAY",
          description: `Intervention showed initial positive lift but has experienced diminishing returns across 3+ assignments.`,
          supportingEvidenceIds: [],
          conflictingEvidenceIds: [],
          confidence: 0.8,
          requiresMoreEvidence: false,
        });
        patternConfidence = Math.max(patternConfidence, 0.8);
      }
    }
  }

  // 3. Problem Migration Detection
  // e.g. Day N-1 had speed gap which improved, but now Day N has accuracy drop
  let isProblemMigration = false;
  let migrationDetails: { resolvedProblem?: string; emergedProblem?: string } | undefined = undefined;

  const previousCase = history.find(c => c.journeyDay === currentDay - 1);
  if (previousCase?.learningEvent) {
    const prevDiagnosis = previousCase.learningEvent.diagnosis.rootCause;
    const prevOutcome = previousCase.learningEvent.outcomeStatus;

    if (prevOutcome === "SUCCESS" || prevOutcome === "PARTIAL") {
      if (prevDiagnosis !== currentRootCause && currentRootCause !== "steady_ramp" && currentRootCause !== "no_evidence") {
        isProblemMigration = true;
        migrationDetails = {
          resolvedProblem: prevDiagnosis,
          emergedProblem: currentRootCause,
        };
        signals.push(`Problem migration: prior issue (${prevDiagnosis}) resolved/improved, but new issue (${currentRootCause}) emerged.`);
        insights.push({
          insightType: "PROBLEM_MIGRATION",
          description: `Primary blocker shifted from ${prevDiagnosis} to ${currentRootCause}. This reflects operational stage transition, not previous intervention failure.`,
          supportingEvidenceIds: [],
          conflictingEvidenceIds: [],
          confidence: 0.85,
          requiresMoreEvidence: false,
        });
        patternConfidence = Math.max(patternConfidence, 0.85);
      }
    }
  }

  // 4. Repeated Success Detection
  if (currentOutcomeStatus === "SUCCESS" && sameInterventionHistory.filter(h => h.outcomeStatus === "SUCCESS").length >= 1) {
    signals.push(`Repeated intervention success: "${currentInterventionTitle}" consistently effective for employee.`);
    insights.push({
      insightType: "REPEATED_SUCCESS",
      description: `Intervention "${currentInterventionTitle}" reliably generates positive lift for this learner context.`,
      supportingEvidenceIds: [],
      conflictingEvidenceIds: [],
      confidence: 0.9,
      requiresMoreEvidence: false,
    });
    patternConfidence = Math.max(patternConfidence, 0.85);
  }

  return {
    isRepeatedFailure,
    isInterventionDecay,
    isProblemMigration,
    migrationDetails,
    signals,
    insights,
    patternConfidence,
  };
}

/**
 * Creates a deterministic, non-destructive LearningEvent for AI-6.
 * Enforces stable idempotent identification and saves to Casebook.
 */
export function recordOutcomeLearningEvent(input: OutcomeLearningInput): LearningEvent {
  const {
    hire,
    dayNumber,
    outcome,
    previousRecord,
    observed,
    diagnosis,
    deterministicAction,
    aiCandidate,
    arbitrationResult,
    finalAction,
    canonicalEvidence,
    availableEvidenceItems,
  } = input;

  // 1. Stable idempotent IDs
  const caseId = input.caseId || `case-${hire.id}-d${dayNumber}`;
  const learningEventId = `le-${hire.id}-d${dayNumber}`;

  // 2. Validate evidence IDs
  const evidenceIds = availableEvidenceItems.map(e => e.id);
  const validatedEv = validateEvidenceIds(evidenceIds, availableEvidenceItems);

  // 3. Classify outcome deterministically
  const {
    status: outcomeStatus,
    effectiveness: interventionEffectiveness,
    evidenceQuality,
    evidenceConfidence,
    outcomeConfidence,
  } = classifyOutcome(outcome, observed, canonicalEvidence);

  // 4. Before / After comparison & Causal Humility
  const beforeAfter = buildBeforeAfterSnapshot(observed, outcome, canonicalEvidence);

  // 5. Outcome Magnitude
  const beforePickRate = beforeAfter.before.pickRate;
  const afterPickRate = beforeAfter.after.pickRate;
  const pickRateDelta = (beforePickRate !== undefined && afterPickRate !== undefined)
    ? afterPickRate - beforePickRate
    : undefined;

  const accuracyDelta = (beforeAfter.before.accuracy !== undefined && beforeAfter.after.accuracy !== undefined)
    ? beforeAfter.after.accuracy - beforeAfter.before.accuracy
    : undefined;

  // 6. Longitudinal signals & patterns
  const longitudinal = analyzeLongitudinalLearningSignals(
    hire,
    dayNumber,
    outcomeStatus,
    finalAction.title,
    diagnosis.rootCause,
    pickRateDelta
  );

  // 7. Human/System Review flagging
  let requiresReview = false;
  let reviewReason: string | undefined = undefined;

  if (longitudinal.isRepeatedFailure) {
    requiresReview = true;
    reviewReason = `Repeated failure of "${finalAction.title}". Reassess root cause and actor assignment.`;
  } else if (beforeAfter.confoundingFactors.length > 0 && outcomeStatus === "SUCCESS") {
    requiresReview = true;
    reviewReason = `Outcome succeeded while external confounders were active. Verify if lift was environmental or worker capability.`;
  } else if (outcomeStatus === "FAILURE" && diagnosis.rootCause === "safety_blocker") {
    requiresReview = true;
    reviewReason = `Safety blocker unresolved post-intervention. High operational risk.`;
  }

  // 8. Construct structured LearningEvent
  const learningEvent: LearningEvent = {
    learningEventId,
    caseId,
    employeeId: hire.id,
    journeyDay: dayNumber,
    createdAt: new Date().toISOString(),

    initialState: {
      status: hire.status,
      statusReason: hire.statusReason,
      currentCapabilityId: hire.currentCapabilityId,
    },
    evidenceIds: validatedEv.valid,
    diagnosis: {
      rootCause: diagnosis.rootCause,
      targetCapId: diagnosis.targetCapId,
      patternCategory: diagnosis.patternCategory,
      patternName: diagnosis.patternName,
      diagnosisText: diagnosis.diagnosisText,
    },
    deterministicAction: {
      title: deterministicAction.actionTitle,
      decisionType: deterministicAction.decisionType,
      targetActor: deterministicAction.targetActor,
      practicalStep: deterministicAction.practicalStep,
      rationale: deterministicAction.decisionRationale,
    },
    aiCandidate,
    arbitrationDecision: arbitrationResult,
    selectedIntervention: {
      actionId: finalAction.id,
      title: finalAction.title,
      actionType: finalAction.actionType,
      targetActor: finalAction.targetActor,
      smallestPracticalStep: finalAction.smallestPracticalStep,
      decisionType: finalAction.decisionType,
    },

    outcome,
    outcomeStatus,
    outcomeMagnitude: {
      pickRateDelta,
      accuracyDelta,
    },
    beforeAfterSnapshot: beforeAfter,

    interventionEffectiveness,
    evidenceQuality,
    evidenceConfidence,
    outcomeConfidence,
    patternConfidence: longitudinal.patternConfidence,

    previousInterventionContext: observed.previousTreatmentContext,
    repeatedProblem: Boolean(previousRecord && previousRecord.actionOutcome?.improved === "no"),
    interventionRepeated: Boolean(previousRecord && previousRecord.recommendedAction?.title === finalAction.title),
    interventionChanged: Boolean(previousRecord && previousRecord.recommendedAction?.title !== finalAction.title),
    isRepeatedFailure: longitudinal.isRepeatedFailure,
    isInterventionDecay: longitudinal.isInterventionDecay,
    isProblemMigration: longitudinal.isProblemMigration,
    migrationDetails: longitudinal.migrationDetails,

    learningSignals: longitudinal.signals,
    insights: longitudinal.insights,
    requiresReview,
    reviewReason,
  };

  // 9. Save to Casebook idempotently
  casebook.recordLearningEvent(learningEvent);

  return learningEvent;
}
