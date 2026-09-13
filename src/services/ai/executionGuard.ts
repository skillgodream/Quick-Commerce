/**
 * DEANCORE Execution Guard
 * AI-9 Production Hardening: Concurrency control, Late-response invalidation (Invariant 11),
 * and Idempotent execution enforcement (Invariant 10).
 */

class DeanExecutionGuard {
  // Key: `${employeeId}-d${journeyDay}` -> current authoritative executionId
  private activeAuthoritativeTokens: Map<string, string> = new Map();

  // Set of processed outcome keys: `${employeeId}-d${journeyDay}-${actionId}-${outcomeId}`
  private processedOutcomeKeys: Set<string> = new Set();

  private getKey(employeeId: string, journeyDay: number): string {
    return `${employeeId}-d${journeyDay}`;
  }

  /**
   * Registers a new authoritative execution token for the given employee and day.
   * Any prior in-flight asynchronous operations for this (employee, day) are immediately obsoleted.
   */
  public registerExecution(employeeId: string, journeyDay: number): string {
    const key = this.getKey(employeeId, journeyDay);
    const timestamp = Date.now();
    const randomSalt = Math.random().toString(36).substring(2, 7);
    const executionId = `exec_${employeeId}_d${journeyDay}_${timestamp}_${randomSalt}`;

    this.activeAuthoritativeTokens.set(key, executionId);
    return executionId;
  }

  /**
   * INVARIANT 11: Late AI responses cannot overwrite newer authoritative decisions.
   * Validates whether an async callback or late AI response is still current.
   */
  public isExecutionCurrent(employeeId: string, journeyDay: number, executionId: string): boolean {
    const key = this.getKey(employeeId, journeyDay);
    const currentToken = this.activeAuthoritativeTokens.get(key);
    return currentToken === executionId;
  }

  /**
   * INVARIANT 10: Repeated execution does not duplicate authoritative outcomes.
   * Checks if an outcome has already been recorded and processed for this action.
   */
  public isOutcomeAlreadyProcessed(
    employeeId: string,
    journeyDay: number,
    actionId: string,
    outcomeId: string
  ): boolean {
    const key = `${employeeId}-d${journeyDay}-${actionId}-${outcomeId}`;
    return this.processedOutcomeKeys.has(key);
  }

  /**
   * Marks an outcome as authoritatively processed.
   */
  public markOutcomeProcessed(
    employeeId: string,
    journeyDay: number,
    actionId: string,
    outcomeId: string
  ): void {
    const key = `${employeeId}-d${journeyDay}-${actionId}-${outcomeId}`;
    this.processedOutcomeKeys.add(key);
  }

  /**
   * Resets execution tracking (primarily for test environments).
   */
  public clear(): void {
    this.activeAuthoritativeTokens.clear();
    this.processedOutcomeKeys.clear();
  }

  public reset(): void {
    this.clear();
  }
}

export const executionGuard = new DeanExecutionGuard();
