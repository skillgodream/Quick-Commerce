/**
 * DEANCORE-AI-10: Controlled Evolution Pipeline
 * 
 * Implements the rigorous promotion & rollback workflow:
 * PROPOSED IMPROVEMENT -> OFFLINE EVALUATION -> HUMAN / GOVERNANCE APPROVAL
 * -> VERSIONED RELEASE -> PRODUCTION -> MONITOR -> ROLLBACK IF NECESSARY
 * 
 * ABSOLUTE ARCHITECTURAL RULE:
 * AI-10 MUST NOT allow Dean to rewrite itself automatically.
 * No automatic prompt mutation, policy mutation, readiness mutation, Doctor-rule mutation,
 * governance-rule mutation, intervention-rule mutation, AI-5 arbitration threshold mutation,
 * AI-8 policy mutation, learner-state mutation, or canonical evidence mutation.
 */

import { 
  CandidateImprovement, 
  CandidateImprovementType, 
  HumanApprovalRecord, 
  DeanReleaseArtifact, 
  RollbackRecord,
  BenchmarkEvaluationResult 
} from "./evolutionTypes";
import { createStandardBenchmarkSuite, runOfflineBenchmark } from "./benchmarkEngine";
import { DEANCORE_SYSTEM_VERSION, GOVERNANCE_POLICY_VERSION, getSystemVersionInfo } from "./versioning";

class EvolutionPipelineStore {
  private candidates: Map<string, CandidateImprovement> = new Map();
  private releaseHistory: DeanReleaseArtifact[] = [];
  private rollbackHistory: RollbackRecord[] = [];
  private activeRelease: DeanReleaseArtifact;

  constructor() {
    // Initial active baseline release
    this.activeRelease = {
      releaseVersion: "10.0.0",
      runtimeVersion: DEANCORE_SYSTEM_VERSION,
      governanceVersion: GOVERNANCE_POLICY_VERSION,
      reasoningVersion: "1.0.0",
      interventionVersion: "1.0.0",
      promotedCandidateId: "initial_production_baseline",
      promotedBy: "SYSTEM_GOVERNANCE",
      promotedAt: new Date().toISOString(),
      active: true,
      checksum: "sha256_baseline_v10",
      previousVersion: "9.0.0",
    };
    this.releaseHistory.push(this.activeRelease);
  }

  /**
   * 1. Create a Candidate Improvement in DRAFT status.
   * INVARIANT: Remains strictly INACTIVE and cannot impact production execution.
   */
  public createCandidate(input: {
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
    targetVersion?: string;
  }): CandidateImprovement {
    const candidateId = `cand-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const candidate: CandidateImprovement = {
      candidateId,
      title: input.title,
      description: input.description,
      improvementType: input.improvementType,
      sourceCaseIds: input.sourceCaseIds,
      sourcePatternIds: input.sourcePatternIds,
      reasonForProposal: input.reasonForProposal,
      expectedImprovement: input.expectedImprovement,
      affectedComponent: input.affectedComponent,
      proposedDelta: input.proposedDelta,
      risks: input.risks,
      approvalStatus: "DRAFT",
      targetVersion: input.targetVersion || "10.1.0",
      createdAt: now,
      updatedAt: now,
    };

    this.candidates.set(candidateId, candidate);
    return candidate;
  }

  /**
   * 2. Run Offline Benchmark Evaluation for a candidate.
   * Compares candidate against DEAN benchmark and enforces zero-tolerance regression checks.
   */
  public evaluateCandidateOffline(candidateId: string): {
    candidate: CandidateImprovement;
    benchmarkResult: BenchmarkEvaluationResult;
    passed: boolean;
  } {
    const candidate = this.candidates.get(candidateId);
    if (!candidate) {
      throw new Error(`Candidate ${candidateId} not found`);
    }

    candidate.approvalStatus = "EVALUATING";
    candidate.updatedAt = new Date().toISOString();

    const suite = createStandardBenchmarkSuite();
    const benchmarkResult = runOfflineBenchmark(suite, candidate);

    candidate.benchmarkResults = benchmarkResult;
    candidate.regressionResults = {
      hasRegressions: benchmarkResult.regressions.length > 0,
      regressions: benchmarkResult.regressions,
    };
    candidate.safetyResults = {
      passed: benchmarkResult.zeroToleranceChecks.safetyPassed && benchmarkResult.zeroToleranceChecks.workerBlamePassed,
      violations: benchmarkResult.regressions,
    };

    // If zero-tolerance gate failed, automatically flag as REJECTED
    if (!benchmarkResult.passedAllGates) {
      candidate.approvalStatus = "REJECTED";
    } else {
      candidate.approvalStatus = "PASSED_OFFLINE";
    }

    candidate.updatedAt = new Date().toISOString();
    return {
      candidate,
      benchmarkResult,
      passed: benchmarkResult.passedAllGates,
    };
  }

  /**
   * 3. Submit candidate for Human Approval.
   * Only candidates that PASSED_OFFLINE can be submitted for human approval.
   */
  public submitForHumanApproval(candidateId: string): CandidateImprovement {
    const candidate = this.candidates.get(candidateId);
    if (!candidate) {
      throw new Error(`Candidate ${candidateId} not found`);
    }

    if (candidate.approvalStatus !== "PASSED_OFFLINE") {
      throw new Error(`Candidate cannot be submitted for human approval from status ${candidate.approvalStatus}. Must be PASSED_OFFLINE.`);
    }

    candidate.approvalStatus = "REQUIRES_HUMAN_APPROVAL";
    candidate.updatedAt = new Date().toISOString();
    return candidate;
  }

  /**
   * 4. Human Approval Gate.
   * ABSOLUTE RULE: A candidate CANNOT become production policy without human approval.
   */
  public approveCandidate(candidateId: string, approval: HumanApprovalRecord): CandidateImprovement {
    const candidate = this.candidates.get(candidateId);
    if (!candidate) {
      throw new Error(`Candidate ${candidateId} not found`);
    }

    if (candidate.approvalStatus !== "REQUIRES_HUMAN_APPROVAL") {
      throw new Error(`Candidate must be in REQUIRES_HUMAN_APPROVAL status to be approved. Current: ${candidate.approvalStatus}`);
    }

    if (!approval.approvedBy || approval.approvedBy.trim().length === 0) {
      throw new Error("Approval rejected: Missing authorized human approver identifier");
    }

    if (!approval.signature || approval.signature.trim().length === 0) {
      throw new Error("Approval rejected: Missing cryptographically or governance authorized signature");
    }

    if (!approval.governanceReviewed) {
      throw new Error("Approval rejected: Candidate must undergo governance review prior to sign-off");
    }

    candidate.approvalStatus = "APPROVED";
    candidate.approvalRecord = approval;
    candidate.updatedAt = new Date().toISOString();
    return candidate;
  }

  /**
   * 5. Reject Candidate.
   */
  public rejectCandidate(candidateId: string, reason: string, rejectedBy: string): CandidateImprovement {
    const candidate = this.candidates.get(candidateId);
    if (!candidate) {
      throw new Error(`Candidate ${candidateId} not found`);
    }

    candidate.approvalStatus = "REJECTED";
    candidate.updatedAt = new Date().toISOString();
    return candidate;
  }

  /**
   * 6. Versioned Promotion.
   * If approved: Creates a versioned Dean release artifact.
   * Historical Casebook interpretation is preserved.
   */
  public promoteCandidateToRelease(candidateId: string, promotedBy: string): DeanReleaseArtifact {
    const candidate = this.candidates.get(candidateId);
    if (!candidate) {
      throw new Error(`Candidate ${candidateId} not found`);
    }

    // INVARIANT CHECK: Only APPROVED candidates with human approval can be promoted!
    if (candidate.approvalStatus !== "APPROVED") {
      throw new Error(
        `PROMOTION BLOCKED: Candidate ${candidateId} is in status "${candidate.approvalStatus}". ` +
        `Only explicitly APPROVED candidates with valid human sign-off can be promoted to production.`
      );
    }

    // Check that benchmark results passed all zero-tolerance gates
    if (!candidate.benchmarkResults?.passedAllGates) {
      throw new Error("PROMOTION BLOCKED: Candidate failed critical benchmark or safety gates.");
    }

    // Deactivate previous active release
    this.activeRelease.active = false;

    // Create new release artifact
    const newRelease: DeanReleaseArtifact = {
      releaseVersion: candidate.targetVersion,
      runtimeVersion: candidate.targetVersion,
      governanceVersion: GOVERNANCE_POLICY_VERSION,
      reasoningVersion: candidate.improvementType === "REASONING_PROMPT" ? "2.0.0" : "1.0.0",
      interventionVersion: candidate.improvementType === "INTERVENTION_SELECTION" ? "2.0.0" : "1.0.0",
      promotedCandidateId: candidate.candidateId,
      promotedBy,
      promotedAt: new Date().toISOString(),
      active: true,
      checksum: `sha256_${candidate.candidateId}_${Date.now()}`,
      previousVersion: this.activeRelease.releaseVersion,
    };

    candidate.approvalStatus = "PROMOTED";
    candidate.updatedAt = new Date().toISOString();

    this.activeRelease = newRelease;
    this.releaseHistory.push(newRelease);
    return newRelease;
  }

  /**
   * 7. Safe Rollback Mechanism.
   * If a promoted candidate causes regression in monitoring:
   * Restores the previous known-good version.
   * 
   * CRITICAL INVARIANT: Rollback must NOT:
   * - delete historical cases
   * - delete outcomes
   * - modify learner state
   * - modify readiness
   * - rewrite evidence
   * - rewrite history
   * Rollback changes the active runtime configuration only.
   */
  public rollbackRelease(targetVersion: string, reason: string, executedBy: string): RollbackRecord {
    const previous = this.releaseHistory.find(r => r.releaseVersion === targetVersion);
    if (!previous) {
      throw new Error(`Cannot rollback: Target version ${targetVersion} not found in release history.`);
    }

    const currentVersion = this.activeRelease.releaseVersion;
    if (currentVersion === targetVersion) {
      throw new Error(`Target rollback version ${targetVersion} is already the currently active release.`);
    }

    // Mark current as rolled back
    const currentCandidate = this.candidates.get(this.activeRelease.promotedCandidateId);
    if (currentCandidate) {
      currentCandidate.approvalStatus = "ROLLED_BACK";
      currentCandidate.updatedAt = new Date().toISOString();
    }

    this.activeRelease.active = false;

    // Reactivate previous release
    const reactivatedRelease: DeanReleaseArtifact = {
      ...previous,
      active: true,
      promotedAt: new Date().toISOString(),
      promotedBy: `ROLLBACK_BY_${executedBy}`,
      previousVersion: currentVersion,
    };

    this.activeRelease = reactivatedRelease;
    this.releaseHistory.push(reactivatedRelease);

    const rollbackRecord: RollbackRecord = {
      rollbackId: `rb-${Date.now()}`,
      targetVersion,
      revertedFromVersion: currentVersion,
      reason,
      executedBy,
      executedAt: new Date().toISOString(),
    };

    this.rollbackHistory.push(rollbackRecord);
    return rollbackRecord;
  }

  public getActiveRelease(): DeanReleaseArtifact {
    return { ...this.activeRelease };
  }

  public getReleaseHistory(): DeanReleaseArtifact[] {
    return [...this.releaseHistory];
  }

  public getRollbackHistory(): RollbackRecord[] {
    return [...this.rollbackHistory];
  }

  public getCandidate(candidateId: string): CandidateImprovement | undefined {
    return this.candidates.get(candidateId);
  }

  public getAllCandidates(): CandidateImprovement[] {
    return Array.from(this.candidates.values());
  }

  public resetForTesting(): void {
    this.candidates.clear();
    this.releaseHistory = [];
    this.rollbackHistory = [];
    this.activeRelease = {
      releaseVersion: "10.0.0",
      runtimeVersion: DEANCORE_SYSTEM_VERSION,
      governanceVersion: GOVERNANCE_POLICY_VERSION,
      reasoningVersion: "1.0.0",
      interventionVersion: "1.0.0",
      promotedCandidateId: "initial_production_baseline",
      promotedBy: "SYSTEM_GOVERNANCE",
      promotedAt: new Date().toISOString(),
      active: true,
      checksum: "sha256_baseline_v10",
      previousVersion: "9.0.0",
    };
    this.releaseHistory.push(this.activeRelease);
  }
}

export const evolutionPipeline = new EvolutionPipelineStore();
