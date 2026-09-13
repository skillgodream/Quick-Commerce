import { CasebookCase, LearningEvent } from "./casebookTypes";
import { CASEBOOK_SCHEMA_VERSION } from "./versioning";

/**
 * Casebook - In-memory structured repository for Dean cases and learning events.
 * Provides idempotent record storage by composite key `${employeeId}-d${journeyDay}`.
 */
class CasebookStore {
  private cases: Map<string, CasebookCase> = new Map();

  private getKey(employeeId: string, journeyDay: number): string {
    return `${employeeId}-d${journeyDay}`;
  }

  /**
   * Save or update a case in the casebook idempotently.
   */
  public recordCase(caseRecord: CasebookCase): CasebookCase {
    const key = this.getKey(caseRecord.employeeId, caseRecord.journeyDay);
    const existing = this.cases.get(key);
    
    const recordWithVersion: CasebookCase = {
      ...caseRecord,
      schemaVersion: caseRecord.schemaVersion || CASEBOOK_SCHEMA_VERSION,
    };

    if (existing) {
      // Merge updates preserving already attached learning events and outcomes
      const merged: CasebookCase = {
        ...existing,
        ...recordWithVersion,
        learningEvent: recordWithVersion.learningEvent || existing.learningEvent,
        outcome: recordWithVersion.outcome || existing.outcome,
        governanceResult: recordWithVersion.governanceResult || existing.governanceResult,
      };
      this.cases.set(key, merged);
      return merged;
    }

    this.cases.set(key, recordWithVersion);
    return recordWithVersion;
  }

  /**
   * Record or update a learning event on an existing or new case record.
   */
  public recordLearningEvent(learningEvent: LearningEvent): void {
    const key = this.getKey(learningEvent.employeeId, learningEvent.journeyDay);
    const existing = this.cases.get(key);
    if (existing) {
      existing.learningEvent = learningEvent;
      if (learningEvent.outcome) {
        existing.outcome = learningEvent.outcome;
      }
    } else {
      // Create minimal placeholder case if case wasn't pre-recorded
      const stubCase: CasebookCase = {
        caseId: learningEvent.caseId,
        employeeId: learningEvent.employeeId,
        employeeName: "Worker",
        journeyDay: learningEvent.journeyDay,
        timestamp: learningEvent.createdAt,
        initialState: {
          status: learningEvent.initialState.status,
          statusReason: learningEvent.initialState.statusReason,
        },
        evidenceItems: [],
        deterministicDiagnosis: {
          rootCause: learningEvent.diagnosis.rootCause as any,
          targetCapId: learningEvent.diagnosis.targetCapId,
          diagnosisText: learningEvent.diagnosis.diagnosisText,
          patternCategory: learningEvent.diagnosis.patternCategory as any,
          patternName: learningEvent.diagnosis.patternName,
        },
        deterministicAction: {
          decisionType: learningEvent.deterministicAction.decisionType as any,
          targetCapId: learningEvent.diagnosis.targetCapId,
          targetActor: learningEvent.deterministicAction.targetActor,
          urgency: "Monitor",
          actionTitle: learningEvent.deterministicAction.title,
          actionDesc: learningEvent.deterministicAction.rationale,
          practicalStep: learningEvent.deterministicAction.practicalStep,
          decisionRationale: learningEvent.deterministicAction.rationale,
          interimStatus: "Doing well",
          interimStatusReason: "",
        },
        aiInterventionCandidate: learningEvent.aiCandidate,
        aiArbitration: learningEvent.arbitrationDecision,
        finalIntervention: {
          id: learningEvent.selectedIntervention.actionId,
          dayNumber: learningEvent.journeyDay,
          actionType: learningEvent.selectedIntervention.actionType as any,
          title: learningEvent.selectedIntervention.title,
          description: "",
          targetActor: learningEvent.selectedIntervention.targetActor,
          urgency: "Monitor",
          smallestPracticalStep: learningEvent.selectedIntervention.smallestPracticalStep,
          status: "completed",
          createdAt: learningEvent.createdAt,
        },
        outcome: learningEvent.outcome,
        learningEvent,
      };
      this.cases.set(key, stubCase);
    }
  }

  public getCase(employeeId: string, journeyDay: number): CasebookCase | undefined {
    return this.cases.get(this.getKey(employeeId, journeyDay));
  }

  public getHistoryForEmployee(employeeId: string): CasebookCase[] {
    const list: CasebookCase[] = [];
    for (const c of this.cases.values()) {
      if (c.employeeId === employeeId) {
        list.push(c);
      }
    }
    return list.sort((a, b) => a.journeyDay - b.journeyDay);
  }

  public getAllCases(): CasebookCase[] {
    return Array.from(this.cases.values());
  }

  public clear(): void {
    this.cases.clear();
  }
}

export const casebook = new CasebookStore();
