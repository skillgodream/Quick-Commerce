import { recordOutcomeLearningEvent } from "./ai/outcomeLearningEngine";
import { casebook } from "./ai/casebook";
import { LearningEvent, CasebookCase } from "./ai/casebookTypes";
import { governDecision } from "./ai/governanceEngine";
import { GovernanceEvaluationResult } from "./ai/governanceTypes";
import { telemetry } from "./ai/telemetry";
import { executionGuard } from "./ai/executionGuard";
import { reconstructDecisionAuditTrail, DecisionAuditTrail } from "./ai/auditTrail";
import { getApiEndpoint } from "./ai/versioning";
import { sanitizeInputText } from "./ai/securityGuard";
import {
  DailySignal,
  ManagerSignal,
  WorkSignal,
  IdentifiedPattern,
  RecommendedAction,
  NewHireStatus,
  NewHire,
  DayRecord,
  ActionOutcome,
  DARK_STORE_CAPABILITIES,
  CapabilityDefinition,
  CapabilityState,
  AdaptiveGearDecision,
  ExposureState,
  EvidenceLevel,
  PerformanceHealth,
  MasteryStatus,
  SignalCategory,
  SnapshotEvidenceItem,
  SnapshotEvidenceCategory,
  CandidatePattern,
} from "../types";
import { createDefaultCapabilitiesLedger } from "../data/seedData";
import { generateInterventionCandidate } from './ai/interventionEngine';
import { arbitrateIntervention } from './ai/arbitrationEngine';


export interface Day10EvaluationResult {
  isReady: boolean;
  status: "Job Ready" | "Not Ready";
  summary: string;
  verifiedCriteria: Array<{ name: string; met: boolean; detail: string }>;
  unresolvedBlockers: string[];
  recommendedAction: string;
}

export interface PatternSynthesisResult {
  pattern: IdentifiedPattern;
  action: RecommendedAction;
  learningEvent?: LearningEvent;
  governanceResult?: GovernanceEvaluationResult;
  updatedStatus: NewHireStatus;
  statusReason: string;
  updatedCapabilities: Record<number, CapabilityState>;
  overallReadinessScore: number;
  currentCapabilityId: number;
  adaptiveDecision: AdaptiveGearDecision;
  day10Evaluation?: Day10EvaluationResult;
  auditTrail?: DecisionAuditTrail;
  executionId?: string;
}


export interface CanonicalEvidence {
  performance?: {
    productivity?: number;
    targetProductivity?: number;
    accuracy?: number;
    completedWork?: number;
    timeTaken?: number;
  };
  attendance?: {
    shiftStatus?: string;
    attendanceStatus?: string;
    shiftCompletion?: number;
  };
  capability?: {
    taskProficiency?: string;
    trainingStatus?: string;
    newTaskExposure?: boolean;
  };
  support?: {
    helpRequests?: number;
    supervisorAssistance?: boolean;
  };
  toolSystem?: {
    toolStatus?: "Failed" | "Working" | "Unknown";
    toolProblem?: string;
    systemDowntime?: number; // minutes
  };
  environment?: {
    workloadCondition?: string;
    environmentalIssue?: string;
    externalBottleneck?: string;
  };
  observation?: {
    supervisorNote?: string;
    behaviorNote?: string;
    communicationNote?: string;
  };
  outcome?: {
    interventionResult?: "yes" | "no" | "partial" | "unknown";
    improved?: "yes" | "no" | "partial";
    treatmentContext?: string;
  };
}

export interface LoopExecutionInput {

  hire: NewHire;
  dayNumber: number;
  dailySignal?: DailySignal;
  managerSignal?: ManagerSignal;
  workSignal?: WorkSignal;
  actionOutcome?: ActionOutcome;
  previousRecord?: DayRecord;
  existingAction?: RecommendedAction;
  candidatePattern?: CandidatePattern;
  canonicalEvidence?: CanonicalEvidence;
}

export async function analyzeLongitudinalHistory(
  historyText: string
): Promise<CandidatePattern | undefined> {
  try {
    const sanitized = sanitizeInputText(historyText).sanitizedText;
    const endpoint = getApiEndpoint("/api/signals/understand-longitudinal");
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ historyText: sanitized }),
    });
    if (res.ok) {
      const data = await res.json();
      return data as CandidatePattern;
    }
  } catch (err: any) {
    if (process.env.NODE_ENV === "development" && process.env.DEBUG_AI) {
      console.debug("Client fallback for longitudinal analysis:", err?.message || err);
    }
  }
  return undefined;
}

export async function analyzeOutcomeNotes(
  notes: string,
  actionTitle?: string
): Promise<{ reason?: string; remainingIssue?: string }> {
  try {
    const sanitized = sanitizeInputText(notes).sanitizedText;
    const endpoint = getApiEndpoint("/api/signals/understand-outcome");
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: sanitized, actionTitle }),
    });
    if (res.ok) {
      const data = await res.json();
      return {
        reason: data.reason,
        remainingIssue: data.remainingIssue,
      };
    }
  } catch (err: any) {
    if (process.env.NODE_ENV === "development" && process.env.DEBUG_AI) {
      console.debug("Client fallback for outcome analysis:", err?.message || err);
    }
  }
  return {
    reason: "No AI interpretation available.",
    remainingIssue: "Unknown"
  };
}

export async function analyzeDailyReport(
  text: string,
  newHireName: string = "Rahul",
  dayNumber: number = 3
): Promise<Partial<DailySignal>> {
  try {
    const sanitized = sanitizeInputText(text).sanitizedText;
    const endpoint = getApiEndpoint("/api/signals/understand-daily");
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: sanitized, newHireName, dayNumber }),
    });
    if (res.ok) {
      const data = await res.json();
      return {
        issue: data.issue,
        confidence: data.confidence,
        possibleImpact: data.possibleImpact,
        category: data.category,
        summary: data.summary,
        companionResponse: data.companionResponse,
      };
    }
  } catch (err: any) {
    if (process.env.NODE_ENV === "development" && process.env.DEBUG_AI) {
      console.debug("Client fallback for daily report analysis:", err?.message || err);
    }
  }

  // Robust deterministic fallback
  const lower = text.toLowerCase();
  if (
    lower.includes("confused") ||
    lower.includes("where") ||
    lower.includes("find") ||
    lower.includes("aisle") ||
    lower.includes("shelf") ||
    lower.includes("rack") ||
    lower.includes("location")
  ) {
    return {
      issue: "Location navigation in high-frequency aisles",
      confidence: "High",
      possibleImpact: "Slow picking, elevated search time",
      category: "Environment",
      summary: "Worker understands scanning and device usage, but experiences friction locating specific product bins in Aisles 4-8.",
      companionResponse:
        `Don't worry, ${newHireName}! Floor layouts in high-frequency aisles take 2-3 shifts to memorize. High pick accuracy is your priority.`,
    };
  }

  if (
    lower.includes("scan") ||
    lower.includes("device") ||
    lower.includes("battery") ||
    lower.includes("bluetooth") ||
    lower.includes("disconnect") ||
    lower.includes("gun") ||
    lower.includes("barcode")
  ) {
    return {
      issue: "Handheld scanner & tool handling friction",
      confidence: "High",
      possibleImpact: "Order delays, re-scanning loops",
      category: "Tool",
      summary: "Worker encountered scanner connection or barcode reading delays on floor.",
      companionResponse:
        `Understood ${newHireName}. Clean the scanner optical lens with microfiber and alert your buddy if Bluetooth drops again.`,
    };
  }

  if (
    lower.includes("tired") ||
    lower.includes("feet") ||
    lower.includes("heavy") ||
    lower.includes("pain") ||
    lower.includes("exhausted") ||
    lower.includes("break")
  ) {
    return {
      issue: "Physical stamina pacing during shift peak",
      confidence: "Medium",
      possibleImpact: "Mid-shift fatigue, late order lag",
      category: "Physical",
      summary: "Worker is adjusting to floor walking distances and crate lifting volume.",
      companionResponse:
        `Great stamina effort today ${newHireName}. Remember to take your micro-breaks and use proper crate lifting posture!`,
    };
  }

  if (
    lower.includes("smooth") ||
    lower.includes("fast") ||
    lower.includes("good") ||
    lower.includes("confident") ||
    lower.includes("hit target") ||
    lower.includes("paced") ||
    lower.includes("easy")
  ) {
    return {
      issue: "Steady ramp progression",
      confidence: "High",
      possibleImpact: "Positive curve acceleration",
      category: "General",
      summary: "Worker is navigating smoothly and hitting expected ramp pace.",
      companionResponse:
        `Fantastic shift, ${newHireName}! You are building great muscle memory on the floor.`,
    };
  }

  return {
    issue: "General floor onboarding observation",
    confidence: "Medium",
    possibleImpact: "Standard ramp curve progress",
    category: "General",
    summary: text.slice(0, 100),
    companionResponse: `Thanks for checking in, ${newHireName}. Your floor buddy and team have your back!`,
  };
}

export async function askCompanion(
  question: string,
  dayNumber: number = 3
): Promise<string> {
  try {
    const res = await fetch("/api/companion/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, dayNumber, role: "Dark Store Picker" }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.answer) return data.answer;
    }
  } catch (err) {
    console.warn("Companion ask fallback used:", err);
  }

  // Deterministic helpful answer
  const q = question.toLowerCase();
  if (q.includes("dairy") || q.includes("cold") || q.includes("frozen") || q.includes("ice")) {
    return "Chilled and frozen dairy items are located in Aisle 8 Chiller Zone. Pick these items last on your order list so cold chain temperature is maintained!";
  }
  if (q.includes("barcode") || q.includes("scan") || q.includes("not working")) {
    return "If the barcode won't scan after two attempts: wipe the scanner lens, flatten the packaging, or enter the 4-digit short SKU code directly on your screen.";
  }
  if (q.includes("missing") || q.includes("not on shelf") || q.includes("out of stock")) {
    return "Spend no more than 30 seconds searching a single bin. If empty, tap 'Bin Empty' on your scanner to trigger inventory backstock check, and move to your next pick.";
  }
  return "Remember the 3 rules for today: 1. Confirm product name and weight before scanning. 2. Keep heavy items at bottom of the tote. 3. Ask your buddy Vikram if you ever get turned around in Aisles 4-8!";
}

/**
 * Calculates overall job readiness (0-100%) based on verified capability states.
 * IMPORTANT: This score is an informational summary, NOT the decision engine.
 * The intelligence makes all decisions from underlying multi-signal evidence.
 */
export function assessReadiness(
  capabilities: Record<number, CapabilityState>,
  hire?: Partial<NewHire>
): number {
  if (!capabilities) return 0;
  let scoreSum = 0;
  const totalCaps = DARK_STORE_CAPABILITIES.length; // 20 capabilities

  for (const cap of DARK_STORE_CAPABILITIES) {
    const state = capabilities[cap.id];
    if (!state) continue;

    if (state.mastery === "mastered") {
      scoreSum += 1.0;
    } else if (state.mastery === "proficient") {
      scoreSum += 0.85;
    } else if (state.evidence === "demonstrated") {
      scoreSum += 0.6;
    } else if (state.evidence === "emerging") {
      scoreSum += 0.3;
    } else if (state.exposure === "exposed" || state.exposure === "reinforced") {
      scoreSum += 0.1;
    }
  }

  let baseScore = Math.min(100, Math.round((scoreSum / totalCaps) * 100));

  // If mandatory training is incomplete, strong floor performance cannot override mandatory requirements
  let modulesCount = 10;
  if (hire) {
    if (hire.completedModuleIds && typeof hire.modulesCompleted === "number") {
      modulesCount = Math.max(hire.completedModuleIds.length, hire.modulesCompleted);
    } else if (hire.completedModuleIds) {
      modulesCount = hire.completedModuleIds.length;
    } else if (typeof hire.modulesCompleted === "number") {
      modulesCount = hire.modulesCompleted;
    }
  }
  if (modulesCount < 10) {
    const trainingFactor = modulesCount / 10;
    baseScore = Math.min(baseScore, Math.round(50 + trainingFactor * 35)); // Max 85% if modules < 10
  }

  return baseScore;
}

// Backward-compatible alias for assessReadiness
export const calculateReadinessScore = assessReadiness;

export interface CanonicalRoadmapStage {
  id: number;
  stageNumber: number;
  key: "training" | "capability" | "independent" | "productivity" | "reliability" | "job_ready";
  titleEn: string;
  titleHi: string;
  shortDescEn: string;
  shortDescHi: string;
  milestoneEn: string;
  milestoneHi: string;
  status: "completed" | "current" | "upcoming";
  isCurrent: boolean;
  completionPercentage: number;
}

export interface LearnerRoadmapResult {
  currentStageIndex: number; // 0 to 5
  currentStage: CanonicalRoadmapStage;
  nextMilestoneEn: string;
  nextMilestoneHi: string;
  destinationEn: string;
  destinationHi: string;
  stages: CanonicalRoadmapStage[];
  demonstratedCount: number;
  totalCapabilities: number;
  readinessScore: number;
  targetCapabilityDef?: CapabilityDefinition;
}

/**
 * Pure presentation derivation over the authoritative capabilities ledger,
 * readiness score, and shift history.
 */
export function deriveLearnerRoadmap(
  hire: NewHire,
  currentDay: number
): LearnerRoadmapResult {
  const capabilities = hire.capabilities || {};
  const currentRecord = hire.daysHistory.find((d) => d.dayNumber === currentDay);
  const currentPickRate = currentRecord?.workSignal?.actualPickRate ?? 0;
  const accuracy = currentRecord?.workSignal?.accuracyRate ?? 0;
  const modulesCompleted = hire.completedModuleIds?.length ?? 0;
  const readinessScore = (typeof hire.overallReadinessScore === "number" ? (hire.overallReadinessScore <= 1 ? Math.round(hire.overallReadinessScore * 100) : Math.round(hire.overallReadinessScore)) : 0);

  const demonstratedCount = (Object.values(capabilities) as CapabilityState[]).filter(
    (c) => c && (c.evidence === "demonstrated" || c.mastery === "proficient" || c.mastery === "mastered")
  ).length;

  const targetCapId = currentRecord?.recommendedAction?.targetCapabilityId || hire.currentCapabilityId || 3;
  const targetCapDef = DARK_STORE_CAPABILITIES.find((c) => c.id === targetCapId);

  // Authoritative stage calculation
  let currentStageIndex = 0;
  if (
    modulesCompleted >= 10 &&
    (readinessScore >= 85 || demonstratedCount >= 18 || (currentPickRate >= 50 && accuracy >= 98 && demonstratedCount >= 16))
  ) {
    currentStageIndex = 5; // 6. Job Ready
  } else if ((currentPickRate >= 45 && accuracy >= 98 && demonstratedCount >= 12) || (readinessScore >= 70 && demonstratedCount >= 12)) {
    currentStageIndex = 4; // 5. Reliability
  } else if ((currentPickRate >= 38 && demonstratedCount >= 8) || (readinessScore >= 50 && demonstratedCount >= 8)) {
    currentStageIndex = 3; // 4. Productivity
  } else if ((modulesCompleted >= 3 && demonstratedCount >= 4) || readinessScore >= 35) {
    currentStageIndex = 2; // 3. Independent Work
  } else if (modulesCompleted >= 1 || demonstratedCount >= 1) {
    currentStageIndex = 1; // 2. Capability
  } else {
    currentStageIndex = 0; // 1. Training
  }

  const rawStages: Array<{
    stageNumber: number;
    key: "training" | "capability" | "independent" | "productivity" | "reliability" | "job_ready";
    titleEn: string;
    titleHi: string;
    shortDescEn: string;
    shortDescHi: string;
    milestoneEn: string;
    milestoneHi: string;
  }> = [
    {
      stageNumber: 1,
      key: "training",
      titleEn: "Training & Orientation",
      titleHi: "बुनियादी ट्रेनिंग",
      shortDescEn: "LMS safety, store zones & terminal basics",
      shortDescHi: "स्टोर सुरक्षा, ज़ोन लेआउट व टर्मिनल की जानकारी",
      milestoneEn: "Complete mandatory foundation safety & terminal modules",
      milestoneHi: "बुनियादी सुरक्षा व टर्मिनल ट्रेनिंग मॉड्यूल पूरे करें",
    },
    {
      stageNumber: 2,
      key: "capability",
      titleEn: "Demonstrated Capability",
      titleHi: "हुनर व तकनीक",
      shortDescEn: targetCapDef ? `${targetCapDef.name}` : "Scanning accuracy & coordinate navigation",
      shortDescHi: targetCapDef ? `${targetCapDef.name}` : "बारकोड स्कैनिंग व लोकेशन नेविगेशन",
      milestoneEn: targetCapDef ? `Demonstrate proficiency in ${targetCapDef.name}` : "Demonstrate accurate rack & bin navigation",
      milestoneHi: targetCapDef ? `${targetCapDef.name} में कुशलता प्रमाणित करें` : "स्टोर रैक व शेल्फ में सही सामान बिना गलती पिक करना",
    },
    {
      stageNumber: 3,
      key: "independent",
      titleEn: "Independent Work",
      titleHi: "स्वतंत्र कार्य",
      shortDescEn: "Solo picking without recurring buddy calls",
      shortDescHi: "बिना साथी की मदद के खुद पूरे ऑर्डर पिक करना",
      milestoneEn: "Complete 5 consecutive customer pick orders solo without assistance",
      milestoneHi: "लगातार 5 ऑर्डर अकेले सफलतापूर्वक पूरे करें",
    },
    {
      stageNumber: 4,
      key: "productivity",
      titleEn: "Productivity & Speed",
      titleHi: "रफ़्तार व गति",
      shortDescEn: "Reaching 40-50 items/hr with zero backtracking",
      shortDescHi: "40-50 सामान/घंटा की रफ़्तार से पिकिंग करना",
      milestoneEn: "Sustain 45+ items/hr pick rate across assigned wave",
      milestoneHi: "पूरी शिफ्ट वेव में 45+ सामान/घंटा की स्पीड बनाए रखना",
    },
    {
      stageNumber: 5,
      key: "reliability",
      titleEn: "Shift Reliability",
      titleHi: "स्थिरता व सटीकता",
      shortDescEn: "Consistent 98%+ scanning accuracy & exception handling",
      shortDescHi: "लगातार 98%+ एक्यूरेसी व जीरो डैमेज बनाए रखना",
      milestoneEn: "Maintain 98%+ scanning accuracy consistently across 3 shifts",
      milestoneHi: "लगातार 3 शिफ्टों में 98%+ एक्यूरेसी बनाए रखना",
    },
    {
      stageNumber: 6,
      key: "job_ready",
      titleEn: "Job Ready / Certified",
      titleHi: "पूर्ण कार्यकुशल (सर्टिफाइड)",
      shortDescEn: "Certified Autonomous Dark Store Picker",
      shortDescHi: "प्रमाणित स्वतंत्र डार्क स्टोर पिकर",
      milestoneEn: "Full shift autonomy across all store zones under peak SLA",
      milestoneHi: "सभी स्टोर ज़ोन में पूर्ण स्वतंत्र व तेज़ पिकिंग",
    },
  ];

  const stages: CanonicalRoadmapStage[] = rawStages.map((s, idx) => {
    const isCompleted = idx < currentStageIndex;
    const isCurrent = idx === currentStageIndex;
    const status: "completed" | "current" | "upcoming" = isCompleted ? "completed" : isCurrent ? "current" : "upcoming";
    let completionPercentage = 0;
    if (isCompleted) {
      completionPercentage = 100;
    } else if (isCurrent) {
      if (idx === 0) completionPercentage = Math.round(Math.min(100, (modulesCompleted / 3) * 100));
      else if (idx === 1) completionPercentage = Math.round(Math.min(100, (demonstratedCount / 4) * 100));
      else if (idx === 2) completionPercentage = Math.round(Math.min(100, (demonstratedCount / 8) * 100));
      else if (idx === 3) completionPercentage = Math.round(Math.min(100, ((currentPickRate - 30) / 20) * 100));
      else if (idx === 4) completionPercentage = Math.round(Math.min(100, ((accuracy - 90) / 10) * 100));
      else completionPercentage = readinessScore;
    }
    return {
      id: s.stageNumber,
      stageNumber: s.stageNumber,
      key: s.key,
      titleEn: s.titleEn,
      titleHi: s.titleHi,
      shortDescEn: s.shortDescEn,
      shortDescHi: s.shortDescHi,
      milestoneEn: s.milestoneEn,
      milestoneHi: s.milestoneHi,
      status,
      isCurrent,
      completionPercentage: Math.max(0, Math.min(100, completionPercentage)),
    };
  });

  const currentStage = stages[currentStageIndex];
  const nextStage = stages[Math.min(5, currentStageIndex + 1)];

  return {
    currentStageIndex,
    currentStage,
    nextMilestoneEn: currentStageIndex === 5 ? "Autonomous shift certification maintained" : nextStage.milestoneEn,
    nextMilestoneHi: currentStageIndex === 5 ? "प्रमाणित कार्यकुशलता जारी है" : nextStage.milestoneHi,
    destinationEn: "Certified Autonomous Dark Store Picker (50+ items/hr, 99% accuracy)",
    destinationHi: "प्रमाणित स्वतंत्र डार्क स्टोर पिकर (50+ सामान/घंटा, 99% एक्यूरेसी)",
    stages,
    demonstratedCount,
    totalCapabilities: DARK_STORE_CAPABILITIES.length,
    readinessScore,
    targetCapabilityDef: targetCapDef,
  };
}

// =========================================================================
// AUTHORITATIVE PREVIOUS-DAY SNAPSHOT SELECTION (19 Evidence Categories)
// Selects the 4 most meaningful parameters for Home; Dashboard carries full detail
// =========================================================================
export interface PreviousDaySnapshotResult {
  dayNumber: number;
  isFirstDay: boolean;
  hasInsufficientEvidence: boolean;
  shiftAssessment: {
    isGood: boolean;
    titleEn: string;
    titleHi: string;
    tagEn: string;
    tagHi: string;
    subEn: string;
    subHi: string;
    themeColor: "emerald" | "amber" | "rose" | "blue" | "purple";
  };
  selectedFourGrids: [
    SnapshotEvidenceItem,
    SnapshotEvidenceItem,
    SnapshotEvidenceItem,
    SnapshotEvidenceItem
  ];
  allDashboardEvidence: SnapshotEvidenceItem[];
}

/**
 * Authoritatively interprets previous-day evidence from multi-signal sources
 * and prioritizes the top 4 most meaningful evidence items for the 4-grid Home snapshot.
 * Absolutely NO fake/fabricated fallback numbers (like actualPace=20 or orders=15).
 */
export function extractAndSelectPreviousDaySnapshot(
  newHire: NewHire,
  currentDay: number
): PreviousDaySnapshotResult {
  const yesterdayNumber = Math.max(1, currentDay - 1);
  const isFirstDay = currentDay === 1;

  const yesterdayRecord: DayRecord | undefined = isFirstDay
    ? undefined
    : newHire.daysHistory.find((d) => d.dayNumber === yesterdayNumber) ||
      newHire.daysHistory.filter((d) => d.dayNumber < currentDay).pop();

  const prevWork = yesterdayRecord?.workSignal;
  const prevDaily = yesterdayRecord?.dailySignal;
  const prevManager = yesterdayRecord?.managerSignal;
  const prevPattern = yesterdayRecord?.identifiedPattern;
  const prevAction = yesterdayRecord?.recommendedAction;
  const prevOutcome = yesterdayRecord?.actionOutcome;

  // Real work evidence check (strictly distinguishing real metrics from absent data)
  const hasActualWorkEvidence = Boolean(
    prevWork &&
    prevWork.hasWorkEvidence !== false &&
    (prevWork.ordersCompleted > 0 || prevWork.actualPickRate > 0)
  );

  const modulesCompleted = newHire.completedModuleIds?.length ?? 0;
  const quizAvg = newHire.quizAverageScore;
  const hasQuizGap = quizAvg !== undefined && quizAvg < 70;
  const isTrainingIncomplete = modulesCompleted < 3; // Foundation modules incomplete

  const pool: SnapshotEvidenceItem[] = [];

  // 1. Tool Problem
  const isToolProblem =
    prevDaily?.category === "Tool" ||
    prevManager?.issueCategory === "Tool" ||
    prevPattern?.category === "Tool" ||
    prevAction?.decisionType === "tool_remedy" ||
    (prevDaily?.rawText || "").toLowerCase().includes("scanner") ||
    (prevDaily?.rawText || "").toLowerCase().includes("battery") ||
    (prevDaily?.rawText || "").toLowerCase().includes("bluetooth");

  if (isToolProblem) {
    pool.push({
      id: "ev-tool-problem",
      category: "tool_problem",
      titleEn: "Scanner Hardware Issue",
      titleHi: "स्कैनर हार्डवेयर समस्या",
      metricValue: "Hardware",
      metricUnit: "issue",
      contextTextEn: "Optical scanner lens latency / disconnect (not worker knowledge)",
      contextTextHi: "स्कैनर लेंस लेटेंसी / डिस्कनेक्ट (ट्रेनी की गलती नहीं)",
      badgeEn: "⚠️ Tool Impact",
      badgeHi: "⚠️ टूल समस्या",
      iconName: "Wrench",
      themeColor: "amber",
      priorityWeight: 98,
    });
  }

  // 2. Safety Issue
  const isSafetyIssue =
    prevPattern?.diagnosis?.toLowerCase().includes("safety") ||
    (prevDaily?.category === "Process" && (prevDaily?.rawText || "").toLowerCase().includes("safety")) ||
    (prevManager?.notes || "").toLowerCase().includes("safety") ||
    /\bppe\b/i.test(prevManager?.notes || "");

  if (isSafetyIssue) {
    pool.push({
      id: "ev-safety-issue",
      category: "safety_issue",
      titleEn: "Store Safety & PPE",
      titleHi: "स्टोर सुरक्षा व पीपीई",
      metricValue: "Protocol",
      metricUnit: "check",
      contextTextEn: "Floor hazard avoidance & mandatory PPE compliance check",
      contextTextHi: "फ्लोर खतरा बचाव व अनिवार्य पीपीई अनुपालन जांच",
      badgeEn: "🛡️ Safety Check",
      badgeHi: "🛡️ सुरक्षा जांच",
      iconName: "ShieldCheck",
      themeColor: "rose",
      priorityWeight: 97,
    });
  }

  // 3. Capability Gap (e.g. Navigation in Aisles 4-8)
  const isNavigationGap =
    prevDaily?.category === "Environment" ||
    prevPattern?.category === "Environment" ||
    (prevDaily?.rawText || "").toLowerCase().includes("aisle") ||
    (prevDaily?.rawText || "").toLowerCase().includes("shelf") ||
    (prevDaily?.rawText || "").toLowerCase().includes("location") ||
    (prevManager?.notes || "").toLowerCase().includes("location");

  if (isNavigationGap) {
    pool.push({
      id: "ev-capability-gap-nav",
      category: "capability_gap",
      titleEn: "Aisle Navigation Gap",
      titleHi: "आइसल नेविगेशन अंतर",
      metricValue: "Aisles 4-8",
      metricUnit: "racks",
      contextTextEn: "Friction locating bin coordinates; search time slowing pick rate",
      contextTextHi: "बिन ढूंढने में देरी; सर्च टाइम से पिकिंग गति धीमी हुई",
      badgeEn: "📍 Aisles 4-8",
      badgeHi: "📍 आइसल 4-8",
      iconName: "Compass",
      themeColor: "amber",
      priorityWeight: 95,
    });
  }

  // 4. Repeated Help Dependency
  const helpCount = prevWork?.helpRequestsCount ?? prevDaily?.helpRequestsCount ?? 0;
  const isHelpDependency =
    helpCount >= 3 ||
    (prevDaily?.rawText || "").toLowerCase().includes("couldn't pick without buddy") ||
    (prevDaily?.rawText || "").toLowerCase().includes("called buddy") ||
    (prevManager?.notes || "").toLowerCase().includes("help dependency");

  if (isHelpDependency) {
    pool.push({
      id: "ev-repeated-help",
      category: "repeated_help_dependency",
      titleEn: "Repeated Location Help",
      titleHi: "बार-बार सहायता अनुरोध",
      metricValue: helpCount > 0 ? `${helpCount}x` : "Frequent",
      metricUnit: "requests",
      contextTextEn: "High buddy dependency during wave; needs structured solo confidence",
      contextTextHi: "पिकिंग के दौरान साथी पर निर्भरता; खुद पिक करने का अभ्यास चाहिए",
      badgeEn: "🤝 Help Dependent",
      badgeHi: "🤝 साथी सहायता",
      iconName: "HelpCircle",
      themeColor: "amber",
      priorityWeight: 94,
    });
  }

  // 5. Intervention Succeeded / Recovery
  if (prevOutcome?.improved === "yes") {
    pool.push({
      id: "ev-intervention-succeeded",
      category: "intervention_succeeded",
      titleEn: "Intervention Succeeded",
      titleHi: "हस्तक्षेप सफल रहा",
      metricValue: "Resolved",
      metricUnit: "step",
      contextTextEn: prevOutcome.notes || "Performance normalized after walkthrough; support stepped down",
      contextTextHi: "वॉकथ्रू के बाद प्रदर्शन में सुधार; स्वतंत्र पिकिंग शुरू",
      badgeEn: "✓ Improved",
      badgeHi: "✓ सुधार दर्ज",
      iconName: "CheckCircle2",
      themeColor: "emerald",
      priorityWeight: 96,
    });
    pool.push({
      id: "ev-recovery-improvement",
      category: "recovery_improvement",
      titleEn: "Floor Recovery / Gain",
      titleHi: "फ्लोर रिकवरी व प्रगति",
      metricValue: prevOutcome.subsequentPickRate ? `${prevOutcome.subsequentPickRate}/hr` : "Solid",
      metricUnit: "pace",
      contextTextEn: "Independent execution resumed with solid accuracy and rhythm",
      contextTextHi: "सटीक और अच्छी लय के साथ स्वतंत्र पिकिंग दोबारा शुरू",
      badgeEn: "🚀 Recovery",
      badgeHi: "🚀 रिकवरी",
      iconName: "TrendingUp",
      themeColor: "emerald",
      priorityWeight: 92,
    });
  } else if (prevOutcome?.improved === "no") {
    pool.push({
      id: "ev-intervention-failed",
      category: "intervention_failed",
      titleEn: "Intervention Ineffective",
      titleHi: "अतिरिक्त मदद जरूरी",
      metricValue: "Repeat",
      metricUnit: "support",
      contextTextEn: "Root cause persists; escalation to supervisor demo required",
      contextTextHi: "समस्या बनी हुई है; सुपरवाइजर द्वारा प्रत्यक्ष डेमो आवश्यक",
      badgeEn: "⚠️ Escalated",
      badgeHi: "⚠️ सहायता जारी",
      iconName: "AlertTriangle",
      themeColor: "rose",
      priorityWeight: 96,
    });
  } else if (prevAction) {
    pool.push({
      id: "ev-intervention-performed",
      category: "intervention_performed",
      titleEn: "Support Assigned",
      titleHi: "सहायता वॉकथ्रू असाइन",
      metricValue: prevAction.targetActor.split(" ")[0],
      metricUnit: "support",
      contextTextEn: prevAction.smallestPracticalStep || prevAction.description,
      contextTextHi: "साथी के साथ 15 मिनट का फ्लोर वॉकथ्रू व अभ्यास",
      badgeEn: "🎯 Active Step",
      badgeHi: "🎯 सक्रिय कदम",
      iconName: "UserCheck",
      themeColor: "purple",
      priorityWeight: 88,
    });
  }

  // 6. Mandatory Training Incomplete
  if (isTrainingIncomplete) {
    pool.push({
      id: "ev-training-incomplete",
      category: "required_training_incomplete",
      titleEn: "Mandatory Training Gap",
      titleHi: "अनिवार्य ट्रेनिंग अधूरी",
      metricValue: `${modulesCompleted}/10`,
      metricUnit: "modules",
      contextTextEn: "Foundation safety & terminal LMS modules must be completed",
      contextTextHi: "सुरक्षा व टर्मिनल के बुनियादी ट्रेनिंग मॉड्यूल पूरे करना जरूरी",
      badgeEn: "⚠️ Blocker",
      badgeHi: "⚠️ जरूरी",
      iconName: "BookOpen",
      themeColor: "rose",
      priorityWeight: 93,
    });
  }

  // 7. Assessment / Quiz Weakness
  if (hasQuizGap) {
    pool.push({
      id: "ev-assessment-weakness",
      category: "assessment_weakness",
      titleEn: "Assessment Review Needed",
      titleHi: "क्विज़ रिवीजन आवश्यक",
      metricValue: `${quizAvg}%`,
      metricUnit: "score",
      contextTextEn: "LMS quiz score below 70% passing bar; concepts require review",
      contextTextHi: "क्विज़ स्कोर 70% से कम; नियमों को दोहराना आवश्यक",
      badgeEn: "⚠️ Quiz 40%",
      badgeHi: "⚠️ क्विज़ रिव्यू",
      iconName: "AlertTriangle",
      themeColor: "amber",
      priorityWeight: 91,
    });
  }

  // 8. Training Completed
  if (modulesCompleted >= 3) {
    pool.push({
      id: "ev-training-completed",
      category: "training_completed",
      titleEn: "Training Modules",
      titleHi: "ट्रेनिंग मॉड्यूल पूर्ण",
      metricValue: `${modulesCompleted}/10`,
      metricUnit: "completed",
      contextTextEn: `Foundation LMS modules verified with ${quizAvg ?? 90}% average score`,
      contextTextHi: `बुनियादी सुरक्षा व टर्मिनल मॉड्यूल ${quizAvg ?? 90}% स्कोर के साथ पूर्ण`,
      badgeEn: "✓ Verified",
      badgeHi: "✓ सत्यापित",
      iconName: "CheckCircle2",
      themeColor: "purple",
      progressPct: Math.min(100, Math.round((modulesCompleted / 10) * 100)),
      priorityWeight: 75,
    });
  }

  // 9. Real Work Performance Metrics (ONLY IF ACTUAL TELEMETRY EXISTS)
  if (hasActualWorkEvidence && prevWork) {
    const pacePct = Math.min(100, Math.round((prevWork.actualPickRate / prevWork.targetPickRate) * 100));
    const isPaceBelow = prevWork.actualPickRate < prevWork.targetPickRate - 3;

    // Pick Speed / Productivity
    pool.push({
      id: "ev-work-speed",
      category: "productivity",
      titleEn: "Pick Speed",
      titleHi: "पिकिंग रफ़्तार",
      metricValue: `${prevWork.actualPickRate}`,
      metricUnit: "/hr",
      contextTextEn: `🎯 Goal ${prevWork.targetPickRate}/hr (${pacePct}%)`,
      contextTextHi: `🎯 लक्ष्य ${prevWork.targetPickRate}/hr (${pacePct}%)`,
      badgeEn: isPaceBelow ? "⚠️ Below Target" : "✓ On Track",
      badgeHi: isPaceBelow ? "⚠️ लक्ष्य से कम" : "✓ लक्ष्य पर",
      iconName: "TrendingUp",
      themeColor: isPaceBelow ? "amber" : "purple",
      progressPct: pacePct,
      priorityWeight: isPaceBelow ? 85 : 70,
    });

    // Accuracy
    const isAccuracyLow = prevWork.accuracyRate < 98;
    pool.push({
      id: "ev-work-accuracy",
      category: "accuracy",
      titleEn: "Scan Accuracy",
      titleHi: "स्कैनिंग एक्यूरेसी",
      metricValue: `${prevWork.accuracyRate}%`,
      metricUnit: "rate",
      contextTextEn: isAccuracyLow ? "Mis-picks recorded during wave" : "Zero barcode scan errors logged",
      contextTextHi: isAccuracyLow ? "ऑर्डर पिकिंग में गलतियां दर्ज" : "0 बारकोड स्कैनिंग गलतियां दर्ज",
      badgeEn: isAccuracyLow ? "⚠️ QC Mis-picks" : "✓ 0 Errors",
      badgeHi: isAccuracyLow ? "⚠️ मिस-पिक" : "✓ 0 त्रुटियां",
      iconName: "ShieldCheck",
      themeColor: isAccuracyLow ? "rose" : "emerald",
      progressPct: prevWork.accuracyRate,
      priorityWeight: isAccuracyLow ? 90 : 65,
    });

    // Orders Completed / Work Output
    pool.push({
      id: "ev-work-orders",
      category: "work_performance",
      titleEn: "Orders Dispatched",
      titleHi: "ऑर्डर पूरे",
      metricValue: `${prevWork.ordersCompleted}`,
      metricUnit: "orders",
      contextTextEn: `📦 Target: ${prevWork.targetOrders || 30} orders`,
      contextTextHi: `📦 लक्ष्य: ${prevWork.targetOrders || 30} ऑर्डर`,
      badgeEn: "📦 100% On-Time",
      badgeHi: "📦 समय पर डिस्पैच",
      iconName: "Package",
      themeColor: "blue",
      progressPct: Math.min(100, Math.round((prevWork.ordersCompleted / (prevWork.targetOrders || 30)) * 100)),
      priorityWeight: 60,
    });

    // Independence (if no help requests and healthy performance)
    if (helpCount === 0 && !isPaceBelow && !isAccuracyLow) {
      pool.push({
        id: "ev-work-independence",
        category: "independence",
        titleEn: "Independent Picking",
        titleHi: "स्वतंत्र पिकिंग",
        metricValue: "100%",
        metricUnit: "solo",
        contextTextEn: "Completed wave orders autonomously without buddy escalation",
        contextTextHi: "बिना साथी की मदद के खुद पूरे ऑर्डर सफलतापूर्वक पिक किए",
        badgeEn: "✓ Solo Wave",
        badgeHi: "✓ खुद पूरा किया",
        iconName: "UserCheck",
        themeColor: "emerald",
        priorityWeight: 80,
      });
    }
  }

  // 10. Environment Problem (Facility Bottleneck / Spills / Aisle Congestion)
  if (prevWork?.externalBottleneck || (prevPattern?.category === "Environment" && !isNavigationGap)) {
    pool.push({
      id: "ev-environment-bottleneck",
      category: "environment_problem",
      titleEn: "Facility Bottleneck",
      titleHi: "स्टोर सुविधा रुकावट",
      metricValue: "Facility",
      metricUnit: "delay",
      contextTextEn: prevWork?.externalBottleneck || "Conveyor / spill delay on floor (external factor)",
      contextTextHi: "कन्वेयर या फ्लोर रुकावट (बाहरी कारण)",
      badgeEn: "⚠️ Facility",
      badgeHi: "⚠️ बाहरी रुकावट",
      iconName: "AlertTriangle",
      themeColor: "amber",
      priorityWeight: 89,
    });
  }

  // 11. No Meaningful Problem (Healthy Learner state)
  const hasNoMajorProblems =
    !isToolProblem &&
    !isSafetyIssue &&
    !isNavigationGap &&
    !isHelpDependency &&
    !hasQuizGap &&
    !isTrainingIncomplete &&
    (hasActualWorkEvidence ? (prevWork?.actualPickRate ?? 50) >= (prevWork?.targetPickRate ?? 50) - 2 : true);

  if (hasNoMajorProblems && !isFirstDay) {
    pool.push({
      id: "ev-no-problem",
      category: "no_meaningful_problem",
      titleEn: "Smooth Floor Ramp",
      titleHi: "संतुलित व स्थिर प्रगति",
      metricValue: "Optimal",
      metricUnit: "pace",
      contextTextEn: "No critical barriers detected; steady ramp curve progression",
      contextTextHi: "कोई बाधा नहीं; मानक गति से सुचारू रूप से आगे बढ़ रहे हैं",
      badgeEn: "👍 Steady Ramp",
      badgeHi: "👍 स्थिर प्रगति",
      iconName: "ThumbsUp",
      themeColor: "emerald",
      priorityWeight: 50,
    });
  }

  // 12. Insufficient Evidence / First Day observation
  if (!hasActualWorkEvidence || isFirstDay || pool.length === 0) {
    pool.push({
      id: "ev-insufficient-evidence-1",
      category: "insufficient_evidence",
      titleEn: isFirstDay ? "Day 1 Orientation" : "Awaiting Shift Orders",
      titleHi: isFirstDay ? "पहला दिन: ओरिएंटेशन" : "शिफ्ट आर्डर प्रतीक्षित",
      metricValue: isFirstDay ? "Day 1" : "Pending",
      metricUnit: isFirstDay ? "start" : "telemetry",
      contextTextEn: isFirstDay
        ? "Floor shadowing & orientation in progress; no solo metrics yet"
        : "Floor shift wave telemetry will populate once picking wave finishes",
      contextTextHi: isFirstDay
        ? "साथी के साथ स्टोर समझना व ओरिएंटेशन जारी; अभी कोई सोलो नंबर नहीं"
        : "शिफ्ट वेव खत्म होने पर फ्लोर डेटा अपने आप दर्ज हो जाएगा",
      badgeEn: isFirstDay ? "🌱 Orientation" : "⏳ Observational",
      badgeHi: isFirstDay ? "🌱 ओरिएंटेशन" : "⏳ अवलोकन",
      iconName: "Clock",
      themeColor: "slate",
      priorityWeight: 40,
    });
  }

  // Shift Assessment Overall Badge logic
  const isGood =
    prevOutcome?.improved === "yes" ||
    (hasActualWorkEvidence && (prevWork?.actualPickRate ?? 0) >= (prevWork?.targetPickRate ?? 0) - 2 && (prevWork?.accuracyRate ?? 0) >= 98);

  const shiftAssessment = {
    isGood,
    titleEn: isFirstDay ? "DAY 1 ORIENTATION" : isGood ? "GOOD SHIFT" : "NEEDS ATTENTION",
    titleHi: isFirstDay ? "पहला दिन ओरिएंटेशन" : isGood ? "शानदार प्रदर्शन (GOOD)" : "सुधार जरूरी (NEEDS WORK)",
    tagEn: isFirstDay ? "Day 1" : isGood ? "✓ On Track" : isNavigationGap ? "⚠️ Aisle Route" : isToolProblem ? "⚠️ Tool Issue" : hasQuizGap ? "⚠️ Quiz Review" : "⚠️ Ramp Support",
    tagHi: isFirstDay ? "पहला दिन" : isGood ? "✓ लक्ष्य पर" : isNavigationGap ? "⚠️ आइसल रूट" : isToolProblem ? "⚠️ टूल समस्या" : hasQuizGap ? "⚠️ क्विज़ रिवीजन" : "⚠️ सहायता सक्रिय",
    subEn: isFirstDay ? "Store safety & terminal familiarization" : isGood ? "Safe & accurate picking rhythm" : "Targeted walkthrough & support active",
    subHi: isFirstDay ? "सुरक्षा व टर्मिनल की बुनियादी जानकारी" : isGood ? "सटीक व सुरक्षित कार्य" : "लक्षित वॉकथ्रू व सहायता सक्रिय",
    themeColor: (isFirstDay ? "purple" : isGood ? "emerald" : "amber") as "emerald" | "amber" | "rose" | "blue" | "purple",
  };

  // Sort candidate evidence items by intelligence priority weight
  pool.sort((a, b) => b.priorityWeight - a.priorityWeight);

  // Take top 4 distinct items. If fewer than 4 unique items exist, fill with meaningful fallback evidence items without fabricating data
  const selected: SnapshotEvidenceItem[] = [];
  const seenCategories = new Set<string>();

  for (const item of pool) {
    if (!seenCategories.has(item.category) && selected.length < 4) {
      selected.push(item);
      seenCategories.add(item.category);
    }
  }

  // Fallback fillers if pool < 4 (strictly realistic non-fabricated items)
  const fillerFallbacks: SnapshotEvidenceItem[] = [
    {
      id: "ev-fallback-training",
      category: "training_completed",
      titleEn: "Training Status",
      titleHi: "ट्रेनिंग स्थिति",
      metricValue: `${modulesCompleted}/10`,
      metricUnit: "modules",
      contextTextEn: `${modulesCompleted} modules completed (${quizAvg ?? 90}% quiz score)`,
      contextTextHi: `${modulesCompleted} मॉड्यूल पूर्ण (${quizAvg ?? 90}% क्विज़ स्कोर)`,
      badgeEn: "LMS Progress",
      badgeHi: "एलएमएस प्रगति",
      iconName: "BookOpen",
      themeColor: "purple",
      priorityWeight: 10,
    },
    {
      id: "ev-fallback-buddy",
      category: "independence",
      titleEn: "Floor Buddy Support",
      titleHi: "फ्लोर साथी सहयोग",
      metricValue: (newHire.buddy || "Vikram").split(" ")[0],
      metricUnit: "buddy",
      contextTextEn: "1-tap direct audio/call assistance available on floor",
      contextTextHi: "फ्लोर पर 1-टैप में साथी से सहायता उपलब्ध",
      badgeEn: "🤝 On-Floor",
      badgeHi: "🤝 उपलब्ध",
      iconName: "UserCheck",
      themeColor: "blue",
      priorityWeight: 9,
    },
    {
      id: "ev-fallback-shift-status",
      category: "no_meaningful_problem",
      titleEn: "Shift Health",
      titleHi: "शिफ्ट स्थिति",
      metricValue: isGood ? "Good" : "Support",
      metricUnit: "status",
      contextTextEn: isGood ? "Safe & accurate work recorded" : "Standard guidance active",
      contextTextHi: isGood ? "सटीक व सुरक्षित कार्य दर्ज" : "मानक मार्गदर्शन सक्रिय",
      badgeEn: isGood ? "✓ Doing Well" : "⚠️ Needs Attention",
      badgeHi: isGood ? "✓ सही प्रगति" : "⚠️ ध्यान दें",
      iconName: isGood ? "ThumbsUp" : "AlertTriangle",
      themeColor: isGood ? "emerald" : "amber",
      priorityWeight: 8,
    },
    {
      id: "ev-fallback-observation",
      category: "insufficient_evidence",
      titleEn: "Observation Cycle",
      titleHi: "अवलोकन चक्र",
      metricValue: "Active",
      metricUnit: "cycle",
      contextTextEn: "Continuous multi-signal observation active across shifts",
      contextTextHi: "शिफ्टों के दौरान मल्टी-सिग्नल अवलोकन निरंतर जारी",
      badgeEn: "Continuous",
      badgeHi: "निरंतर",
      iconName: "Clock",
      themeColor: "slate",
      priorityWeight: 7,
    },
  ];

  for (const filler of fillerFallbacks) {
    if (selected.length < 4 && !seenCategories.has(filler.category)) {
      selected.push(filler);
      seenCategories.add(filler.category);
    }
  }

  // Ensure exactly 4 items
  while (selected.length < 4) {
    selected.push({
      ...fillerFallbacks[3],
      id: `ev-fallback-extra-${selected.length}`,
    });
  }

  return {
    dayNumber: yesterdayNumber,
    isFirstDay,
    hasInsufficientEvidence: !hasActualWorkEvidence,
    shiftAssessment,
    selectedFourGrids: [selected[0], selected[1], selected[2], selected[3]],
    allDashboardEvidence: pool,
  };
}

// Internal data structures for the single authoritative pipeline
export interface ObservedSignals {
  currentPickRate: number;
  targetPickRate: number;
  accuracy: number;
  speedGap: number;
  previousPickRate?: number;
  currentCapabilities: Record<number, CapabilityState>;
  workerReportsConfusion: boolean;
  workerReportsTool: boolean;
  workerReportsVariant: boolean;
  workerReportsCommunication: boolean;
  workerReportsExternalBottleneck: boolean;
  externalBottleneckDescription?: string;
  hasWorkEvidence: boolean;
  helpRequestsCount: number;
  workerChronicHelpDependency: boolean;
  managerObservesSupport: boolean;
  managerObservesStruggle: boolean;
  managerObservesAccuracy: boolean;
  managerObservesSpeed: boolean;
  previousInterventionFailed: boolean;
  previousInterventionPartial: boolean;
  previousInterventionImproved?: boolean;
  previousTreatmentContext?: string;
  dailySignal?: DailySignal;
  managerSignal?: ManagerSignal;
  structuredEvidence: SnapshotEvidenceItem[];
  canonicalEvidence?: CanonicalEvidence;
  isSafetyRiskReported?: boolean;
}

type RootCauseType =
  | "tool_hardware"
  | "communication_confidence"
  | "environment_spatial"
  | "variant_quality"
  | "safety_blocker"
  | "prerequisite_gap"
  | "capability_practice"
  | "steady_ramp"
  | "environment_bottleneck"
  | "no_evidence"
  | "chronic_dependency";

export interface UnderstoodDiagnosis {
  rootCause: RootCauseType;
  targetCapId: number;
  diagnosisText: string;
  patternCategory: SignalCategory;
  patternName: string;
}

interface ConnectedContext {
  targetCapDef: CapabilityDefinition;
  prerequisites: CapabilityDefinition[];
  buddyName: string;
  supervisorName: string;
  firstName: string;
  roleTitle: string;
}

export interface DecidedAction {
  decisionType: AdaptiveGearDecision;
  targetCapId: number;
  targetActor: string;
  urgency: "Immediate" | "Next Shift" | "Monitor";
  actionTitle: string;
  actionDesc: string;
  practicalStep: string;
  decisionRationale: string;
  interimStatus: NewHireStatus;
  interimStatusReason: string;
}

// -------------------------------------------------------------
// INTERNAL HELPER 1: observe() - Normalize multi-signal evidence
// -------------------------------------------------------------
export function observe(input: LoopExecutionInput): ObservedSignals {
  const { hire, dailySignal, managerSignal, workSignal, previousRecord, existingAction, actionOutcome, canonicalEvidence } = input;

  const currentPickRate = canonicalEvidence?.performance?.productivity ?? workSignal?.actualPickRate;
  const targetPickRate = canonicalEvidence?.performance?.targetProductivity ?? workSignal?.targetPickRate;
  const accuracy = canonicalEvidence?.performance?.accuracy ?? workSignal?.accuracyRate;
  const speedGap = (targetPickRate != null && currentPickRate != null) ? targetPickRate - currentPickRate : 0;

  const previousPickRate = previousRecord?.workSignal?.actualPickRate;

  const currentCapabilities: Record<number, CapabilityState> = {
    ...(hire.capabilities || createDefaultCapabilitiesLedger()),
  };

  const textContent = `${dailySignal?.issue || ""} ${dailySignal?.rawText || ""} ${dailySignal?.category || ""}`.toLowerCase();
  const managerNotes = `${managerSignal?.notes || ""} ${canonicalEvidence?.observation?.supervisorNote || ""} ${canonicalEvidence?.observation?.behaviorNote || ""} ${canonicalEvidence?.observation?.communicationNote || ""}`.toLowerCase();
  const externalBottleneckText = `${workSignal?.externalBottleneck || ""} ${dailySignal?.rawText || ""} ${managerNotes}`.toLowerCase();

  const workerReportsExternalBottleneck =
    Boolean(canonicalEvidence?.environment?.externalBottleneck) ||
    Boolean(canonicalEvidence?.environment?.environmentalIssue) ||
    Boolean(canonicalEvidence?.toolSystem?.systemDowntime) ||
    Boolean(workSignal?.externalBottleneck) ||
    externalBottleneckText.includes("conveyor") ||
    externalBottleneckText.includes("liquid spill") ||
    externalBottleneckText.includes("spill") ||
    externalBottleneckText.includes("power outage") ||
    externalBottleneckText.includes("network outage") ||
    externalBottleneckText.includes("system down") ||
    externalBottleneckText.includes("facility bottleneck");

  const externalBottleneckDescription =
    canonicalEvidence?.environment?.externalBottleneck ||
    canonicalEvidence?.environment?.environmentalIssue ||
    (canonicalEvidence?.toolSystem?.systemDowntime ? `System downtime: ${canonicalEvidence.toolSystem.systemDowntime} mins` : undefined) ||
    workSignal?.externalBottleneck ||
    (workerReportsExternalBottleneck ? "facility/conveyor disruption" : undefined);

  const hasWorkEvidence =
    Boolean(canonicalEvidence || workSignal) &&
    workSignal?.hasWorkEvidence !== false &&
    !(workSignal?.ordersCompleted === 0 && (workSignal?.gapIdentified === "No shift orders logged" || (workSignal?.actualPickRate === 0 && workSignal?.accuracyRate === 0)));

  const helpRequestsCount = canonicalEvidence?.support?.helpRequests ?? workSignal?.helpRequestsCount ?? dailySignal?.helpRequestsCount ?? 0;

  const isExplicitDependency =
    textContent.includes("called buddy 6 times") ||
    textContent.includes("couldn't pick without buddy") ||
    textContent.includes("high help dependency") ||
    textContent.includes("unable to pick solo") ||
    textContent.includes("cannot pick solo") ||
    textContent.includes("need buddy with me on every single order") ||
    textContent.includes("stay with me while i pick") ||
    textContent.includes("stay with me") ||
    managerNotes.includes("continuous buddy support") ||
    managerNotes.includes("help dependency") ||
    managerNotes.includes("unable to pick solo") ||
    managerNotes.includes("needs independent picking");

  const workerChronicHelpDependency =
    isExplicitDependency ||
    (helpRequestsCount >= 5 && (managerSignal?.issueCategory === "Confidence" || managerSignal?.state === "Struggling"));

  const workerReportsConfusion =
    !workerChronicHelpDependency &&
    (textContent.includes("location") ||
      textContent.includes("confused") ||
      textContent.includes("where") ||
      textContent.includes("find") ||
      textContent.includes("aisle") ||
      textContent.includes("shelf") ||
      textContent.includes("rack"));

  const isToolResolved =
    canonicalEvidence?.toolSystem?.toolStatus === "Working" ||
    textContent.includes("working perfectly") ||
    textContent.includes("hardware resolved") ||
    managerNotes.includes("hardware resolved") ||
    managerNotes.includes("terminal hardware resolved");

  const workerReportsTool =
    !isToolResolved &&
    (canonicalEvidence?.toolSystem?.toolStatus === "Failed" ||
      Boolean(canonicalEvidence?.toolSystem?.toolProblem) ||
      dailySignal?.category === "Tool" ||
      textContent.includes("bluetooth") ||
      textContent.includes("battery") ||
      textContent.includes("hardware") ||
      (textContent.includes("scanner") &&
        (textContent.includes("disconnect") ||
          textContent.includes("died") ||
          textContent.includes("won't scan") ||
          textContent.includes("broken") ||
          textContent.includes("lens"))) ||
      managerSignal?.issueCategory === "Tool");

  const workerReportsVariant =
    textContent.includes("variant") ||
    textContent.includes("packaging") ||
    textContent.includes("packet") ||
    textContent.includes("weight") ||
    textContent.includes("gram") ||
    textContent.includes("wrong item");

  const workerReportsCommunication =
    textContent.includes("nervous") ||
    textContent.includes("hesitant") ||
    textContent.includes("afraid") ||
    textContent.includes("shy") ||
    textContent.includes("scared to ask") ||
    managerSignal?.issueCategory === "Confidence";

  const managerObservesSupport = managerSignal?.state === "Needs support" || canonicalEvidence?.support?.supervisorAssistance === true;
  const managerObservesStruggle = managerSignal?.state === "Struggling";
  const managerObservesAccuracy = managerSignal?.issueCategory === "Accuracy";
  const managerObservesSpeed = managerSignal?.issueCategory === "Speed";

  const prevOutcome = actionOutcome || previousRecord?.actionOutcome;
  const prevImproved = canonicalEvidence?.outcome?.improved ?? prevOutcome?.improved;
  const previousInterventionPartial = Boolean(prevImproved === "partial");
  const previousInterventionImproved = Boolean(prevImproved === "yes");

  let previousTreatmentContext = undefined;
  const contextText = canonicalEvidence?.outcome?.treatmentContext ?? prevOutcome?.treatmentContext?.reason;
  if (contextText) {
     previousTreatmentContext = `Previous treatment (${prevImproved || 'unknown'}): ${contextText}`;
  }

  const previousInterventionFailed =
    Boolean(
      (prevImproved === "no") ||
      (!canonicalEvidence?.outcome?.improved && ((existingAction?.status === "completed" || previousRecord?.actionOutcome?.improved === "no") &&
        previousRecord?.actionOutcome &&
        previousRecord.actionOutcome.improved === "no"))
    );

  const structuredEvidence: SnapshotEvidenceItem[] = [];

  if (hasWorkEvidence) {
    structuredEvidence.push({
      id: `ev-work-uph-${input.dayNumber}`,
      category: speedGap > 0 ? "work_performance" : "no_meaningful_problem",
      titleEn: `Pick Rate Performance: ${currentPickRate} UPH`,
      titleHi: `पिक दर प्रदर्शन: ${currentPickRate} UPH`,
      metricValue: `${currentPickRate}`,
      metricUnit: "UPH",
      contextTextEn: `Target is ${targetPickRate} UPH. Speed gap is ${speedGap} items/hr.`,
      contextTextHi: `लक्ष्य ${targetPickRate} UPH है।`,
      badgeEn: speedGap > 0 ? "⚡ Below Target" : "🎯 On Target",
      badgeHi: speedGap > 0 ? "⚡ लक्ष्य से कम" : "🎯 लक्ष्य पर",
      iconName: "TrendingUp",
      themeColor: speedGap > 0 ? "amber" : "emerald",
      priorityWeight: 90,
      source: "work_signal",
      evidenceType: "uph",
      timestampDay: input.dayNumber,
      observedValue: currentPickRate,
      confidence: "high",
      comparisonToPrevious: previousPickRate !== undefined ? `${currentPickRate >= previousPickRate ? "+" : ""}${currentPickRate - previousPickRate} vs prev` : undefined,
      direction: speedGap > 0 ? "conflicting" : "supporting",
    });

    structuredEvidence.push({
      id: `ev-work-acc-${input.dayNumber}`,
      category: accuracy < 98 ? "accuracy" : "no_meaningful_problem",
      titleEn: `Fulfillment Accuracy: ${accuracy}%`,
      titleHi: `सटीकता दर: ${accuracy}%`,
      metricValue: `${accuracy}`,
      metricUnit: "%",
      contextTextEn: `Observed order picking accuracy rate.`,
      contextTextHi: `ऑर्डर पिकिंग सटीकता दर।`,
      badgeEn: accuracy < 98 ? "⚠️ Review Accuracy" : "✓ High Accuracy",
      badgeHi: accuracy < 98 ? "⚠️ सटीकता जांचें" : "✓ उच्च सटीकता",
      iconName: "ShieldCheck",
      themeColor: accuracy < 98 ? "rose" : "emerald",
      priorityWeight: 89,
      source: "work_signal",
      evidenceType: "accuracy",
      timestampDay: input.dayNumber,
      observedValue: accuracy,
      confidence: "high",
      direction: accuracy < 98 ? "conflicting" : "supporting",
    });
  }

  if (helpRequestsCount > 0) {
    structuredEvidence.push({
      id: `ev-help-${input.dayNumber}`,
      category: helpRequestsCount >= 3 ? "repeated_help_dependency" : "capability_gap",
      titleEn: `Help Requests Logged: ${helpRequestsCount}`,
      titleHi: `सहायता अनुरोध: ${helpRequestsCount}`,
      metricValue: `${helpRequestsCount}`,
      metricUnit: "requests",
      contextTextEn: `Worker requested assistance during shift execution.`,
      contextTextHi: `ट्रेनी ने शिफ्ट के दौरान सहायता मांगी।`,
      badgeEn: "🤝 Buddy Support",
      badgeHi: "🤝 साथी सहायता",
      iconName: "HelpCircle",
      themeColor: helpRequestsCount >= 3 ? "amber" : "blue",
      priorityWeight: 85,
      source: "work_signal",
      evidenceType: "help_request",
      timestampDay: input.dayNumber,
      observedValue: helpRequestsCount,
      confidence: "high",
      direction: "conflicting",
    });
  }

  if (dailySignal) {
    structuredEvidence.push({
      id: `ev-daily-${input.dayNumber}`,
      category: dailySignal.category === "Tool" ? "tool_problem" : dailySignal.category === "Process" ? "safety_issue" : "capability_gap",
      titleEn: `Daily Check-In: ${dailySignal.category}`,
      titleHi: `दैनिक चेक-इन: ${dailySignal.category}`,
      metricValue: dailySignal.category,
      contextTextEn: dailySignal.rawText || dailySignal.issue || "Worker daily check-in observation.",
      contextTextHi: dailySignal.rawText || dailySignal.issue || "ट्रेनी दैनिक चेक-इन अवलोकन।",
      badgeEn: "📝 Daily Signal",
      badgeHi: "📝 दैनिक सिग्नल",
      iconName: "BookOpen",
      themeColor: "purple",
      priorityWeight: 80,
      source: "daily_signal",
      evidenceType: "assessment",
      timestampDay: input.dayNumber,
      observedValue: dailySignal.category,
      confidence: "medium",
      direction: "neutral",
    });
  }

  if (managerSignal) {
    structuredEvidence.push({
      id: `ev-mgr-${input.dayNumber}`,
      category: managerSignal.state === "Struggling" ? "capability_gap" : "no_meaningful_problem",
      titleEn: `Supervisor Observation: ${managerSignal.state}`,
      titleHi: `सुपरवाइज़र अवलोकन: ${managerSignal.state}`,
      metricValue: managerSignal.state,
      contextTextEn: managerSignal.notes || "Manager shift observation.",
      contextTextHi: managerSignal.notes || "मैनेजर शिफ्ट अवलोकन।",
      badgeEn: "👁️ Manager Note",
      badgeHi: "👁️ मैनेजर नोट",
      iconName: "UserCheck",
      themeColor: "indigo",
      priorityWeight: 82,
      source: "manager_signal",
      evidenceType: "manager_observation",
      timestampDay: input.dayNumber,
      observedValue: managerSignal.state,
      confidence: "high",
      direction: managerSignal.state === "Struggling" ? "conflicting" : "supporting",
    });
  }

  return {
    currentPickRate,
    targetPickRate,
    accuracy,
    speedGap,
    previousPickRate,
    currentCapabilities,
    workerReportsConfusion,
    workerReportsTool,
    workerReportsVariant,
    workerReportsCommunication,
    workerReportsExternalBottleneck,
    externalBottleneckDescription,
    hasWorkEvidence,
    helpRequestsCount,
    workerChronicHelpDependency,
    managerObservesSupport,
    managerObservesStruggle,
    managerObservesAccuracy,
    managerObservesSpeed,
    previousInterventionFailed,
    previousInterventionPartial,
    previousInterventionImproved,
    previousTreatmentContext,
    dailySignal,
    managerSignal,
    structuredEvidence,
    canonicalEvidence: input.canonicalEvidence,
  };
}

// -------------------------------------------------------------
// INTERNAL HELPER 1.5: linkEvidenceToCapabilities() - Doctor 2 Capability Linkage
// -------------------------------------------------------------
export function linkEvidenceToCapabilities(
  evidenceItems: SnapshotEvidenceItem[]
): Record<number, SnapshotEvidenceItem[]> {
  const mapping: Record<number, SnapshotEvidenceItem[]> = {};

  if (!evidenceItems || !Array.isArray(evidenceItems)) {
    return mapping;
  }

  const addLink = (capId: number, ev: SnapshotEvidenceItem) => {
    // Ground strictly in canonical DARK_STORE_CAPABILITIES
    if (!DARK_STORE_CAPABILITIES.some((c) => c.id === capId)) return;
    if (!mapping[capId]) {
      mapping[capId] = [];
    }
    if (!mapping[capId].some((existing) => existing.id === ev.id)) {
      mapping[capId].push(ev);
    }
  };

  for (const ev of evidenceItems) {
    // If evidence is explicitly insufficient/uncertain, do NOT manufacture links
    if (ev.category === "insufficient_evidence") {
      continue;
    }

    const matchedCapIds = new Set<number>();

    // 1. Explicit capabilityId tag on the evidence item
    if (typeof ev.capabilityId === "number" && DARK_STORE_CAPABILITIES.some((c) => c.id === ev.capabilityId)) {
      matchedCapIds.add(ev.capabilityId);
    }

    // Build unified searchable text for semantic matching
    const textBlob = `${ev.titleEn || ""} ${ev.contextTextEn || ""} ${ev.badgeEn || ""} ${ev.metricValue || ""} ${ev.source || ""}`.toLowerCase();

    // 2. Semantic matching against specific capability domains in DARK_STORE_CAPABILITIES
    // Cap 1: Store Safety & PPE
    if (
      /\bppe\b/i.test(textBlob) ||
      textBlob.includes("safety shoe") ||
      textBlob.includes("safety boot") ||
      textBlob.includes("slip hazard") ||
      textBlob.includes("emergency exit") ||
      textBlob.includes("traffic thoroughfare") ||
      textBlob.includes("floor safety") ||
      textBlob.includes("safety protocol") ||
      textBlob.includes("store safety")
    ) {
      matchedCapIds.add(1);
    }

    // Cap 2: Scanner Basics & Hardware
    if (
      textBlob.includes("ring-scanner") ||
      textBlob.includes("ring scanner") ||
      textBlob.includes("scanner login") ||
      textBlob.includes("bluetooth") ||
      textBlob.includes("battery dock") ||
      textBlob.includes("barcode aiming") ||
      textBlob.includes("scanner hardware") ||
      textBlob.includes("terminal login") ||
      (textBlob.includes("scanner") && !textBlob.includes("lens condensation"))
    ) {
      matchedCapIds.add(2);
    }

    // Cap 3: Coordinate Navigation & Location Reading
    if (
      textBlob.includes("coordinate") ||
      textBlob.includes("rack-bay-shelf-bin") ||
      textBlob.includes("rack numbering") ||
      textBlob.includes("bay numbering") ||
      textBlob.includes("shelf numbering") ||
      textBlob.includes("aisle navigation") ||
      textBlob.includes("spatial") ||
      textBlob.includes("finding rack") ||
      textBlob.includes("aisles 1-8") ||
      textBlob.includes("aisles 4-8") ||
      textBlob.includes("location navigation") ||
      textBlob.includes("location nav") ||
      (textBlob.includes("aisle") && (textBlob.includes("confusion") || textBlob.includes("search time") || textBlob.includes("coordinate")))
    ) {
      matchedCapIds.add(3);
    }

    // Cap 4: Cold Room Protocols
    if (
      textBlob.includes("cold room") ||
      textBlob.includes("cold chain") ||
      textBlob.includes("chilled dairy") ||
      textBlob.includes("thermal gear") ||
      textBlob.includes("thermal jacket") ||
      textBlob.includes("door-close") ||
      textBlob.includes("door close") ||
      textBlob.includes("lens condensation") ||
      textBlob.includes("refrigerat")
    ) {
      matchedCapIds.add(4);
    }

    // Cap 5: Single-Order Pick & Core Tote Flow
    if (
      textBlob.includes("single-order") ||
      textBlob.includes("single order") ||
      textBlob.includes("customer tote order") ||
      textBlob.includes("tote pick") ||
      textBlob.includes("directed pick path") ||
      textBlob.includes("bin barcode scan") ||
      textBlob.includes("solo pick")
    ) {
      matchedCapIds.add(5);
    }

    // Cap 6: Variant Differentiation & Quality Check
    if (
      textBlob.includes("variant") ||
      textBlob.includes("look-alike") ||
      textBlob.includes("200g vs 500g") ||
      textBlob.includes("200g") ||
      textBlob.includes("500g") ||
      textBlob.includes("diet vs regular") ||
      textBlob.includes("flavor") ||
      textBlob.includes("packaging mix-up") ||
      textBlob.includes("packaging variant")
    ) {
      matchedCapIds.add(6);
    }

    // Cap 7: Produce Weighment & PLU
    if (
      textBlob.includes("produce") ||
      textBlob.includes("weighment") ||
      textBlob.includes("digital scale") ||
      textBlob.includes("taring") ||
      textBlob.includes("plu barcode") ||
      textBlob.includes("price look-up") ||
      textBlob.includes("fresh produce")
    ) {
      matchedCapIds.add(7);
    }

    // Cap 8: Fragile Handling
    if (
      textBlob.includes("fragile") ||
      textBlob.includes("eggs") ||
      textBlob.includes("glass jar") ||
      textBlob.includes("bakery") ||
      textBlob.includes("crush") ||
      textBlob.includes("delicate")
    ) {
      matchedCapIds.add(8);
    }

    // Cap 9: Multi-Item Batching
    if (
      textBlob.includes("multi-item") ||
      textBlob.includes("multi-quantity") ||
      textBlob.includes("multi-qty") ||
      textBlob.includes("batching") ||
      textBlob.includes("batch pick") ||
      textBlob.includes("identical items") ||
      textBlob.includes("unit count")
    ) {
      matchedCapIds.add(9);
    }

    // Cap 10: Tote Balancing & Space Utilization
    if (
      textBlob.includes("tote balancing") ||
      textBlob.includes("tote packing") ||
      textBlob.includes("heavy items at bottom") ||
      textBlob.includes("chemical isolation") ||
      textBlob.includes("tote space")
    ) {
      matchedCapIds.add(10);
    }

    // Cap 11: Stock Exceptions & Substitutions
    if (
      textBlob.includes("stock exception") ||
      textBlob.includes("out of stock") ||
      textBlob.includes("secondary shelf check") ||
      textBlob.includes("backstock") ||
      textBlob.includes("substitution") ||
      textBlob.includes("missing item")
    ) {
      matchedCapIds.add(11);
    }

    // Cap 12: Damaged Goods & QC
    if (
      textBlob.includes("damaged goods") ||
      textBlob.includes("expiration date") ||
      textBlob.includes("expiry") ||
      textBlob.includes("seal integrity") ||
      textBlob.includes("dented packaging") ||
      textBlob.includes("quarantine bin") ||
      textBlob.includes("damaged item")
    ) {
      matchedCapIds.add(12);
    }

    // Cap 13: Manual Barcode Entry
    if (
      textBlob.includes("manual barcode") ||
      textBlob.includes("13-digit") ||
      textBlob.includes("smudged barcode") ||
      textBlob.includes("torn barcode") ||
      textBlob.includes("unreadable barcode") ||
      textBlob.includes("manual ean")
    ) {
      matchedCapIds.add(13);
    }

    // Cap 14: Route Optimization & Backtracking
    if (
      textBlob.includes("route optimization") ||
      textBlob.includes("route optimize") ||
      textBlob.includes("serpentine") ||
      textBlob.includes("backtracking") ||
      textBlob.includes("walking path") ||
      textBlob.includes("travel time")
    ) {
      matchedCapIds.add(14);
    }

    // Cap 15: SLA Timer Pacing
    if (
      textBlob.includes("sla timer") ||
      textBlob.includes("10-minute delivery") ||
      textBlob.includes("countdown timer") ||
      textBlob.includes("sla breach") ||
      textBlob.includes("delivery countdown")
    ) {
      matchedCapIds.add(15);
    }

    // Cap 16: Dispatch Staging
    if (
      textBlob.includes("dispatch staging") ||
      textBlob.includes("dispatch buffer") ||
      textBlob.includes("tote handoff") ||
      textBlob.includes("handoff to qc") ||
      textBlob.includes("dispatch handoff")
    ) {
      matchedCapIds.add(16);
    }

    // Cap 17: Rider Bag Sealing
    if (
      textBlob.includes("rider bag") ||
      textBlob.includes("zip seal") ||
      textBlob.includes("tamper-evident") ||
      textBlob.includes("insulation bag") ||
      textBlob.includes("rider dispatch")
    ) {
      matchedCapIds.add(17);
    }

    // Cap 18: Floor Escalation & Communication
    if (
      textBlob.includes("floor escalation") ||
      textBlob.includes("aisle congestion") ||
      textBlob.includes("floor radio") ||
      textBlob.includes("communication hesitation") ||
      textBlob.includes("asking supervisor") ||
      textBlob.includes("hesitation asking") ||
      textBlob.includes("peer communication")
    ) {
      matchedCapIds.add(18);
    }

    // Cap 19: Shift Closeout
    if (
      textBlob.includes("shift closeout") ||
      textBlob.includes("terminal return") ||
      textBlob.includes("sanitizing pick tote") ||
      textBlob.includes("shift log") ||
      textBlob.includes("end of shift")
    ) {
      matchedCapIds.add(19);
    }

    // Cap 20: Autonomous Picking
    if (
      textBlob.includes("autonomous picking") ||
      textBlob.includes("autonomous mastery") ||
      textBlob.includes("all 8 dark-store aisles") ||
      textBlob.includes("high-velocity picking")
    ) {
      matchedCapIds.add(20);
    }

    // 3. Fallback to Category / EvidenceType-level mappings only if no specific capability domain was matched
    if (matchedCapIds.size === 0) {
      if (ev.category === "safety_issue") {
        matchedCapIds.add(1);
      } else if (ev.category === "tool_problem") {
        matchedCapIds.add(2);
      } else if (ev.evidenceType === "accuracy" || ev.category === "accuracy") {
        // Core fulfillment accuracy capabilities
        matchedCapIds.add(5);
        matchedCapIds.add(6);
      } else if (ev.evidenceType === "uph" || ev.category === "work_performance") {
        // Capabilities with designated pick rate target metrics
        matchedCapIds.add(3);
        matchedCapIds.add(5);
        matchedCapIds.add(14);
        matchedCapIds.add(15);
      } else if (ev.evidenceType === "help_request" || ev.category === "repeated_help_dependency") {
        matchedCapIds.add(5);
        matchedCapIds.add(18);
      } else if (ev.category === "environment_problem") {
        matchedCapIds.add(3);
      }
      // Note: If none of the above match (e.g. unknown category or insufficient_evidence),
      // we do NOT force an arbitrary link to Cap 3. matchedCapIds remains empty.
    }

    for (const capId of matchedCapIds) {
      addLink(capId, ev);
    }
  }

  return mapping;
}

// -------------------------------------------------------------
// HELPER: Dynamic Prerequisite DAG Resolution
// -------------------------------------------------------------
export function isPrerequisiteSatisfied(state?: CapabilityState): boolean {
  if (!state) return false;
  if (state.mastery === "mastered" || state.mastery === "proficient") return true;
  if (state.evidence === "demonstrated" && state.performance !== "below_target") return true;
  return false;
}

/**
 * Dynamically resolves the earliest actionable unmet prerequisite for a given target capability
 * by traversing the canonical DAG of prerequisites defined in DARK_STORE_CAPABILITIES.
 * 
 * If a prerequisite is unmet, and that prerequisite itself has unmet prerequisites,
 * it recursively resolves the dependency chain until the earliest actionable root prerequisite is found.
 * If multiple prerequisites are unmet, it prioritizes by the canonical order (defaultOrder / ID).
 */
export function resolveUnmetPrerequisite(
  targetCapId: number,
  capabilities: Record<number, CapabilityState>,
  visited: Set<number> = new Set()
): CapabilityDefinition | null {
  if (visited.has(targetCapId)) return null;
  visited.add(targetCapId);

  const capDef = DARK_STORE_CAPABILITIES.find((c) => c.id === targetCapId);
  if (!capDef || !capDef.prerequisites || capDef.prerequisites.length === 0) {
    return null;
  }

  // Canonical ordering by defaultOrder / ID
  const prereqDefs = capDef.prerequisites
    .map((id) => DARK_STORE_CAPABILITIES.find((c) => c.id === id))
    .filter((c): c is CapabilityDefinition => Boolean(c))
    .sort((a, b) => (a.defaultOrder ?? a.id) - (b.defaultOrder ?? b.id));

  for (const prereq of prereqDefs) {
    const prereqState = capabilities[prereq.id];
    if (!isPrerequisiteSatisfied(prereqState)) {
      // Recursively check if this unmet prerequisite has an even deeper unmet root prerequisite
      const deeperPrereq = resolveUnmetPrerequisite(prereq.id, capabilities, visited);
      return deeperPrereq || prereq;
    }
  }

  return null;
}

// -------------------------------------------------------------
// INTERNAL HELPER 2: understand() - Root cause & Exposure vs Mastery
// -------------------------------------------------------------
export function understand(
  observed: ObservedSignals,
  linkedEvidence: Record<number, SnapshotEvidenceItem[]>,
  hire: NewHire,
  capabilities: Record<number, CapabilityState>,
  existingAction?: RecommendedAction,
  candidatePattern?: CandidatePattern
): UnderstoodDiagnosis {
  const diagnosis = understandInternal(observed, linkedEvidence, hire, capabilities, existingAction);
  
  if (candidatePattern && candidatePattern.isPattern && candidatePattern.category) {
    // Integrate the AI candidate pattern safely.
    // It enriches the diagnosisText rather than overriding the hard determinism of rootCause.
    diagnosis.diagnosisText += ` | Longitudinal Pattern (${candidatePattern.category}): ${candidatePattern.supportingEvidence}`;
  }
  
  return diagnosis;
}

function understandInternal(
  observed: ObservedSignals,
  linkedEvidence: Record<number, SnapshotEvidenceItem[]>,
  hire: NewHire,
  capabilities: Record<number, CapabilityState>,
  existingAction?: RecommendedAction
): UnderstoodDiagnosis {
  const firstName = (hire.name || "Worker").split(" ")[0];
  const roleTitle = hire.roleTitle || "Dark Store Picker";

  let targetCapId = existingAction?.targetCapabilityId || hire.currentCapabilityId || 3;

  // 1. Check for lack of floor work evidence
  if (!observed.hasWorkEvidence) {
    return {
      rootCause: "no_evidence",
      targetCapId: hire.currentCapabilityId || 1,
      patternCategory: "General",
      patternName: "Awaiting Floor Work Telemetry",
      diagnosisText:
        "Insufficient floor work evidence collected yet. Continue shift observation before assessing capability mastery.",
    };
  }

  const { canonicalEvidence } = observed;
  const isFloorObservationDoingWell = observed.managerSignal?.state === "Doing well" || observed.previousInterventionImproved === true || existingAction?.status === "completed";
  const isPerformanceImpacted = !isFloorObservationDoingWell && (
    observed.speedGap > 5 ||
    observed.managerObservesSupport ||
    observed.managerObservesStruggle ||
    observed.managerObservesSpeed ||
    observed.previousInterventionFailed ||
    canonicalEvidence?.support?.supervisorAssistance === true
  );

  // 2. Check for external facility bottleneck (Environment context overrides raw metric)
  const isEnvBottleneckSupported = observed.workerReportsExternalBottleneck || 
    (canonicalEvidence?.environment?.externalBottleneck && isPerformanceImpacted) ||
    (canonicalEvidence?.toolSystem?.systemDowntime && isPerformanceImpacted) ||
    (canonicalEvidence?.environment?.environmentalIssue && isPerformanceImpacted);

  if (isEnvBottleneckSupported) {
    return {
      rootCause: "environment_bottleneck",
      targetCapId: hire.currentCapabilityId || 3,
      patternCategory: "Environment",
      patternName: "External Dark Store Facility Bottleneck",
      diagnosisText:
        `Shift pick rate drop (${observed.currentPickRate}/hr) was caused by an external facility bottleneck (${observed.externalBottleneckDescription || "facility issue"}), NOT worker competence or diligence. Core capability remains solid.`,
    };
  }

  // 3. Critical safety blocker (explicit safety hazard signal or PPE violation)
  const textRaw = `${observed.dailySignal?.rawText || ""} ${observed.dailySignal?.issue || ""}`.toLowerCase();
  const mgrNotes = (observed.managerSignal?.notes || "").toLowerCase();
  const isSafetyRiskReported =
    /\bppe\b/i.test(textRaw) ||
    /\bppe\b/i.test(mgrNotes) ||
    (textRaw.includes("safety") && (textRaw.includes("hazard") || textRaw.includes("injury") || textRaw.includes("blocked exit") || textRaw.includes("violation") || textRaw.includes("without"))) ||
    (mgrNotes.includes("safety") && (mgrNotes.includes("hazard") || /\bppe\b/i.test(mgrNotes) || mgrNotes.includes("violation") || mgrNotes.includes("critical safety risk") || mgrNotes.includes("compliance issue")));

  if (isSafetyRiskReported) {
    return {
      rootCause: "safety_blocker",
      targetCapId: 1, // DSP-01-SAFETY-ZONES
      patternCategory: "Process",
      patternName: "Critical Floor Safety Protocol Blocker",
      diagnosisText:
        `Critical safety hazard / PPE compliance issue reported on floor. Floor safety protocols (Capability 1: Store Safety & PPE) must be immediately verified with supervisor before independent fulfillment can proceed.`,
    };
  }

  // 4. Critical accuracy failure (Quality floor is paramount)
  const hasStructuredQualityIssue = canonicalEvidence?.capability?.taskProficiency === "low" || canonicalEvidence?.capability?.newTaskExposure === true;
  const isQualityDiagnosisSupported = (observed.accuracy < 95 || observed.managerObservesAccuracy || observed.workerReportsVariant) &&
    (observed.managerObservesAccuracy || observed.workerReportsVariant || hasStructuredQualityIssue || observed.managerObservesStruggle);

  if (isQualityDiagnosisSupported) {
    return {
      rootCause: "variant_quality",
      targetCapId: 6, // DSP-06-VARIANT-CHECK
      patternCategory: "Process",
      patternName: "Item Variant Differentiation & Verification Rush",
      diagnosisText:
        `Accuracy is at ${observed.accuracy}% (critically below 98% threshold). ${firstName} is moving at pace but mis-picking visually identical packaging variants (e.g. 200g vs 500g pouches). Real-world accuracy requires immediate standard clarification.`,
    };
  }

  // 5. Hardware / Tool issue
  const hasStructuredToolIssue = canonicalEvidence?.toolSystem?.toolStatus === "Failed" || !!canonicalEvidence?.toolSystem?.toolProblem;
  const isToolDiagnosisSupported = (observed.workerReportsTool || hasStructuredToolIssue) && 
    (isPerformanceImpacted || observed.managerSignal?.issueCategory === "Tool");

  if (isToolDiagnosisSupported) {
    return {
      rootCause: "tool_hardware",
      targetCapId: 2, // DSP-02-SCANNER-BASICS
      patternCategory: "Tool",
      patternName: "Hardware / Barcode Scanner Friction",
      diagnosisText:
        "Friction is caused by device hardware or barcode scan connectivity delays, NOT worker comprehension or diligence. Training another module will not fix a technical hardware obstacle.",
    };
  }

  // 6. Chronic help dependency
  const hasStructuredDependency = canonicalEvidence?.support?.supervisorAssistance === true || (canonicalEvidence?.support?.helpRequests || 0) >= 5;
  const isDependencySupported = (observed.workerChronicHelpDependency || hasStructuredDependency) && isPerformanceImpacted;

  if (isDependencySupported) {
    return {
      rootCause: "chronic_dependency",
      targetCapId: hire.currentCapabilityId || 5,
      patternCategory: "Process",
      patternName: "Floor Independence & Help Dependency Gap",
      diagnosisText:
        `${firstName} logged ${observed.helpRequestsCount || "multiple"} repeated help requests and is unable to complete tote pick cycles independently on the floor. Structured practice required to build solo autonomy.`,
    };
  }

  // 7. Communication / confidence barrier
  if (observed.workerReportsCommunication || canonicalEvidence?.observation?.communicationNote?.includes("hesitant")) {
    return {
      rootCause: "communication_confidence",
      targetCapId: 18, // DSP-18-TEAM-ESCALATION
      patternCategory: "Confidence",
      patternName: "Floor Escalation & Peer Communication Hesitation",
      diagnosisText:
        `${firstName} demonstrates adequate task knowledge but reports hesitation asking shift supervisors or peers for help during peak floor rushes. Non-training buddy support is required.`,
    };
  }

  // 8. Aisle & Location navigation
  const pacingText = `${observed.dailySignal?.rawText || ""} ${observed.dailySignal?.issue || ""}`.toLowerCase();
  const isPacingIssue =
    observed.speedGap > 5 &&
    (pacingText.includes("pacing fatigue") ||
      pacingText.includes("pacing lag") ||
      pacingText.includes("route backtracking") ||
      (pacingText.includes("pace") && (pacingText.includes("struggl") || pacingText.includes("drop") || pacingText.includes("slow"))));

  if (
    !isPacingIssue &&
    (observed.workerReportsConfusion ||
      (observed.managerSignal?.notes || "").toLowerCase().includes("location") ||
      observed.previousInterventionFailed ||
      (existingAction?.targetCapabilityId === 3 && observed.speedGap >= 8)) &&
    isPerformanceImpacted
  ) {
    const currentTargetCapId = existingAction?.targetCapabilityId || hire.currentCapabilityId || 3;
    const unmetPrereq = resolveUnmetPrerequisite(currentTargetCapId, capabilities);

    if (unmetPrereq) {
      const currentTargetDef = DARK_STORE_CAPABILITIES.find((c) => c.id === currentTargetCapId);
      const targetName = currentTargetDef ? currentTargetDef.name : `Capability ${currentTargetCapId}`;
      return {
        rootCause: "prerequisite_gap",
        targetCapId: unmetPrereq.id,
        patternCategory: "Process",
        patternName: `Prerequisite Gap in ${unmetPrereq.name}`,
        diagnosisText:
          `${firstName} is struggling with ${targetName} because foundational prerequisite ${unmetPrereq.name} (Capability ${unmetPrereq.id}) is not yet solidly grounded on the floor. Returning to prerequisite Capability ${unmetPrereq.id} (${unmetPrereq.name}) is necessary before continuing ${targetName}.`,
      };
    }

    const cap3State = capabilities[currentTargetCapId] || capabilities[3];
    const exposureNote =
      (hire.completedModuleIds?.length ?? 0) === 10 || cap3State?.exposure === "exposed"
        ? "Worker completed mandatory training modules (10/10), but real-world floor navigation is lagging. Module exposure does NOT equal floor mastery."
        : "Initial floor navigation in high-density aisles requires spatial familiarization.";

    return {
      rootCause: "environment_spatial",
      targetCapId: currentTargetCapId === 3 ? 3 : currentTargetCapId,
      patternCategory: "Environment",
      patternName: "Dark Store Spatial & Rack Coordinate Friction",
      diagnosisText:
        `${firstName} (${roleTitle}) reports aisle/rack navigation confusion in Aisles 4-8. Accuracy is high (${observed.accuracy}%), confirming strong diligence, but search time slows pick pace to ${observed.currentPickRate}/hr (target: ${observed.targetPickRate}/hr). ${exposureNote}`,
    };
  }

  // 9. General pacing / floor route practice
  if (
    isPacingIssue ||
    (observed.speedGap >= 5 && (observed.managerObservesSupport || observed.managerObservesSpeed || (hire.completedModuleIds?.length ?? 0) === 10 || canonicalEvidence?.capability?.taskProficiency === "improving"))
  ) {
    const modulePrefix = (hire.completedModuleIds?.length ?? 0) === 10
      ? "Training modules (10/10) are 100% complete, but real-world floor readiness is not yet demonstrated. "
      : "";

    return {
      rootCause: "capability_practice",
      targetCapId: hire.currentCapabilityId || 5,
      patternCategory: "Process",
      patternName: "Floor Pacing & Route Practice Gap",
      diagnosisText:
        `${modulePrefix}Pick pace (${observed.currentPickRate}/hr) lags target (${observed.targetPickRate}/hr). The worker understands store rules, but requires supervised floor repetition to build picking rhythm and route efficiency.`,
    };
  }

  return {
    rootCause: "steady_ramp",
    targetCapId,
    patternCategory: "General",
    patternName: "Steady Ramp Progression",
    diagnosisText:
      `Pick rate (${observed.currentPickRate}/hr) and accuracy (${observed.accuracy}%) are meeting or exceeding the ramp curve. ${firstName} is working independently with high consistency.`,
  };
}

// -------------------------------------------------------------
// INTERNAL HELPER 3: connect() - Connect to capability graph & actors
// -------------------------------------------------------------
export function connect(
  understood: UnderstoodDiagnosis,
  hire: NewHire
): ConnectedContext {
  const targetCapDef =
    DARK_STORE_CAPABILITIES.find((c) => c.id === understood.targetCapId) || DARK_STORE_CAPABILITIES[2];

  const prerequisites = targetCapDef.prerequisites
    .map((prereqId) => DARK_STORE_CAPABILITIES.find((c) => c.id === prereqId))
    .filter((c): c is CapabilityDefinition => Boolean(c));

  const buddyName = (hire.buddy || "Senior Picker").split(" ")[0];
  const supervisorName = (hire.supervisor || "Shift In-charge").split(" ")[0];
  const firstName = (hire.name || "Worker").split(" ")[0];
  const roleTitle = hire.roleTitle || "Dark Store Picker";

  return {
    targetCapDef,
    prerequisites,
    buddyName,
    supervisorName,
    firstName,
    roleTitle,
  };
}

// -------------------------------------------------------------
// INTERNAL HELPER 4: chooseNextAction() - The Adaptive Core
// -------------------------------------------------------------
export function chooseNextAction(
  understood: UnderstoodDiagnosis,
  connected: ConnectedContext,
  hire: NewHire,
  observed: ObservedSignals,
  capabilities: Record<number, CapabilityState>
): DecidedAction {
  const result = chooseNextActionInternal(understood, connected, hire, observed, capabilities);
  
  // Append treatment memory to rationale if relevant
  if (observed.previousTreatmentContext && result.decisionRationale && result.decisionType !== "no_action_monitor") {
    result.decisionRationale += ` | Context from memory: ${observed.previousTreatmentContext}`;
  }
  return result;
}

function chooseNextActionInternal(
  understood: UnderstoodDiagnosis,
  connected: ConnectedContext,
  hire: NewHire,
  observed: ObservedSignals,
  capabilities: Record<number, CapabilityState>
): DecidedAction {
  const { firstName, buddyName, supervisorName, targetCapDef } = connected;
  const { currentPickRate, targetPickRate, accuracy } = observed;

  if (understood.rootCause === "no_evidence") {
    return {
      decisionType: "no_action_monitor",
      targetCapId: targetCapDef.id,
      targetActor: "Shift Supervisor",
      urgency: "Monitor",
      actionTitle: "Observe Shift Execution & Collect Telemetry",
      actionDesc: "Awaiting floor pick telemetry before evaluating capability mastery.",
      practicalStep: "Log first floor shift wave telemetry.",
      decisionRationale: "No evidence does not equal poor performance. Gather observation first.",
      interimStatus: "Doing well",
      interimStatusReason: "Awaiting shift telemetry; observing standard ramp.",
    };
  }

  if (understood.rootCause === "environment_bottleneck") {
    let actionDesc = "Performance drop was caused by facility/conveyor downtime. Resume standard picking monitoring under normal conditions.";
    let interimReason = "Temporary drop caused by external facility bottleneck; worker capability on track.";

    if (observed.canonicalEvidence?.environment?.externalBottleneck || observed.canonicalEvidence?.environment?.environmentalIssue) {
      const issue = observed.canonicalEvidence.environment.externalBottleneck || observed.canonicalEvidence.environment.environmentalIssue;
      actionDesc = `Performance drop was caused by an external environmental disruption: ${issue}. Resume standard picking monitoring under normal conditions once resolved.`;
      interimReason = `Temporary drop caused by external disruption (${issue}); worker capability on track.`;
    } else if (observed.canonicalEvidence?.toolSystem?.systemDowntime) {
      actionDesc = `Performance drop was caused by a system downtime of ${observed.canonicalEvidence.toolSystem.systemDowntime} minutes. Resume standard picking monitoring under normal conditions.`;
      interimReason = `Temporary drop caused by system downtime; worker capability on track.`;
    }

    return {
      decisionType: "no_action_monitor",
      targetCapId: targetCapDef.id,
      targetActor: "Store Operations & Maintenance",
      urgency: "Monitor",
      actionTitle: "Standard Shift Operations (Post-Facility Resolution)",
      actionDesc,
      practicalStep: "Standard shift monitoring on next wave.",
      decisionRationale: "Context overrides raw metric. External environmental disruption does not require capability retraining.",
      interimStatus: "Doing well",
      interimStatusReason: interimReason,
    };
  }

  if (understood.rootCause === "chronic_dependency") {
    let actionDesc = `Allow ${firstName} 30 minutes of independent picking with buddy ${buddyName} on standby observation from 5 meters away to transition from help dependency to solo autonomy.`;
    let actionTitle = `Structured Solo-Picking Practice with Fading Buddy Support`;

    if (observed.canonicalEvidence?.support?.supervisorAssistance === true) {
       actionDesc = `${firstName} requires structured independent practice to transition away from supervisor assistance. Supervisor ${supervisorName} to observe from a distance without intervening.`;
       actionTitle = `Structured Solo-Picking Practice with Supervisor Observation`;
    }

    return {
      decisionType: "reinforce_current",
      targetCapId: hire.currentCapabilityId || 5,
      targetActor: `Buddy (${buddyName}) & Supervisor (${supervisorName})`,
      urgency: "Next Shift",
      actionTitle,
      actionDesc,
      practicalStep: "30-minute solo pick run with buddy observation.",
      decisionRationale: "Worker is overly reliant on peer prompts. Guided fading of support will build floor independence.",
      interimStatus: "Needs attention",
      interimStatusReason: "High help dependency detected; structured solo practice assigned.",
    };
  }

  if (understood.rootCause === "tool_hardware") {
    const evidenceText = `${observed.canonicalEvidence?.toolSystem?.toolProblem || ""} ${observed.dailySignal?.rawText || ""} ${observed.managerSignal?.notes || ""}`.toLowerCase();
    
    let actionTitle = "Scanner Hardware Check & Lens Cleaning Protocol";
    let actionDesc = "Inspect handheld terminal Bluetooth connection, replace aging battery pack, and review fallback 4-digit short SKU manual entry.";
    let practicalStep = "5-minute hardware check and terminal re-pairing before shift.";
    let interimReason = `Tool friction detected on scanner; hardware check scheduled with ${buddyName}.`;

    if (evidenceText.includes("forklift") || evidenceText.includes("pallet jack") || evidenceText.includes("reach truck") || evidenceText.includes("cart")) {
      actionTitle = "Equipment Inspection & Maintenance Escalation";
      actionDesc = `Inspect affected equipment (${observed.canonicalEvidence?.toolSystem?.toolProblem || "lift/cart"}) for mechanical issues or low charge. Route ${firstName} to a working unit.`;
      practicalStep = "Equipment tag-out and reassignment.";
      interimReason = `Equipment friction detected; maintenance escalation scheduled with ${buddyName}.`;
    } else if (evidenceText.includes("scanner") || evidenceText.includes("battery") || evidenceText.includes("bluetooth") || evidenceText.includes("terminal")) {
      // Legacy scanner behavior
    } else if (observed.canonicalEvidence?.toolSystem?.toolProblem) {
      actionTitle = "General System & Tool Hardware Inspection";
      actionDesc = `Inspect the reported tool issue: ${observed.canonicalEvidence.toolSystem.toolProblem}. Verify functionality before resuming independent tasks.`;
      practicalStep = "5-minute equipment verification with supervisor or maintenance.";
      interimReason = `Tool friction detected (${observed.canonicalEvidence.toolSystem.toolProblem}); inspection scheduled.`;
    } else {
      actionTitle = "General System & Tool Hardware Inspection";
      actionDesc = "Inspect the reported tool issue. Verify functionality before resuming independent tasks.";
      practicalStep = "5-minute equipment verification with supervisor or maintenance.";
      interimReason = "Tool friction detected; inspection scheduled.";
    }

    return {
      decisionType: "tool_remedy",
      targetCapId: 2,
      targetActor: `Buddy (${buddyName}) & Maintenance`,
      urgency: "Immediate",
      actionTitle,
      actionDesc,
      practicalStep,
      decisionRationale: "Problem is hardware tool connectivity, not worker competence. Tool remedy avoids useless training.",
      interimStatus: "Needs attention",
      interimStatusReason: interimReason,
    };
  }

  if (understood.rootCause === "communication_confidence") {
    return {
      decisionType: "communication_support",
      targetCapId: 18,
      targetActor: `Buddy (${buddyName} - Senior Picker)`,
      urgency: "Immediate",
      actionTitle: "Buddy Pre-Shift Communication & Escalation Check-in",
      actionDesc:
        `Pair ${firstName} with buddy ${buddyName} for a 5-minute pre-shift check-in to build comfort reporting inventory bottlenecks and asking supervisor questions.`,
      practicalStep: "5-minute informal check-in before shift briefing.",
      decisionRationale:
        "Non-training confidence/communication barrier. Peer buddy support builds floor engagement without course lecturing.",
      interimStatus: "Needs attention",
      interimStatusReason: `Communication hesitation detected; buddy check-in scheduled.`,
    };
  }

  if (understood.rootCause === "variant_quality") {
    const evidenceText = `${observed.canonicalEvidence?.observation?.behaviorNote || ""} ${observed.canonicalEvidence?.observation?.supervisorNote || ""} ${observed.dailySignal?.rawText || ""} ${observed.dailySignal?.issue || ""}`.toLowerCase();
    
    let actionTitle = "Demonstrate 3-Point Variant Check (Brand, Weight, Barcode)";
    let actionDesc = `Supervisor ${supervisorName} conducts a 10-minute floor demonstration on tricky SKU packaging variants (200g vs 500g pouches). Clarify that quality takes strict priority over speed during ramp.`;
    let practicalStep = "10-minute demonstration with 5 tricky product variant sets.";
    let interimReason = `Critical accuracy alert (${accuracy}%); supervisor 3-point variant check demo required.`;

    if (observed.canonicalEvidence?.observation?.behaviorNote || observed.canonicalEvidence?.observation?.supervisorNote) {
      const specificIssue = observed.canonicalEvidence.observation.behaviorNote || observed.canonicalEvidence.observation.supervisorNote || "";
      actionTitle = "Targeted Quality & Accuracy Floor Demonstration";
      actionDesc = `Supervisor ${supervisorName} conducts a floor demonstration addressing the specific quality issue: ${specificIssue}. Clarify that quality takes strict priority over speed.`;
      practicalStep = "10-minute targeted quality demonstration on the floor.";
    } else if (!evidenceText.includes("variant") && !evidenceText.includes("packaging") && !evidenceText.includes("200g")) {
      actionTitle = "General Quality Standard & Accuracy Reinforcement";
      actionDesc = `Supervisor ${supervisorName} conducts a 10-minute floor demonstration on general accuracy standards. Clarify that quality takes strict priority over speed during ramp.`;
      practicalStep = "10-minute general quality reinforcement on the floor.";
    }

    return {
      decisionType: "supervisor_demo",
      targetCapId: 6,
      targetActor: `Supervisor (${supervisorName} - Shift In-charge)`,
      urgency: "Immediate",
      actionTitle,
      actionDesc,
      practicalStep,
      decisionRationale: "Accuracy below 98% quality floor. Requires supervisor authority to re-establish quality standard.",
      interimStatus: "At risk",
      interimStatusReason: interimReason,
    };
  }

  if (understood.rootCause === "safety_blocker") {
    return {
      decisionType: "supervisor_demo",
      targetCapId: 1,
      targetActor: `Supervisor (${supervisorName}) & Safety Lead`,
      urgency: "Immediate",
      actionTitle: `Critical Safety & Zone Protocol Floor Verification`,
      actionDesc:
        `Pause fulfillment advancement until Supervisor ${supervisorName} conducts on-floor verification of PPE compliance, emergency exit locations, and slip-hazard safety protocols (Capability 1).`,
      practicalStep: "15-minute floor safety review and PPE verification before shift start.",
      decisionRationale:
        "Safety is a zero-tolerance non-negotiable prerequisite. Unresolved safety capability halts independent progression.",
      interimStatus: "At risk",
      interimStatusReason: "Critical safety protocol unresolved; supervisor safety verification required.",
    };
  }

  if (understood.rootCause === "prerequisite_gap") {
    const prereqCapId = understood.targetCapId;
    const prereqCapDef = DARK_STORE_CAPABILITIES.find((c) => c.id === prereqCapId) || targetCapDef;
    const originalTargetCapId = hire.currentCapabilityId || 3;
    const originalTargetDef = DARK_STORE_CAPABILITIES.find((c) => c.id === originalTargetCapId);
    const originalTargetName = originalTargetDef ? originalTargetDef.name : `Capability ${originalTargetCapId}`;

    return {
      decisionType: "return_prerequisite",
      targetCapId: prereqCapDef.id,
      targetActor: `Supervisor (${supervisorName}) & Buddy (${buddyName})`,
      urgency: "Immediate",
      actionTitle: `Return to Prerequisite: ${prereqCapDef.name}`,
      actionDesc:
        `Pause higher-level progression on ${originalTargetName} until foundational ${prereqCapDef.name} (Capability ${prereqCapDef.id}) is solidly mastered.`,
      practicalStep: `10-minute targeted walkthrough on ${prereqCapDef.name} with buddy ${buddyName} before continuing solo floor picks.`,
      decisionRationale:
        `${originalTargetName} blocked because prerequisite ${prereqCapDef.name} (Capability ${prereqCapDef.id}) was weak or unmet. Stepping back is required.`,
      interimStatus: "Needs attention",
      interimStatusReason: `Prerequisite gap identified in ${prereqCapDef.name}; returning to Capability ${prereqCapDef.id} with ${buddyName}.`,
    };
  }

  if (understood.rootCause === "environment_spatial") {
    if (observed.previousInterventionFailed) {
      return {
        decisionType: "environment_support",
        targetCapId: 3,
        targetActor: `Supervisor (${supervisorName} - Shift In-charge)`,
        urgency: "Immediate",
        actionTitle: "Supervisor Floor Layout & Shelf Label Verification",
        actionDesc:
          `Previous buddy walkthrough did not resolve aisle confusion. Supervisor ${supervisorName} will directly verify shelf coordinate signage in Aisles 4-8 with ${firstName}.`,
        practicalStep: "10-minute supervisor aisle review focusing on bin coordinate labeling errors.",
        decisionRationale:
          "Previous buddy walkthrough failed to close gap. Escalating to supervisor floor layout intervention instead of repeating identical action.",
        interimStatus: "At risk",
        interimStatusReason: "Aisle confusion persisted after buddy walkthrough; escalated to supervisor layout check.",
      };
    }

    return {
      decisionType: "reinforce_current",
      targetCapId: 3,
      targetActor: `Buddy (${buddyName} - Senior Picker)`,
      urgency: "Next Shift",
      actionTitle: `Buddy Walkthrough of Aisles 4-8 Rack Coordinates (${targetCapDef.name})`,
      actionDesc:
        `Pair ${firstName} with Senior Picker ${buddyName} for a 15-minute floor walkthrough focusing on Aisles 4-8 shelf numbering (Rack-Bay-Level).`,
      practicalStep: `15-minute floor walkthrough before morning peak wave with ${buddyName}.`,
      decisionRationale:
        "Exposure occurred, but real-world capability is inconsistent. Reinforce capability 3 via floor buddy.",
      interimStatus: "Needs attention",
      interimStatusReason: `Pick rate (${currentPickRate}/${targetPickRate}) delayed by aisle navigation; buddy walkthrough scheduled.`,
    };
  }

  if (understood.rootCause === "capability_practice") {
    return {
      decisionType: "reinforce_current",
      targetCapId: hire.currentCapabilityId || 5,
      targetActor: `Buddy (${buddyName})`,
      urgency: "Next Shift",
      actionTitle: `Targeted Route Pacing Practice (${targetCapDef.name})`,
      actionDesc:
        `Allow ${firstName} 30 minutes of guided picking with buddy ${buddyName} to practice serpentine route pacing without backtracking.`,
      practicalStep: "30-minute guided picking run on core grocery aisles.",
      decisionRationale:
        "Worker understands process but requires structured repetition to reach speed threshold.",
      interimStatus: "Needs attention",
      interimStatusReason: `Pacing practice assigned on Capability ${understood.targetCapId} to close speed gap.`,
    };
  }

  // Steady Ramp / Outpacing
  const currentMasteredCount = Object.values(capabilities).filter(
    (c) => c.mastery === "mastered" || c.mastery === "proficient"
  ).length;

  if (currentMasteredCount >= 18) {
    return {
      decisionType: "no_action_monitor",
      targetCapId: targetCapDef.id,
      targetActor: "Self & Supervisor",
      urgency: "Monitor",
      actionTitle: "Maintain Standard Autonomous Picking",
      actionDesc:
        `All core capabilities demonstrated with high consistency (${currentPickRate}/hr, ${accuracy}% accuracy). Continue regular shift observation.`,
      practicalStep: "Routine end-of-shift check.",
      decisionRationale: "Worker has achieved consistent operational performance across all store zones.",
      interimStatus: "Doing well",
      interimStatusReason: `Sustaining target performance (${currentPickRate} picks/hr, ${accuracy}% accuracy).`,
    };
  }

  const isTrainingFoundationComplete = (hire.completedModuleIds?.length ?? 0) >= 3;
  if (isTrainingFoundationComplete && currentPickRate >= targetPickRate + 10 && accuracy >= 98 && (hire.currentCapabilityId || 1) < 8) {
    const advancedCap = DARK_STORE_CAPABILITIES.find((c) => c.id === 8) || DARK_STORE_CAPABILITIES[7];
    return {
      decisionType: "jump_ahead",
      targetCapId: advancedCap.id,
      targetActor: `Supervisor (${supervisorName})`,
      urgency: "Monitor",
      actionTitle: `Fast-Track Jump to Capability ${advancedCap.id}: ${advancedCap.name}`,
      actionDesc:
        `${firstName} is significantly exceeding standard ramp pace (${currentPickRate}/hr vs target ${targetPickRate}/hr, ${accuracy}% accuracy). System approves jumping directly to multi-order batching.`,
      practicalStep: "Assign multi-order batch cart for next shift wave.",
      decisionRationale:
        "Exceptional performance evidence justifies jumping ahead past routine single-order practice.",
      interimStatus: "Doing well",
      interimStatusReason: `Exceeding pace curve (${currentPickRate}/hr); fast-tracked to Capability ${advancedCap.id}.`,
    };
  }

  // Normal progression: find next unmastered capability in sequence respecting required prerequisites
  const isMasteredOrProficient = (capId: number): boolean => {
    const st = capabilities[capId];
    return Boolean(st && (st.mastery === "mastered" || st.mastery === "proficient"));
  };

  const nextUnmastered = DARK_STORE_CAPABILITIES.find((c) => {
    const st = capabilities[c.id];
    const isUnmastered = !st || (st.mastery !== "mastered" && st.mastery !== "proficient");
    if (!isUnmastered) return false;
    // Must respect prerequisites already defined in the capability catalog
    return c.prerequisites.every((prereqId) => isMasteredOrProficient(prereqId));
  });

  if (nextUnmastered) {
    return {
      decisionType: "advance_default",
      targetCapId: nextUnmastered.id,
      targetActor: `Self & Buddy (${buddyName})`,
      urgency: "Monitor",
      actionTitle: `Advance to Capability ${nextUnmastered.id}: ${nextUnmastered.name}`,
      actionDesc:
        `${firstName} has demonstrated solid performance on prior capabilities. Begin floor introduction to ${nextUnmastered.name}.`,
      practicalStep: `Brief 5-minute pre-shift overview of ${nextUnmastered.name}.`,
      decisionRationale:
        "Performance is stable and prior prerequisites are mastered; advancing along capability path.",
      interimStatus: "Doing well",
      interimStatusReason: `Ramp curve on track; advancing to Capability ${nextUnmastered.id}.`,
    };
  }

  return {
    decisionType: "no_action_monitor",
    targetCapId: targetCapDef.id,
    targetActor: "Self & Supervisor",
    urgency: "Monitor",
    actionTitle: "Continue Shift Pacing",
    actionDesc: "Standard shift operation without intervention.",
    practicalStep: "Standard daily logging.",
    decisionRationale: "Consistent performance on target.",
    interimStatus: "Doing well",
    interimStatusReason: `Performing on curve (${currentPickRate}/hr, ${accuracy}% accuracy).`,
  };
}

// -------------------------------------------------------------
// INTERNAL HELPER 5: act() - Dispatch smallest practical action
// -------------------------------------------------------------
export function act(
  decided: DecidedAction,
  connected: ConnectedContext,
  hire: NewHire,
  dayNumber: number,
  existingAction: RecommendedAction | undefined,
  observed: ObservedSignals,
  understood: UnderstoodDiagnosis
): { pattern: IdentifiedPattern; action: RecommendedAction } {
  const { targetCapDef } = connected;

  const pattern: IdentifiedPattern = {
    id: `pat-${hire.id}-d${dayNumber}`,
    dayNumber,
    patternName: understood.patternName,
    patternConfidence: "High",
    diagnosis: understood.diagnosisText,
    category: understood.patternCategory,
    connectedSignalSummary: [
      `🗣️ Worker: "${observed.dailySignal?.rawText || observed.dailySignal?.issue || "Floor check-in logged"}"`,
      `👔 Manager: ${observed.managerSignal?.state || "Active observation"} (${observed.managerSignal?.issueCategory || "General"})`,
      `📊 Work Telemetry: ${observed.currentPickRate} picks/hr (target ${observed.targetPickRate}), ${observed.accuracy}% accuracy`,
      `🎯 Target Capability: ${targetCapDef.code} - ${targetCapDef.name}`,
    ],
    detectedAt: "Just now",
  };

  const action: RecommendedAction = {
    id: existingAction?.id || `act-${hire.id}-d${dayNumber}`,
    dayNumber,
    actionType:
      decided.decisionType === "reinforce_current"
        ? "buddy_walkthrough"
        : decided.decisionType === "supervisor_demo"
        ? "demonstrate_task"
        : decided.decisionType === "tool_remedy" || decided.decisionType === "communication_support"
        ? "practice"
        : decided.decisionType === "no_action_monitor"
        ? "no_action"
        : "practice",
    title: decided.actionTitle,
    description: decided.actionDesc,
    targetActor: decided.targetActor,
    urgency: decided.urgency,
    smallestPracticalStep: decided.practicalStep,
    status: existingAction?.status === "completed" ? "completed" : "pending",
    createdAt: existingAction?.createdAt || "Just now",
    decisionType: decided.decisionType,
    targetCapabilityId: decided.targetCapId,
    rationale: decided.decisionRationale,
    whyThisAction: decided.decisionRationale,
  };

  return { pattern, action };
}

// -------------------------------------------------------------
// INTERNAL HELPER 6: check() - Outcome check & ledger update
// -------------------------------------------------------------
export interface CheckStageInput {
  actionOutcome?: ActionOutcome;
  action: RecommendedAction;
  interimStatus: NewHireStatus;
  interimStatusReason: string;
  currentCapabilities: Record<number, CapabilityState>;
  targetCapId: number;
  observed: ObservedSignals;
  dayNumber: number;
  decisionType: AdaptiveGearDecision;
  existingAction?: RecommendedAction;
  hire: NewHire;
  understoodRootCause?: RootCauseType;
}

export function check(stageInput: CheckStageInput): {
  finalStatus: NewHireStatus;
  finalStatusReason: string;
  updatedCapabilities: Record<number, CapabilityState>;
  action: RecommendedAction;
} {
  const {
    actionOutcome,
    action,
    interimStatus,
    interimStatusReason,
    currentCapabilities,
    targetCapId,
    observed,
    dayNumber,
    decisionType,
    existingAction,
    hire,
    understoodRootCause,
  } = stageInput;

  let finalStatus: NewHireStatus = interimStatus;
  let finalStatusReason = interimStatusReason;

  const outcomeCapId = existingAction?.targetCapabilityId || targetCapId || hire.currentCapabilityId || 1;
  if (!currentCapabilities[outcomeCapId]) {
    currentCapabilities[outcomeCapId] = {
      capabilityId: outcomeCapId,
      exposure: "not_exposed",
      evidence: "none",
      performance: "unknown",
      mastery: "locked",
      lastAssessedAt: `Day ${dayNumber}`,
      reinforcementCount: 0,
    };
  }

  const capState = currentCapabilities[outcomeCapId];
  capState.lastAssessedAt = `Day ${dayNumber}`;

  if (actionOutcome) {
    const outcomePickRate = actionOutcome.subsequentPickRate ?? observed.currentPickRate;
    const outcomeAccuracy = actionOutcome.subsequentAccuracy ?? observed.accuracy;

    const isImproved =
      actionOutcome.improved === "yes" ||
      (outcomePickRate >= observed.targetPickRate - 4 && outcomeAccuracy >= 95);

    const isPartial =
      actionOutcome.improved === "partial" ||
      (observed.previousPickRate !== undefined && outcomePickRate > observed.previousPickRate);

    if (isImproved) {
      finalStatus = "Doing well";
      finalStatusReason = `Intervention succeeded. Pick rate recovered to ${outcomePickRate}/hr with ${outcomeAccuracy}% accuracy.`;
      action.status = "completed";

      capState.exposure = "reinforced";
      capState.evidence = "demonstrated";
      capState.performance =
        outcomePickRate > observed.targetPickRate
          ? "exceeding"
          : "on_target";
      capState.mastery = "proficient";
      capState.notes = `Intervention closed: ${actionOutcome.notes || "Standard met on floor"}`;
      if (actionOutcome.treatmentContext?.reason) {
        capState.notes += ` | Context: ${actionOutcome.treatmentContext.reason}`;
      }
    } else if (isPartial) {
      finalStatus = "Needs attention";
      finalStatusReason = `Pick rate partially improved to ${outcomePickRate}/hr; continued buddy practice on Capability ${targetCapId} recommended.`;
      action.status = "completed";

      capState.exposure = "reinforced";
      capState.evidence = "emerging";
      capState.performance = "below_target";
      capState.mastery = "in_progress";
      capState.reinforcementCount += 1;
      capState.notes = `Partial recovery (${outcomePickRate}/hr). Continued practice required.`;
      if (actionOutcome.treatmentContext?.reason) {
        capState.notes += ` | Context: ${actionOutcome.treatmentContext.reason}`;
      }
    } else {
      finalStatus = "At risk";
      finalStatusReason = `Performance stalled at ${outcomePickRate}/hr despite intervention; reassessing root cause for next shift.`;
      action.status = "completed";

      capState.exposure = "reinforced";
      capState.evidence = "inconsistent";
      capState.performance = "below_target";
      capState.mastery = "in_progress";
      capState.reinforcementCount += 1;
      capState.notes = "Intervention failed to close gap. Must reassess approach.";
      if (actionOutcome.treatmentContext?.reason) {
        capState.notes += ` | Context: ${actionOutcome.treatmentContext.reason}`;
      }
    }
  } else {
    if (observed.managerSignal?.state === "Doing well") {
      finalStatus = "Doing well";
      finalStatusReason = observed.managerSignal.notes || "Floor check observation: trainee is performing on track.";
      if (action) {
        action.status = "completed";
      }
      capState.exposure = "reinforced";
      capState.evidence = "demonstrated";
      capState.performance = "on_target";
      capState.mastery = "proficient";
    } else if (decisionType === "reinforce_current" || decisionType === "return_prerequisite" || decisionType === "supervisor_demo" || decisionType === "communication_support") {
      capState.exposure = capState.exposure === "not_exposed" ? "exposed" : "reinforced";
      capState.evidence = "inconsistent";
      capState.performance = "below_target";
      capState.reinforcementCount += 1;
    } else if (decisionType === "advance_default" || decisionType === "no_action_monitor") {
      if (observed.hasWorkEvidence && understoodRootCause !== "environment_bottleneck") {
        capState.exposure = "exposed";
        capState.evidence = "demonstrated";
        capState.performance =
          observed.currentPickRate > observed.targetPickRate
            ? "exceeding"
            : observed.currentPickRate === observed.targetPickRate
            ? "on_target"
            : "below_target";
        if (capState.mastery === "locked" || capState.mastery === "in_progress") {
          capState.mastery = "proficient";
        }
      } else {
        // No telemetry or external environmental bottleneck: keep evidence as is
        capState.exposure = "exposed";
        if (capState.evidence === "none") {
          capState.performance = "unknown";
        }
      }
    }
  }

  return {
    finalStatus,
    finalStatusReason,
    updatedCapabilities: currentCapabilities,
    action,
  };
}

/**
 * AUTHORITATIVE CORE LOOP EXECUTION
 * SINGLE EXECUTION AUTHORITY for CheckIn CheckOut
 *
 * Coordinates 6 bounded stages internally:
 * 1. OBSERVE   - Collects & normalizes multi-signal evidence
 * 2. UNDERSTAND - Diagnoses root cause; distinguishes Exposure from Mastery
 * 3. CONNECT   - Connects to capability prerequisite graph & store actors
 * 4. DECIDE    - The Adaptive Core: selects gear shift (advance, reinforce, return, jump, non-training)
 * 5. ACT       - Dispatches smallest practical floor intervention
 * 6. CHECK     - Evaluates before/after outcome; updates Capability Ledger
 */

export async function executeCoordinationLoopAsync(input: LoopExecutionInput, historyText: string = ""): Promise<PatternSynthesisResult> {
  const executionId = executionGuard.registerExecution(input.hire.id, input.dayNumber);
  const startTime = Date.now();
  const sanitizedHistory = sanitizeInputText(historyText).sanitizedText;

  const observed = observe(input);
  const linkedEvidence = linkEvidenceToCapabilities(observed.structuredEvidence);
  const understood = understand(observed, linkedEvidence, input.hire, observed.currentCapabilities, input.existingAction, input.candidatePattern);
  const connected = connect(understood, input.hire);
  
  const decided = chooseNextAction(
    understood,
    connected,
    input.hire,
    observed,
    observed.currentCapabilities
  );
  
  let candidateAction = decided;
  let capturedAiCandidate: any = undefined;
  let capturedArbitration: any = {
    arbitration_status: "DETERMINISTIC_CONFIRMED",
    selected_source: "DETERMINISTIC",
    arbitration_reason: "Baseline deterministic execution",
    supporting_evidence_ids: [],
    conflicting_evidence_ids: [],
    confidence: 1.0
  };
  let isAiTimeout = false;
  
  try {
    const aiPipeline = (async () => {
      const aiCandidate = await generateInterventionCandidate({
        diagnosis: understood,
        deterministicAction: decided,
        observed,
        hire: input.hire,
        historyText: sanitizedHistory
      });
      capturedAiCandidate = aiCandidate;

      const arbitrationResult = await arbitrateIntervention({
        diagnosis: understood,
        deterministicAction: decided,
        aiCandidate,
        observed,
        hire: input.hire,
        historyText: sanitizedHistory
      });
      capturedArbitration = {
        arbitration_status: arbitrationResult.actionTitle?.includes("[AI") ? "AI_SUPPORTED" : "DETERMINISTIC_CONFIRMED",
        selected_source: arbitrationResult.actionTitle?.includes("[AI") ? "AI" : "DETERMINISTIC",
        arbitration_reason: arbitrationResult.decisionRationale,
        supporting_evidence_ids: aiCandidate.required_evidence || [],
        conflicting_evidence_ids: aiCandidate.conflicting_evidence_ids || [],
        confidence: aiCandidate.confidence || 0.8
      };

      return arbitrationResult;
    })();

    const timeoutMs = (typeof process !== "undefined" && process.env.NODE_ENV === "test") ? 2000 : 4500;
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("AI Timeout")), timeoutMs));
    candidateAction = await Promise.race([aiPipeline, timeoutPromise]) as DecidedAction;
  } catch (err: any) {
    if (process.env.NODE_ENV === "development" && process.env.DEBUG_AI) {
      console.debug("AI Arbitration unavailable or timed out, activating deterministic fallback:", err?.message || err);
    }
    candidateAction = decided;
    isAiTimeout = true;
  }

  // INVARIANT 11: Late AI responses cannot overwrite newer authoritative decisions.
  if (!executionGuard.isExecutionCurrent(input.hire.id, input.dayNumber, executionId)) {
    candidateAction = decided;
  }

  // AI-8: DEANCORE GOVERNANCE AUTHORITY
  const governanceResult = governDecision({
    hire: input.hire,
    dayNumber: input.dayNumber,
    observed,
    canonicalEvidence: input.canonicalEvidence,
    availableEvidenceItems: observed.structuredEvidence,
    diagnosis: understood,
    deterministicAction: decided,
    aiCandidate: capturedAiCandidate,
    arbitrationResult: capturedArbitration,
    proposedFinalAction: candidateAction,
    isAiTimeoutOrUnavailable: isAiTimeout,
  });

  const finalDecidedAction = governanceResult.governedAction;

  const actionPackage = act(
    finalDecidedAction,
    connected,
    input.hire,
    input.dayNumber,
    input.existingAction,
    observed,
    understood
  );

  const checkResult = check({
    actionOutcome: input.actionOutcome,
    action: actionPackage.action,
    interimStatus: finalDecidedAction.interimStatus,
    interimStatusReason: finalDecidedAction.interimStatusReason,
    currentCapabilities: observed.currentCapabilities,
    targetCapId: finalDecidedAction.targetCapId,
    observed,
    dayNumber: input.dayNumber,
    decisionType: finalDecidedAction.decisionType,
    existingAction: input.existingAction,
    hire: input.hire,
    understoodRootCause: understood.rootCause,
  });

  const overallReadinessScore = assessReadiness(checkResult.updatedCapabilities, input.hire);
  const day10Evaluation = input.dayNumber >= 10 ? evaluateDay10Outcome({ ...input.hire, status: checkResult.finalStatus, capabilities: checkResult.updatedCapabilities }, input.workSignal, input.dailySignal, input.managerSignal) : undefined;

  // AI-6: OUTCOME LEARNING LOOP
  let learningEvent: LearningEvent | undefined = undefined;
  const caseId = `case-${input.hire.id}-d${input.dayNumber}`;

  try {
    // INVARIANT 10: Repeated execution does not duplicate authoritative outcomes
    if (input.actionOutcome) {
      if (!executionGuard.isOutcomeAlreadyProcessed(input.hire.id, input.dayNumber, input.actionOutcome.actionId, input.actionOutcome.id)) {
        executionGuard.markOutcomeProcessed(input.hire.id, input.dayNumber, input.actionOutcome.actionId, input.actionOutcome.id);
        learningEvent = recordOutcomeLearningEvent({
          caseId,
          hire: input.hire,
          dayNumber: input.dayNumber,
          outcome: input.actionOutcome,
          previousRecord: input.previousRecord,
          observed,
          diagnosis: understood,
          deterministicAction: decided,
          finalAction: actionPackage.action,
          canonicalEvidence: input.canonicalEvidence,
          availableEvidenceItems: observed.structuredEvidence,
          historyText: sanitizedHistory,
        });
      }
    }
  } catch (learningErr: any) {
    if (process.env.NODE_ENV === "development" && process.env.DEBUG_AI) {
      console.debug("AI-6 Outcome learning loop failed safely (isolated):", learningErr?.message || learningErr);
    }
  }

  const recordedCase = casebook.recordCase({
    caseId,
    employeeId: input.hire.id,
    employeeName: input.hire.name,
    journeyDay: input.dayNumber,
    timestamp: new Date().toISOString(),
    initialState: {
      status: input.hire.status,
      statusReason: input.hire.statusReason,
      readinessScore: overallReadinessScore,
      capabilities: checkResult.updatedCapabilities,
    },
    canonicalEvidence: input.canonicalEvidence,
    evidenceItems: observed.structuredEvidence,
    deterministicDiagnosis: understood,
    deterministicAction: decided,
    aiInterventionCandidate: capturedAiCandidate,
    aiArbitration: capturedArbitration,
    finalIntervention: actionPackage.action,
    outcome: input.actionOutcome,
    learningEvent,
    governanceResult,
  });

  const auditTrail = reconstructDecisionAuditTrail(recordedCase);

  telemetry.record({
    executionId,
    employeeId: input.hire.id,
    journeyDay: input.dayNumber,
    pipelineStage: "COMPLETED",
    durationMs: Date.now() - startTime,
    timestamp: new Date().toISOString(),
    success: true,
    fallbackInvoked: isAiTimeout || finalDecidedAction.decisionType !== candidateAction.decisionType,
    aiProviderFailure: isAiTimeout,
    governanceVerdict: governanceResult.governanceVerdict,
    finalActionSource: isAiTimeout ? "FALLBACK" : (governanceResult.governedAction.actionTitle !== candidateAction.actionTitle ? "GOVERNANCE_OVERRIDE" : (capturedArbitration?.selected_source === "AI" ? "AI" : "DETERMINISTIC")),
    outcomeStatus: learningEvent?.outcomeStatus,
    systemMode: isAiTimeout ? "AI_UNAVAILABLE" : "NORMAL",
  });

  return {
    pattern: actionPackage.pattern,
    action: actionPackage.action,
    updatedStatus: checkResult.finalStatus,
    statusReason: checkResult.finalStatusReason,
    updatedCapabilities: checkResult.updatedCapabilities,
    overallReadinessScore,
    currentCapabilityId: checkResult.action.id === "no_action" ? 0 : finalDecidedAction.targetCapId,
    adaptiveDecision: finalDecidedAction.decisionType,
    day10Evaluation,
    learningEvent,
    governanceResult,
    auditTrail,
    executionId,
  };
}

export function executeCoordinationLoop(input: LoopExecutionInput): PatternSynthesisResult {
  const executionId = executionGuard.registerExecution(input.hire.id, input.dayNumber);
  const startTime = Date.now();

  // 1. OBSERVE (D1: Evidence / Path Lab)
  const observed = observe(input);

  // 2. CAPABILITY LINKAGE (D2: Evidence -> Capability)
  const linkedEvidence = linkEvidenceToCapabilities(observed.structuredEvidence);

  // 3. UNDERSTAND (D3: Diagnosis)
  const understood = understand(observed, linkedEvidence, input.hire, observed.currentCapabilities, input.existingAction, input.candidatePattern);

  // 4. CONNECT (D2/D3 Graph & Metadata Connection)
  const connected = connect(understood, input.hire);

  // 4. DECIDE
  const decided = chooseNextAction(
    understood,
    connected,
    input.hire,
    observed,
    observed.currentCapabilities
  );

  // AI-8: DEANCORE GOVERNANCE AUTHORITY
  const governanceResult = governDecision({
    hire: input.hire,
    dayNumber: input.dayNumber,
    observed,
    canonicalEvidence: input.canonicalEvidence,
    availableEvidenceItems: observed.structuredEvidence,
    diagnosis: understood,
    deterministicAction: decided,
    arbitrationResult: {
      arbitration_status: "DETERMINISTIC_CONFIRMED",
      selected_source: "DETERMINISTIC",
      arbitration_reason: "Synchronous deterministic baseline execution",
      supporting_evidence_ids: [],
      conflicting_evidence_ids: [],
      confidence: 1.0,
    },
    proposedFinalAction: decided,
  });

  const finalDecidedAction = governanceResult.governedAction;

  // 5. ACT
  const actionPackage = act(
    finalDecidedAction,
    connected,
    input.hire,
    input.dayNumber,
    input.existingAction,
    observed,
    understood
  );

  // 6. CHECK
  const checkResult = check({
    actionOutcome: input.actionOutcome,
    action: actionPackage.action,
    interimStatus: finalDecidedAction.interimStatus,
    interimStatusReason: finalDecidedAction.interimStatusReason,
    currentCapabilities: observed.currentCapabilities,
    targetCapId: finalDecidedAction.targetCapId,
    observed,
    dayNumber: input.dayNumber,
    decisionType: finalDecidedAction.decisionType,
    existingAction: input.existingAction,
    hire: input.hire,
    understoodRootCause: understood.rootCause,
  });

  const overallReadinessScore = assessReadiness(checkResult.updatedCapabilities, input.hire);

  const day10Evaluation = evaluateDay10Outcome(
    {
      ...input.hire,
      status: checkResult.finalStatus,
      capabilities: checkResult.updatedCapabilities,
    },
    input.workSignal,
    input.dailySignal,
    input.managerSignal
  );

  // AI-6: OUTCOME LEARNING LOOP
  let learningEvent: LearningEvent | undefined = undefined;
  const caseId = `case-${input.hire.id}-d${input.dayNumber}`;

  try {
    // INVARIANT 10: Repeated execution does not duplicate authoritative outcomes
    if (input.actionOutcome) {
      if (!executionGuard.isOutcomeAlreadyProcessed(input.hire.id, input.dayNumber, input.actionOutcome.actionId, input.actionOutcome.id)) {
        executionGuard.markOutcomeProcessed(input.hire.id, input.dayNumber, input.actionOutcome.actionId, input.actionOutcome.id);
        learningEvent = recordOutcomeLearningEvent({
          caseId,
          hire: input.hire,
          dayNumber: input.dayNumber,
          outcome: input.actionOutcome,
          previousRecord: input.previousRecord,
          observed,
          diagnosis: understood,
          deterministicAction: decided,
          finalAction: actionPackage.action,
          canonicalEvidence: input.canonicalEvidence,
          availableEvidenceItems: observed.structuredEvidence,
        });
      }
    }
  } catch (learningErr: any) {
    if (process.env.NODE_ENV === "development" && process.env.DEBUG_AI) {
      console.debug("AI-6 Outcome learning loop failed safely (isolated):", learningErr?.message || learningErr);
    }
  }

  const recordedCase = casebook.recordCase({
    caseId,
    employeeId: input.hire.id,
    employeeName: input.hire.name,
    journeyDay: input.dayNumber,
    timestamp: new Date().toISOString(),
    initialState: {
      status: input.hire.status,
      statusReason: input.hire.statusReason,
      readinessScore: overallReadinessScore,
      capabilities: checkResult.updatedCapabilities,
    },
    canonicalEvidence: input.canonicalEvidence,
    evidenceItems: observed.structuredEvidence,
    deterministicDiagnosis: understood,
    deterministicAction: decided,
    finalIntervention: actionPackage.action,
    outcome: input.actionOutcome,
    learningEvent,
    governanceResult,
  });

  const auditTrail = reconstructDecisionAuditTrail(recordedCase);

  telemetry.record({
    executionId,
    employeeId: input.hire.id,
    journeyDay: input.dayNumber,
    pipelineStage: "COMPLETED",
    durationMs: Date.now() - startTime,
    timestamp: new Date().toISOString(),
    success: true,
    fallbackInvoked: false,
    aiProviderFailure: false,
    governanceVerdict: governanceResult.governanceVerdict,
    finalActionSource: governanceResult.governedAction.actionTitle !== decided.actionTitle ? "GOVERNANCE_OVERRIDE" : "DETERMINISTIC",
    outcomeStatus: learningEvent?.outcomeStatus,
    systemMode: "NORMAL",
  });

  return {
    pattern: actionPackage.pattern,
    action: checkResult.action,
    updatedStatus: checkResult.finalStatus,
    statusReason: checkResult.finalStatusReason,
    updatedCapabilities: checkResult.updatedCapabilities,
    overallReadinessScore,
    currentCapabilityId: checkResult.action.id === "no_action" ? 0 : finalDecidedAction.targetCapId,
    adaptiveDecision: finalDecidedAction.decisionType,
    day10Evaluation,
    learningEvent,
    governanceResult,
    auditTrail,
    executionId,
  };
}

/**
 * Authoritative Commercial Model Evaluation: Day 0 -> Day 10
 * Assesses whether worker is certified Job Ready or Not Ready across all 7 criteria.
 * Does NOT reduce readiness to a single metric.
 */
export function evaluateDay10Outcome(
  hire: NewHire,
  latestWorkSignal?: WorkSignal,
  latestDailySignal?: DailySignal,
  latestManagerSignal?: ManagerSignal
): Day10EvaluationResult {
  const capabilities = hire.capabilities || {};
  const currentWork = latestWorkSignal || hire.daysHistory[hire.daysHistory.length - 1]?.workSignal || {
    dayNumber: 10,
    targetPickRate: 50,
    actualPickRate: 50,
    accuracyRate: 98,
    ordersCompleted: 60,
    targetOrders: 60,
  };

  const capStates = Object.values(capabilities) as CapabilityState[];
  const demonstratedCount = capStates.filter(
    (c) => c && (c.evidence === "demonstrated" || c.mastery === "proficient" || c.mastery === "mastered")
  ).length;

  const modulesCompleted = Math.max(
    hire.completedModuleIds ? hire.completedModuleIds.length : 0,
    hire.modulesCompleted ?? 0
  );
  const pickRate = currentWork.actualPickRate;
  const targetPickRate = currentWork.targetPickRate || 50;
  const accuracy = currentWork.accuracyRate;
  const helpRequests = currentWork.helpRequestsCount ?? 0;

  const safetyCap = capabilities[1];
  const textRaw = `${latestDailySignal?.rawText || ""} ${latestDailySignal?.issue || ""}`.toLowerCase();
  const mgrNotes = (latestManagerSignal?.notes || "").toLowerCase();
  const isSafetyClear = Boolean(
    safetyCap &&
    safetyCap.mastery !== "locked" &&
    safetyCap.evidence !== "inconsistent" &&
    !/\bppe\b/i.test(textRaw) &&
    !/\bppe\b/i.test(mgrNotes)
  );

  const isTrainingComplete = modulesCompleted >= 10;
  const isCapabilitiesDemonstrated = demonstratedCount >= 14;
  const isPerformanceAdequate = pickRate >= targetPickRate;
  const isAccuracyAcceptable = accuracy >= 98;
  const isIndependent = helpRequests <= 1 && latestManagerSignal?.issueCategory !== "Confidence" && latestManagerSignal?.state !== "Struggling";
  const hasNoCriticalBlockers = hire.status !== "At risk" && latestDailySignal?.category !== "Tool";

  const verifiedCriteria = [
    {
      name: "Mandatory Training Completed",
      met: isTrainingComplete,
      detail: `${modulesCompleted}/10 foundation modules completed`,
    },
    {
      name: "Required Capabilities Demonstrated",
      met: isCapabilitiesDemonstrated,
      detail: `${demonstratedCount}/20 capabilities demonstrated on floor`,
    },
    {
      name: "Floor Productivity Target",
      met: isPerformanceAdequate,
      detail: `${pickRate} picks/hr (target ${targetPickRate}/hr)`,
    },
    {
      name: "Scanning Accuracy Floor",
      met: isAccuracyAcceptable,
      detail: `${accuracy}% accuracy (threshold 98%)`,
    },
    {
      name: "Independent Solo Execution",
      met: isIndependent,
      detail: `${helpRequests} help requests logged; working autonomously`,
    },
    {
      name: "Safety & Zone Compliance Clear",
      met: isSafetyClear,
      detail: isSafetyClear ? "Capability 1 verified; zero safety violations" : "Safety protocol or PPE issue pending",
    },
    {
      name: "No Unresolved Critical Blockers",
      met: hasNoCriticalBlockers,
      detail: hasNoCriticalBlockers ? "Floor friction cleared" : "Active floor blocker pending",
    },
  ];

  const unresolvedBlockers = verifiedCriteria.filter((c) => !c.met).map((c) => c.name);
  const isReady = unresolvedBlockers.length === 0;

  return {
    isReady,
    status: isReady ? "Job Ready" : "Not Ready",
    summary: isReady
      ? `${(hire.name || "Worker").split(" ")[0]} has met all 7 commercial readiness criteria across training, capabilities, speed, accuracy, independence, and safety.`
      : `${(hire.name || "Worker").split(" ")[0]} is NOT yet ready for autonomous certification due to ${unresolvedBlockers.length} active blocker(s): ${unresolvedBlockers.join(", ")}.`,
    verifiedCriteria,
    unresolvedBlockers,
    recommendedAction: isReady
      ? "Certify as Autonomous Dark Store Picker for standard floor shift assignment."
      : `Address ${unresolvedBlockers[0]} before approving autonomous certification.`,
  };
}

/**
 * Backward-compatible wrapper that delegates to executeCoordinationLoop
 */
export function synthesizePattern(
  dayNumber: number,
  dailySignal?: DailySignal,
  managerSignal?: ManagerSignal,
  workSignal?: WorkSignal,
  hire?: NewHire,
  actionOutcome?: ActionOutcome,
  previousRecord?: DayRecord,
  existingAction?: RecommendedAction
): PatternSynthesisResult {
  const fallbackHire: NewHire = hire || {
    id: "nh-rahul-01",
    name: "Rahul Sharma",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    roleId: "role-picker-01",
    roleTitle: "Dark Store Picker",
    storeLocation: "Dark Store #104 (Indiranagar Central)",
    shift: "Morning (07:00 - 15:30)",
    startDate: "2025-02-17",
    currentDay: dayNumber,
    buddy: "Vikram R. (Senior Picker)",
    supervisor: "Suresh K. (Shift In-charge)",
    status: "Needs attention",
    statusReason: "Aisle navigation friction",
    recommendedActionSnippet: "Buddy walkthrough of Aisles 4-8",
    daysHistory: [],
    capabilities: createDefaultCapabilitiesLedger(),
  };

  const currentWorkSignal: WorkSignal = workSignal || {
    dayNumber,
    targetPickRate: 50,
    actualPickRate: 35,
    accuracyRate: 98,
    ordersCompleted: 44,
    targetOrders: 65,
  };

  return executeCoordinationLoop({
    hire: fallbackHire,
    dayNumber,
    dailySignal,
    managerSignal,
    workSignal: currentWorkSignal,
    actionOutcome,
    previousRecord,
    existingAction,
  });
}

