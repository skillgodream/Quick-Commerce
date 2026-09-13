/**
 * DEANCORE-AI-10: Case Mining Layer
 * 
 * Extracts structured cases from existing Casebook records without creating a second historical truth.
 * Preserves complete traceability, evidence IDs, context, and longitudinal signals while
 * defending against prompt injection, fabricated evidence, duplicate cases, and poisoned outcomes.
 */

import { CasebookCase, LearningEvent } from "./casebookTypes";
import { casebook } from "./casebook";
import { MinedCase, CaseMiningStats } from "./evolutionTypes";

// Known injection and jailbreak signatures
const INJECTION_PATTERNS = [
  /ignore (all )?(previous|prior) instructions/i,
  /system override/i,
  /approve (hire|new hire) immediately/i,
  /grant certification/i,
  /bypass governance/i,
  /disregard safety/i,
  /give high rating/i,
  /set readiness to 100/i,
  /force job ready/i,
  /<script\b[^>]*>/i,
  /javascript:/i,
  /eval\(/i,
  /DROP TABLE/i,
  /DELETE FROM/i,
];

/**
 * Sanitizes untrusted text in historical notes and flags prompt injection attempts.
 */
export function sanitizeHistoricalText(text?: string): {
  sanitized: string;
  injectionDetected: boolean;
  flags: string[];
} {
  if (!text || typeof text !== "string") {
    return { sanitized: "", injectionDetected: false, flags: [] };
  }

  const flags: string[] = [];
  let injectionDetected = false;

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      injectionDetected = true;
      flags.push(`INJECTION_DETECTED: ${pattern.source}`);
    }
  }

  // Strip dangerous html tags and escape quotes/special chars
  let sanitized = text
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
    .trim();

  if (injectionDetected) {
    sanitized = `[UNTRUSTED_CONTENT_FLAGGED] ${sanitized}`;
  }

  return { sanitized, injectionDetected, flags };
}

/**
 * Validates that an evidence ID actually belongs to the case's evidence items or canonical store.
 * Prevents hallucinated or fabricated evidence IDs from leaking into mining.
 */
export function validateMinedEvidenceIds(
  evidenceIds: string[],
  validEvidenceIds: Set<string>
): { valid: string[]; fabricated: string[] } {
  const valid: string[] = [];
  const fabricated: string[] = [];

  for (const id of evidenceIds) {
    if (validEvidenceIds.has(id)) {
      valid.push(id);
    } else {
      fabricated.push(id);
    }
  }

  return { valid, fabricated };
}

/**
 * Extracts context tags from learner state, journey day, and evidence.
 */
function extractContextTags(caseRecord: CasebookCase): string[] {
  const tags: string[] = [];
  tags.push(`day_${caseRecord.journeyDay}`);
  tags.push(`status_${caseRecord.initialState.status.toLowerCase().replace(/\s+/g, "_")}`);

  if (caseRecord.canonicalEvidence?.performance) {
    const p = caseRecord.canonicalEvidence.performance;
    const prod = p.productivity ?? 0;
    const target = p.targetProductivity ?? 50;
    if (prod < target * 0.7) {
      tags.push("severe_pick_rate_deficit");
    } else if (prod < target) {
      tags.push("moderate_pick_rate_deficit");
    } else {
      tags.push("target_met_or_exceeded");
    }
  }

  if (caseRecord.canonicalEvidence?.environment?.externalBottleneck) {
    tags.push("environmental_bottleneck");
  }

  if (caseRecord.canonicalEvidence?.toolSystem?.toolStatus === "Failed" || (caseRecord.canonicalEvidence?.toolSystem?.systemDowntime && caseRecord.canonicalEvidence.toolSystem.systemDowntime > 0)) {
    tags.push("tool_system_issue");
  }

  if (caseRecord.canonicalEvidence?.attendance?.shiftStatus && caseRecord.canonicalEvidence.attendance.shiftStatus !== "Present") {
    tags.push("punctuality_issue");
  }

  if (caseRecord.deterministicDiagnosis?.patternCategory) {
    tags.push(`pattern_${caseRecord.deterministicDiagnosis.patternCategory.toLowerCase()}`);
  }

  return Array.from(new Set(tags));
}

/**
 * Extracts confounders recorded in beforeAfterSnapshot or canonical evidence.
 */
function extractConfounders(caseRecord: CasebookCase): string[] {
  const confounders: string[] = [];

  if (caseRecord.learningEvent?.beforeAfterSnapshot?.confoundingFactors) {
    confounders.push(...caseRecord.learningEvent.beforeAfterSnapshot.confoundingFactors);
  }

  if (caseRecord.canonicalEvidence?.environment?.externalBottleneck) {
    confounders.push(caseRecord.canonicalEvidence.environment.externalBottleneck);
  }

  if (caseRecord.canonicalEvidence?.toolSystem?.systemDowntime) {
    confounders.push(`System downtime: ${caseRecord.canonicalEvidence.toolSystem.systemDowntime} min`);
  }

  return Array.from(new Set(confounders));
}

/**
 * Classifies data quality based on evidence quantity, metric availability, and verification.
 */
function determineEvidenceQuality(
  caseRecord: CasebookCase,
  hasFabricatedIds: boolean,
  injectionDetected: boolean
): "HIGH" | "MODERATE" | "LOW" | "INSUFFICIENT" {
  if (injectionDetected || hasFabricatedIds) {
    return "LOW";
  }

  if (caseRecord.learningEvent?.evidenceQuality) {
    return caseRecord.learningEvent.evidenceQuality;
  }

  const evidenceCount = (caseRecord.evidenceItems?.length || 0) +
    (caseRecord.canonicalEvidence ? 1 : 0);

  const hasMetrics = Boolean(
    caseRecord.outcome?.subsequentPickRate !== undefined ||
    caseRecord.canonicalEvidence?.performance?.productivity !== undefined
  );

  if (evidenceCount >= 3 && hasMetrics && caseRecord.outcome) {
    return "HIGH";
  } else if (evidenceCount >= 2 && hasMetrics) {
    return "MODERATE";
  } else if (evidenceCount >= 1) {
    return "LOW";
  }
  return "INSUFFICIENT";
}

/**
 * Main Case Mining Function
 * Mines structured, traceable cases from Casebook.
 */
export function mineCasesFromCasebook(casesInput?: CasebookCase[]): {
  minedCases: MinedCase[];
  stats: CaseMiningStats;
} {
  const rawCases = casesInput || casebook.getAllCases();
  const minedCases: MinedCase[] = [];
  const seenKeys = new Set<string>();
  const uniqueEmployees = new Set<string>();

  let highQualityCount = 0;
  let moderateQualityCount = 0;
  let lowQualityCount = 0;
  let insufficientCount = 0;
  let flaggedSecurityCount = 0;
  let duplicatesRemoved = 0;

  for (const record of rawCases) {
    const compositeKey = `${record.employeeId}-d${record.journeyDay}`;
    if (seenKeys.has(compositeKey)) {
      duplicatesRemoved++;
      continue;
    }
    seenKeys.add(compositeKey);
    uniqueEmployees.add(record.employeeId);

    // 1. Gather all legitimate ground-truth evidence IDs from evidenceItems
    const validEvidenceIds = new Set<string>();
    for (const item of record.evidenceItems || []) {
      if (item.id) validEvidenceIds.add(item.id);
    }

    // 2. Validate evidence IDs referenced in learning event
    const referencedIds = record.learningEvent?.evidenceIds || [];
    const { valid, fabricated } = validateMinedEvidenceIds(referencedIds, validEvidenceIds);
    const hasFabricatedIds = fabricated.length > 0;

    // 3. Check notes for prompt injection
    const securityFlags: string[] = [];
    const outcomeNotesSanitization = sanitizeHistoricalText(record.outcome?.notes);
    const reasonSanitization = sanitizeHistoricalText(record.deterministicAction.actionDesc);
    const aiRationaleSanitization = sanitizeHistoricalText(record.aiInterventionCandidate?.why_this_action);

    if (outcomeNotesSanitization.injectionDetected) securityFlags.push(...outcomeNotesSanitization.flags);
    if (reasonSanitization.injectionDetected) securityFlags.push(...reasonSanitization.flags);
    if (aiRationaleSanitization.injectionDetected) securityFlags.push(...aiRationaleSanitization.flags);

    if (hasFabricatedIds) {
      securityFlags.push(`FABRICATED_EVIDENCE_IDS_REJECTED: ${fabricated.join(", ")}`);
    }

    // Check for poisoned outcome metrics
    if (record.outcome?.subsequentPickRate !== undefined) {
      if (record.outcome.subsequentPickRate > 500 || record.outcome.subsequentPickRate < 0) {
        securityFlags.push(`POISONED_OUTCOME_METRIC: subsequentPickRate=${record.outcome.subsequentPickRate}`);
      }
    }

    const injectionDetected = outcomeNotesSanitization.injectionDetected ||
      reasonSanitization.injectionDetected ||
      aiRationaleSanitization.injectionDetected;

    if (securityFlags.length > 0) {
      flaggedSecurityCount++;
    }

    // 4. Quality determination
    const quality = determineEvidenceQuality(record, hasFabricatedIds, injectionDetected);
    if (quality === "HIGH") highQualityCount++;
    else if (quality === "MODERATE") moderateQualityCount++;
    else if (quality === "LOW") lowQualityCount++;
    else insufficientCount++;

    // 5. Evidence sufficiency
    let sufficiency: "SUFFICIENT" | "PARTIAL" | "INSUFFICIENT" = "PARTIAL";
    if (validEvidenceIds.size >= 2) sufficiency = "SUFFICIENT";
    else if (validEvidenceIds.size === 0) sufficiency = "INSUFFICIENT";

    // 6. Complete mined structured case with full traceability
    const mined: MinedCase = {
      caseId: record.caseId,
      employeeId: record.employeeId,
      employeeName: record.employeeName,
      journeyDay: record.journeyDay,
      timestamp: record.timestamp,
      schemaVersion: record.schemaVersion || "2.0.0",

      initialState: {
        status: record.initialState.status,
        statusReason: record.initialState.statusReason,
        readinessScore: record.initialState.readinessScore,
        capabilities: record.initialState.capabilities,
      },

      canonicalEvidence: record.canonicalEvidence,
      evidenceItems: record.evidenceItems || [],
      evidenceIds: Array.from(validEvidenceIds),
      evidenceSufficiency: sufficiency,
      evidenceQuality: quality,

      diagnosis: record.deterministicDiagnosis,
      deterministicAction: record.deterministicAction,
      aiReasoning: record.aiInterventionCandidate?.why_this_action,
      aiInterventionCandidate: record.aiInterventionCandidate,
      arbitrationResult: record.aiArbitration,
      governanceResult: record.governanceResult,
      finalAction: record.finalIntervention,

      outcome: record.outcome,
      learningEvent: record.learningEvent,
      outcomeClassification: record.learningEvent?.outcomeStatus || (record.outcome?.improved ? "SUCCESS" : "NO_MEANINGFUL_CHANGE"),
      interventionEffectiveness: record.learningEvent?.interventionEffectiveness || (record.outcome?.improved ? "EFFECTIVE" : "INEFFECTIVE"),

      contextTags: extractContextTags(record),
      confoundingFactors: extractConfounders(record),
      longitudinalContext: record.learningEvent?.previousInterventionContext,

      isSanitized: injectionDetected || hasFabricatedIds,
      securityFlags,
    };

    minedCases.push(mined);
  }

  return {
    minedCases,
    stats: {
      totalCasesMined: minedCases.length,
      uniqueEmployees: uniqueEmployees.size,
      highQualityCount,
      moderateQualityCount,
      lowQualityCount,
      insufficientCount,
      flaggedSecurityCount,
      duplicatesRemoved,
    },
  };
}
