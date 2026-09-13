import { GovernanceEvaluationResult } from "./governanceTypes";
import { RecommendedAction, NewHire, ActionOutcome, CapabilityState, SnapshotEvidenceItem } from "../../types";
import { CanonicalEvidence, UnderstoodDiagnosis, DecidedAction, } from "../intelligence";
import { AIInterventionCandidate } from "./interventionTypes";
import { AIArbitrationResult } from "./arbitrationTypes";

/**
 * Controlled Outcome Classification (Normalized)
 */
export type OutcomeClassification =
  | "SUCCESS"
  | "PARTIAL"
  | "FAILURE"
  | "NO_MEANINGFUL_CHANGE"
  | "INSUFFICIENT_EVIDENCE";

/**
 * Controlled Intervention Effectiveness State
 */
export type InterventionEffectiveness =
  | "EFFECTIVE"
  | "PARTIALLY_EFFECTIVE"
  | "INEFFECTIVE"
  | "UNKNOWN";

/**
 * Controlled Learning Insight Types (AI-6 analytical taxonomy)
 */
export type LearningInsightType =
  | "REPEATED_SUCCESS"
  | "REPEATED_FAILURE"
  | "INTERVENTION_DECAY"
  | "CONTEXT_DEPENDENT_SUCCESS"
  | "CONTEXT_DEPENDENT_FAILURE"
  | "PROBLEM_MIGRATION"
  | "RECURRING_CAUSE"
  | "POSSIBLE_FALSE_POSITIVE"
  | "INSUFFICIENT_EVIDENCE";

export interface LearningInsight {
  insightType: LearningInsightType;
  description: string;
  supportingEvidenceIds: string[];
  conflictingEvidenceIds: string[];
  confidence: number;
  uncertainty?: string;
  requiresMoreEvidence: boolean;
}

export interface BeforeAfterSnapshot {
  before: {
    pickRate?: number;
    targetPickRate?: number;
    accuracy?: number;
    taskProficiency?: string;
    helpRequests?: number;
    systemDowntime?: number;
    externalBottleneck?: string;
    supervisorNote?: string;
    workerNote?: string;
  };
  after: {
    pickRate?: number;
    targetPickRate?: number;
    accuracy?: number;
    taskProficiency?: string;
    helpRequests?: number;
    systemDowntime?: number;
    externalBottleneck?: string;
    supervisorNote?: string;
    workerNote?: string;
  };
  confoundingFactors: string[];
  causalityQualifiedClaim: string; // e.g., "Improvement observed after intervention"
}

export interface LearningEvent {
  learningEventId: string;
  caseId: string;
  employeeId: string;
  journeyDay: number;
  createdAt: string;

  // Decision & context capture
  initialState: {
    status: string;
    statusReason: string;
    currentCapabilityId?: number;
  };
  evidenceIds: string[];
  diagnosis: {
    rootCause: string;
    targetCapId: number;
    patternCategory: string;
    patternName: string;
    diagnosisText: string;
  };
  deterministicAction: {
    title: string;
    decisionType: string;
    targetActor: string;
    practicalStep: string;
    rationale: string;
  };
  aiCandidate?: AIInterventionCandidate;
  arbitrationDecision?: AIArbitrationResult;
  selectedIntervention: {
    actionId: string;
    title: string;
    actionType: string;
    targetActor: string;
    smallestPracticalStep: string;
    decisionType?: string;
  };

  // Outcome & measurement
  outcome?: ActionOutcome;
  outcomeStatus: OutcomeClassification;
  outcomeMagnitude?: {
    pickRateDelta?: number;
    accuracyDelta?: number;
  };
  beforeAfterSnapshot?: BeforeAfterSnapshot;

  // Effectiveness & Confidence Separation
  interventionEffectiveness: InterventionEffectiveness;
  evidenceQuality: "HIGH" | "MODERATE" | "LOW" | "INSUFFICIENT";
  evidenceConfidence: number;
  outcomeConfidence: number;
  patternConfidence: number;

  // Longitudinal & History Context
  previousInterventionContext?: string;
  repeatedProblem: boolean;
  interventionRepeated: boolean;
  interventionChanged: boolean;
  isRepeatedFailure: boolean;
  isInterventionDecay: boolean;
  isProblemMigration: boolean;
  migrationDetails?: {
    resolvedProblem?: string;
    emergedProblem?: string;
  };

  // Learning Signals & Insights
  learningSignals: string[];
  insights: LearningInsight[];
  requiresReview: boolean;
  reviewReason?: string;
}

export interface CasebookCase {
  caseId: string;
  schemaVersion?: string;
  employeeId: string;
  employeeName: string;
  journeyDay: number;
  timestamp: string;

  initialState: {
    status: string;
    statusReason: string;
    readinessScore?: number;
    capabilities?: Record<number, CapabilityState>;
  };
  canonicalEvidence?: CanonicalEvidence;
  evidenceItems: SnapshotEvidenceItem[];
  deterministicDiagnosis: UnderstoodDiagnosis;
  deterministicAction: DecidedAction;
  aiInterventionCandidate?: AIInterventionCandidate;
  aiArbitration?: AIArbitrationResult;
  finalIntervention: RecommendedAction;
  outcome?: ActionOutcome;
  learningEvent?: LearningEvent;
  governanceResult?: GovernanceEvaluationResult;
}

