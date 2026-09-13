/**
 * DEANCORE Versioning & Contract Stability
 * AI-10 Evolution & Proprietary Intelligence
 */

export const DEANCORE_SYSTEM_VERSION = "10.0.0";
export const DEANCORE_VERSION = "10.0.0";
export const GOVERNANCE_POLICY_VERSION = "1.0.0";
export const CASEBOOK_SCHEMA_VERSION = "2.0.0";
export const DECISION_AUDIT_VERSION = "1.0.0";

export const SYSTEM_VERSIONS = {
  D1_OBSERVE: "2.0.0",
  D2_LINK: "2.0.0",
  D3_UNDERSTAND: "2.0.0",
  D4_CONNECT: "2.0.0",
  D5_DECIDE: "2.0.0",
  AI3_REASON: "1.0.0",
  AI4_INTERVENE: "1.0.0",
  AI5_ARBITRATE: "1.0.0",
  AI8_GOVERNANCE: "1.0.0",
  AI9_HARDENING: "1.0.0",
  AI10_EVOLUTION: "1.0.0",
};

export interface VersionInfo {
  systemVersion: string;
  policyVersion: string;
  casebookSchemaVersion: string;
  decisionAuditVersion: string;
  timestamp: string;
}

export function getSystemVersionInfo(): VersionInfo {
  return {
    systemVersion: DEANCORE_SYSTEM_VERSION,
    policyVersion: GOVERNANCE_POLICY_VERSION,
    casebookSchemaVersion: CASEBOOK_SCHEMA_VERSION,
    decisionAuditVersion: DECISION_AUDIT_VERSION,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Checks if a historical Casebook case was recorded with a compatible schema version
 */
export function isHistoricalRecordCompatible(recordSchemaVersion?: string): boolean {
  if (!recordSchemaVersion) return true; // Legacy pre-AI-9 records supported
  const major = recordSchemaVersion.split(".")[0];
  const currentMajor = CASEBOOK_SCHEMA_VERSION.split(".")[0];
  return major === currentMajor;
}

/**
 * Resolves safe API URL across browser and Node/SSR/Vitest environments
 */
export function getApiEndpoint(path: string): string {
  if (typeof window !== "undefined" && window.location && window.location.origin) {
    return path;
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `http://localhost:3000${cleanPath}`;
}
