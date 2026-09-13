/**
 * DEANCORE-AI-10: Proprietary Intelligence Assets
 * 
 * Formal catalog and structured manifest of the 12 DEANCORE intellectual property assets:
 * 1. Diagnostic ontology
 * 2. Canonical evidence schema
 * 3. Learner-state model
 * 4. Six Doctor reasoning structure
 * 5. Intervention library
 * 6. Casebook
 * 7. STATE -> DIAGNOSIS -> DECISION -> INTERVENTION -> OUTCOME dataset
 * 8. Evaluation benchmark
 * 9. Governance policy
 * 10. Outcome history
 * 11. Context-sensitive intervention effectiveness
 * 12. Novel-pattern library
 * 
 * Protects structured cases as core training/evaluation assets without flattening into chat transcripts.
 */

import { casebook } from "./casebook";
import { mineCasesFromCasebook } from "./caseMining";
import { discoverPatterns } from "./patternDiscovery";
import { analyzeInterventionOutcomes, evaluateInterventionEffectiveness } from "./outcomeAnalysis";
import { createStandardBenchmarkSuite, CURRENT_BENCHMARK_VERSION } from "./benchmarkEngine";
import { evolutionPipeline } from "./evolutionPipeline";
import { CASEBOOK_SCHEMA_VERSION, GOVERNANCE_POLICY_VERSION, DEANCORE_SYSTEM_VERSION } from "./versioning";

export interface ProprietaryAssetMetadata {
  assetId: string;
  name: string;
  category: "ONTOLOGY" | "DATASET" | "ARCHITECTURE" | "BENCHMARK" | "POLICY" | "EVALUATION";
  version: string;
  description: string;
  itemCount: number;
  lastUpdated: string;
  structuredSchema: string;
}

export interface ProprietaryIntelligenceManifest {
  systemVersion: string;
  generatedAt: string;
  assets: ProprietaryAssetMetadata[];
  totalStructuredCases: number;
  totalCandidatePatterns: number;
  totalBenchmarkScenarios: number;
  governancePolicyVersion: string;
}

/**
 * Builds the comprehensive manifest of DEANCORE's 12 Proprietary Intelligence Assets.
 */
export function generateProprietaryAssetsManifest(): ProprietaryIntelligenceManifest {
  const allCases = casebook.getAllCases();
  const { minedCases } = mineCasesFromCasebook(allCases);
  const patterns = discoverPatterns(minedCases);
  const outcomes = analyzeInterventionOutcomes(minedCases);
  const effectiveness = evaluateInterventionEffectiveness(minedCases);
  const benchmarkSuite = createStandardBenchmarkSuite();

  const assets: ProprietaryAssetMetadata[] = [
    {
      assetId: "ASSET-1-DIAGNOSTIC-ONTOLOGY",
      name: "Dean Diagnostic Ontology",
      category: "ONTOLOGY",
      version: "2.0.0",
      description: "Structured multi-level root-cause ontology differentiating skills, cart layout, tool hardware, attendance, and environmental bottlenecks.",
      itemCount: 16,
      lastUpdated: new Date().toISOString(),
      structuredSchema: "UnderstoodDiagnosis { rootCause, targetCapId, patternCategory, patternName, diagnosisText }",
    },
    {
      assetId: "ASSET-2-CANONICAL-EVIDENCE-SCHEMA",
      name: "Canonical Evidence Schema",
      category: "ONTOLOGY",
      version: "2.0.0",
      description: "7-pillar canonical evidence standard: work performance, tools/systems, attendance, environment, behavior, physical stamina, cognitive load.",
      itemCount: 7,
      lastUpdated: new Date().toISOString(),
      structuredSchema: "CanonicalEvidence { workPerformance, toolSystem, attendancePunctuality, environmentalPhysical, ... }",
    },
    {
      assetId: "ASSET-3-LEARNER-STATE-MODEL",
      name: "Learner State & Readiness Model",
      category: "ARCHITECTURE",
      version: "3.0.0",
      description: "Non-destructive learner state graph tracking readiness score (0-100), capability progression, milestone certification, and safety status.",
      itemCount: 8,
      lastUpdated: new Date().toISOString(),
      structuredSchema: "NewHireState { status, statusReason, readinessScore, capabilities: Record<number, CapabilityState> }",
    },
    {
      assetId: "ASSET-4-SIX-DOCTOR-REASONING",
      name: "Six Doctor Reasoning Structure",
      category: "ARCHITECTURE",
      version: "2.0.0",
      description: "Sequential cognitive pipeline: D1 Observe -> D2 Link -> D3 Understand -> D4 Connect -> D5 Decide -> D6 Act/Check.",
      itemCount: 6,
      lastUpdated: new Date().toISOString(),
      structuredSchema: "DoctorPipelineStages [D1_Observe, D2_Link, D3_Understand, D4_Connect, D5_Decide, D6_Act]",
    },
    {
      assetId: "ASSET-5-INTERVENTION-LIBRARY",
      name: "Standardized Floor Intervention Library",
      category: "ONTOLOGY",
      version: "2.0.0",
      description: "Curated catalog of floor actions, micro-drills, peer shadowing, equipment swaps, and supervisor escalations with smallest practical steps.",
      itemCount: 24,
      lastUpdated: new Date().toISOString(),
      structuredSchema: "RecommendedAction { actionType, title, smallestPracticalStep, targetActor, urgency }",
    },
    {
      assetId: "ASSET-6-CASEBOOK-STORE",
      name: "Casebook In-Memory & Historical Repository",
      category: "DATASET",
      version: CASEBOOK_SCHEMA_VERSION,
      description: "Idempotent multi-learner historical case repository capturing entire decision lifecycles across days.",
      itemCount: allCases.length,
      lastUpdated: new Date().toISOString(),
      structuredSchema: "CasebookCase { caseId, employeeId, journeyDay, initialState, evidence, diagnosis, finalIntervention, outcome, learningEvent }",
    },
    {
      assetId: "ASSET-7-END-TO-END-PIPELINE-DATASET",
      name: "STATE -> DIAGNOSIS -> DECISION -> INTERVENTION -> OUTCOME Dataset",
      category: "DATASET",
      version: "1.0.0",
      description: "Curated dataset of fully traced, sanitized, high-quality closed-loop operational trajectories for offline evaluation.",
      itemCount: minedCases.length,
      lastUpdated: new Date().toISOString(),
      structuredSchema: "MinedCase { initialState, canonicalEvidence, diagnosis, deterministicAction, aiCandidate, finalAction, outcome, learningEvent }",
    },
    {
      assetId: "ASSET-8-EVALUATION-BENCHMARK",
      name: "DEAN Official Evaluation Benchmark Suite",
      category: "BENCHMARK",
      version: CURRENT_BENCHMARK_VERSION,
      description: "Standardized 15-dimension test suite with zero-tolerance gates for safety, worker-blame protection, evidence grounding, and abstention.",
      itemCount: benchmarkSuite.examples.length,
      lastUpdated: new Date().toISOString(),
      structuredSchema: "DeanBenchmarkSuite { examples: EvaluationExample[] across dimensions A through O }",
    },
    {
      assetId: "ASSET-9-GOVERNANCE-POLICY",
      name: "AI-8 Governance Authority & Policy Engine",
      category: "POLICY",
      version: GOVERNANCE_POLICY_VERSION,
      description: "16-rule policy governing ground truth verification, worker-blame protection, risk tiers, and mandatory human sign-off boundaries.",
      itemCount: 16,
      lastUpdated: new Date().toISOString(),
      structuredSchema: "GovernancePolicyRules [POL_EVIDENCE_GROUNDING, POL_WORKER_BLAME, POL_RISK_TIERS, ...]",
    },
    {
      assetId: "ASSET-10-OUTCOME-HISTORY",
      name: "Aggregated Longitudinal Outcome History",
      category: "DATASET",
      version: "1.0.0",
      description: "Statistical outcome mappings across intervention attempts, successes, failures, and environmental confounders.",
      itemCount: outcomes.length,
      lastUpdated: new Date().toISOString(),
      structuredSchema: "OutcomeAnalysis { interventionTitle, contextKey, attempts, successCount, failureCount, effectivenessRate, confidence }",
    },
    {
      assetId: "ASSET-11-INTERVENTION-EFFECTIVENESS-MODEL",
      name: "Context-Sensitive Intervention Effectiveness Model",
      category: "EVALUATION",
      version: "1.0.0",
      description: "Rigorously separates 'worked', 'appeared to work but evidence was weak', 'repeated context success', and 'learner specific'.",
      itemCount: effectiveness.length,
      lastUpdated: new Date().toISOString(),
      structuredSchema: "InterventionEffectivenessRecord { interventionTitle, targetProblem, context, expectedEffect, observedOutcome, verdict, confidence }",
    },
    {
      assetId: "ASSET-12-NOVEL-PATTERN-LIBRARY",
      name: "Candidate Pattern & Hypothesis Library",
      category: "ONTOLOGY",
      version: "1.0.0",
      description: "Controlled registry of discovered multi-day trajectories, recurring failures, symptom shifts, and candidate hypotheses under test.",
      itemCount: patterns.length,
      lastUpdated: new Date().toISOString(),
      structuredSchema: "CandidatePattern { patternId, patternType, occurrenceCount, supportingCaseIds, outcomeStats, confidence }",
    },
  ];

  return {
    systemVersion: DEANCORE_SYSTEM_VERSION,
    generatedAt: new Date().toISOString(),
    assets,
    totalStructuredCases: minedCases.length,
    totalCandidatePatterns: patterns.length,
    totalBenchmarkScenarios: benchmarkSuite.examples.length,
    governancePolicyVersion: GOVERNANCE_POLICY_VERSION,
  };
}
