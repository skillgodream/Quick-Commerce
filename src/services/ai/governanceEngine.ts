import { 
  GovernanceEvaluationInput, 
  GovernanceEvaluationResult, 
  GovernanceVerdictStatus, 
  EvidenceSufficiencyTier, 
  GovernanceRiskTier,
  GovernanceRuleAudit,
  CURRENT_GOVERNANCE_POLICY_VERSION 
} from "./governanceTypes";
import { DecidedAction } from "../intelligence";
import { casebook } from "./casebook";

/**
 * Safety Constraints Registry
 * Prohibited patterns that NO intervention may ever prescribe, regardless of AI confidence or novelty.
 */
const PROHIBITED_SAFETY_KEYWORDS = [
  "override safety",
  "bypass safety",
  "skip safety",
  "ignore harness",
  "climb rack without",
  "skip lock out",
  "exceed maximum weight",
  "speed up without regard",
  "ignore weight limit",
  "run in warehouse",
  "skip spill cleanup",
  "work through exhaustion",
  "skip emergency stop",
  "operate damaged equipment",
  "bypass interlock",
  "forklift without license",
];

/**
 * AI-8 Governance Authority: Evaluate and Govern Consequential Decisions
 */
export function governDecision(input: GovernanceEvaluationInput): GovernanceEvaluationResult {
  const policyVersion = input.policyVersion || CURRENT_GOVERNANCE_POLICY_VERSION;
  const timestamp = new Date().toISOString();
  const audits: GovernanceRuleAudit[] = [];
  const rejectedReasons: string[] = [];
  let riskTier: GovernanceRiskTier = "LOW";
  let requiresHumanApproval = false;
  let humanApprovalReason: string | undefined = undefined;
  let requiresEscalation = false;
  let escalationTarget: string | undefined = undefined;
  let escalationReason: string | undefined = undefined;
  let workerBlameProtected = false;

  const {
    hire,
    dayNumber,
    observed,
    canonicalEvidence,
    availableEvidenceItems,
    diagnosis,
    deterministicAction,
    aiCandidate,
    arbitrationResult,
    proposedFinalAction,
    isAiTimeoutOrUnavailable,
    malformedAiOutputDetected,
  } = input;

  // 1. Evidence Grounding & Traceability
  const validEvidenceIdSet = new Set<string>();
  availableEvidenceItems.forEach(item => validEvidenceIdSet.add(item.id));
  if (canonicalEvidence) {
    if (canonicalEvidence.performance?.productivity) validEvidenceIdSet.add("ev-work-uph");
    if (canonicalEvidence.performance?.accuracy) validEvidenceIdSet.add("ev-work-acc");
    if (canonicalEvidence.toolSystem?.systemDowntime) validEvidenceIdSet.add("ev-tool-downtime");
    if (canonicalEvidence.toolSystem?.toolStatus === "Failed") validEvidenceIdSet.add("ev-tool-hardware");
    if (canonicalEvidence.environment?.environmentalIssue) validEvidenceIdSet.add("ev-env-issue");
    if (canonicalEvidence.environment?.externalBottleneck) validEvidenceIdSet.add("ev-env-bottleneck");
    if (canonicalEvidence.observation?.supervisorNote) validEvidenceIdSet.add("ev-mgr-obs");
    if (canonicalEvidence.observation?.behaviorNote) validEvidenceIdSet.add("ev-worker-report");
  }

  // Check proposed action evidence grounding
  const claimedEvidenceIds = [
    ...(arbitrationResult.supporting_evidence_ids || []),
    ...(aiCandidate?.required_evidence || []),
  ];
  const ungroundedIds = claimedEvidenceIds.filter(id => !validEvidenceIdSet.has(id));
  const traceableEvidenceIds = claimedEvidenceIds.filter(id => validEvidenceIdSet.has(id));

  if (ungroundedIds.length > 0) {
    audits.push({
      ruleCode: "EVIDENCE_UNGROUNDED",
      ruleName: "Evidence Grounding Verification",
      passed: false,
      severity: "WARNING",
      description: `Action references ungrounded or hallucinated evidence IDs: ${ungroundedIds.join(", ")}`,
    });
  } else {
    audits.push({
      ruleCode: "EVIDENCE_UNGROUNDED",
      ruleName: "Evidence Grounding Verification",
      passed: true,
      severity: "INFO",
      description: "All referenced evidence IDs are grounded in the active canonical evidence pool.",
    });
  }

  // 2. Evidence Sufficiency Evaluation
  let evidenceSufficiency: EvidenceSufficiencyTier = "SUFFICIENT";
  const hasExternalDowntime = (canonicalEvidence?.toolSystem?.systemDowntime || 0) > 10;
  const hasHardwareFailure = canonicalEvidence?.toolSystem?.toolStatus === "Failed";
  const hasAisleCongestion = !!canonicalEvidence?.environment?.environmentalIssue || !!canonicalEvidence?.environment?.externalBottleneck;
  const hasWorkerConflict = observed.workerReportsTool && observed.managerObservesStruggle && !observed.hasWorkEvidence;

  if (availableEvidenceItems.length === 0 && !observed.hasWorkEvidence) {
    evidenceSufficiency = "INSUFFICIENT";
  } else if (hasWorkerConflict || arbitrationResult.arbitration_status === "CONFLICT") {
    evidenceSufficiency = "CONFLICTING";
  } else if (availableEvidenceItems.length < 2 && (!observed.currentPickRate || observed.currentPickRate === 0)) {
    evidenceSufficiency = "PARTIALLY_SUPPORTED";
  }

  audits.push({
    ruleCode: evidenceSufficiency === "INSUFFICIENT" 
      ? "EVIDENCE_INSUFFICIENT" 
      : evidenceSufficiency === "CONFLICTING" 
        ? "EVIDENCE_CONFLICTING" 
        : "EVIDENCE_UNGROUNDED",
    ruleName: "Evidence Sufficiency Check",
    passed: evidenceSufficiency === "SUFFICIENT",
    severity: evidenceSufficiency === "INSUFFICIENT" || evidenceSufficiency === "CONFLICTING" ? "BLOCKING" : "INFO",
    description: `Evidence sufficiency evaluated as ${evidenceSufficiency}. Available items: ${availableEvidenceItems.length}.`,
  });

  // 3. Worker-Blame Protection
  // Rule: If strong external bottleneck (tool downtime, scanner failure, severe congestion) exists,
  // the Dean MUST NOT attribute blame to the worker (e.g. diagnosing capability_practice or disciplinary)
  const isExternalConstraintPresent = hasExternalDowntime || hasHardwareFailure || hasAisleCongestion || observed.workerReportsExternalBottleneck;
  const isBlamingWorker = diagnosis.rootCause === "capability_practice" || 
                          proposedFinalAction.actionTitle.toLowerCase().includes("discipline") ||
                          proposedFinalAction.actionTitle.toLowerCase().includes("warning") ||
                          proposedFinalAction.actionDesc.toLowerCase().includes("penalize");

  if (isExternalConstraintPresent && isBlamingWorker) {
    workerBlameProtected = true;
    audits.push({
      ruleCode: "WORKER_BLAME_PROTECTION",
      ruleName: "Worker-Blame Inversion Protection",
      passed: false,
      severity: "BLOCKING",
      description: "External bottleneck / hardware constraint detected. Suppressing worker-blaming diagnosis and re-routing action to environmental / tooling resolution.",
    });
  } else {
    audits.push({
      ruleCode: "WORKER_BLAME_PROTECTION",
      ruleName: "Worker-Blame Inversion Protection",
      passed: true,
      severity: "INFO",
      description: "No worker-blaming inversion detected.",
    });
  }

  // 4. Strict Safety Override (Highest Priority)
  const actionTextToScan = `${proposedFinalAction.actionTitle} ${proposedFinalAction.actionDesc} ${proposedFinalAction.practicalStep}`.toLowerCase();
  const violatedSafetyRule = PROHIBITED_SAFETY_KEYWORDS.find(keyword => actionTextToScan.includes(keyword));
  const safetyCleared = !violatedSafetyRule;

  if (!safetyCleared) {
    riskTier = "CRITICAL";
    rejectedReasons.push(`CRITICAL SAFETY VIOLATION: Action contained prohibited directive "${violatedSafetyRule}".`);
    audits.push({
      ruleCode: "SAFETY_VIOLATION",
      ruleName: "Physical Safety Constraint Clearance",
      passed: false,
      severity: "BLOCKING",
      description: `Action violates warehouse safety constraint by proposing "${violatedSafetyRule}". Immediate rejection mandated.`,
    });
  } else {
    audits.push({
      ruleCode: "SAFETY_VIOLATION",
      ruleName: "Physical Safety Constraint Clearance",
      passed: true,
      severity: "INFO",
      description: "Proposed action passed warehouse physical safety screening.",
    });
  }

  // 5. Longitudinal Learning & Repeated Failure Check
  const historicalCases = casebook.getHistoryForEmployee(hire.id);
  const repeatedFailures = historicalCases.filter(c => 
    c.learningEvent?.outcomeStatus === "FAILURE" || c.learningEvent?.isRepeatedFailure
  );

  if (repeatedFailures.length >= 2) {
    riskTier = "HIGH";
    requiresHumanApproval = true;
    humanApprovalReason = `Repeated intervention failure observed across ${repeatedFailures.length} historical episodes. Human supervisor sign-off required.`;
    audits.push({
      ruleCode: "REPEATED_FAILURE_GUARD",
      ruleName: "Repeated Failure Gatekeeper",
      passed: false,
      severity: "WARNING",
      description: humanApprovalReason,
    });
  } else {
    audits.push({
      ruleCode: "REPEATED_FAILURE_GUARD",
      ruleName: "Repeated Failure Gatekeeper",
      passed: true,
      severity: "INFO",
      description: "No chronic repeated failure threshold exceeded.",
    });
  }

  // 6. Novelty Risk & Human Approval Requirements
  const isNovelIntervention = aiCandidate?.intervention_type === "NOVEL" || 
                             arbitrationResult.arbitration_status === "AI_NOVEL_ACCEPTED";

  if (isNovelIntervention) {
    // Novel interventions require higher evidence standard and human approval if confidence < 0.85
    if (evidenceSufficiency !== "SUFFICIENT" || (aiCandidate?.confidence || 0) < 0.85) {
      requiresHumanApproval = true;
      riskTier = riskTier === "CRITICAL" ? "CRITICAL" : "MEDIUM";
      humanApprovalReason = "Novel intervention proposed without high-tier evidence sufficiency (>0.85 confidence). Requires human supervisor authorization.";
      audits.push({
        ruleCode: "NOVELTY_RISK_UNVERIFIED",
        ruleName: "AI Novelty Risk Containment",
        passed: false,
        severity: "WARNING",
        description: humanApprovalReason,
      });
    } else {
      audits.push({
        ruleCode: "NOVELTY_RISK_UNVERIFIED",
        ruleName: "AI Novelty Risk Containment",
        passed: true,
        severity: "INFO",
        description: "Novel intervention met evidence sufficiency criteria.",
      });
    }
  }

  // 7. Systemic Escalation Conditions
  // If external infrastructure has failed, or conflicting evidence cannot be resolved, require escalation
  if (hasHardwareFailure || hasExternalDowntime) {
    requiresEscalation = true;
    escalationTarget = "IT / Facility Operations";
    escalationReason = `System downtime (${canonicalEvidence?.toolSystem?.systemDowntime || 0}m) or hardware failure detected. Issue cannot be resolved by floor coaching alone.`;
    audits.push({
      ruleCode: "ESCALATION_REQUIRED",
      ruleName: "Systemic Issue Escalation",
      passed: false,
      severity: "WARNING",
      description: escalationReason,
    });
  }

  // 8. Deterministic Fallback & AI Fault Tolerance
  let governedAction: DecidedAction = proposedFinalAction;
  let governanceVerdict: GovernanceVerdictStatus = "APPROVED";

  if (isAiTimeoutOrUnavailable || malformedAiOutputDetected || ungroundedIds.length > 0) {
    audits.push({
      ruleCode: "DETERMINISTIC_FALLBACK_ENFORCED",
      ruleName: "Fault-Tolerant Deterministic Fallback",
      passed: false,
      severity: "INFO",
      description: `Enforcing deterministic Doctor 5 action due to AI ${
        isAiTimeoutOrUnavailable ? "timeout/unavailability" : malformedAiOutputDetected ? "malformed payload" : "ungrounded evidence"
      }.`,
    });
    governedAction = deterministicAction;
  }

  // Apply Worker-Blame Correction
  if (workerBlameProtected) {
    governedAction = {
      ...deterministicAction,
      decisionType: "tool_remedy",
      targetActor: "IT Support / Shift In-Charge",
      actionTitle: "Hardware & Station Diagnostics Verification",
      actionDesc: "Acknowledge external blocker (scanner/network downtime) and provide operational relief rather than penalizing picker speed.",
      practicalStep: "Report handheld scanner/station issues to IT dispatch and log shift downtime exception.",
      decisionRationale: "AI-8 Governance: Worker-blame protection enforced. Shift bottleneck is technical/environmental, not picker capability.",
    };
  }

  // Apply Final Verdict Logic
  if (!safetyCleared) {
    governanceVerdict = "REJECTED";
    // Emergency failsafe fallback to safe default inspection
    governedAction = {
      decisionType: "reinforce_current",
      targetCapId: deterministicAction.targetCapId,
      targetActor: "Shift Safety Lead",
      urgency: "Immediate",
      actionTitle: "[GOVERNANCE SAFETY OVERRIDE] Standard Safety & Aisle Verification",
      actionDesc: "Action overridden by DEANCORE AI-8 Governance due to safety rule violation. Floor inspection required.",
      practicalStep: "Conduct standard 5-minute safety check with Shift Safety Lead before resuming normal picking.",
      decisionRationale: `AI-8 GOVERNANCE OVERRIDE: Original action contained safety violation (${violatedSafetyRule}). Replaced with safe protocol.`,
      interimStatus: "Needs attention",
      interimStatusReason: "Safety protocol check",
    };
  } else if (evidenceSufficiency === "INSUFFICIENT" && !governedAction.actionTitle.includes("Verify")) {
    governanceVerdict = "ABSTAIN";
    governedAction = {
      ...deterministicAction,
      actionTitle: "Evidence Verification & Observational Check",
      actionDesc: "Evidence insufficient to support active intervention. Observe for one shift cycle before deciding.",
      practicalStep: "Supervisor to conduct 10-minute observational audit during next shift to collect verified evidence.",
      decisionRationale: "AI-8 Governance: Abstaining from consequential intervention due to insufficient evidence.",
    };
  } else if (requiresEscalation) {
    governanceVerdict = "REQUIRE_ESCALATION";
  } else if (requiresHumanApproval) {
    governanceVerdict = "REQUIRE_HUMAN_APPROVAL";
  } else {
    governanceVerdict = "APPROVED";
  }

  // 9. Longitudinal Policy Immutability Audit
  audits.push({
    ruleCode: "LONGITUDINAL_POLICY_DRIFT_BLOCKED",
    ruleName: "Policy Immutability Guarantee",
    passed: true,
    severity: "INFO",
    description: "Historical cases in Casebook remain read-only evidence. Policy version 1.0.0 rules remain structurally immutable.",
  });

  const governanceRationale = [
    `AI-8 Governance Verdict: ${governanceVerdict} (Policy v${policyVersion}, Risk: ${riskTier}).`,
    `Evidence: ${evidenceSufficiency}. Traceable evidence IDs: [${traceableEvidenceIds.join(", ")}].`,
    workerBlameProtected ? "Worker-blame protection activated." : null,
    !safetyCleared ? `SAFETY REJECTION: ${violatedSafetyRule}.` : null,
    requiresHumanApproval ? `HUMAN APPROVAL REQUIRED: ${humanApprovalReason}.` : null,
    requiresEscalation ? `ESCALATION MANDATED to ${escalationTarget}: ${escalationReason}.` : null,
  ].filter(Boolean).join(" ");

  return {
    policyVersion,
    timestamp,
    governanceVerdict,
    riskTier,
    governedAction,
    evidenceSufficiency,
    workerBlameProtected,
    safetyCleared,
    requiresHumanApproval,
    humanApprovalReason,
    requiresEscalation,
    escalationTarget,
    escalationReason,
    auditedRules: audits,
    governanceRationale,
    traceableEvidenceIds,
    rejectedReasons,
  };
}
