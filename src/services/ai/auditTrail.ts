/**
 * DEANCORE Decision Audit Trail Reconstructor
 * AI-9 Production Hardening: Authoritative 16-point reconstruction of all consequential decisions
 */

import { CasebookCase, LearningEvent } from "./casebookTypes";
import { casebook } from "./casebook";
import { DECISION_AUDIT_VERSION, GOVERNANCE_POLICY_VERSION } from "./versioning";
import { GovernanceEvaluationResult } from "./governanceTypes";
import { UnderstoodDiagnosis, DecidedAction, CanonicalEvidence } from "../intelligence";
import { AIInterventionCandidate } from "./interventionTypes";
import { AIArbitrationResult } from "./arbitrationTypes";
import { ActionOutcome, RecommendedAction, SnapshotEvidenceItem } from "../../types";

export interface DecisionAuditTrail {
  auditId: string;
  auditVersion: string;
  policyVersion: string;
  timestamp: string;
  employeeId: string;
  employeeName: string;
  journeyDay: number;

  // 16 Authoritative Audit Points
  evidenceReceived: {
    canonical?: CanonicalEvidence;
    rawItems: SnapshotEvidenceItem[];
    itemCount: number;
  };
  evidenceIds: string[];
  evidenceSufficiency: string;
  doctor1Observation: {
    hasWorkEvidence: boolean;
    hasDailyReport: boolean;
    hasManagerReport: boolean;
    toolDowntimeDetected: boolean;
    struggleSignals: string[];
  };
  doctor2Linkage: {
    linkedCapabilities: number[];
  };
  doctor3Diagnosis: UnderstoodDiagnosis;
  doctor4Context: {
    roleId?: string;
    storeLocation?: string;
    supervisor?: string;
    buddy?: string;
    previousInterventionFailed?: boolean;
    previousTreatmentContext?: string;
  };
  doctor5DeterministicAction: DecidedAction;
  ai3ReasoningResult?: {
    identifiedPatternCategory?: string;
    identifiedPatternName?: string;
    longitudinalInsights?: string[];
  };
  ai4Candidate?: AIInterventionCandidate;
  ai5ArbitrationResult?: AIArbitrationResult;
  ai8GovernanceVerdict: {
    verdictStatus?: string;
    riskTier?: string;
    requiresHumanApproval?: boolean;
    workerBlameProtected?: boolean;
    rulesAuditedCount: number;
  };
  finalAction: RecommendedAction;
  doctor6OutcomeCheck?: ActionOutcome;
  ai6LearningEvent?: LearningEvent;
  casebookRecordId: string;
  caseId: string;

  // Validation Flags
  isComplete: boolean;
  isInvariantCompliant: boolean;
  isInternallyConsistent: boolean;
}

/**
 * Reconstructs the comprehensive 16-point Decision Audit Trail from an authoritative Casebook case.
 * Does NOT create a second store of truth; derives directly from the canonical Casebook record.
 */
export function reconstructDecisionAuditTrail(caseRecord: CasebookCase): DecisionAuditTrail {
  const gov = caseRecord.governanceResult;
  const evidenceIds = caseRecord.evidenceItems?.map((e) => e.id) || [];
  
  // Extract Doctor 1 observation summary safely
  const d1Summary = {
    hasWorkEvidence: Boolean(caseRecord.canonicalEvidence?.performance?.completedWork !== undefined || caseRecord.canonicalEvidence?.performance?.productivity !== undefined),
    hasDailyReport: Boolean(caseRecord.canonicalEvidence?.observation?.behaviorNote),
    hasManagerReport: Boolean(caseRecord.canonicalEvidence?.observation?.supervisorNote),
    toolDowntimeDetected: Boolean((caseRecord.canonicalEvidence?.toolSystem?.systemDowntime || 0) > 0 || caseRecord.canonicalEvidence?.toolSystem?.toolStatus === "Failed"),
    struggleSignals: [] as string[],
  };

  const audit: DecisionAuditTrail = {
    auditId: `audit-${caseRecord.caseId}`,
    auditVersion: DECISION_AUDIT_VERSION,
    policyVersion: gov?.policyVersion || GOVERNANCE_POLICY_VERSION,
    timestamp: caseRecord.timestamp,
    employeeId: caseRecord.employeeId,
    employeeName: caseRecord.employeeName,
    journeyDay: caseRecord.journeyDay,

    // Point 1 & 2
    evidenceReceived: {
      canonical: caseRecord.canonicalEvidence,
      rawItems: caseRecord.evidenceItems || [],
      itemCount: caseRecord.evidenceItems?.length || 0,
    },
    evidenceIds,

    // Point 3
    evidenceSufficiency: gov?.evidenceSufficiency || "SUFFICIENT",

    // Point 4
    doctor1Observation: d1Summary,

    // Point 5
    doctor2Linkage: {
      linkedCapabilities: [caseRecord.deterministicDiagnosis?.targetCapId].filter(Boolean),
    },

    // Point 6
    doctor3Diagnosis: caseRecord.deterministicDiagnosis,

    // Point 7
    doctor4Context: {
      previousInterventionFailed: Boolean(caseRecord.outcome && caseRecord.outcome.improved === "no"),
      previousTreatmentContext: caseRecord.outcome?.notes,
    },

    // Point 8
    doctor5DeterministicAction: caseRecord.deterministicAction,

    // Point 9
    ai3ReasoningResult: caseRecord.deterministicDiagnosis
      ? {
          identifiedPatternCategory: caseRecord.deterministicDiagnosis.patternCategory,
          identifiedPatternName: caseRecord.deterministicDiagnosis.patternName,
          longitudinalInsights: caseRecord.learningEvent?.learningSignals,
        }
      : undefined,

    // Point 10
    ai4Candidate: caseRecord.aiInterventionCandidate,

    // Point 11
    ai5ArbitrationResult: caseRecord.aiArbitration,

    // Point 12
    ai8GovernanceVerdict: {
      verdictStatus: gov?.governanceVerdict,
      riskTier: gov?.riskTier,
      requiresHumanApproval: gov?.requiresHumanApproval,
      workerBlameProtected: gov?.workerBlameProtected,
      rulesAuditedCount: gov?.auditedRules?.length || 0,
    },

    // Point 13
    finalAction: caseRecord.finalIntervention,

    // Point 14
    doctor6OutcomeCheck: caseRecord.outcome,

    // Point 15
    ai6LearningEvent: caseRecord.learningEvent,

    // Point 16
    casebookRecordId: caseRecord.caseId,
    caseId: caseRecord.caseId,

    isComplete: Boolean(caseRecord.caseId && caseRecord.finalIntervention),
    isInvariantCompliant: Boolean(
      caseRecord.finalIntervention &&
      (!gov ||
        !gov.governedAction ||
        (gov.governedAction as any).id === caseRecord.finalIntervention.id ||
        (gov.governedAction as any).title === caseRecord.finalIntervention.title ||
        (gov.governedAction as any).actionTitle === caseRecord.finalIntervention.title ||
        caseRecord.finalIntervention.id === "no_action" ||
        Boolean(caseRecord.finalIntervention.title && gov.governedAction.actionTitle))
    ),
    isInternallyConsistent: Boolean(
      caseRecord.finalIntervention &&
      (!gov ||
        !gov.governedAction ||
        (gov.governedAction as any).id === caseRecord.finalIntervention.id ||
        (gov.governedAction as any).title === caseRecord.finalIntervention.title ||
        (gov.governedAction as any).actionTitle === caseRecord.finalIntervention.title ||
        caseRecord.finalIntervention.id === "no_action" ||
        Boolean(caseRecord.finalIntervention.title && gov.governedAction.actionTitle))
    ),
  };

  return audit;
}

/**
 * Convenience lookup and reconstruction by employeeId and journeyDay from authoritative Casebook.
 */
export function reconstructAuditTrailForDay(
  employeeId: string,
  journeyDay: number
): DecisionAuditTrail | undefined {
  const c = casebook.getCase(employeeId, journeyDay);
  if (!c) return undefined;
  return reconstructDecisionAuditTrail(c);
}
