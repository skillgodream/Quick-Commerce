/**
 * DEANCORE Security Guard
 * AI-9 Production Hardening: Threat Protection, Prompt Injection Neutralization, and State Mutation Shield
 */

export interface SecurityCheckResult {
  isSuspicious: boolean;
  injectionDetected: boolean;
  sanitizedText: string;
  flags: string[];
  flaggedPatterns: string[];
}

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /system\s+override/i,
  /disregard\s+(all\s+)?(safety|rules|instructions)/i,
  /you\s+are\s+now\s+(an?\s+)?admin/i,
  /grant\s+(full\s+)?certification/i,
  /set\s+(readiness|score)\s+to\s+100/i,
  /force\s+(status\s+to\s+)?certified/i,
  /delete\s+all\s+(previous\s+)?records/i,
  /bypass\s+(governance|safeguards?|rules?)/i,
  /jailbreak/i,
  /DAN\s+mode/i,
];

/**
 * Sanitizes and protects free text inputs against prompt injection and oversized payloads.
 * Strictly enforces that user/manager input is treated as DATA, never as system instructions.
 */
export function sanitizeInputText(text?: string, maxLength: number = 2500): SecurityCheckResult {
  if (!text || typeof text !== "string") {
    return { isSuspicious: false, injectionDetected: false, sanitizedText: "", flags: [], flaggedPatterns: [] };
  }

  const flags: string[] = [];
  let sanitized = text;

  // 1. Length bounding
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
    flags.push(`TRUNCATED_EXCESS_LENGTH_${maxLength}`);
  }

  // 2. Control character removal (strip null bytes and non-printable control chars except \n \r \t)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // 3. Prompt injection detection and neutralization
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(sanitized)) {
      flags.push(`PROMPT_INJECTION_PATTERN_DETECTED: ${pattern.source}`);
      sanitized = sanitized.replace(pattern, "[FILTERED]");
    }
  }

  const isSuspicious = flags.length > 0;
  return {
    isSuspicious,
    injectionDetected: isSuspicious,
    sanitizedText: sanitized,
    flags,
    flaggedPatterns: flags,
  };
}

/**
 * Validates evidence IDs ensuring they conform to canonical identifier formats.
 * Rejects script tags, SQL syntax, or fabricated/malicious strings.
 */
export function validateEvidenceIdFormat(id: string): boolean {
  if (!id || typeof id !== "string") return false;
  if (id.length > 64) return false;
  // Valid IDs: ev-*, ds-*, ms-*, ws-*, cap-*, etc.
  return /^[a-zA-Z0-9_\-\.]+$/.test(id);
}

/**
 * State Mutation Shield
 * Strips any attempt from AI or external payloads to illegally mutate authoritative Learner State.
 */
export function stripUnauthorizedStateMutations<T extends object>(
  aiPayload: any,
  authoritativeState?: T
): any {
  if (!aiPayload || typeof aiPayload !== "object") {
    return authoritativeState || aiPayload;
  }

  // Any attempt to inject readinessScore, capabilities, status, or governance verdicts is stripped
  const prohibitedKeys = [
    "capabilities",
    "updatedCapabilities",
    "overallReadinessScore",
    "readinessScore",
    "status",
    "statusReason",
    "governanceRules",
    "policyVersion",
    "governanceVerdict",
    "governanceRationale",
    "policyViolations",
    "isApproved",
    "override",
  ];

  const cloned = { ...aiPayload };
  for (const key of prohibitedKeys) {
    if (key in cloned) {
      delete cloned[key];
    }
  }

  if (authoritativeState) {
    return authoritativeState;
  }

  return cloned;
}
