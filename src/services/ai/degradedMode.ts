/**
 * DEANCORE Degraded Modes & Recovery
 * AI-9 Production Hardening: Explicit operating state classification and fallback coordination
 */

import { DecidedAction } from "../intelligence";

export type SystemOperatingMode =
  | "NORMAL"
  | "DEGRADED_AI"
  | "AI_UNAVAILABLE"
  | "INSUFFICIENT_EVIDENCE"
  | "CONFLICTING_EVIDENCE"
  | "SAFETY_ISSUE"
  | "SYSTEM_FACILITY_ISSUE"
  | "DEGRADED_TELEMETRY";

export interface OperatingModeAssessmentContext {
  isAiTimeoutOrUnavailable?: boolean;
  malformedAiOutput?: boolean;
  evidenceSufficiency?: "SUFFICIENT" | "PARTIAL" | "INSUFFICIENT" | "CONFLICTING";
  hasExternalBottleneck?: boolean;
  hasToolFailure?: boolean;
  hasSafetyViolation?: boolean;
  hasFatigue?: boolean;
  safetyIssueDetected?: boolean;
  aiCircuitBreakerOpen?: boolean;
  recentErrorRate?: number;
  dbReachable?: boolean;
}

/**
 * Assesses the authoritative operating mode of the Dean intelligence system.
 * Governs how the pipeline executes and what fallbacks are enforced.
 */
export function assessSystemOperatingMode(
  context: OperatingModeAssessmentContext
): {
  mode: SystemOperatingMode;
  reason: string;
  deterministicFallbackRequired: boolean;
} {
  // 1. Safety violations, physical exhaustion, or explicit safety issues take absolute top priority
  if (context.hasSafetyViolation || context.hasFatigue || context.safetyIssueDetected) {
    return {
      mode: "SAFETY_ISSUE",
      reason: "Safety violation risk or physical exhaustion identified; enforcing strict safe operating protocol.",
      deterministicFallbackRequired: true,
    };
  }

  // 2. Tool / Facility external blockers take second priority (worker-blame protection)
  if (context.hasExternalBottleneck || context.hasToolFailure) {
    return {
      mode: "SYSTEM_FACILITY_ISSUE",
      reason: "External system, facility, or tooling failure detected; worker-blame protection active.",
      deterministicFallbackRequired: false,
    };
  }

  // 3. Conflicting evidence takes precedence over AI proposals
  if (context.evidenceSufficiency === "CONFLICTING") {
    return {
      mode: "CONFLICTING_EVIDENCE",
      reason: "Contradictory evidence signals detected across telemetry and observations; human review required.",
      deterministicFallbackRequired: true,
    };
  }

  // 4. Insufficient evidence
  if (context.evidenceSufficiency === "INSUFFICIENT") {
    return {
      mode: "INSUFFICIENT_EVIDENCE",
      reason: "Critical operational evidence missing; active intervention suppressed in favor of observation.",
      deterministicFallbackRequired: true,
    };
  }

  // 5. AI provider unavailable, circuit open, high error rate, or malformed output
  if (
    context.isAiTimeoutOrUnavailable ||
    context.malformedAiOutput ||
    context.aiCircuitBreakerOpen ||
    (context.recentErrorRate !== undefined && context.recentErrorRate > 0.15)
  ) {
    return {
      mode: "AI_UNAVAILABLE",
      reason: "AI generation failed, timed out, circuit open, or returned malformed schema; deterministic Doctor 5 action enforced.",
      deterministicFallbackRequired: true,
    };
  }

  // 6. DB unreachable
  if (context.dbReachable === false) {
    return {
      mode: "DEGRADED_TELEMETRY",
      reason: "Telemetry storage disconnected; operational loop running in local memory fallback.",
      deterministicFallbackRequired: false,
    };
  }

  // 7. Normal operating mode
  return {
    mode: "NORMAL",
    reason: "All evidence systems, governance rules, and AI providers operating nominally.",
    deterministicFallbackRequired: false,
  };
}

/**
 * Returns a guaranteed deterministic fallback action annotated with the system degraded mode.
 */
export function getDegradedModeAction(
  mode: SystemOperatingMode,
  deterministicBaseline: DecidedAction
): DecidedAction {
  return {
    ...deterministicBaseline,
    decisionRationale: `${deterministicBaseline.decisionRationale} | [Operating Mode: ${mode}] Deterministic safety fallback enforced.`,
  };
}
