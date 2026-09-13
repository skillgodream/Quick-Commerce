/**
 * DEANCORE-AI-10: Evolution & Proprietary Intelligence Types
 * 
 * Defines the core types for Dean's controlled evolution pipeline:
 * Case Mining -> Pattern Discovery -> Outcome Analysis -> Intervention Effectiveness
 * -> Hypothesis Evaluation -> Benchmark -> Candidate Improvement -> Offline Evaluation
 * -> Human Approval Gate -> Versioned Promotion -> Rollback.
 * 
 * INVARIANT: Dean CANNOT rewrite its own runtime intelligence automatically.
 */

import { CasebookCase, LearningEvent, OutcomeClassification, InterventionEffectiveness } from "./casebookTypes";
import { GovernanceEvaluationResult } from "./governanceTypes";
import { UnderstoodDiagnosis, DecidedAction, CanonicalEvidence } from "../intelligence";
import { RecommendedAction, SnapshotEvidenceItem, CapabilityState, ActionOutcome } from "../../types";
import { AIInterventionCandidate } from "./interventionTypes";
import { AIArbitrationResult } from "./arbitrationTypes";

/**
 * 1. Mined Structured Case
 * Extracted from Casebook without creating a secondary historical truth.
 */
export interface MinedCase {
  caseId: string;
  employeeId: string;
  employeeName: string;
  journeyDay: number;
  timestamp: string;
  schemaVersion: string;

  // Learner state
  initialState: {
    status: string;
    statusReason: string;
    readinessScore?: number;
    capabilities?: Record<number, CapabilityState>;
  };

  // Evidence & Traceability
  canonicalEvidence?: CanonicalEvidence;
  evidenceItems: SnapshotEvidenceItem[];
  evidenceIds: string[];
  evidenceSufficiency: "SUFFICIENT" | "PARTIAL" | "INSUFFICIENT";
  evidenceQuality: "HIGH" | "MODERATE" | "LOW" | "INSUFFICIENT";

  // Diagnostic & Decisions
  diagnosis: UnderstoodDiagnosis;
  deterministicAction: DecidedAction;
  aiReasoning?: string;
  aiInterventionCandidate?: AIInterventionCandidate;
  arbitrationResult?: AIArbitrationResult;
  governanceResult?: GovernanceEvaluationResult;
  finalAction: RecommendedAction;

  // Outcome & Learning
  outcome?: ActionOutcome;
  learningEvent?: LearningEvent;
  outcomeClassification: OutcomeClassification;
  interventionEffectiveness: InterventionEffectiveness;

  // Environmental context & Confounders
  contextTags: string[];
  confoundingFactors: string[];
  longitudinalContext?: string;

  // Security & Sanitization Flags
  isSanitized: boolean;
  securityFlags: string[];
}

export interface CaseMiningStats {
  totalCasesMined: number;
  uniqueEmployees: number;
  highQualityCount: number;
  moderateQualityCount: number;
  lowQualityCount: number;
  insufficientCount: number;
  flaggedSecurityCount: number;
  duplicatesRemoved: number;
}

/**
 * 2. Candidate Patterns
 */
export type CandidatePatternType =
  | "RECURRING_FAILURE"
  | "RECURRING_RECOVERY"
  | "INTERVENTION_DECAY"
  | "PROBLEM_MIGRATION"
  | "SYMPTOM_SHIFT"
  | "ENVIRONMENTAL_BOTTLENECK"
  | "TOOL_SYSTEM_FAILURE"
  | "CAPABILITY_GAP"
  | "COMMUNICATION_PROBLEM"
  | "ATTENDANCE_PATTERN"
  | "DIFFERENT_CAUSES_SAME_SYMPTOM"
  | "SAME_CAUSE_DIFFERENT_SYMPTOMS"
  | "CONTEXT_DEPENDENT_EFFECTIVENESS"
  | "TRAJECTORY_MULTIDAY"
  | "NOVEL_COMBINATION";

export interface CandidatePattern {
  patternId: string;
  patternType: CandidatePatternType;
  title: string;
  description: string;
  supportingCaseIds: string[];
  evidenceIds: string[];
  occurrenceCount: number;
  contexts: string[];
  outcomeStats: {
    totalCount: number;
    successCount: number;
    partialCount: number;
    failureCount: number;
    insufficientCount: number;
    successRate: number;
  };
  confidence: number;
  contradictoryCases: string[];
  evidenceQuality: "HIGH" | "MODERATE" | "LOW" | "INSUFFICIENT";
  firstObservedDate: string;
  latestObservedDate: string;
}

/**
 * 3. Outcome Analysis
 */
export interface OutcomeAnalysis {
  interventionTitle: string;
  actionType: string;
  contextKey: string;
  attempts: number;
  successCount: number;
  partialSuccessCount: number;
  failureCount: number;
  insufficientEvidenceCount: number;
  harmfulOrUnintendedCount: number;
  effectivenessRate: number;
  confidence: number;
  contextualLimitations: string[];
  confoundersDetected: string[];
  causalHumilityPreserved: boolean;
}

/**
 * 4. Intervention Effectiveness Model
 */
export type InterventionEffectivenessVerdict =
  | "WORKED"
  | "APPEARED_TO_WORK_WEAK_EVIDENCE"
  | "WORKED_REPEATEDLY_SIMILAR_CONTEXT"
  | "WORKED_FOR_LEARNER_FAILED_ELSEWHERE"
  | "INEFFECTIVE"
  | "UNKNOWN_INSUFFICIENT";

export interface InterventionEffectivenessRecord {
  interventionTitle: string;
  targetProblem: string;
  context: string;
  expectedEffect: string;
  observedOutcome: string;
  evidenceQuality: "HIGH" | "MODERATE" | "LOW" | "INSUFFICIENT";
  effectivenessVerdict: InterventionEffectivenessVerdict;
  confidence: number;
  learnerSpecific: boolean;
  supportingCaseIds: string[];
}

/**
 * 5. Candidate Hypothesis (Novel Pattern Evaluation)
 */
export interface CandidateHypothesis {
  hypothesisId: string;
  hypothesis: string;
  targetProblem: string;
  proposedMechanism: string;
  supportingCaseIds: string[];
  supportingEvidenceIds: string[];
  conflictingEvidenceIds: string[];
  requiredValidation: string;
  confidence: number;
  contexts: string[];
  expectedObservableSignature: string;
  possibleAlternativeExplanations: string[];
  status: "PROPOSED" | "TESTING" | "VALIDATED" | "REFUTED";
  createdAt: string;
}

/**
 * 6. Evaluation Dataset & Benchmark Dimensions
 */
export type BenchmarkDimension =
  | "A_EVIDENCE_GROUNDING"
  | "B_DIAGNOSTIC_CORRECTNESS"
  | "C_CAUSE_DIFFERENTIATION"
  | "D_LONGITUDINAL_REASONING"
  | "E_INTERVENTION_EFFECTIVENESS"
  | "F_WORKER_BLAME_PROTECTION"
  | "G_SAFETY"
  | "H_APPROPRIATE_ABSTENTION"
  | "I_APPROPRIATE_ESCALATION"
  | "J_EVIDENCE_SUFFICIENCY_HANDLING"
  | "K_CONFLICTING_EVIDENCE_HANDLING"
  | "L_AI_FAILURE_RECOVERY"
  | "M_NOVEL_PATTERN_HANDLING"
  | "N_HUMAN_APPROVAL_COMPLIANCE"
  | "O_OUTCOME_LEARNING_QUALITY";

export interface EvaluationExample {
  exampleId: string;
  sourceCaseId?: string;
  dimension: BenchmarkDimension;
  scenarioTitle: string;
  difficulty: "NORMAL" | "HARD" | "ADVERSARIAL";
  evidenceQuality: "HIGH" | "MODERATE" | "LOW" | "INSUFFICIENT";
  input: {
    signals: Record<string, any>;
    hireState: Record<string, any>;
    evidenceText?: string;
    canonicalEvidence?: Record<string, any>;
    historicalContext?: string;
    simulatedFailure?: "TIMEOUT" | "INJECTION" | "HALLUCINATED_EVIDENCE" | "MALFORMED";
  };
  expected: {
    targetDiagnosis?: string;
    expectedActionTitle?: string;
    mustAbstain?: boolean;
    mustEscalate?: boolean;
    requiresHumanApproval?: boolean;
    mustProtectWorkerBlame?: boolean;
    mustTriggerFallback?: boolean;
    prohibitedActions?: string[];
  };
}

export interface DeanBenchmarkSuite {
  benchmarkVersion: string;
  name: string;
  description: string;
  createdAt: string;
  examples: EvaluationExample[];
}

export interface BenchmarkEvaluationResult {
  benchmarkVersion: string;
  evaluatedAt: string;
  evaluatedTarget: string;
  totalExamples: number;
  passedExamples: number;
  overallScore: number; // percentage 0-100
  dimensionScores: Record<BenchmarkDimension, { score: number; passed: boolean; details: string }>;
  zeroToleranceChecks: {
    safetyPassed: boolean; // Must be 100%
    workerBlamePassed: boolean; // Must be 100%
    evidenceGroundingPassed: boolean; // Must be 100%
    abstentionPassed: boolean; // Must be 100%
    governanceCompliancePassed: boolean; // Must be 100%
    fallbackPassed: boolean; // Must be 100%
  };
  regressions: string[];
  passedAllGates: boolean;
}

/**
 * 7. Candidate Improvement & Approval Workflow
 */
export type CandidateImprovementType =
  | "DIAGNOSTIC_MAPPING"
  | "REASONING_PROMPT"
  | "INTERVENTION_SELECTION"
  | "EVIDENCE_INTERPRETATION"
  | "LONGITUDINAL_REASONING"
  | "GOVERNANCE_RULE_PROPOSAL"
  | "EVALUATION_METRIC";

export type CandidateApprovalStatus =
  | "DRAFT"
  | "EVALUATING"
  | "PASSED_OFFLINE"
  | "REQUIRES_HUMAN_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "PROMOTED"
  | "ROLLED_BACK";

export interface HumanApprovalRecord {
  approvedBy: string;
  approvedAt: string;
  governanceReviewed: boolean;
  notes: string;
  signature: string;
}

export interface CandidateImprovement {
  candidateId: string;
  title: string;
  description: string;
  improvementType: CandidateImprovementType;
  sourceCaseIds: string[];
  sourcePatternIds: string[];
  reasonForProposal: string;
  expectedImprovement: string;
  affectedComponent: string;
  proposedDelta: Record<string, any>;
  risks: string[];
  benchmarkResults?: BenchmarkEvaluationResult;
  regressionResults?: { hasRegressions: boolean; regressions: string[] };
  safetyResults?: { passed: boolean; violations: string[] };
  approvalStatus: CandidateApprovalStatus;
  approvalRecord?: HumanApprovalRecord;
  targetVersion: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 8. Versioned Release & Rollback Artifacts
 */
export interface DeanReleaseArtifact {
  releaseVersion: string;
  runtimeVersion: string;
  governanceVersion: string;
  reasoningVersion: string;
  interventionVersion: string;
  promotedCandidateId: string;
  promotedBy: string;
  promotedAt: string;
  active: boolean;
  checksum: string;
  previousVersion: string;
}

export interface RollbackRecord {
  rollbackId: string;
  targetVersion: string;
  revertedFromVersion: string;
  reason: string;
  executedBy: string;
  executedAt: string;
}
