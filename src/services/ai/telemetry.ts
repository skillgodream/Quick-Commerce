/**
 * DEANCORE Operational Telemetry & Observability
 * AI-9 Production Hardening: Structured event tracking, latency measurement, and failure monitoring
 */

export type PipelineStage =
  | "INIT"
  | "OBSERVE"
  | "LINK"
  | "UNDERSTAND"
  | "CONNECT"
  | "DECIDE"
  | "AI_REASON"
  | "AI_INTERVENE"
  | "AI_ARBITRATE"
  | "AI_GOVERN"
  | "ACT"
  | "CHECK"
  | "LEARN"
  | "COMPLETED"
  | "FAILED";

export type FinalActionSource = "DETERMINISTIC" | "AI" | "GOVERNANCE_OVERRIDE" | "FALLBACK";

export interface ExecutionTelemetryEvent {
  executionId: string;
  employeeId: string;
  journeyDay: number;
  pipelineStage: PipelineStage;
  durationMs: number;
  timestamp: string;
  success: boolean;
  fallbackInvoked: boolean;
  aiProviderFailure: boolean;
  governanceVerdict?: string;
  finalActionSource: FinalActionSource;
  outcomeStatus?: string;
  systemMode: string;
  details?: Record<string, any>;
  errorMessage?: string;
}

export type TelemetryEvent = ExecutionTelemetryEvent;

export interface TelemetrySummary {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  fallbackCount: number;
  aiFailureCount: number;
  averageDurationMs: number;
  fallbackRatePercentage: number;
  successRate: number;
  fallbackRate: number;
  governanceOverrides: number;
}

class DeanTelemetryBuffer {
  private events: ExecutionTelemetryEvent[] = [];
  private readonly maxBufferSize = 1000;

  public record(event: ExecutionTelemetryEvent): void {
    // Sanitize any potential PII or raw secrets from details
    const sanitizedEvent: ExecutionTelemetryEvent = {
      ...event,
      details: event.details ? { ...event.details } : undefined,
    };

    this.events.push(sanitizedEvent);
    if (this.events.length > this.maxBufferSize) {
      this.events.shift(); // FIFO ring buffer
    }
  }

  public getEvents(): ExecutionTelemetryEvent[] {
    return [...this.events];
  }

  public getRecent(limit: number = 50): ExecutionTelemetryEvent[] {
    return this.events.slice(-limit).reverse();
  }

  public getByEmployee(employeeId: string): ExecutionTelemetryEvent[] {
    return this.events.filter((e) => e.employeeId === employeeId);
  }

  public getByExecutionId(executionId: string): ExecutionTelemetryEvent | undefined {
    return this.events.find((e) => e.executionId === executionId);
  }

  public getSummary(): TelemetrySummary {
    const total = this.events.length;
    if (total === 0) {
      return {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        fallbackCount: 0,
        aiFailureCount: 0,
        averageDurationMs: 0,
        fallbackRatePercentage: 0,
        successRate: 1.0,
        fallbackRate: 0.0,
        governanceOverrides: 0,
      };
    }

    const successful = this.events.filter((e) => e.success).length;
    const fallbacks = this.events.filter((e) => e.fallbackInvoked).length;
    const aiFailures = this.events.filter((e) => e.aiProviderFailure).length;
    const totalDuration = this.events.reduce((acc, curr) => acc + curr.durationMs, 0);
    const overrides = this.events.filter((e) => e.governanceVerdict === "OVERRIDDEN" || e.finalActionSource === "GOVERNANCE_OVERRIDE").length;

    return {
      totalExecutions: total,
      successfulExecutions: successful,
      failedExecutions: total - successful,
      fallbackCount: fallbacks,
      aiFailureCount: aiFailures,
      averageDurationMs: Math.round(totalDuration / total),
      fallbackRatePercentage: Math.round((fallbacks / total) * 100),
      successRate: Math.round((successful / total) * 100) / 100,
      fallbackRate: Math.round((fallbacks / total) * 100) / 100,
      governanceOverrides: overrides,
    };
  }

  public clear(): void {
    this.events = [];
  }
}

export const telemetry = new DeanTelemetryBuffer();
