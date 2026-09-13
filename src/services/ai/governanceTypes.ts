import { UnderstoodDiagnosis, DecidedAction, ObservedSignals, CanonicalEvidence } from "../intelligence";
import { AIInterventionCandidate } from "./interventionTypes";
import { AIArbitrationResult } from "./arbitrationTypes";
import { SnapshotEvidenceItem, RecommendedAction, NewHire } from "../../types";

/**
 * AI-8 Governance Policy Version
 */
export const CURRENT_GOVERNANCE_POLICY_VERSION = "1.0.0";

/**
 * Evidence Sufficiency Tier
 */
export type EvidenceSufficiencyTier = 
  | "SUFFICIENT" 
  | "PARTIALLY_SUPPORTED" 
  | "INSUFFICIENT" 
  | "CONFLICTING";

/**
 * AI-8 Governance Verdict Status
 */
export type GovernanceVerdictStatus = 
  | "APPROVED" 
  | "REJECTED" 
  | "ABSTAIN" 
  | "REQUIRE_HUMAN_APPROVAL" 
  | "REQUIRE_ESCALATION";

/**
 * High-Level Governance Risk Tier
 */
export type GovernanceRiskTier = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

/**
 * Governance Rule Violation / Flag Code
 */
export type GovernanceRuleCode =
  | "SAFETY_VIOLATION"
  | "WORKER_BLAME_PROTECTION"
  | "EVIDENCE_INSUFFICIENT"
  | "EVIDENCE_CONFLICTING"
  | "EVIDENCE_UNGROUNDED"
  | "AI_CONFIDENCE_BELOW_THRESHOLD"
  | "NOVELTY_RISK_UNVERIFIED"
  | "HUMAN_APPROVAL_MANDATED"
  | "ESCALATION_REQUIRED"
  | "REPEATED_FAILURE_GUARD"
  | "DETERMINISTIC_FALLBACK_ENFORCED"
  | "LONGITUDINAL_POLICY_DRIFT_BLOCKED";

/**
 * Granular Audit Rule Record
 */
export interface GovernanceRuleAudit {
  ruleCode: GovernanceRuleCode;
  ruleName: string;
  passed: boolean;
  severity: "INFO" | "WARNING" | "BLOCKING";
  description: string;
  supportingEvidenceIds?: string[];
  conflictingEvidenceIds?: string[];
}

/**
 * Input Context submitted to AI-8 Governance Authority
 */
export interface GovernanceEvaluationInput {
  hire: NewHire;
  dayNumber: number;
  observed: ObservedSignals;
  canonicalEvidence?: CanonicalEvidence;
  availableEvidenceItems: SnapshotEvidenceItem[];
  diagnosis: UnderstoodDiagnosis;
  deterministicAction: DecidedAction;
  aiCandidate?: AIInterventionCandidate;
  arbitrationResult: AIArbitrationResult;
  proposedFinalAction: DecidedAction;
  policyVersion?: string;
  isAiTimeoutOrUnavailable?: boolean;
  malformedAiOutputDetected?: boolean;
}

/**
 * Definitive Governance Audit & Decision Output
 */
export interface GovernanceEvaluationResult {
  policyVersion: string;
  timestamp: string;
  governanceVerdict: GovernanceVerdictStatus;
  riskTier: GovernanceRiskTier;
  governedAction: DecidedAction;
  evidenceSufficiency: EvidenceSufficiencyTier;
  workerBlameProtected: boolean;
  safetyCleared: boolean;
  requiresHumanApproval: boolean;
  humanApprovalReason?: string;
  requiresEscalation: boolean;
  escalationTarget?: string;
  escalationReason?: string;
  auditedRules: GovernanceRuleAudit[];
  governanceRationale: string;
  traceableEvidenceIds: string[];
  rejectedReasons: string[];
}
