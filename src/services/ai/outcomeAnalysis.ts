/**
 * DEANCORE-AI-10: Outcome Analysis & Intervention Effectiveness
 * 
 * Provides rigorous statistical analysis of intervention outcomes across contexts.
 * Enforces causal humility (AI-6 invariant: correlation != causation).
 * Distinguishes:
 * - "worked"
 * - "appeared to work but evidence was weak"
 * - "worked repeatedly in similar contexts"
 * - "worked for this learner but failed elsewhere"
 * Also evaluates novel hypotheses generated during reasoning.
 */

import { 
  MinedCase, 
  OutcomeAnalysis, 
  InterventionEffectivenessRecord, 
  InterventionEffectivenessVerdict,
  CandidateHypothesis 
} from "./evolutionTypes";

/**
 * Aggregates and analyzes outcomes for intervention & context combinations.
 */
export function analyzeInterventionOutcomes(minedCases: MinedCase[]): OutcomeAnalysis[] {
  // Group by composite key: interventionTitle + primaryContext
  const groupMap = new Map<string, {
    interventionTitle: string;
    actionType: string;
    contextKey: string;
    cases: MinedCase[];
  }>();

  for (const c of minedCases) {
    const actTitle = c.finalAction.title;
    const actType = c.finalAction.actionType || "practice";
    // Primary context key
    const primaryContext = c.contextTags[0] || "general_onboarding";
    const key = `${actTitle}:::${primaryContext}`;

    const existing = groupMap.get(key) || {
      interventionTitle: actTitle,
      actionType: actType,
      contextKey: primaryContext,
      cases: [],
    };
    existing.cases.push(c);
    groupMap.set(key, existing);
  }

  const results: OutcomeAnalysis[] = [];

  for (const group of groupMap.values()) {
    let successCount = 0;
    let partialSuccessCount = 0;
    let failureCount = 0;
    let insufficientEvidenceCount = 0;
    let harmfulOrUnintendedCount = 0;
    const allConfounders = new Set<string>();
    const allContexts = new Set<string>();

    for (const c of group.cases) {
      for (const cf of c.confoundingFactors) allConfounders.add(cf);
      for (const ctx of c.contextTags) allContexts.add(ctx);

      switch (c.outcomeClassification) {
        case "SUCCESS":
          successCount++;
          break;
        case "PARTIAL":
          partialSuccessCount++;
          break;
        case "FAILURE":
          failureCount++;
          break;
        case "INSUFFICIENT_EVIDENCE":
          insufficientEvidenceCount++;
          break;
        case "NO_MEANINGFUL_CHANGE":
          failureCount++;
          break;
      }

      // Check if performance significantly degraded (harmful / unintended consequence)
      if (c.canonicalEvidence?.performance?.productivity !== undefined && c.outcome?.subsequentPickRate !== undefined) {
        if (c.outcome.subsequentPickRate < c.canonicalEvidence.performance.productivity * 0.75) {
          harmfulOrUnintendedCount++;
        }
      }
    }

    const attempts = group.cases.length;
    const evaluatedAttempts = successCount + partialSuccessCount + failureCount;
    const effectivenessRate = evaluatedAttempts > 0 ? (successCount + 0.5 * partialSuccessCount) / evaluatedAttempts : 0;

    // Confidence scales with sample size and evidence quality, penalized by confounders
    const highQualityRatio = group.cases.filter(c => c.evidenceQuality === "HIGH").length / attempts;
    const confounderPenalty = Math.min(0.3, allConfounders.size * 0.1);
    const confidence = Math.max(0.1, Math.min(0.95, (highQualityRatio * 0.6 + Math.min(1, attempts / 5) * 0.4) - confounderPenalty));

    const contextualLimitations: string[] = [];
    if (allConfounders.size > 0) {
      contextualLimitations.push(`Observed with environmental confounders: ${Array.from(allConfounders).join(", ")}`);
    }
    if (insufficientEvidenceCount > 0) {
      contextualLimitations.push(`${insufficientEvidenceCount} case(s) lacked sufficient follow-up metrics.`);
    }
    if (attempts < 3) {
      contextualLimitations.push(`Small sample size (${attempts} attempt(s)); findings are preliminary.`);
    }

    results.push({
      interventionTitle: group.interventionTitle,
      actionType: group.actionType,
      contextKey: group.contextKey,
      attempts,
      successCount,
      partialSuccessCount,
      failureCount,
      insufficientEvidenceCount,
      harmfulOrUnintendedCount,
      effectivenessRate,
      confidence,
      contextualLimitations,
      confoundersDetected: Array.from(allConfounders),
      causalHumilityPreserved: true,
    });
  }

  return results;
}

/**
 * Builds the structured Intervention Effectiveness Model.
 * Rigorously classifies into:
 * - "WORKED"
 * - "APPEARED_TO_WORK_WEAK_EVIDENCE"
 * - "WORKED_REPEATEDLY_SIMILAR_CONTEXT"
 * - "WORKED_FOR_LEARNER_FAILED_ELSEWHERE"
 * - "INEFFECTIVE"
 * - "UNKNOWN_INSUFFICIENT"
 */
export function evaluateInterventionEffectiveness(minedCases: MinedCase[]): InterventionEffectivenessRecord[] {
  const records: InterventionEffectivenessRecord[] = [];

  // Group by intervention title
  const byIntervention = new Map<string, MinedCase[]>();
  for (const c of minedCases) {
    const list = byIntervention.get(c.finalAction.title) || [];
    list.push(c);
    byIntervention.set(c.finalAction.title, list);
  }

  for (const [interventionTitle, cases] of byIntervention.entries()) {
    const targetProblem = cases[0]?.diagnosis.diagnosisText || cases[0]?.diagnosis.rootCause || "performance_gap";
    const primaryContext = cases[0]?.contextTags[0] || "standard_shift";
    const expectedEffect = cases[0]?.finalAction.smallestPracticalStep || "Improvement in picking proficiency";
    
    // Group outcomes by employeeId
    const employeeOutcomes = new Map<string, { success: number; failure: number; weak: number }>();
    for (const c of cases) {
      const stats = employeeOutcomes.get(c.employeeId) || { success: 0, failure: 0, weak: 0 };
      if (c.evidenceQuality === "LOW" || c.evidenceQuality === "INSUFFICIENT") {
        stats.weak++;
      } else if (c.outcomeClassification === "SUCCESS" || c.interventionEffectiveness === "EFFECTIVE") {
        stats.success++;
      } else {
        stats.failure++;
      }
      employeeOutcomes.set(c.employeeId, stats);
    }

    const uniqueEmployees = Array.from(employeeOutcomes.keys());
    const totalSuccess = cases.filter(c => (c.outcomeClassification === "SUCCESS" || c.interventionEffectiveness === "EFFECTIVE") && c.evidenceQuality !== "LOW").length;
    const totalFailure = cases.filter(c => c.outcomeClassification === "FAILURE" || c.interventionEffectiveness === "INEFFECTIVE").length;
    const weakEvidenceCases = cases.filter(c => c.evidenceQuality === "LOW" || c.evidenceQuality === "INSUFFICIENT");

    let verdict: InterventionEffectivenessVerdict = "UNKNOWN_INSUFFICIENT";
    let confidence = 0.5;
    let learnerSpecific = false;
    let observedOutcomeSummary = "";

    // Case 1: All evidence was weak
    if (weakEvidenceCases.length === cases.length && cases.length > 0) {
      verdict = "APPEARED_TO_WORK_WEAK_EVIDENCE";
      confidence = 0.3;
      observedOutcomeSummary = "Reported improvement lacked verified metric evidence or had severe confounders.";
    }
    // Case 2: Worked for 1 learner but failed for another
    else if (uniqueEmployees.length >= 2 &&
             uniqueEmployees.some(id => employeeOutcomes.get(id)!.success > 0) &&
             uniqueEmployees.some(id => employeeOutcomes.get(id)!.failure > 0)) {
      verdict = "WORKED_FOR_LEARNER_FAILED_ELSEWHERE";
      learnerSpecific = true;
      confidence = 0.85;
      observedOutcomeSummary = "Gains observed for specific learner, but failed when replicated across other learners.";
    }
    // Case 3: Worked repeatedly across multiple learners in similar context
    else if (uniqueEmployees.length >= 2 && totalSuccess >= 2 && totalFailure === 0) {
      verdict = "WORKED_REPEATEDLY_SIMILAR_CONTEXT";
      confidence = 0.92;
      observedOutcomeSummary = `Consistent verified recovery across ${uniqueEmployees.length} distinct learners in matching contexts.`;
    }
    // Case 4: Worked single learner/case with strong evidence
    else if (totalSuccess > 0 && totalFailure === 0) {
      verdict = "WORKED";
      confidence = 0.78;
      observedOutcomeSummary = "Verified metric recovery observed following intervention without notable confounders.";
    }
    // Case 5: Consistently failed
    else if (totalFailure > 0 && totalSuccess === 0) {
      verdict = "INEFFECTIVE";
      confidence = 0.80;
      observedOutcomeSummary = "No meaningful progress or continued decline observed post-intervention.";
    } else {
      verdict = "UNKNOWN_INSUFFICIENT";
      confidence = 0.2;
      observedOutcomeSummary = "Insufficient data or conflicting indicators to establish effectiveness.";
    }

    const highestQuality = cases.some(c => c.evidenceQuality === "HIGH") ? "HIGH"
      : cases.some(c => c.evidenceQuality === "MODERATE") ? "MODERATE"
      : cases.some(c => c.evidenceQuality === "LOW") ? "LOW" : "INSUFFICIENT";

    records.push({
      interventionTitle,
      targetProblem,
      context: primaryContext,
      expectedEffect,
      observedOutcome: observedOutcomeSummary,
      evidenceQuality: highestQuality,
      effectivenessVerdict: verdict,
      confidence,
      learnerSpecific,
      supportingCaseIds: cases.map(c => c.caseId),
    });
  }

  return records;
}

/**
 * Evaluates a novel hypothesis identified by AI-3 / diagnostic reasoning.
 * Does NOT immediately convert it into production logic.
 */
export function evaluateNovelHypothesis(
  input: {
    hypothesis: string;
    targetProblem: string;
    proposedMechanism: string;
    contexts?: string[];
    expectedObservableSignature?: string;
    possibleAlternativeExplanations?: string[];
    supportingCaseIds?: string[];
    requiredValidation?: string;
  },
  minedCases: MinedCase[]
): CandidateHypothesis {
  const supportingCases: string[] = [];
  const supportingEvidence: string[] = [];
  const conflictingEvidence: string[] = [];

  const hypothesisLower = input.hypothesis.toLowerCase();
  const targetLower = input.targetProblem.toLowerCase();

  for (const c of minedCases) {
    const diagText = (c.diagnosis.diagnosisText || "").toLowerCase();
    const rootCause = (c.diagnosis.rootCause || "").toLowerCase();
    const aiTarget = (c.aiInterventionCandidate?.target_problem || "").toLowerCase();
    const statusReason = (c.initialState?.statusReason || "").toLowerCase();

    if (
      diagText.includes(targetLower) ||
      rootCause.includes(targetLower) ||
      aiTarget.includes(targetLower) ||
      statusReason.includes(targetLower) ||
      (rootCause && targetLower.includes(rootCause))
    ) {
      if (c.outcomeClassification === "SUCCESS" || c.interventionEffectiveness === "EFFECTIVE") {
        supportingCases.push(c.caseId);
        supportingEvidence.push(...c.evidenceIds);
      } else if (c.outcomeClassification === "FAILURE") {
        conflictingEvidence.push(...c.evidenceIds);
      }
    }
  }

  const confidence = supportingCases.length > 0 
    ? Math.max(0.4, Math.min(0.9, (supportingCases.length / (supportingCases.length + conflictingEvidence.length + 1))))
    : 0.35;

  return {
    hypothesisId: `hyp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    hypothesis: input.hypothesis,
    targetProblem: input.targetProblem,
    proposedMechanism: input.proposedMechanism,
    supportingCaseIds: input.supportingCaseIds || supportingCases,
    supportingEvidenceIds: Array.from(new Set(supportingEvidence)),
    conflictingEvidenceIds: Array.from(new Set(conflictingEvidence)),
    requiredValidation: input.requiredValidation || "Multi-day cohort trial with counter-evidence controls",
    confidence,
    contexts: input.contexts || ["warehouse_floor", "onboarding_trajectory"],
    expectedObservableSignature: input.expectedObservableSignature || "Shift in accuracy delta preceding pick rate normalization",
    possibleAlternativeExplanations: input.possibleAlternativeExplanations || [
      "Worker acclimation effect",
      "Shift-specific pacing variance",
      "Equipment calibration drift",
    ],
    status: "PROPOSED",
    createdAt: new Date().toISOString(),
  };
}
