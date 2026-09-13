import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Zap,
  Sparkles,
  CheckCircle2,
  Play,
  ArrowRight,
  Clock,
  Languages,
  Check,
  Stethoscope,
  Pencil,
  BookOpen,
  ListTodo,
  X,
  Target,
  UserCheck,
  Activity,
  Radio,
  TrendingUp,
  Bell,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { NewHire, TrainingModule, DayRecord, DARK_STORE_CAPABILITIES } from "../types";
import { MANDATORY_TRAINING_MODULES } from "../data/modulesData";
import { LearnerSection } from "./FloatingGlassMenu";
import { CoordinateNavigationModuleView } from "./CoordinateNavigationModuleView";

interface TodaysGoalLandingViewProps {
  newHire: NewHire;
  currentDay: number;
  isHindi?: boolean;
  onToggleLanguage?: () => void;
  onBack: () => void;
  onSelectSection?: (section: LearnerSection) => void;
  onUpdateHire?: (updatedHire: NewHire) => void;
  onOpenBuddy?: () => void;
  onSelectModuleWithId?: (modId: string) => void;
  onSelectFloorTask?: (modalType: "buddy" | "scanner" | "work" | "target" | "map") => void;
}

interface CustomModule extends TrainingModule {
  rxReason?: string;
  rxReasonHi?: string;
}

interface CustomTask {
  id: string;
  title: string;
  category: string;
  duration: string;
  detailsEn: string;
  detailsHi: string;
}

export const TodaysGoalLandingView: React.FC<TodaysGoalLandingViewProps> = ({
  newHire,
  currentDay,
  isHindi = false,
  onToggleLanguage,
  onBack,
  onSelectSection,
  onUpdateHire,
  onOpenBuddy,
  onSelectModuleWithId,
  onSelectFloorTask,
}) => {
  // Popup detail modals state
  const [activeModule, setActiveModule] = useState<CustomModule | null>(null);
  const [activeTask, setActiveTask] = useState<CustomTask | null>(null);

  // Interactive task completion state
  const [completedTaskIds, setCompletedTaskIds] = useState<Record<string, boolean>>({
    task_1: true,
  });

  const toggleTaskCompletion = (taskId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCompletedTaskIds((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  // 3-Tab dial mode state: "day" | "career" | "yesterday"
  const [activeDialTab, setActiveDialTab] = useState<"day" | "career" | "yesterday">("day");

  // Expandable sections state (Prescribed training & Required floor actions)
  const [isPrescribedExpanded, setIsPrescribedExpanded] = useState<boolean>(true);
  const [isFloorActionsExpanded, setIsFloorActionsExpanded] = useState<boolean>(true);
  const [isRxAlertActive, setIsRxAlertActive] = useState<boolean>(true);
  const [isDiagnosisNotesOpen, setIsDiagnosisNotesOpen] = useState<boolean>(false);
  const [isTodaysActivityModalOpen, setIsTodaysActivityModalOpen] = useState<boolean>(false);
  const [isEodSimulation, setIsEodSimulation] = useState<boolean>(false);

  // Live floor performance data
  const currentRecord = (newHire?.daysHistory || []).find((d) => d.dayNumber === currentDay) || {
    dayNumber: currentDay,
  };

  const actualPickRate = currentRecord.workSignal?.actualPickRate;
  const targetPickRate = currentRecord.workSignal?.targetPickRate;
  const accuracyRate = currentRecord.workSignal?.accuracyRate;

  // Authoritative live career readiness score calculation
  const baseReadiness =
    (typeof newHire.overallReadinessScore === "number" ? (newHire.overallReadinessScore <= 1 ? Math.round(newHire.overallReadinessScore * 100) : Math.round(newHire.overallReadinessScore)) : 0);

  const tasksBonus = Object.values(completedTaskIds).filter(Boolean).length * 2;
  const liveReadinessPct = baseReadiness;

  // Today's shift performance / daily progress score matching Home page
  const completedCount = newHire.modulesCompleted ?? 3;
  const totalActivities = 20;
  const quizAvg = newHire.quizAverageScore ?? 94;
  const ordersCompleted = currentRecord.workSignal?.ordersCompleted ?? 0;
  const targetOrders = currentRecord.workSignal?.targetOrders ?? 0;
  const trainingScore = Math.min(100, Math.round(((completedCount / 3) * 50 + (quizAvg / 100) * 50)));
  const speedScore = actualPickRate && targetPickRate ? Math.min(100, Math.round((actualPickRate / targetPickRate) * 100)) : 100;
  const accuracyScore = accuracyRate != null ? Math.min(100, Math.round(accuracyRate)) : 100;
  const ordersScore = targetOrders > 0 ? Math.min(100, Math.round((ordersCompleted / targetOrders) * 100)) : 100;
  const dailyShiftProgress = Math.round(
    trainingScore * 0.25 + speedScore * 0.30 + accuracyScore * 0.30 + ordersScore * 0.15
  );

  // Yesterday's record & composite score calculation
  const yesterdayNumber = Math.max(1, currentDay - 1);
  const isFirstDay = currentDay === 1;
  const yesterdayRecord: DayRecord | undefined = isFirstDay
    ? undefined
    : (newHire?.daysHistory || []).find((d) => d.dayNumber === yesterdayNumber) ||
      (newHire?.daysHistory || []).filter((d) => d.dayNumber < currentDay).pop();

  const prevWork = yesterdayRecord?.workSignal;
  const yestActualPace = prevWork?.actualPickRate ?? (isFirstDay ? 20 : 32);
  const yestTargetPace = prevWork?.targetPickRate ?? (isFirstDay ? 25 : 35);
  const yestAccuracy = prevWork?.accuracyRate ?? 99;
  const yestOrders = prevWork?.ordersCompleted ?? (isFirstDay ? 15 : 38);
  const yestTargetOrders = prevWork?.targetOrders ?? (isFirstDay ? 20 : 42);

  const yestSpeedScore = Math.min(100, Math.round((yestActualPace / yestTargetPace) * 100));
  const yestAccuracyScore = Math.min(100, Math.round(yestAccuracy));
  const yestOrdersScore = Math.min(100, Math.round((yestOrders / yestTargetOrders) * 100));
  const yesterdayScore = Math.round(
    trainingScore * 0.25 + yestSpeedScore * 0.30 + yestAccuracyScore * 0.30 + yestOrdersScore * 0.15
  );

  // Resolve values for the 3-tab dial
  let displayedPercentage = dailyShiftProgress;
  let dialUnit = isHindi ? "% दैनिक लक्ष्य" : "% Day Goal";
  let dialSubtext = isHindi ? "आज का दैनिक प्रगति स्कोर" : "Present Day Performance";
  let dialBadgeText = dailyShiftProgress >= 75 ? (isHindi ? "लक्ष्य पर" : "On Track") : (isHindi ? "प्रगति में" : "Ramping Steady");

  if (activeDialTab === "career") {
    displayedPercentage = liveReadinessPct;
    dialUnit = isHindi ? "% जॉब रेडी" : "% Job Ready";
    dialSubtext = isHindi ? "अब तक का समग्र करियर रेडीनेस" : "Till Date Job Ready Score";
    dialBadgeText = liveReadinessPct >= 80 ? (isHindi ? "नौकरी के लिए तैयार" : "Role Ready") : (isHindi ? "स्थिर गति" : "Ramping Steady");
  } else if (activeDialTab === "yesterday") {
    displayedPercentage = yesterdayScore;
    dialUnit = isHindi ? "% कल का स्कोर" : "% Yesterday";
    dialSubtext = isHindi ? "कल का समग्र शिफ्ट प्रदर्शन" : "Yesterday Performance";
    dialBadgeText = yesterdayScore >= 75 ? (isHindi ? "सफल शिफ्ट" : "Shift Met") : (isHindi ? "ध्यान दें" : "Needs Attention");
  }

  // Radial dial calculations
  const dialRadius = 68;
  const dialCircumference = 2 * Math.PI * dialRadius;
  const sweepDegree = 280;
  const strokeDashoffset = dialCircumference - (displayedPercentage / 100) * (sweepDegree / 360) * dialCircumference;

  const totalTicks = 32;
  const ticks = Array.from({ length: totalTicks }).map((_, i) => {
    const angle = 130 + (i / (totalTicks - 1)) * sweepDegree;
    const rad = (angle * Math.PI) / 180;
    const x1 = 100 + 82 * Math.cos(rad);
    const y1 = 100 + 82 * Math.sin(rad);
    const x2 = 100 + 90 * Math.cos(rad);
    const y2 = 100 + 90 * Math.sin(rad);
    const isActive = (i / (totalTicks - 1)) * 100 <= displayedPercentage;
    return { x1, y1, x2, y2, isActive, key: i };
  });

  const recAction = (currentRecord as any).recommendedAction || (newHire as any).recommendedAction;
  const actionOutcome = (currentRecord as any).actionOutcome;

  let longitudinalContext: { category: string; evidence: string } | null = null;
  const patternDiagnosis = (currentRecord as any).identifiedPattern?.diagnosis;
  if (patternDiagnosis) {
    const match = patternDiagnosis.match(/\|\s*Longitudinal Pattern\s*\((.*?)\):\s*(.*)/);
    if (match) {
      longitudinalContext = {
        category: match[1],
        evidence: match[2],
      };
    }
  }

  // Concise Doctor's suggestion for today
  const [isPlanExpanded, setIsPlanExpanded] = useState(false);

  // Today's prescribed modules
  const targetCapId = (recAction && recAction.targetCapabilityId) || newHire.currentCapabilityId;
  const targetCapability = DARK_STORE_CAPABILITIES.find(c => c.id === targetCapId);
  const todaysPrescribedModules: CustomModule[] = [];
    
  if (targetCapId) {
    const mappedModules = MANDATORY_TRAINING_MODULES.filter(m => 
      m.mappedCapabilityIds.includes(targetCapId)
    );
    mappedModules.forEach(m => {
      todaysPrescribedModules.push({
        ...m,
      });
    });
  }

  const unmasteredCaps = useMemo(() => {
    return DARK_STORE_CAPABILITIES.filter((cap) => {
      if (cap.id === 20) return false;
      if (cap.id === targetCapId) return false;
      const state = newHire?.capabilities?.[cap.id];
      return !state || state.mastery !== "proficient";
    }).sort((a, b) => a.defaultOrder - b.defaultOrder);
  }, [newHire?.capabilities, targetCapId]);

  const predictivePath = useMemo(() => {
    const path = [];
    let capIndex = 0;
    for (let d = currentDay + 1; d <= 10; d++) {
      if (d === 10) {
        path.push({ day: 10, isCheckpoint: true });
      } else if (capIndex < unmasteredCaps.length) {
        path.push({ day: d, cap: unmasteredCaps[capIndex] });
        capIndex++;
      } else {
        path.push({ day: d, cap: null });
      }
    }
    return path;
  }, [currentDay, unmasteredCaps]);

  const doctorDiagnosis = recAction
    ? (recAction.whyThisAction || recAction.rationale || recAction.title)
    : "No current intervention required. Follow standard floor operations.";


  // Today's floor tasks with rich details for popups
  const todaysTasks: CustomTask[] = [];
  if (recAction) {
    todaysTasks.push({
      id: recAction.id,
      title: recAction.title,
      category: recAction.targetActor || "Floor Task",
      duration: recAction.smallestPracticalStep || "15 min",
      detailsEn: recAction.description,
      detailsHi: recAction.description,
    });
  }

  const handleStartModule = (modId: string) => {
    setActiveModule(null);
    if (onSelectModuleWithId) {
      onSelectModuleWithId(modId);
    } else if (onSelectSection) {
      onSelectSection("modules");
    }
  };

  const handleOpenTaskDestination = (taskId: string, taskCategory: string) => {
    setActiveTask(null);
    if (onSelectFloorTask) {
      if (taskId === "task_1") {
        onSelectFloorTask("map");
      } else if (taskId === "task_2") {
        onSelectFloorTask("scanner");
      } else if (taskId === "task_3") {
        onSelectFloorTask("work");
      } else if (taskId === "task_4") {
        onSelectFloorTask("target");
      } else {
        onSelectFloorTask("work");
      }
    } else if (onSelectSection) {
      onSelectSection("dial");
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-28 select-none relative font-sans">
      {/* MAIN CONTENT CONTAINER */}
      <div className="max-w-md mx-auto p-1.5 sm:p-2 space-y-3">
        {/* ========================================================= */}
        {/* SECTION 1: 3-TAB PROGRESS CARD (DAY, CAREER, YESTERDAY)   */}
        {/* ========================================================= */}
        <div className="space-y-2">
          <div
            id="circular-telemetry-dial-widget"
            className="bg-[#e5e5e5] rounded-[40px] px-5 py-5 shadow-sm space-y-2 select-none relative overflow-hidden text-black border border-slate-200/80"
          >
            {/* Top Bar inside Hero Banner: Back Button, Blinking Green Dot, and Hindi Language Icon */}
            <div className="flex items-center justify-between relative z-20 pb-0.5">
              {/* Floating Back Action */}
              <button
                type="button"
                onClick={onBack}
                className="w-8 h-8 rounded-xl bg-white hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center text-slate-800 border border-slate-200 cursor-pointer shadow-sm"
                title={isHindi ? "वापस जाएं" : "Back to Home"}
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
              </button>

              {/* Green Blinking Status Dot */}
              <div className="flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-700">
                  {isHindi ? "लाइव" : "LIVE"}
                </span>
              </div>

              {/* Hindi / Language Selector Icon */}
              {onToggleLanguage ? (
                <button
                  type="button"
                  onClick={onToggleLanguage}
                  className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-[11px] font-black tracking-wide border border-slate-200 transition-all cursor-pointer active:scale-95 flex items-center gap-1 shadow-sm"
                  title="Toggle Hindi / English"
                >
                  <Languages className="w-3 h-3 text-cyan-600" />
                  <span>{isHindi ? "हिंदी" : "EN"}</span>
                </button>
              ) : (
                <div className="w-8" />
              )}
            </div>

            <div className="flex items-center justify-between">
              {/* Large Left-Aligned Number */}
              <div className="flex items-center gap-3 sm:gap-4 pt-1 pb-1">
                <div className="flex items-baseline shrink-0 leading-[0.85]">
                  <span 
                    className="font-medium text-black tracking-[-0.05em]"
                    style={{ fontSize: 'clamp(5rem, 22vw, 6.5rem)' }}
                  >
                    {String(displayedPercentage).padStart(2, '0')}
                  </span>
                  <span 
                    className="font-bold text-black/60 tracking-[-0.02em] ml-1 sm:ml-1.5"
                    style={{ fontSize: 'clamp(2.5rem, 9vw, 3.5rem)' }}
                  >
                    %
                  </span>
                </div>
                <div className="text-xs sm:text-sm font-medium text-slate-700 leading-tight tracking-tight max-w-[100px]">
                  {dialSubtext}
                </div>
              </div>

              {/* Three Character / Role Icons ON THE RIGHT - Vertical */}
              <div className="flex flex-col items-center justify-start gap-2">
                {/* Character Icon 1: Day (Shift Progress) */}
                <button
                  type="button"
                  onClick={() => setActiveDialTab("day")}
                  title={isHindi ? "दैनिक शिफ्ट प्रोग्रेस" : "Day / Shift Progress"}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 border ${
                    activeDialTab === "day"
                      ? "bg-white text-black border-slate-200 shadow-sm"
                      : "bg-transparent text-slate-500 border-transparent hover:bg-slate-200/50"
                  }`}
                >
                  <Zap className={`w-4 h-4 ${activeDialTab === "day" ? "text-amber-500 fill-amber-400" : "text-slate-400"}`} />
                </button>

                {/* Character Icon 2: Career (Role Readiness / 85%) */}
                <button
                  type="button"
                  onClick={() => setActiveDialTab("career")}
                  title={isHindi ? "करियर रेडीनेस (85%+)" : "Career Readiness (85%+)"}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 border ${
                    activeDialTab === "career"
                      ? "bg-white text-black border-slate-200 shadow-sm"
                      : "bg-transparent text-slate-500 border-transparent hover:bg-slate-200/50"
                  }`}
                >
                  <TrendingUp className={`w-4 h-4 ${activeDialTab === "career" ? "text-cyan-600 stroke-[2.5]" : "text-slate-400"}`} />
                </button>

                {/* Character Icon 3: Yesterday (Shift Performance) */}
                <button
                  type="button"
                  onClick={() => setActiveDialTab("yesterday")}
                  title={isHindi ? "कल का शिफ्ट प्रदर्शन" : "Yesterday Performance"}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 border ${
                    activeDialTab === "yesterday"
                      ? "bg-white text-black border-slate-200 shadow-sm"
                      : "bg-transparent text-slate-500 border-transparent hover:bg-slate-200/50"
                  }`}
                >
                  <Clock className={`w-4 h-4 ${activeDialTab === "yesterday" ? "text-indigo-600 stroke-[2.5]" : "text-slate-400"}`} />
                </button>
              </div>
            </div>
          </div>
          
          {/* Progress Completion Tab positioned UNDER the banner */}
          <div className="bg-white rounded-[32px] p-5 shadow-sm border border-slate-200 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-base font-black text-black tracking-tight">
                {isHindi ? "आज के कार्य पूर्णता" : "Today's Task Completion"}
              </span>
              <span className="text-lg font-black text-black leading-none">
                {Math.round((completedCount / totalActivities) * 100)}%
              </span>
            </div>
            {/* Horizontal Progress Bar */}
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#f97316] rounded-full transition-all duration-700 ease-out"
                style={{ width: `${(completedCount / totalActivities) * 100}%` }}
              />
            </div>
            <div className="flex justify-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                {completedCount}/{totalActivities} TASKS
              </span>
            </div>
          </div>
          
        </div>

        {/* ========================================================= */}
        {/* SECTION 2: TODAY'S LIVE METRICS (MINIMALIST 4-GRID CARD)  */}
        {/* ========================================================= */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <span className="h-4 w-1 bg-slate-900 rounded-full" />
            <h3 className="text-xs font-black tracking-widest uppercase text-slate-600">
              {isHindi ? "आज के लाइव मेट्रिक्स" : "TODAY'S LIVE METRICS"}
            </h3>
          </div>

          <div className="bg-[#e0e0e0] rounded-[24px] p-4 shadow-xs text-slate-900 space-y-3 border-transparent">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-[13px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {isHindi ? "लाइव शिफ्ट मेट्रिक्स" : "LIVE SHIFT METRICS"}
              </span>
              <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {isHindi ? `दिन ${currentDay} लाइव` : `Day ${currentDay} Live`}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
              {/* 1. Live Module Completion % */}
              <div className="bg-[#e0e0e0] rounded-xl p-2 sm:p-2.5 text-center flex flex-col items-center justify-center overflow-hidden shadow-[6px_6px_12px_#b8b8b8,-6px_-6px_12px_#ffffff]">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-500 tracking-tight truncate w-full">
                  {isHindi ? "मॉड्यूल" : "Modules"}
                </span>
                <div className="my-1.5 py-0.5 flex items-center justify-center">
                  <span className="text-2xl sm:text-[26px] font-normal text-slate-950 leading-none inline-block transform scale-y-[1.38] scale-x-[1.06] origin-center tracking-tight">
                    {Math.min(100, Math.round((completedCount / 4) * 100))}%
                  </span>
                </div>
                <span className="text-[8px] sm:text-[9px] font-bold text-emerald-600 truncate w-full">
                  {isHindi ? `${completedCount}/4 पूर्ण` : `${completedCount}/4 Done`}
                </span>
              </div>

              {/* 2. Pick Rate Live */}
              <div className="bg-[#e0e0e0] rounded-xl p-2 sm:p-2.5 text-center flex flex-col items-center justify-center overflow-hidden shadow-[6px_6px_12px_#b8b8b8,-6px_-6px_12px_#ffffff]">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-500 tracking-tight truncate w-full">
                  {isHindi ? "पिक रेट" : "Pick Rate"}
                </span>
                <div className="my-1.5 py-0.5 flex items-center justify-center">
                  <span className="text-2xl sm:text-[26px] font-normal text-slate-950 leading-none inline-block transform scale-y-[1.38] scale-x-[1.06] origin-center tracking-tight">
                    {Math.round(actualPickRate)}
                  </span>
                </div>
                <span className="text-[8px] sm:text-[9px] font-bold text-blue-600 truncate w-full">
                  /{Math.round(targetPickRate)} P/H
                </span>
              </div>

              {/* 3. Accuracy Live */}
              <div className="bg-[#e0e0e0] rounded-xl p-2 sm:p-2.5 text-center flex flex-col items-center justify-center overflow-hidden shadow-[6px_6px_12px_#b8b8b8,-6px_-6px_12px_#ffffff]">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-500 tracking-tight truncate w-full">
                  {isHindi ? "सटीकता" : "Accuracy"}
                </span>
                <div className="my-1.5 py-0.5 flex items-center justify-center">
                  <span className="text-2xl sm:text-[26px] font-normal text-slate-950 leading-none inline-block transform scale-y-[1.38] scale-x-[1.06] origin-center tracking-tight">
                    {Math.round(accuracyRate)}%
                  </span>
                </div>
                <span className="text-[8px] sm:text-[9px] font-bold text-emerald-600 truncate w-full">
                  {isHindi ? "लक्ष्य पार" : "On Target"}
                </span>
              </div>

              {/* 4. Quality Check */}
              <div className="bg-[#e0e0e0] rounded-xl p-2 sm:p-2.5 text-center flex flex-col items-center justify-center overflow-hidden shadow-[6px_6px_12px_#b8b8b8,-6px_-6px_12px_#ffffff]">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-500 tracking-tight truncate w-full">
                  {isHindi ? "क्वालिटी" : "QC Check"}
                </span>
                <div className="my-1.5 py-0.5 flex items-center justify-center">
                  <span className="text-2xl sm:text-[26px] font-normal text-slate-950 leading-none inline-block transform scale-y-[1.38] scale-x-[1.06] origin-center tracking-tight">
                    99%
                  </span>
                </div>
                <span className="text-[8px] sm:text-[9px] font-bold text-blue-600 truncate w-full">
                  {isHindi ? "पास (OK)" : "Passed"}
                </span>
              </div>
            </div>
          </div>
        </div>

                {/* ========================================================= */}
        {/* PREDICTIVE LEARNING PLAN                                  */}
        {/* ========================================================= */}
        <div className="bg-slate-50 rounded-[24px] border border-slate-200 overflow-hidden shadow-sm transition-all duration-300">
          <button
            type="button"
            onClick={() => setIsPlanExpanded(!isPlanExpanded)}
            className="w-full flex items-center justify-between p-4 sm:p-5 text-left cursor-pointer hover:bg-slate-100 transition-colors"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-0.5 block">
                  {isHindi ? "भविष्य कहनेवाला योजना" : "PREDICTIVE LEARNING PLAN"}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                {isHindi ? "दिन 10 तक आपका रास्ता" : "Your path to Day 10"}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                {isHindi ? "डीन का वर्तमान अपेक्षित मार्ग देखें" : "See Dean's current expected learning path"}
              </p>
            </div>
            <div className={`w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 transition-transform duration-300 ${isPlanExpanded ? "rotate-180" : ""}`}>
              <ChevronDown className="w-4 h-4" />
            </div>
          </button>
          
          {isPlanExpanded && (
            <div className="px-4 pb-5 sm:px-5 border-t border-slate-200/60 bg-white">
              <div className="pt-4 space-y-4 relative">
                {/* Vertical connecting line */}
                <div className="absolute left-3.5 top-8 bottom-4 w-0.5 bg-slate-100 rounded-full" />
                
                {/* Current Day */}
                <div className="flex items-start gap-3 relative z-10">
                  <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 border-[3px] border-white shadow-sm ring-1 ring-slate-100">
                    <span className="text-[10px] font-bold">●</span>
                  </div>
                  <div className="pt-1.5 pb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block mb-0.5">
                      DAY {currentDay} • TODAY
                    </span>
                    <h4 className="text-[13px] font-bold text-slate-900 leading-snug">
                      {targetCapability?.name || "Floor Operations"}
                    </h4>
                    <span className="text-[11px] text-slate-500 font-medium">Current focus</span>
                  </div>
                </div>

                {/* Projected Days */}
                {predictivePath.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 relative z-10">
                    {step.isCheckpoint ? (
                      <div className="w-7 h-7 rounded-full bg-slate-900 text-yellow-400 flex items-center justify-center shrink-0 border-[3px] border-white shadow-sm ring-1 ring-slate-100">
                        <span className="text-xs">★</span>
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-white text-slate-300 flex items-center justify-center shrink-0 border-[3px] border-white shadow-sm ring-1 ring-slate-200">
                        <span className="text-[10px]">○</span>
                      </div>
                    )}
                    <div className="pt-1">
                      <span className={`text-[10px] font-black uppercase tracking-wider block mb-0.5 ${step.isCheckpoint ? 'text-slate-900' : 'text-slate-400'}`}>
                        DAY {step.day}
                      </span>
                      {step.isCheckpoint ? (
                        <>
                          <h4 className="text-[13px] font-bold text-slate-900 leading-snug">Independent Picking</h4>
                          <span className="text-[11px] text-slate-500 font-medium">Readiness checkpoint</span>
                        </>
                      ) : step.cap ? (
                        <>
                          <h4 className="text-[13px] font-bold text-slate-700 leading-snug">{step.cap.name}</h4>
                          <span className="text-[11px] text-slate-400 font-medium">Expected next</span>
                        </>
                      ) : (
                        <>
                          <h4 className="text-[13px] font-semibold text-slate-500 italic leading-snug">Evaluating</h4>
                          <span className="text-[11px] text-slate-400 font-medium">Dean is evaluating your next step</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic text-center">
                  {isHindi ? "यह मार्ग आपके सीखने और काम करने के साथ अपडेट होता है।" : "This path updates as you learn and work."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* TODAY'S ADAPTIVE GOAL: WHAT, WHY, DO, CHECK, NEXT         */}
        {/* ========================================================= */}
        <div className="space-y-4 pt-2">
          {/* WHAT */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Target className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 mb-1 block">
                  {isHindi ? "क्या (WHAT)" : "WHAT AM I DOING?"}
                </span>
                <h3 className="text-base sm:text-[17px] font-black text-slate-900 leading-tight">
                  {targetCapability?.name || "Floor Operations"}
                </h3>
                <p className="text-xs text-slate-600 font-medium mt-1.5 leading-relaxed pr-2">
                  {targetCapability?.description || "General store fulfillment and safety operations."}
                </p>
              </div>
            </div>
          </div>

          {/* WHY */}
          <div className="bg-gradient-to-br from-slate-900 to-[#111520] rounded-3xl p-4 sm:p-5 border border-slate-700/60 shadow-lg relative overflow-hidden text-white">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
            <div className="flex items-start gap-3.5 relative z-10">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 mb-1 block">
                  {isHindi ? "क्यों (WHY)" : "WHY THIS GOAL?"}
                </span>
                <p className="text-[13px] sm:text-sm text-slate-200 font-medium leading-relaxed">
                  {doctorDiagnosis}
                </p>
                {longitudinalContext && (
                  <div className="mt-3 bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 relative overflow-hidden">
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 shrink-0 text-purple-300">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <path d="M12 16v-4"></path>
                          <path d="M12 8h.01"></path>
                        </svg>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wide block mb-0.5">
                          Dean's Memory
                        </span>
                        <p className="text-xs text-purple-100/90 font-medium leading-snug">
                          {longitudinalContext.evidence}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* DO */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="w-full">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 mb-1 block">
                  {isHindi ? "कार्य (DO)" : "WHAT SHOULD I DO NOW?"}
                </span>
                <h3 className="text-[15px] sm:text-base font-black text-slate-900 leading-tight">
                  {recAction ? recAction.title : "Follow standard floor routine"}
                </h3>
                <p className="text-xs sm:text-[13px] text-slate-600 font-medium mt-1.5 mb-4 leading-relaxed pr-2">
                  {recAction ? recAction.description : "Execute assigned tasks safely and maintain pacing standards."}
                </p>
                
                {recAction && (
                  <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 px-1">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-700">{recAction.smallestPracticalStep || "15 mins"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-700">{recAction.targetActor || "Self"}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenTaskDestination(recAction.id, recAction.targetActor || "work")}
                      className="px-4 py-2.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
                    >
                      {isHindi ? "गतिविधि प्रारंभ करें" : "Start Activity"}
                    </button>
                  </div>
                )}
                
                {todaysPrescribedModules.length > 0 && (
                  <div className="bg-purple-50/80 border border-purple-200/80 rounded-2xl p-3 flex flex-col sm:flex-row gap-3 sm:items-center justify-between mt-2">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 px-1">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-purple-400" />
                        <span className="text-xs font-bold text-purple-900 line-clamp-1">{todaysPrescribedModules[0].title}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleStartModule(todaysPrescribedModules[0].id)}
                      className="px-4 py-2.5 bg-purple-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-purple-700 active:scale-95 transition-all shadow-sm shrink-0"
                    >
                      {isHindi ? "लर्निंग शुरू करें" : "Start LMS"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CHECK & NEXT Container */}
          <div className="grid grid-cols-2 gap-3.5 pb-2">
            {/* CHECK */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 mb-3 block">
                {isHindi ? "चेक (CHECK)" : "HOW IT'S CHECKED"}
              </span>
              <div className="space-y-3 mt-auto">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Target Pace</span>
                  <span className="text-sm font-black text-slate-900">{targetCapability?.targetMetrics?.minPickRate || 40} items/hr</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Target Quality</span>
                  <span className="text-sm font-black text-slate-900">{targetCapability?.targetMetrics?.minAccuracy || 98}% acc</span>
                </div>
              </div>
            </div>

                        {/* RESULT */}
            {actionOutcome && (
              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 mb-3 block">
                  {isHindi ? "परिणाम (RESULT)" : "RESULT"}
                </span>
                
                <h3 className="text-[15px] sm:text-base font-black text-slate-900 leading-tight mb-2">
                  {actionOutcome.improved === "yes" ? "Improved" : actionOutcome.improved === "partial" ? "Partially improved" : actionOutcome.improved === "no" ? "Not improved yet" : "Not enough evidence yet"}
                </h3>
                
                <p className="text-xs sm:text-[13px] text-slate-600 font-medium mb-3 leading-relaxed">
                  {actionOutcome.improved === "yes" 
                    ? "Your latest evidence shows improvement." 
                    : actionOutcome.improved === "partial" 
                    ? "You're improving, but more evidence/practice is needed." 
                    : actionOutcome.improved === "no"
                    ? "Dean is adjusting the next step based on the latest evidence."
                    : "Dean needs more evidence before confirming improvement."}
                </p>
                
                {/* Evidence Metrics */}
                {(actionOutcome.subsequentPickRate || actionOutcome.subsequentAccuracy) && (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 grid grid-cols-2 gap-3 mt-1 mb-3">
                    {actionOutcome.subsequentPickRate && (
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Pick Rate</span>
                        <span className="text-sm font-black text-slate-900">{actionOutcome.subsequentPickRate} items/hr</span>
                      </div>
                    )}
                    {actionOutcome.subsequentAccuracy && (
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Accuracy</span>
                        <span className="text-sm font-black text-slate-900">{actionOutcome.subsequentAccuracy}%</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Environmental Context / Blocker */}
                {actionOutcome.treatmentContext?.reason && (
                  <div className="mt-1 flex items-start gap-2 bg-amber-50/50 p-2.5 rounded-lg border border-amber-100/50">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                    <span className="text-[11px] font-semibold text-amber-800 leading-snug">
                      {actionOutcome.treatmentContext.reason}
                    </span>
                  </div>
                )}
              </div>
            )}
            
            {/* REPLAN */}
            {actionOutcome && (
              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-cyan-500" />
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-600 mb-2 block">
                  {isHindi ? "अगला कदम (NEXT STEP)" : "NEXT STEP"}
                </span>
                <p className="text-xs sm:text-[13px] text-slate-700 font-semibold leading-relaxed">
                  {recAction ? recAction.title : newHire.recommendedActionSnippet || "Follow standard floor routine"}
                </p>
              </div>
            )}

            {/* NEXT */}
            {!actionOutcome && (
              <div className="bg-slate-50 rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-400" />
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2 block">
                    {isHindi ? "आगे क्या (NEXT)" : "WHAT COMES NEXT"}
                  </span>
                  <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                    {isHindi
                      ? "प्रदर्शन का मूल्यांकन होने के बाद डीन आपका अगला कदम तय करेगा।"
                      : "Dean will determine your next step after evaluating your performance."}
                  </p>
                </div>
                <div className="mt-3 flex items-start sm:items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 mt-0.5 sm:mt-0" />
                  <span className="text-xs font-black text-slate-900 leading-tight">
                    {isHindi ? "मूल्यांकन की प्रतीक्षा है" : "Awaiting Evaluation"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
{/* ========================================================= */}
      {/* 10. CONTROL TOWER VIEW: DEAN PRESCRIBED ACTIVITIES LIST   */}
      {/* ========================================================= */}
      {isTodaysActivityModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl relative animate-in slide-in-from-bottom duration-300 text-black">
            {/* Close button */}
            <button
              onClick={() => setIsTodaysActivityModalOpen(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 hover:text-black border border-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="space-y-1 pr-8">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-mono">
                  {isHindi ? "ट्रेनिंग व्यू" : "Training View"}
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {isHindi ? `दिन ${currentDay} निगरानी` : `Day ${currentDay} Monitor`}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-black leading-tight">
                {isHindi ? "आज की ट्रेनिंग" : "Today's Training"}
              </h2>
              <p className="text-[11px] text-slate-700 font-medium">
                {isHindi
                  ? "यह ट्रेनिंग अवलोकन है। यहां से कोई कार्रवाई या सबमिशन नहीं होता।"
                  : "Read-only training viewpoint. Displays all LMS sub-modules and floor tasks with shift tracking."}
              </p>
            </div>

            {/* EOD Simulation Toggle Switch */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isEodSimulation ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-black text-black block">
                    {isHindi ? "एंड-ऑफ-डे (EOD) सिमुलेशन" : "End-of-Day (EOD) Shift Simulation"}
                  </span>
                  <span className="text-[10px] text-slate-700 font-medium">
                    {isEodSimulation
                      ? (isHindi ? "अपूर्ण कार्य लाल (Red) दिखाए जा रहे हैं" : "Unfinished tasks flagged Red for EOD")
                      : (isHindi ? "सक्रिय शिफ्ट - अपूर्ण कार्य पीले (Amber)" : "Active shift - unfinished tasks in Amber")}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEodSimulation(!isEodSimulation)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isEodSimulation ? 'bg-red-600' : 'bg-slate-400'}`}
              >
                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isEodSimulation ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="h-px bg-slate-200" />

            {/* Flat Control Tower List of Prescribed LMS Modules and 5 Sub-Activities */}
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-black block">
                {isHindi ? "1. निर्धारित एलएमएस मॉड्यूल" : "1. LMS Modules"}
              </span>

              <div className="space-y-2">
                {todaysPrescribedModules.map((prescribedMod) => {
                  const fullModData = MANDATORY_TRAINING_MODULES.find((m) => m.id === prescribedMod.id) || prescribedMod;
                  const activities = fullModData.activities || [];

                  return (
                    <div key={prescribedMod.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-200 font-mono">
                            {prescribedMod.code}
                          </span>
                          <span className="text-xs font-black text-black">
                            {isHindi ? prescribedMod.titleHi : prescribedMod.title}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-700 font-mono">
                          {prescribedMod.durationMinutes}m
                        </span>
                      </div>

                      {/* Flat list of 5 sub-activities (No nested cards) */}
                      <div className="space-y-1.5 pl-1">
                        {activities.map((act, actIdx) => {
                          const isDone = act.completed;
                          const statusColor = isDone
                            ? "text-black bg-emerald-50 border-emerald-300"
                            : isEodSimulation
                            ? "text-black bg-red-50 border-red-300"
                            : "text-black bg-white border-slate-200";

                          return (
                            <div
                              key={act.id || actIdx}
                              className={`px-3 py-2 rounded-lg border flex items-center justify-between gap-2 text-xs cursor-pointer hover:border-blue-300 transition-colors ${statusColor}`}
                              onClick={() => handleStartModule(prescribedMod.id)}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {isDone ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                ) : isEodSimulation ? (
                                  <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                                ) : (
                                  <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                )}
                                <span className="font-bold text-black truncate">
                                  {actIdx + 1}. {isHindi ? (act.titleHi || act.title) : act.title}
                                </span>
                              </div>

                              <div className="shrink-0">
                                {isDone ? (
                                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    {isHindi ? "पूर्ण" : "DONE"}
                                  </span>
                                ) : isEodSimulation ? (
                                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                                    {isHindi ? "अपूर्ण (लाल)" : "OVERDUE"}
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                    {isHindi ? "लंबित" : "PENDING"}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Flat Control Tower List of Floor Practice Tasks */}
            <div className="space-y-2.5 pt-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-black block">
                {isHindi ? "2. फ्लोर अभ्यास और कार्य" : "2. Floor Practice Tasks"}
              </span>

              <div className="space-y-1.5">
                {todaysTasks.map((t) => {
                  const isDone = completedTaskIds[t.id];
                  const statusColor = isDone
                    ? "text-black bg-emerald-50 border-emerald-300"
                    : isEodSimulation
                    ? "text-black bg-red-50 border-red-300"
                    : "text-black bg-slate-50 border-slate-200";

                  return (
                    <div
                      key={t.id}
                      className={`px-3 py-2.5 rounded-lg border flex items-center justify-between gap-2 text-xs cursor-pointer hover:border-blue-300 transition-colors ${statusColor}`}
                      onClick={() => handleOpenTaskDestination(t.id, t.category)}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isDone ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : isEodSimulation ? (
                          <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        )}
                        <span className="font-bold text-black truncate">{t.title}</span>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <span className="text-[9px] text-slate-700 font-mono font-bold">{t.duration}</span>
                        {isDone ? (
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {isHindi ? "पूर्ण" : "DONE"}
                          </span>
                        ) : isEodSimulation ? (
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                            {isHindi ? "लाल (EOD)" : "OVERDUE"}
                          </span>
                        ) : (
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                            {isHindi ? "लंबित" : "PENDING"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-2">
              <button
                onClick={() => setIsTodaysActivityModalOpen(false)}
                className="py-3 px-6 rounded-xl font-black text-xs uppercase tracking-wider bg-black hover:bg-neutral-900 text-white transition-all w-full cursor-pointer shadow-md"
              >
                <span>{isHindi ? "बंद करें" : "Close Training View"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
