import { CanonicalEvidence, LoopExecutionInput } from "./intelligence";
import { sanitizeInputText, validateEvidenceIdFormat } from "./ai/securityGuard";

/**
 * Simulator Canonical Evidence API Access Layer
 * Connects the deployed Simulator API (https://dummy-organization.vercel.app/api/v1/evidence)
 * to the Check-in Evidence Access Layer and DEANCORE pipeline.
 *
 * ARCHITECTURAL BOUNDARY:
 * Simulator is an evidence provider, NOT an intelligence engine.
 * Path: Simulator -> Canonical Evidence API -> Check-in Evidence Access Layer -> Six Doctors -> AI-3/4/5 -> AI-8 -> Doctor 6 -> Learner State -> Outcome -> Casebook / AI-6
 */

export const DEFAULT_SIMULATOR_API_URL = "https://dummy-organization.vercel.app/api/v1/evidence";

/**
 * Single authoritative Simulator API base URL resolver.
 */
export function getSimulatorEndpoint(): string {
  if (typeof process !== "undefined" && process.env) {
    if (process.env.VITE_SIMULATOR_API_URL) return process.env.VITE_SIMULATOR_API_URL;
    if (process.env.SIMULATOR_API_URL) return process.env.SIMULATOR_API_URL;
  }
  return DEFAULT_SIMULATOR_API_URL;
}

export interface SimulatorQueryParams {
  since_timestamp?: string;
  limit?: number;
  employeeId?: string;
  journeyDay?: number;
}

export interface SimulatorEvidenceItem {
  id?: string;
  evidence_id?: string;
  evidenceId?: string;
  employee_id?: string;
  employeeId?: string;
  subjectId?: string;
  journey_day?: number;
  journeyDay?: number;
  dayNumber?: number;
  timestamp?: string;
  createdAt?: string;
  source_system?: string;
  sourceSystem?: string;
  category?: string;
  type?: string;
  value?: number | string;
  unit?: string;
  confidence?: number | string;
  context?: string;
  contextText?: string;
  canonicalEvidence?: CanonicalEvidence;
  performance?: CanonicalEvidence["performance"];
  attendance?: CanonicalEvidence["attendance"];
  capability?: CanonicalEvidence["capability"];
  support?: CanonicalEvidence["support"];
  toolSystem?: CanonicalEvidence["toolSystem"];
  environment?: CanonicalEvidence["environment"];
  observation?: CanonicalEvidence["observation"];
  outcome?: CanonicalEvidence["outcome"];
}

export interface FetchSimulatorResult {
  success: boolean;
  evidence: SimulatorEvidenceItem[];
  error?: string;
  count: number;
}

/**
 * Check-in canonical 4 persistent test employee IDs.
 */
export const CANONICAL_CHECKIN_EMPLOYEES = [
  { id: "nh-rahul-01", name: "Rahul Sharma", aliases: ["emp-1", "emp-01", "rahul", "1"] },
  { id: "nh-priya-02", name: "Priya Sundaram", aliases: ["emp-2", "emp-02", "priya", "2"] },
  { id: "nh-amit-03", name: "Amit Verma", aliases: ["emp-3", "emp-03", "amit", "3"] },
  { id: "nh-sneha-04", name: "Sneha Patel", aliases: ["emp-4", "emp-04", "sneha", "4"] },
];

/**
 * Maps incoming simulator employee identifiers to persistent canonical check-in employee IDs.
 */
export function mapToCanonicalEmployeeId(rawId?: string): string {
  if (!rawId || typeof rawId !== "string") return "nh-rahul-01";
  const cleaned = rawId.trim().toLowerCase();

  const matched = CANONICAL_CHECKIN_EMPLOYEES.find(
    (e) => e.id.toLowerCase() === cleaned || e.aliases.includes(cleaned) || cleaned.includes(e.id.toLowerCase())
  );
  if (matched) return matched.id;

  if (cleaned.includes("rahul") || cleaned.includes("emp-1") || cleaned.includes("emp-01")) return "nh-rahul-01";
  if (cleaned.includes("priya") || cleaned.includes("emp-2") || cleaned.includes("emp-02")) return "nh-priya-02";
  if (cleaned.includes("amit") || cleaned.includes("emp-3") || cleaned.includes("emp-03")) return "nh-amit-03";
  if (cleaned.includes("sneha") || cleaned.includes("emp-4") || cleaned.includes("emp-04")) return "nh-sneha-04";

  if (/^nh-[a-z0-9-]+$/i.test(cleaned)) {
    return cleaned;
  }

  return "nh-rahul-01";
}

// Global in-memory cache of processed evidence keys to prevent duplicate records
const processedEvidenceKeys = new Set<string>();

export function getProcessedEvidenceCount(): number {
  return processedEvidenceKeys.size;
}

export function clearProcessedEvidenceCache(): void {
  processedEvidenceKeys.clear();
}

/**
 * Generates a unique, deterministic evidence identity key.
 */
export function getEvidenceKey(item: SimulatorEvidenceItem): string {
  const id = item.id || item.evidence_id || item.evidenceId;
  if (id && validateEvidenceIdFormat(id)) {
    return id;
  }
  const empId = mapToCanonicalEmployeeId(item.employeeId || item.employee_id || item.subjectId);
  const day = item.journeyDay || item.journey_day || item.dayNumber || 1;
  const ts = item.timestamp || item.createdAt || "";
  const cat = item.category || item.type || "";
  const val = item.value ?? "";
  return `${empId}_d${day}_${ts}_${cat}_${val}`;
}

export function isDuplicateEvidence(item: SimulatorEvidenceItem): boolean {
  const key = getEvidenceKey(item);
  return processedEvidenceKeys.has(key);
}

export function markEvidenceProcessed(item: SimulatorEvidenceItem): void {
  const key = getEvidenceKey(item);
  processedEvidenceKeys.add(key);
}

/**
 * Validates untrusted Simulator response objects against the CanonicalEvidence contract,
 * stripping malicious inputs, prompt injection attempts, and invalid numbers/enums.
 */
export function validateAndSanitizeEvidenceRecord(rawItem: any): SimulatorEvidenceItem | null {
  if (!rawItem || typeof rawItem !== "object") return null;

  const sanitizedRecord: SimulatorEvidenceItem = {};

  // Preserve & validate evidence IDs
  const rawId = rawItem.id || rawItem.evidence_id || rawItem.evidenceId;
  if (rawId && typeof rawId === "string" && validateEvidenceIdFormat(rawId)) {
    sanitizedRecord.id = rawId;
    sanitizedRecord.evidence_id = rawId;
    sanitizedRecord.evidenceId = rawId;
  }

  // Canonical employee identity mapping
  const rawEmpId = rawItem.employeeId || rawItem.employee_id || rawItem.subjectId;
  sanitizedRecord.employeeId = mapToCanonicalEmployeeId(rawEmpId);

  // Preserve journeyDay strictly separate from calendar time
  const rawDay = Number(rawItem.journeyDay ?? rawItem.journey_day ?? rawItem.dayNumber);
  sanitizedRecord.journeyDay = Number.isFinite(rawDay) && rawDay > 0 ? Math.floor(rawDay) : 1;

  // Preserve timestamps
  if (rawItem.timestamp || rawItem.createdAt) {
    sanitizedRecord.timestamp = String(rawItem.timestamp || rawItem.createdAt);
  }

  // Preserve source system
  const source = rawItem.source_system || rawItem.sourceSystem;
  if (source) {
    sanitizedRecord.source_system = sanitizeInputText(String(source)).sanitizedText;
  }

  // Category & Type
  if (rawItem.category) sanitizedRecord.category = sanitizeInputText(String(rawItem.category)).sanitizedText;
  if (rawItem.type) sanitizedRecord.type = sanitizeInputText(String(rawItem.type)).sanitizedText;
  if (rawItem.unit) sanitizedRecord.unit = sanitizeInputText(String(rawItem.unit)).sanitizedText;

  // Confidence score
  if (rawItem.confidence !== undefined) {
    const confNum = Number(rawItem.confidence);
    sanitizedRecord.confidence = Number.isFinite(confNum) ? Math.max(0, Math.min(1, confNum)) : 1.0;
  }

  // Context text
  const contextRaw = rawItem.context || rawItem.contextText;
  if (contextRaw && typeof contextRaw === "string") {
    sanitizedRecord.context = sanitizeInputText(contextRaw).sanitizedText;
  }

  // Build CanonicalEvidence sub-object
  const nested = rawItem.canonicalEvidence || rawItem;
  const canonical: CanonicalEvidence = {};

  // 1. Performance Health
  const perf = nested.performance || {};
  if (typeof perf.productivity === "number" && Number.isFinite(perf.productivity)) {
    canonical.performance = canonical.performance || {};
    canonical.performance.productivity = Math.max(0, Math.min(300, perf.productivity));
  } else if (rawItem.category === "work_performance" || rawItem.type === "productivity") {
    const val = Number(rawItem.value);
    if (Number.isFinite(val)) {
      canonical.performance = canonical.performance || {};
      canonical.performance.productivity = Math.max(0, Math.min(300, val));
    }
  }

  if (typeof perf.targetProductivity === "number" && Number.isFinite(perf.targetProductivity)) {
    canonical.performance = canonical.performance || {};
    canonical.performance.targetProductivity = Math.max(1, Math.min(300, perf.targetProductivity));
  }

  if (typeof perf.accuracy === "number" && Number.isFinite(perf.accuracy)) {
    canonical.performance = canonical.performance || {};
    canonical.performance.accuracy = Math.max(0, Math.min(100, perf.accuracy));
  } else if (rawItem.type === "accuracy") {
    const val = Number(rawItem.value);
    if (Number.isFinite(val)) {
      canonical.performance = canonical.performance || {};
      canonical.performance.accuracy = Math.max(0, Math.min(100, val));
    }
  }

  if (typeof perf.completedWork === "number" && Number.isFinite(perf.completedWork)) {
    canonical.performance = canonical.performance || {};
    canonical.performance.completedWork = Math.max(0, perf.completedWork);
  }

  if (typeof perf.timeTaken === "number" && Number.isFinite(perf.timeTaken)) {
    canonical.performance = canonical.performance || {};
    canonical.performance.timeTaken = Math.max(0, perf.timeTaken);
  }

  // 2. Attendance & Shift Status
  const att = nested.attendance || {};
  if (att.shiftStatus || att.attendanceStatus || typeof att.shiftCompletion === "number") {
    canonical.attendance = {
      shiftStatus: att.shiftStatus ? sanitizeInputText(String(att.shiftStatus)).sanitizedText : undefined,
      attendanceStatus: att.attendanceStatus ? sanitizeInputText(String(att.attendanceStatus)).sanitizedText : undefined,
      shiftCompletion: typeof att.shiftCompletion === "number" && Number.isFinite(att.shiftCompletion)
        ? Math.max(0, Math.min(100, att.shiftCompletion))
        : undefined,
    };
  }

  // 3. Capability Progress
  const cap = nested.capability || {};
  if (cap.taskProficiency || cap.trainingStatus || cap.newTaskExposure !== undefined) {
    canonical.capability = {
      taskProficiency: cap.taskProficiency ? sanitizeInputText(String(cap.taskProficiency)).sanitizedText : undefined,
      trainingStatus: cap.trainingStatus ? sanitizeInputText(String(cap.trainingStatus)).sanitizedText : undefined,
      newTaskExposure: Boolean(cap.newTaskExposure),
    };
  }

  // 4. Support & Guidance
  const supp = nested.support || {};
  if (typeof supp.helpRequests === "number" || supp.supervisorAssistance !== undefined) {
    canonical.support = {
      helpRequests: typeof supp.helpRequests === "number" && Number.isFinite(supp.helpRequests)
        ? Math.max(0, supp.helpRequests)
        : undefined,
      supervisorAssistance: Boolean(supp.supervisorAssistance),
    };
  }

  // 5. Tool System Health
  const tool = nested.toolSystem || {};
  if (tool.toolStatus || tool.toolProblem || typeof tool.systemDowntime === "number") {
    let validToolStatus: "Failed" | "Working" | "Unknown" | undefined = undefined;
    if (tool.toolStatus === "Failed" || tool.toolStatus === "Working" || tool.toolStatus === "Unknown") {
      validToolStatus = tool.toolStatus;
    }
    canonical.toolSystem = {
      toolStatus: validToolStatus,
      toolProblem: tool.toolProblem ? sanitizeInputText(String(tool.toolProblem)).sanitizedText : undefined,
      systemDowntime: typeof tool.systemDowntime === "number" && Number.isFinite(tool.systemDowntime)
        ? Math.max(0, tool.systemDowntime)
        : undefined,
    };
  }

  // 6. Environmental Conditions
  const env = nested.environment || {};
  if (env.workloadCondition || env.environmentalIssue || env.externalBottleneck) {
    canonical.environment = {
      workloadCondition: env.workloadCondition ? sanitizeInputText(String(env.workloadCondition)).sanitizedText : undefined,
      environmentalIssue: env.environmentalIssue ? sanitizeInputText(String(env.environmentalIssue)).sanitizedText : undefined,
      externalBottleneck: env.externalBottleneck ? sanitizeInputText(String(env.externalBottleneck)).sanitizedText : undefined,
    };
  }

  // 7. Qualitative Observations
  const obs = nested.observation || {};
  if (obs.supervisorNote || obs.behaviorNote || obs.communicationNote) {
    canonical.observation = {
      supervisorNote: obs.supervisorNote ? sanitizeInputText(String(obs.supervisorNote)).sanitizedText : undefined,
      behaviorNote: obs.behaviorNote ? sanitizeInputText(String(obs.behaviorNote)).sanitizedText : undefined,
      communicationNote: obs.communicationNote ? sanitizeInputText(String(obs.communicationNote)).sanitizedText : undefined,
    };
  }

  // 8. Outcome Evaluation
  const out = nested.outcome || {};
  if (out.interventionResult || out.improved || out.treatmentContext) {
    canonical.outcome = {
      interventionResult: out.interventionResult,
      improved: out.improved,
      treatmentContext: out.treatmentContext ? sanitizeInputText(String(out.treatmentContext)).sanitizedText : undefined,
    };
  }

  sanitizedRecord.canonicalEvidence = canonical;
  return sanitizedRecord;
}

/**
 * Main Network Evidence Transport/Access Call.
 * Queries the deployed Simulator API with safety timeouts, error handling, and deduplication.
 */
export async function fetchSimulatorEvidence(
  params?: SimulatorQueryParams,
  timeoutMs: number = 4000
): Promise<FetchSimulatorResult> {
  try {
    const endpoint = getSimulatorEndpoint();
    const url = new URL(endpoint);

    if (params?.since_timestamp) url.searchParams.set("since_timestamp", params.since_timestamp);
    if (params?.limit) url.searchParams.set("limit", String(params.limit));
    if (params?.employeeId) url.searchParams.set("employeeId", params.employeeId);
    if (params?.journeyDay) url.searchParams.set("journeyDay", String(params.journeyDay));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        evidence: [],
        error: `Simulator API returned HTTP status ${response.status}`,
        count: 0,
      };
    }

    const data = await response.json();
    let rawList: any[] = [];
    if (Array.isArray(data)) {
      rawList = data;
    } else if (data && Array.isArray(data.evidence)) {
      rawList = data.evidence;
    } else if (data && Array.isArray(data.data)) {
      rawList = data.data;
    }

    const validEvidence: SimulatorEvidenceItem[] = [];
    for (const raw of rawList) {
      const sanitized = validateAndSanitizeEvidenceRecord(raw);
      if (sanitized) {
        if (!isDuplicateEvidence(sanitized)) {
          markEvidenceProcessed(sanitized);
          validEvidence.push(sanitized);
        }
      }
    }

    return {
      success: true,
      evidence: validEvidence,
      count: validEvidence.length,
    };
  } catch (err: any) {
    const errorMsg = err?.name === "AbortError" ? "Simulator API fetch timed out" : (err?.message || String(err));
    return {
      success: false,
      evidence: [],
      error: errorMsg,
      count: 0,
    };
  }
}

/**
 * Connects validated Simulator evidence record directly to the existing DEANCORE LoopExecutionInput,
 * feeding CanonicalEvidence into the existing evidence boundary and Doctor pipeline without bypassing any component.
 */
export function adaptSimulatorToLoopInput(
  baseInput: LoopExecutionInput,
  simulatorRecord?: SimulatorEvidenceItem
): LoopExecutionInput {
  if (!simulatorRecord || !simulatorRecord.canonicalEvidence) {
    return baseInput;
  }

  const simCanonical = simulatorRecord.canonicalEvidence;
  const mergedCanonical: CanonicalEvidence = {
    performance: {
      ...baseInput.canonicalEvidence?.performance,
      ...simCanonical.performance,
    },
    attendance: {
      ...baseInput.canonicalEvidence?.attendance,
      ...simCanonical.attendance,
    },
    capability: {
      ...baseInput.canonicalEvidence?.capability,
      ...simCanonical.capability,
    },
    support: {
      ...baseInput.canonicalEvidence?.support,
      ...simCanonical.support,
    },
    toolSystem: {
      ...baseInput.canonicalEvidence?.toolSystem,
      ...simCanonical.toolSystem,
    },
    environment: {
      ...baseInput.canonicalEvidence?.environment,
      ...simCanonical.environment,
    },
    observation: {
      ...baseInput.canonicalEvidence?.observation,
      ...simCanonical.observation,
    },
    outcome: {
      ...baseInput.canonicalEvidence?.outcome,
      ...simCanonical.outcome,
    },
  };

  return {
    ...baseInput,
    canonicalEvidence: mergedCanonical,
  };
}
