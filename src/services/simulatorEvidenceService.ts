import { CanonicalEvidence, LoopExecutionInput } from "./intelligence";
import { WorkSignal } from "../types";
import { sanitizeInputText, validateEvidenceIdFormat } from "./ai/securityGuard";

/**
 * Simulator Canonical Evidence API Access Layer
 * Connects the deployed Simulator API (https://ais-pre-zj3dyugz2dislznxqdahrd-891743969591.asia-east1.run.app/api/v1/evidence)
 * to the Check-in Evidence Access Layer and DEANCORE pipeline.
 *
 * ARCHITECTURAL BOUNDARY:
 * Simulator is an evidence provider, NOT an intelligence engine.
 * Path: Simulator -> Canonical Evidence API -> Check-in Evidence Access Layer -> Six Doctors -> AI-3/4/5 -> AI-8 -> Doctor 6 -> Learner State -> Outcome -> Casebook / AI-6
 */

export const DEFAULT_SIMULATOR_API_URL = "https://ais-pre-zj3dyugz2dislznxqdahrd-891743969591.asia-east1.run.app/api/v1/evidence";
export const RUN_APP_SIMULATOR_API_URL = "https://ais-pre-zj3dyugz2dislznxqdahrd-891743969591.asia-east1.run.app/api/v1/evidence";
export const DEFAULT_FALLBACK_SIMULATOR_URL = "https://dummy-organization.vercel.app/api/v1/evidence";

const STORAGE_KEY_CUSTOM_ENDPOINT = "custom_simulator_api_url";

/**
 * Single authoritative Simulator API base URL resolver.
 * Checks localStorage first, then environment variables, then falls back to default.
 */
export function getSimulatorEndpoint(): string {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const customUrl = localStorage.getItem(STORAGE_KEY_CUSTOM_ENDPOINT);
      if (customUrl && customUrl.trim().length > 0) {
        return customUrl.trim();
      }
    } catch (e) {
      // localStorage may fail in some environments
    }
  }
  if (typeof process !== "undefined" && process.env) {
    if (process.env.VITE_SIMULATOR_API_URL) return process.env.VITE_SIMULATOR_API_URL;
    if (process.env.SIMULATOR_API_URL) return process.env.SIMULATOR_API_URL;
  }
  return DEFAULT_SIMULATOR_API_URL;
}

export function setCustomSimulatorEndpoint(url: string | null): void {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      if (url && url.trim().length > 0) {
        localStorage.setItem(STORAGE_KEY_CUSTOM_ENDPOINT, url.trim());
      } else {
        localStorage.removeItem(STORAGE_KEY_CUSTOM_ENDPOINT);
      }
    } catch (e) {}
  }
}

export function getCustomSimulatorEndpoint(): string | null {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      return localStorage.getItem(STORAGE_KEY_CUSTOM_ENDPOINT) || null;
    } catch (e) {}
  }
  return null;
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
  { id: "nh-rahul-01", name: "Rahul Sharma", aliases: ["emp-1", "emp-01", "emp-001", "rahul", "1"] },
  { id: "nh-priya-02", name: "Priya Sundaram", aliases: ["emp-2", "emp-02", "emp-002", "priya", "2"] },
  { id: "nh-amit-03", name: "Amit Verma", aliases: ["emp-3", "emp-03", "emp-003", "amit", "3"] },
  { id: "nh-sneha-04", name: "Sneha Patel", aliases: ["emp-4", "emp-04", "emp-004", "sneha", "diana", "4"] },
];

/**
 * Maps persistent canonical check-in employee IDs to outbound Simulator API employee identifiers.
 * nh-rahul-01 -> EMP-001
 * nh-priya-02 -> EMP-002
 * nh-amit-03 -> EMP-003
 * nh-sneha-04 -> EMP-004
 */
export function mapToSimulatorEmployeeId(canonicalId?: string): string {
  if (!canonicalId || typeof canonicalId !== "string") return "EMP-001";
  const cleaned = canonicalId.trim().toLowerCase();

  if (cleaned.includes("priya") || cleaned.includes("nh-priya-02") || cleaned === "emp-002" || cleaned === "emp-02" || cleaned === "emp-2") return "EMP-002";
  if (cleaned.includes("amit") || cleaned.includes("nh-amit-03") || cleaned === "emp-003" || cleaned === "emp-03" || cleaned === "emp-3") return "EMP-003";
  if (cleaned.includes("sneha") || cleaned.includes("diana") || cleaned.includes("nh-sneha-04") || cleaned === "emp-004" || cleaned === "emp-04" || cleaned === "emp-4") return "EMP-004";
  if (cleaned.includes("rahul") || cleaned.includes("nh-rahul-01") || cleaned === "emp-001" || cleaned === "emp-01" || cleaned === "emp-1") return "EMP-001";

  return canonicalId;
}

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

  if (cleaned.includes("rahul") || cleaned.includes("emp-1") || cleaned.includes("emp-01") || cleaned.includes("emp-001")) return "nh-rahul-01";
  if (cleaned.includes("priya") || cleaned.includes("emp-2") || cleaned.includes("emp-02") || cleaned.includes("emp-002")) return "nh-priya-02";
  if (cleaned.includes("amit") || cleaned.includes("emp-3") || cleaned.includes("emp-03") || cleaned.includes("emp-003")) return "nh-amit-03";
  if (cleaned.includes("sneha") || cleaned.includes("diana") || cleaned.includes("emp-4") || cleaned.includes("emp-04") || cleaned.includes("emp-004")) return "nh-sneha-04";

  if (/^nh-[a-z0-9-]+$/i.test(cleaned)) {
    return cleaned;
  }

  return "nh-rahul-01";
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
  const rawEmpId = rawItem.employeeId || rawItem.employee_id || rawItem.subjectId || rawItem.subject_id;
  sanitizedRecord.employeeId = mapToCanonicalEmployeeId(rawEmpId);

  // Preserve journeyDay strictly separate from calendar time (including Day 0)
  const rawDayNum = rawItem.journeyDay ?? rawItem.journey_day ?? rawItem.dayNumber ?? (rawItem.context && typeof rawItem.context === "object" ? rawItem.context.journey_day : undefined);
  const rawDay = Number(rawDayNum);
  sanitizedRecord.journeyDay = Number.isFinite(rawDay) && rawDay >= 0 ? Math.floor(rawDay) : 0;

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
  } else if (
    rawItem.category === "work_performance" ||
    rawItem.category === "productivity" ||
    rawItem.type === "productivity" ||
    rawItem.type === "pick_velocity" ||
    rawItem.type === "pick_volume" ||
    rawItem.type === "uph"
  ) {
    const val = Number(rawItem.value);
    if (Number.isFinite(val)) {
      canonical.performance = canonical.performance || {};
      canonical.performance.productivity = Math.max(0, Math.min(300, val));
    }
  }

  if (typeof perf.targetProductivity === "number" && Number.isFinite(perf.targetProductivity)) {
    canonical.performance = canonical.performance || {};
    canonical.performance.targetProductivity = Math.max(1, Math.min(300, perf.targetProductivity));
  } else if (rawItem.type === "expected_volume" || rawItem.type === "target_productivity") {
    const val = Number(rawItem.value);
    if (Number.isFinite(val)) {
      canonical.performance = canonical.performance || {};
      canonical.performance.targetProductivity = Math.max(1, Math.min(300, val));
    }
  }

  if (typeof perf.accuracy === "number" && Number.isFinite(perf.accuracy)) {
    canonical.performance = canonical.performance || {};
    canonical.performance.accuracy = Math.max(0, Math.min(100, perf.accuracy));
  } else if (rawItem.type === "accuracy" || rawItem.type === "accuracy_score" || rawItem.category === "quality" || rawItem.category === "accuracy") {
    const val = Number(rawItem.value);
    if (Number.isFinite(val)) {
      canonical.performance = canonical.performance || {};
      canonical.performance.accuracy = Math.max(0, Math.min(100, val));
    }
  }

  if (typeof perf.completedWork === "number" && Number.isFinite(perf.completedWork)) {
    canonical.performance = canonical.performance || {};
    canonical.performance.completedWork = Math.max(0, perf.completedWork);
  } else if (rawItem.type === "pick_volume" || rawItem.type === "completed_work" || rawItem.type === "orders_completed") {
    const val = Number(rawItem.value);
    if (Number.isFinite(val)) {
      canonical.performance = canonical.performance || {};
      canonical.performance.completedWork = Math.max(0, val);
    }
  }

  if (typeof perf.timeTaken === "number" && Number.isFinite(perf.timeTaken)) {
    canonical.performance = canonical.performance || {};
    canonical.performance.timeTaken = Math.max(0, perf.timeTaken);
  } else if (rawItem.type === "time_taken" || rawItem.type === "duration_minutes") {
    const val = Number(rawItem.value);
    if (Number.isFinite(val)) {
      canonical.performance = canonical.performance || {};
      canonical.performance.timeTaken = Math.max(0, val);
    }
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
  } else if (rawItem.category === "attendance" || rawItem.type === "shift_status" || rawItem.type === "attendance_status") {
    canonical.attendance = {
      shiftStatus: rawItem.type === "shift_status" ? sanitizeInputText(String(rawItem.value)).sanitizedText : undefined,
      attendanceStatus: rawItem.type === "attendance_status" ? sanitizeInputText(String(rawItem.value)).sanitizedText : undefined,
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
  } else if (rawItem.category === "learning" || rawItem.type === "task_proficiency" || rawItem.type === "training_status") {
    canonical.capability = {
      taskProficiency: rawItem.type === "task_proficiency" ? sanitizeInputText(String(rawItem.value)).sanitizedText : undefined,
      trainingStatus: rawItem.type === "training_status" ? sanitizeInputText(String(rawItem.value)).sanitizedText : undefined,
      newTaskExposure: rawItem.type === "new_task_exposure" ? String(rawItem.value).toLowerCase() === "yes" : undefined,
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
  } else if (rawItem.category === "support" || rawItem.type === "help_requests") {
    const reqVal = Number(rawItem.value);
    canonical.support = {
      helpRequests: Number.isFinite(reqVal) ? Math.max(0, reqVal) : undefined,
      supervisorAssistance: rawItem.type === "supervisor_assistance" ? String(rawItem.value).toLowerCase() === "yes" : undefined,
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
  const attemptFetch = async (fetchUrl: string): Promise<FetchSimulatorResult> => {
    const url = new URL(
      fetchUrl,
      typeof window !== "undefined" && window.location ? window.location.origin : "http://localhost:3000"
    );
    if (params?.since_timestamp) url.searchParams.set("since_timestamp", params.since_timestamp);
    if (params?.limit) url.searchParams.set("limit", String(params.limit));
    if (params?.employeeId) {
      const simEmpId = mapToSimulatorEmployeeId(params.employeeId);
      url.searchParams.set("employeeId", simEmpId);
    }
    if (params?.journeyDay !== undefined && params?.journeyDay !== null) {
      url.searchParams.set("journeyDay", String(params.journeyDay));
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
        },
        cache: "no-store",
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

      const expectedCanonicalEmpId = params?.employeeId ? mapToCanonicalEmployeeId(params.employeeId) : undefined;
      const expectedJourneyDay =
        params?.journeyDay !== undefined && params?.journeyDay !== null ? Number(params.journeyDay) : undefined;

      const validEvidence: SimulatorEvidenceItem[] = [];
      const batchKeys = new Set<string>();
      for (const raw of rawList) {
        const sanitized = validateAndSanitizeEvidenceRecord(raw);
        if (sanitized) {
          // Strict learner identity check: must correspond to requested learner
          if (expectedCanonicalEmpId && sanitized.employeeId !== expectedCanonicalEmpId) {
            continue;
          }
          // Strict journey_day check: MUST exactly equal requested journeyDay. NO cross-day fallback!
          if (expectedJourneyDay !== undefined && sanitized.journeyDay !== expectedJourneyDay) {
            continue;
          }
          const key = getEvidenceKey(sanitized);
          if (!batchKeys.has(key)) {
            batchKeys.add(key);
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
      clearTimeout(timeoutId);
      const errorMsg = err?.name === "AbortError" ? "Simulator API fetch timed out" : err?.message || String(err);
      return {
        success: false,
        evidence: [],
        error: errorMsg,
        count: 0,
      };
    }
  };

  const primaryEndpoint = getSimulatorEndpoint();
  const primaryResult = await attemptFetch(primaryEndpoint);

  // If in browser and primary failed, try local server proxy or public cloud mirror
  if (!primaryResult.success && typeof window !== "undefined") {
    try {
      const proxyResult = await attemptFetch("/api/simulator/evidence");
      if (proxyResult.success && proxyResult.count > 0) {
        return proxyResult;
      }
    } catch (_) {}

    try {
      const fallbackResult = await attemptFetch(DEFAULT_FALLBACK_SIMULATOR_URL);
      if (fallbackResult.success) {
        return fallbackResult;
      }
    } catch (_) {}
  }

  return primaryResult;
}

/**
 * Connects validated Simulator evidence record directly to the existing DEANCORE LoopExecutionInput,
 * feeding CanonicalEvidence into the existing evidence boundary and Doctor pipeline without bypassing any component.
 */
export function adaptSimulatorToLoopInput(
  baseInput: LoopExecutionInput,
  simulatorRecord?: SimulatorEvidenceItem | SimulatorEvidenceItem[]
): LoopExecutionInput {
  const records = Array.isArray(simulatorRecord)
    ? simulatorRecord
    : simulatorRecord
    ? [simulatorRecord]
    : [];

  if (records.length === 0) {
    return {
      ...baseInput,
      workSignal: undefined,
      canonicalEvidence: undefined,
    };
  }

  let mergedCanonical: CanonicalEvidence = {};
  let hasPerformance = false;

  const updatedWorkSignal: WorkSignal = {
    dayNumber: baseInput.dayNumber,
    targetPickRate: 50,
    actualPickRate: 0,
    accuracyRate: 100,
    ordersCompleted: 0,
    targetOrders: 50,
  };

  for (const item of records) {
    if (!item || !item.canonicalEvidence) continue;
    const simCanonical = item.canonicalEvidence;

    if (simCanonical.performance) {
      hasPerformance = true;
      mergedCanonical.performance = {
        ...mergedCanonical.performance,
        ...simCanonical.performance,
      };
      if (simCanonical.performance.productivity !== undefined) {
        updatedWorkSignal.actualPickRate = Number(simCanonical.performance.productivity);
      }
      if (simCanonical.performance.targetProductivity !== undefined) {
        updatedWorkSignal.targetPickRate = Number(simCanonical.performance.targetProductivity);
      }
      if (simCanonical.performance.accuracy !== undefined) {
        updatedWorkSignal.accuracyRate = Number(simCanonical.performance.accuracy);
      }
    }

    if (simCanonical.attendance) {
      mergedCanonical.attendance = {
        ...mergedCanonical.attendance,
        ...simCanonical.attendance,
      };
    }

    if (simCanonical.capability) {
      mergedCanonical.capability = {
        ...mergedCanonical.capability,
        ...simCanonical.capability,
      };
    }

    if (simCanonical.support) {
      mergedCanonical.support = {
        ...mergedCanonical.support,
        ...simCanonical.support,
      };
    }

    if (simCanonical.toolSystem) {
      mergedCanonical.toolSystem = {
        ...mergedCanonical.toolSystem,
        ...simCanonical.toolSystem,
      };
    }

    if (simCanonical.environment) {
      mergedCanonical.environment = {
        ...mergedCanonical.environment,
        ...simCanonical.environment,
      };
    }

    if (simCanonical.observation) {
      mergedCanonical.observation = {
        ...mergedCanonical.observation,
        ...simCanonical.observation,
      };
    }

    if (simCanonical.outcome) {
      mergedCanonical.outcome = {
        ...mergedCanonical.outcome,
        ...simCanonical.outcome,
      };
    }
  }

  const finalCanonical = Object.keys(mergedCanonical).length > 0 ? mergedCanonical : undefined;
  const finalWorkSignal = hasPerformance ? updatedWorkSignal : undefined;

  return {
    ...baseInput,
    workSignal: finalWorkSignal,
    canonicalEvidence: finalCanonical,
  };
}

/**
 * Public parser and canonical adapter for incoming evidence
 */
export function parseCanonicalEvidence(rawItem: any): SimulatorEvidenceItem | null {
  return validateAndSanitizeEvidenceRecord(rawItem);
}

/**
 * Ingests a list of evidence items and updates the active cohort's day records, metrics, and journey day.
 */
export function applyEvidenceToCohort(
  cohort: any[],
  evidenceItems: SimulatorEvidenceItem[],
  journeyDayOverride?: number
): any[] {
  const updated = JSON.parse(JSON.stringify(cohort));
  if (!Array.isArray(evidenceItems) || evidenceItems.length === 0) {
    return updated;
  }

  // Group evidence by canonical employee ID
  const evidenceByHire: Record<string, SimulatorEvidenceItem[]> = {};
  for (const item of evidenceItems) {
    const rawId = item.employeeId || item.employee_id || item.subjectId || (item as any).subject_id;
    const canId = mapToCanonicalEmployeeId(rawId);
    if (!evidenceByHire[canId]) evidenceByHire[canId] = [];
    evidenceByHire[canId].push(item);
  }

  // Update cohort members
  updated.forEach((hire: any) => {
    const items = evidenceByHire[hire.id] || [];
    if (items.length === 0) return;

    // Group items by journey day (no artificial day cap - accepts any day from simulator)
    const itemsByDay: Record<number, SimulatorEvidenceItem[]> = {};
    for (const item of items) {
      const rawDay =
        item.journeyDay ??
        item.journey_day ??
        item.dayNumber ??
        (item.context && typeof item.context === "object" ? (item.context as any).journey_day : undefined);
      const dayNum = Number(rawDay);
      if (Number.isFinite(dayNum) && dayNum >= 1) {
        const d = Math.floor(dayNum);
        if (!itemsByDay[d]) itemsByDay[d] = [];
        itemsByDay[d].push(item);
      }
    }

    const availableDays = Object.keys(itemsByDay)
      .map(Number)
      .filter((d) => d >= 1)
      .sort((a, b) => a - b);

    for (const d of availableDays) {
      const dayItems = itemsByDay[d] || [];
      let dayRecord = hire.daysHistory.find((rec: any) => rec.dayNumber === d);
      if (!dayRecord) {
        dayRecord = {
          dayNumber: d,
          date: `Day ${d}`,
          statusAtEnd: "Doing well",
          statusReason: `Day ${d} shift logged`,
        };
        hire.daysHistory.push(dayRecord);
      }

      let pickVol: number | undefined;
      let expVol: number | undefined;
      let pickVel: number | undefined;
      let accScore: number | undefined;
      let supervisorNote: string = "";
      let helpReqs: number | undefined;
      let timeTaken: number | undefined;

      for (const item of dayItems) {
        const type = (item.type || item.category || "").toLowerCase();
        const rawVal = item.value;
        const val = typeof rawVal === "number" ? rawVal : parseFloat(String(rawVal));
        const numVal = Number.isFinite(val) ? val : 0;

        if (type === "pick_volume" || type.includes("pick_volume")) {
          pickVol = Math.round(numVal);
        } else if (type === "expected_volume" || type.includes("expected_volume")) {
          expVol = Math.round(numVal);
        } else if (type === "pick_velocity" || type.includes("velocity") || type.includes("uph")) {
          pickVel = Math.round(numVal);
        } else if (type === "accuracy_score" || type.includes("accuracy")) {
          accScore = parseFloat(numVal.toFixed(1));
        } else if (type === "help_requests" || type.includes("help_request")) {
          helpReqs = Math.round(numVal);
        } else if (type === "time_taken" || type.includes("time_taken")) {
          timeTaken = Math.round(numVal);
        } else if (type.includes("note") || type.includes("observation")) {
          supervisorNote = String(item.value || "");
        }
      }

      const actualPickRate = pickVel ?? pickVol ?? (d === 1 ? 52 : 50);
      const targetPickRate = expVol ?? 60;
      const accuracyRate = accScore ?? (d === 1 ? 94.5 : 96.0);
      const ordersCompleted = pickVol ?? actualPickRate;

      dayRecord.workSignal = {
        dayNumber: d,
        targetPickRate,
        actualPickRate,
        accuracyRate,
        ordersCompleted,
        targetOrders: targetPickRate,
        hasWorkEvidence: true,
      };

      if (!dayRecord.dailySignal) {
        dayRecord.dailySignal = {
          id: `ds-${hire.id}-d${d}`,
          dayNumber: d,
          rawText: `Day ${d} shift completed. Pick pace: ${actualPickRate} UPH (target: ${targetPickRate}). Accuracy: ${accuracyRate}%.`,
          inputMethod: "voice",
          issue: actualPickRate < targetPickRate * 0.85 ? "Aisle navigation pacing" : "None",
          confidence: "High",
          possibleImpact: "Ramp velocity",
          category: "Work / Tools",
          summary: `Day ${d} telemetry: ${actualPickRate}/${targetPickRate} UPH, ${accuracyRate}% accuracy.`,
          timestamp: new Date().toISOString(),
          helpRequestsCount: helpReqs ?? 1,
        };
      }

      if (!dayRecord.managerSignal) {
        dayRecord.managerSignal = {
          id: `ms-${hire.id}-d${d}`,
          dayNumber: d,
          managerName: "Suresh K.",
          state: actualPickRate < targetPickRate * 0.85 ? "Needs support" : "Doing well",
          notes: supervisorNote || `Observed floor picking shift. Speed: ${actualPickRate} UPH, duration: ${timeTaken || 60}m.`,
          timestamp: new Date().toISOString(),
        };
      }

      if (actualPickRate < targetPickRate * 0.82) {
        dayRecord.statusAtEnd = "Needs attention";
        dayRecord.statusReason = `Pick rate (${actualPickRate} UPH) below target (${targetPickRate} UPH).`;
      } else {
        dayRecord.statusAtEnd = "Doing well";
        dayRecord.statusReason = `On track with ${actualPickRate} UPH and ${accuracyRate}% accuracy.`;
      }
    }

    // Sort days history in ascending order
    hire.daysHistory.sort((a: any, b: any) => a.dayNumber - b.dayNumber);

    // Update current day on the hire (driven by this hire's individual evidence)
    const maxDay = availableDays.length > 0 ? Math.max(...availableDays) : (hire.currentDay || 1);
    const finalDay = journeyDayOverride !== undefined ? journeyDayOverride : maxDay;
    hire.currentDay = finalDay;
    hire.journeyDay = finalDay;
    hire.daysCompleted = finalDay;

    const latestRecord = hire.daysHistory.find((r: any) => r.dayNumber === finalDay) || hire.daysHistory[hire.daysHistory.length - 1];
    if (latestRecord) {
      hire.status = latestRecord.statusAtEnd;
      hire.statusReason = latestRecord.statusReason;
      if (latestRecord.workSignal) {
        const paceRatio = Math.min(1.0, latestRecord.workSignal.actualPickRate / (latestRecord.workSignal.targetPickRate || 60));
        const accRatio = Math.min(1.0, latestRecord.workSignal.accuracyRate / 100);
        hire.overallReadinessScore = Math.round((paceRatio * 0.5 + accRatio * 0.5) * 100);
      }
    }
  });

  return updated;
}

export interface EvidenceSyncResult {
  success: boolean;
  count: number;
  data: SimulatorEvidenceItem[];
  updatedCohort?: any[];
}

/**
 * Orchestrates full evidence synchronization from Firestore and Simulator APIs
 */
export async function syncSimulatorEvidenceToCohort(
  currentCohort: any[],
  journeyDayOverride?: number,
  onStatusUpdate?: (status: "idle" | "fetching" | "success" | "fallback" | "error", message: string) => void
): Promise<EvidenceSyncResult> {
  onStatusUpdate?.("fetching", "Checking Shared Cloud Database...");
  try {
    const { fetchEvidenceFromFirestore } = await import("./firestoreSyncService");
    const fsEvidence = await fetchEvidenceFromFirestore();
    if (fsEvidence && fsEvidence.length > 0) {
      const updated = applyEvidenceToCohort(currentCohort, fsEvidence, journeyDayOverride);
      onStatusUpdate?.("success", `✓ Loaded ${fsEvidence.length} live records from Cloud Firestore!`);
      return { success: true, count: fsEvidence.length, data: fsEvidence, updatedCohort: updated };
    }
  } catch (fsErr) {
    console.log("Firestore fetch fallback:", fsErr);
  }

  // Fallback to REST API
  const res = await fetchSimulatorEvidence();
  if (res.success && res.evidence.length > 0) {
    const updated = applyEvidenceToCohort(currentCohort, res.evidence, journeyDayOverride);
    onStatusUpdate?.("success", `✓ Loaded ${res.evidence.length} records from Simulator API!`);
    return { success: true, count: res.evidence.length, data: res.evidence, updatedCohort: updated };
  }

  return { success: false, count: 0, data: [] };
}

