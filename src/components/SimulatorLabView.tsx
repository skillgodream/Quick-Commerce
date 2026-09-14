import React, { useState, useEffect } from "react";
import {
  Calendar,
  RotateCcw,
  Sparkles,
  Save,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Layers,
  Clock,
  User,
  Wrench,
  MapPin,
  FileText,
  HelpCircle,
  Activity,
  ArrowLeft,
  CalendarCheck,
  Zap,
} from "lucide-react";
import { NewHire, WorkSignal } from "../types";

interface SimulatorLabViewProps {
  newHires: NewHire[];
  activeHireId: string;
  currentDay: number;
  onSelectHire?: (hireId: string) => void;
  onSelectDay?: (day: number) => void;
  onApplyTelemetry: (
    hireId: string,
    dayNum: number,
    telemetry: {
      workSignal: WorkSignal;
      toolStatus?: "Normal" | "Failed";
      toolProblem?: string;
      errorCount?: number;
      errorNotes?: string;
      zone?: string;
      autoNavigate?: boolean;
    }
  ) => void;
  onBatchPopulateHistory?: (
    hireId: string,
    presentDay: number,
    endHistoryDay: number,
    pattern: string
  ) => void;
  onSetPresentDay?: (hireId: string, presentDay: number) => void;
  onPopulateTenDays: (hireId: string) => void;
  onPopulateEntireCohort: () => void;
  onResetCohort?: () => void;
  onNavigateToLearner?: () => void;
  onNavigateToManager?: () => void;
  onNavigateToStoreOps?: () => void;
}

const CANONICAL_PERSONAS = [
  { id: "nh-amit-03", canonicalId: "EMP-003", name: "Amit Verma", role: "Dark Store Picker", pattern: "High Velocity Top-Quartile" },
  { id: "nh-rahul-01", canonicalId: "EMP-001", name: "Rahul Sharma", role: "Dark Store Picker", pattern: "Struggling Picker (Aisle Friction)" },
  { id: "nh-priya-02", canonicalId: "EMP-002", name: "Priya Patel", role: "Dark Store Picker", pattern: "Hardware Malfunction (Scanner Disconnect)" },
  { id: "nh-sneha-04", canonicalId: "EMP-004", name: "Sneha Gupta", role: "Dark Store Picker", pattern: "Standard Progression" },
  { id: "nh-neha-05", canonicalId: "EMP-005", name: "Neha Singh", role: "Dark Store Picker", pattern: "Medium Complexity" },
];

export const SimulatorLabView: React.FC<SimulatorLabViewProps> = ({
  newHires,
  activeHireId,
  currentDay,
  onSelectHire,
  onSelectDay,
  onApplyTelemetry,
  onBatchPopulateHistory,
  onSetPresentDay,
  onPopulateTenDays,
  onPopulateEntireCohort,
  onResetCohort,
  onNavigateToLearner,
  onNavigateToManager,
  onNavigateToStoreOps,
}) => {
  const [selectedHireId, setSelectedHireId] = useState<string>(activeHireId || "nh-amit-03");
  const [selectedDay, setSelectedDay] = useState<number>(currentDay ?? 0);
  const [presentDay, setPresentDay] = useState<number>(currentDay ?? 7);

  // Quick populate dropdowns
  const [daysToPopulateOption, setDaysToPopulateOption] = useState<string>("7_days");
  const [patternComplexity, setPatternComplexity] = useState<string>("medium");

  // Telemetry Inputs for active selected day
  const [pickRate, setPickRate] = useState<number>(58);
  const [targetPickRate, setTargetPickRate] = useState<number>(50);
  const [accuracy, setAccuracy] = useState<number>(96.6);
  const [ordersCompleted, setOrdersCompleted] = useState<number>(46);
  const [targetOrders, setTargetOrders] = useState<number>(65);
  const [errorCount, setErrorCount] = useState<number>(2);

  // Additional Telemetry Sections
  const [attendanceStatus, setAttendanceStatus] = useState<string>("on_time");
  const [hoursOnFloor, setHoursOnFloor] = useState<number>(8);
  const [moduleCompleted, setModuleCompleted] = useState<string>("DSP-03 Location Nav");
  const [skillMasteryLevel, setSkillMasteryLevel] = useState<string>("proficient");
  const [escalationsCount, setEscalationsCount] = useState<number>(0);
  const [toolStatus, setToolStatus] = useState<"Normal" | "Failed">("Normal");
  const [toolProblem, setToolProblem] = useState<string>("");
  const [downtimeMinutes, setDowntimeMinutes] = useState<number>(0);
  const [zone, setZone] = useState<string>("aisle_1_4");
  const [congestion, setCongestion] = useState<string>("normal");
  const [observationNotes, setObservationNotes] = useState<string>("Day 0 dark store onboarding scan benchmark");
  const [interventionAction, setInterventionAction] = useState<string>("no_action");
  const [actionOutcome, setActionOutcome] = useState<string>("Improved");

  // Collapsible Accordion sections open/close state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    sectionA: true,
    sectionB: true,
    sectionC: false,
    sectionD: false,
    sectionE: false,
    sectionF: false,
    sectionG: false,
    sectionH: false,
    sectionI: true,
  });

  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const toggleSection = (sec: string) => {
    setOpenSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const currentHire = newHires.find((h) => h.id === selectedHireId) || newHires[0];
  const selectedPersona = CANONICAL_PERSONAS.find((p) => p.id === selectedHireId) || CANONICAL_PERSONAS[0];

  useEffect(() => {
    if (currentHire) {
      setPresentDay(currentHire.currentDay || currentDay || 7);
    }
  }, [currentHire?.id, currentHire?.currentDay, currentDay]);

  // Sync state whenever day or employee changes
  useEffect(() => {
    loadDayTelemetry(selectedHireId, selectedDay);
  }, [selectedHireId, selectedDay, currentHire?.daysHistory]);

  const loadDayTelemetry = (hireId: string, day: number) => {
    const hire = newHires.find((h) => h.id === hireId);
    const existingDayRecord = hire?.daysHistory?.find((d) => d.dayNumber === day);

    if (existingDayRecord && existingDayRecord.workSignal) {
      setPickRate(existingDayRecord.workSignal.actualPickRate || 50);
      setTargetPickRate(existingDayRecord.workSignal.targetPickRate || 50);
      setAccuracy(existingDayRecord.workSignal.accuracyRate || 95);
      setOrdersCompleted(existingDayRecord.workSignal.ordersCompleted || 40);
      setTargetOrders(existingDayRecord.workSignal.targetOrders || 65);
      setErrorCount(existingDayRecord.workSignal.errorCount ?? (existingDayRecord.canonicalEvidence?.floorObservations?.errorCount ?? 2));
      setObservationNotes(existingDayRecord.workSignal.gapIdentified || existingDayRecord.canonicalEvidence?.floorObservations?.notes || `Day ${day} shift record`);
      setZone(existingDayRecord.canonicalEvidence?.floorObservations?.zone || "aisle_1_4");
      setToolStatus(existingDayRecord.canonicalEvidence?.toolSystem?.toolStatus === "Failed" ? "Failed" : "Normal");
      setToolProblem(existingDayRecord.canonicalEvidence?.toolSystem?.toolProblem || "");
    } else if (existingDayRecord) {
      setPickRate(50);
      setTargetPickRate(50);
      setAccuracy(95);
      setOrdersCompleted(40);
      setTargetOrders(65);
      setErrorCount(existingDayRecord.canonicalEvidence?.floorObservations?.errorCount ?? 2);
      setObservationNotes(existingDayRecord.canonicalEvidence?.floorObservations?.notes || `Day ${day} shift record`);
      setZone(existingDayRecord.canonicalEvidence?.floorObservations?.zone || "aisle_1_4");
      setToolStatus(existingDayRecord.canonicalEvidence?.toolSystem?.toolStatus === "Failed" ? "Failed" : "Normal");
      setToolProblem(existingDayRecord.canonicalEvidence?.toolSystem?.toolProblem || "");
    } else {
      // Default formula based on persona and day
      loadDefaultPreset(hireId, day);
    }
  };

  const loadDefaultPreset = (hireId: string, day: number) => {
    if (hireId === "nh-amit-03") {
      if (day === 0) {
        setPickRate(58); setTargetPickRate(50); setAccuracy(96.6); setOrdersCompleted(46); setTargetOrders(65); setErrorCount(2);
        setToolStatus("Normal"); setToolProblem(""); setZone("aisle_1_4"); setObservationNotes("Day 0 dark store onboarding scan benchmark");
      } else {
        const u = Math.min(72, Math.round(38 + day * 3.2));
        setPickRate(u); setTargetPickRate(50); setAccuracy(Number((95.0 + day * 0.45).toFixed(1)));
        setOrdersCompleted(Math.min(65, Math.round(30 + day * 3.5))); setTargetOrders(65); setErrorCount(Math.max(0, 3 - Math.floor(day / 3)));
        setToolStatus("Normal"); setToolProblem(""); setZone("aisle_1_4"); setObservationNotes(`Day ${day} Amit progression benchmark`);
      }
    } else if (hireId === "nh-priya-02") {
      if (day === 3 || day === 4) {
        setPickRate(35); setTargetPickRate(50); setAccuracy(90.5); setOrdersCompleted(27); setTargetOrders(65); setErrorCount(6);
        setToolStatus("Failed"); setToolProblem("Bluetooth ring scanner disconnects repeatedly"); setZone("aisle_4_8");
        setObservationNotes("Hardware malfunction: Bluetooth ring scanner dropped pairing 6 times.");
      } else if (day >= 5) {
        setPickRate(50 + (day - 5) * 3); setTargetPickRate(50); setAccuracy(Number((97.0 + (day - 5) * 0.5).toFixed(1)));
        setOrdersCompleted(45 + (day - 5) * 4); setTargetOrders(65); setErrorCount(1);
        setToolStatus("Normal"); setToolProblem(""); setZone("aisle_1_4");
        setObservationNotes("Hardware resolved: Swapped to Terminal B4. High pick velocity restored.");
      } else {
        setPickRate(38); setTargetPickRate(50); setAccuracy(93.0); setOrdersCompleted(30); setTargetOrders(65); setErrorCount(4);
        setToolStatus("Normal"); setToolProblem(""); setZone("aisle_1_4"); setObservationNotes("Standard orientation picking.");
      }
    } else if (hireId === "nh-rahul-01") {
      if (day === 4) {
        setPickRate(40); setTargetPickRate(50); setAccuracy(94.2); setOrdersCompleted(33); setTargetOrders(65); setErrorCount(4);
        setToolStatus("Normal"); setToolProblem(""); setZone("aisle_4_8");
        setObservationNotes("Bottleneck in deep aisles 4-8; searching for variant SKUs took extra time.");
      } else if (day >= 5) {
        setPickRate(49 + (day - 5) * 4); setTargetPickRate(50); setAccuracy(Number((96.5 + (day - 5) * 0.5).toFixed(1)));
        setOrdersCompleted(44 + (day - 5) * 4); setTargetOrders(65); setErrorCount(1);
        setToolStatus("Normal"); setToolProblem(""); setZone("aisle_1_4");
        setObservationNotes("Post-buddy walkthrough: Navigation confident, pick pace recovered.");
      } else {
        setPickRate(42); setTargetPickRate(50); setAccuracy(95.0); setOrdersCompleted(34); setTargetOrders(65); setErrorCount(3);
        setToolStatus("Normal"); setToolProblem(""); setZone("aisle_1_4"); setObservationNotes("Standard shift onboarding.");
      }
    } else {
      setPickRate(Math.min(70, Math.round(40 + day * 3.0)));
      setTargetPickRate(50);
      setAccuracy(Number((94.0 + day * 0.5).toFixed(1)));
      setOrdersCompleted(Math.min(65, Math.round(32 + day * 3.3)));
      setTargetOrders(65);
      setErrorCount(Math.max(0, 3 - Math.floor(day / 3)));
      setToolStatus("Normal");
      setToolProblem("");
      setZone("aisle_1_4");
      setObservationNotes(`Day ${day} shift progression telemetry`);
    }
  };

  const handleSelectDay = (day: number) => {
    setSelectedDay(day);
    if (onSelectDay) onSelectDay(day);
  };

  const handleSelectHire = (hireId: string) => {
    setSelectedHireId(hireId);
    if (onSelectHire) onSelectHire(hireId);
  };

  // Choose / Set Present Day explicitly
  const handleSetPresentDayExplicit = (targetDay: number) => {
    setPresentDay(targetDay);
    setSelectedDay(targetDay);
    if (onSelectDay) onSelectDay(targetDay);
    if (onSetPresentDay) {
      onSetPresentDay(selectedHireId, targetDay);
    }
    setNotificationMsg(`✓ Present Day set to Day ${targetDay}. Showing data strictly up to Day ${Math.max(0, targetDay - 1)}.`);
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  // Save telemetry for active day
  const handleSaveActiveDay = () => {
    const workSignal: WorkSignal = {
      dayNumber: selectedDay,
      targetPickRate,
      actualPickRate: pickRate,
      accuracyRate: accuracy,
      ordersCompleted,
      targetOrders,
      gapIdentified: observationNotes,
      hasWorkEvidence: true,
    };

    onApplyTelemetry(selectedHireId, selectedDay, {
      workSignal,
      toolStatus,
      toolProblem: toolStatus === "Failed" ? toolProblem : undefined,
      errorCount,
      errorNotes: observationNotes,
      zone,
      autoNavigate: false,
    });

    setNotificationMsg(`✓ Data is saved! Day ${selectedDay} shift telemetry recorded for ${selectedPersona?.name}.`);
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  // Auto-populate days and prune future days beyond the requested threshold
  const handleAutoPopulateAndSave = () => {
    let endHistoryDay = 6;
    let newPresentDay = 7;

    if (daysToPopulateOption === "5_days") {
      endHistoryDay = 4;
      newPresentDay = 5;
    } else if (daysToPopulateOption === "7_days") {
      endHistoryDay = 6;
      newPresentDay = 7;
    } else if (daysToPopulateOption === "10_days") {
      endHistoryDay = 9;
      newPresentDay = 10;
    } else if (daysToPopulateOption === "all_11") {
      endHistoryDay = 10;
      newPresentDay = 10;
    } else if (daysToPopulateOption === "up_to_present") {
      endHistoryDay = Math.max(0, presentDay - 1);
      newPresentDay = presentDay;
    } else if (daysToPopulateOption === "up_to_selected") {
      endHistoryDay = selectedDay;
      newPresentDay = Math.min(10, selectedDay + 1);
    }

    setPresentDay(newPresentDay);
    setSelectedDay(Math.min(endHistoryDay, selectedDay));

    if (onBatchPopulateHistory) {
      onBatchPopulateHistory(selectedHireId, newPresentDay, endHistoryDay, patternComplexity);
    } else {
      // Fallback manual loop
      for (let d = 0; d <= endHistoryDay; d++) {
        onApplyTelemetry(selectedHireId, d, {
          workSignal: {
            dayNumber: d,
            targetPickRate: 50,
            actualPickRate: 50,
            accuracyRate: 96,
            ordersCompleted: 45,
            targetOrders: 65,
            gapIdentified: `Day ${d} shift telemetry`,
            hasWorkEvidence: true,
          },
          toolStatus: "Normal",
          errorCount: 2,
          zone: "aisle_1_4",
          autoNavigate: false,
        });
      }
    }

    setNotificationMsg(
      `✓ Data saved! System filled automatic shift data for ${endHistoryDay + 1} days (Day 0 to Day ${endHistoryDay}). Simulator shows data ONLY till Day ${endHistoryDay}; future days are not populated.`
    );
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  // Reset cohort / days
  const handleResetDays = () => {
    if (onResetCohort) {
      onResetCohort();
      setPresentDay(1);
      setSelectedDay(0);
      setNotificationMsg("Reset all days data back to baseline.");
      setTimeout(() => setNotificationMsg(null), 3500);
    }
  };

  // Filter sorted history strictly to populated days up to the maximum active history limit
  const allHistory = currentHire?.daysHistory || [];
  const populatedDaysSet = new Set(allHistory.map((d) => d.dayNumber));
  const populatedCount = populatedDaysSet.size;

  // Max day with data
  const maxDayWithData = allHistory.length > 0 ? Math.max(...allHistory.map((d) => d.dayNumber)) : -1;

  // Sorted history strictly showing only populated days up to that limit
  const sortedHistory = [...allHistory].sort((a, b) => a.dayNumber - b.dayNumber);

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 pb-16 font-sans">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
            ⚗
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Simulator Workbench
            </h1>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Present Day Progression & Shift Telemetry Generator
            </p>
          </div>
        </div>

        {/* Quick View Switchers */}
        <div className="flex items-center gap-2">
          {onNavigateToLearner && (
            <button
              onClick={onNavigateToLearner}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Learner View</span>
            </button>
          )}

          {onNavigateToManager && (
            <button
              onClick={onNavigateToManager}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>Supervisor View</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-5">
        {/* Notification Toast */}
        {notificationMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-start gap-2.5 shadow-sm animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{notificationMsg}</div>
          </div>
        )}

        {/* Active Candidate Selector Bar */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Active Candidate
            </span>
            <span className="text-xs font-semibold text-slate-700">
              {selectedPersona?.name} <span className="font-mono text-slate-400">({selectedPersona?.canonicalId})</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {CANONICAL_PERSONAS.map((p) => {
              const isSelected = p.id === selectedHireId;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectHire(p.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  {p.name.split(" ")[0]} ({p.canonicalId})
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================= */}
        {/* CARD 1: PRESENT DAY SELECTOR & TIMELINE */}
        {/* ========================================================= */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-indigo-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  CHOOSE PRESENT DAY & TIMELINE
                </h2>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Active Present Day: <strong className="text-indigo-600 font-bold">Day {presentDay}</strong> • Showing data till <strong className="text-slate-800">{maxDayWithData >= 0 ? `Day ${maxDayWithData}` : "None"}</strong>
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-xl">
              {populatedCount}/11 days populated
            </span>
          </div>

          {/* Squircle Day Buttons Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-4 gap-2.5">
            {Array.from({ length: 11 }, (_, i) => i).map((d) => {
              const isSelected = d === selectedDay;
              const isPresent = d === presentDay;
              const isPopulated = populatedDaysSet.has(d);
              const isFuture = d > presentDay && !isPopulated;

              return (
                <button
                  key={d}
                  onClick={() => handleSelectDay(d)}
                  className={`h-14 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer border relative ${
                    isSelected
                      ? "bg-[#4338ca] text-white border-[#4338ca] shadow-md shadow-indigo-500/20 font-bold"
                      : isPresent
                      ? "bg-indigo-50 border-indigo-400 text-indigo-900 font-bold ring-2 ring-indigo-200"
                      : isPopulated
                      ? "bg-emerald-50/70 border-emerald-300 text-emerald-900 font-bold hover:bg-emerald-100"
                      : isFuture
                      ? "bg-slate-50/50 border-dashed border-slate-200 text-slate-300 font-medium"
                      : "bg-slate-50/80 border-slate-200 text-slate-400 font-semibold hover:bg-slate-100 hover:text-slate-600"
                  }`}
                >
                  <span className="text-sm">D{d}</span>
                  {isPresent && !isSelected && (
                    <span className="text-[9px] font-bold text-indigo-700 uppercase tracking-tighter">Present</span>
                  )}
                  {isPopulated && !isSelected && !isPresent && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Action Row under Timeline */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={handleResetDays}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 py-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Days</span>
            </button>

            <button
              onClick={() => handleSetPresentDayExplicit(selectedDay)}
              title={`Set Day ${selectedDay} as your present day`}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-200 flex items-center gap-1 transition-all cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Make Day {selectedDay} Present Day</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CARD 2: JOURNEY HISTORY (STRICTLY DATA TILL SELECTED DATE) */}
        {/* ========================================================= */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                JOURNEY HISTORY
              </h2>
              <p className="text-[11px] text-slate-400">
                {sortedHistory.length > 0
                  ? `Showing data strictly till Day ${sortedHistory[sortedHistory.length - 1].dayNumber} (${sortedHistory.length} total shifts recorded)`
                  : "No shift data recorded yet"}
              </p>
            </div>
            <span className="text-[11px] text-slate-400">
              Click row to edit
            </span>
          </div>

          <div className="overflow-hidden border border-slate-100 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3.5">Day</th>
                  <th className="py-2.5 px-3">Units (UPH)</th>
                  <th className="py-2.5 px-3">Errors</th>
                  <th className="py-2.5 px-3">Acc%</th>
                  <th className="py-2.5 px-3">Shift Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedHistory.length > 0 ? (
                  sortedHistory.map((rec) => {
                    const isRowSelected = rec.dayNumber === selectedDay;
                    return (
                      <tr
                        key={rec.dayNumber}
                        onClick={() => handleSelectDay(rec.dayNumber)}
                        className={`cursor-pointer transition-colors ${
                          isRowSelected
                            ? "bg-indigo-50/80 font-bold text-indigo-950"
                            : "hover:bg-slate-50 text-slate-700 font-medium"
                        }`}
                      >
                        <td className="py-2.5 px-3.5 flex items-center gap-2">
                          <span>Day {rec.dayNumber}</span>
                          {isRowSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                          )}
                        </td>
                        <td className="py-2.5 px-3">{rec.workSignal?.actualPickRate ?? "--"} /hr</td>
                        <td className="py-2.5 px-3">{rec.workSignal?.errorCount ?? 0}</td>
                        <td className="py-2.5 px-3">{rec.workSignal?.accuracyRate ? `${rec.workSignal.accuracyRate}%` : "--"}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            rec.statusAtEnd === "Doing well" ? "bg-emerald-100 text-emerald-800" :
                            rec.statusAtEnd === "Needs attention" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                          }`}>
                            {rec.statusAtEnd || "Active"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                      No days populated yet. Select an option below and click <strong>Auto Populate & Save</strong>.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CARD 3: AUTO POPULATE DAYS (Exact requested workflow) */}
        {/* ========================================================= */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              AUTO POPULATE DAYS (FILL AUTOMATIC DATA)
            </h2>
          </div>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            Choose how many days to generate. The system populates data strictly up to that selected date and prunes future days.
          </p>

          <div className="space-y-3.5">
            {/* Dropdown 1: Days to Populate */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Choose Days to Populate
              </label>
              <select
                value={daysToPopulateOption}
                onChange={(e) => setDaysToPopulateOption(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="7_days">7 Days (Fills Day 0 to Day 6 • Sets Present Day 7)</option>
                <option value="5_days">5 Days (Fills Day 0 to Day 4 • Sets Present Day 5)</option>
                <option value="10_days">10 Days (Fills Day 0 to Day 9 • Sets Present Day 10)</option>
                <option value="all_11">All 11 Days (Fills Day 0 to Day 10)</option>
                <option value="up_to_present">Up to Present Day (Fills Day 0 to Day {Math.max(0, presentDay - 1)})</option>
                <option value="up_to_selected">Up to Selected Day (Fills Day 0 to Day {selectedDay})</option>
              </select>
            </div>

            {/* Dropdown 2: Pattern / Complexity */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Performance / Progression Pattern
              </label>
              <select
                value={patternComplexity}
                onChange={(e) => setPatternComplexity(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="medium">Medium Complexity (Natural Dark Store Ramp)</option>
                <option value="standard">Standard Progression (Linear Improvement)</option>
                <option value="struggling">Struggling Picker (Aisle Friction on Day 4)</option>
                <option value="hardware">Hardware Malfunction (Bluetooth Ring Scanner Drop on Day 3-4)</option>
                <option value="stellar">High Velocity Top-Quartile (Amit Benchmark)</option>
              </select>
            </div>

            {/* Primary Populate & Save Button */}
            <button
              onClick={handleAutoPopulateAndSave}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#5454fa] hover:bg-[#4338ca] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm shadow-indigo-500/20 active:scale-98 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Auto Populate & Save Data</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CARD 4: LIVE CALCULATIONS & METRICS FOR SELECTED DAY */}
        {/* ========================================================= */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="text-sm font-bold text-slate-900">
                  Day {selectedDay} Live Calculations & Metrics
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Instant evaluation feedback based on the numbers entered below
              </p>
            </div>

            <button
              onClick={handleSaveActiveDay}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-98 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Day {selectedDay}</span>
            </button>
          </div>

          {/* Metric Stat Boxes Side by Side */}
          <div className="grid grid-cols-2 gap-3.5">
            {/* Box 1: Pick Velocity */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                PICK VELOCITY
              </span>
              <div className="text-xl font-bold text-slate-900">
                {pickRate} /hr
              </div>
              <div>
                <span
                  className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    pickRate < targetPickRate
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {pickRate < targetPickRate ? "⚠ Behind Target" : "✓ On Target"}
                </span>
              </div>
            </div>

            {/* Box 2: Calculated Accuracy */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                CALCULATED ACCURACY
              </span>
              <div className="text-xl font-bold text-slate-900">
                {accuracy}%
              </div>
              <div>
                <span
                  className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    accuracy < 95
                      ? "bg-rose-100 text-rose-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {accuracy < 95 ? "⚠ Quality Gap" : "✓ High Quality"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* ACCORDION SECTIONS A THROUGH I (Exact telemetry editor) */}
        {/* ========================================================= */}
        <div className="space-y-3">
          {/* SECTION A */}
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
            <button
              onClick={() => toggleSection("sectionA")}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left font-bold text-xs text-slate-800 hover:bg-slate-50 cursor-pointer"
            >
              <span>SECTION A — PICK & PACK PERFORMANCE</span>
              {openSections.sectionA ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            {openSections.sectionA && (
              <div className="p-5 pt-0 space-y-3.5 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-3 pt-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600">Pick Velocity (UPH)</label>
                    <input
                      type="number"
                      value={pickRate}
                      onChange={(e) => setPickRate(Number(e.target.value))}
                      className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600">Target Velocity (UPH)</label>
                    <input
                      type="number"
                      value={targetPickRate}
                      onChange={(e) => setTargetPickRate(Number(e.target.value))}
                      className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600">Orders Completed</label>
                    <input
                      type="number"
                      value={ordersCompleted}
                      onChange={(e) => setOrdersCompleted(Number(e.target.value))}
                      className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600">Target Orders</label>
                    <input
                      type="number"
                      value={targetOrders}
                      onChange={(e) => setTargetOrders(Number(e.target.value))}
                      className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION B */}
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
            <button
              onClick={() => toggleSection("sectionB")}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left font-bold text-xs text-slate-800 hover:bg-slate-50 cursor-pointer"
            >
              <span>SECTION B — SCAN QUALITY & ACCURACY</span>
              {openSections.sectionB ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            {openSections.sectionB && (
              <div className="p-5 pt-0 space-y-3.5 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-3 pt-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600">Accuracy Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={accuracy}
                      onChange={(e) => setAccuracy(Number(e.target.value))}
                      className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600">Barcode Scan Errors</label>
                    <input
                      type="number"
                      value={errorCount}
                      onChange={(e) => setErrorCount(Number(e.target.value))}
                      className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION C */}
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
            <button
              onClick={() => toggleSection("sectionC")}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left font-bold text-xs text-slate-800 hover:bg-slate-50 cursor-pointer"
            >
              <span>SECTION C — ATTENDANCE & SHIFT TIME</span>
              {openSections.sectionC ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            {openSections.sectionC && (
              <div className="p-5 pt-0 space-y-3 border-t border-slate-100 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600">Shift Punctuality</label>
                    <select
                      value={attendanceStatus}
                      onChange={(e) => setAttendanceStatus(e.target.value)}
                      className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                    >
                      <option value="on_time">On Time (08:00 AM)</option>
                      <option value="late_15">15 Min Late</option>
                      <option value="absent">Unexcused Absence</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600">Hours on Floor</label>
                    <input
                      type="number"
                      value={hoursOnFloor}
                      onChange={(e) => setHoursOnFloor(Number(e.target.value))}
                      className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION D */}
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
            <button
              onClick={() => toggleSection("sectionD")}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left font-bold text-xs text-slate-800 hover:bg-slate-50 cursor-pointer"
            >
              <span>SECTION D — LEARNING & DIGITAL READINESS</span>
              {openSections.sectionD ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            {openSections.sectionD && (
              <div className="p-5 pt-0 space-y-3 border-t border-slate-100 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600">Module Completed</label>
                    <input
                      type="text"
                      value={moduleCompleted}
                      onChange={(e) => setModuleCompleted(e.target.value)}
                      className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600">Skill Mastery Level</label>
                    <select
                      value={skillMasteryLevel}
                      onChange={(e) => setSkillMasteryLevel(e.target.value)}
                      className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                    >
                      <option value="proficient">Proficient (≥95%)</option>
                      <option value="learning">Learning In Progress</option>
                      <option value="struggling">Needs Retraining</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION E */}
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
            <button
              onClick={() => toggleSection("sectionE")}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left font-bold text-xs text-slate-800 hover:bg-slate-50 cursor-pointer"
            >
              <span>SECTION E — SUPERVISOR SIGNALS & ESCALATIONS</span>
              {openSections.sectionE ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            {openSections.sectionE && (
              <div className="p-5 pt-0 space-y-3 border-t border-slate-100 pt-3">
                <label className="text-[11px] font-bold text-slate-600">Logged Escalations</label>
                <input
                  type="number"
                  value={escalationsCount}
                  onChange={(e) => setEscalationsCount(Number(e.target.value))}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                />
              </div>
            )}
          </div>

          {/* SECTION F */}
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
            <button
              onClick={() => toggleSection("sectionF")}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left font-bold text-xs text-slate-800 hover:bg-slate-50 cursor-pointer"
            >
              <span>SECTION F — HARDWARE & SCANNER TOOL STATUS</span>
              {openSections.sectionF ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            {openSections.sectionF && (
              <div className="p-5 pt-0 space-y-3 border-t border-slate-100 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600">Tool System Status</label>
                    <select
                      value={toolStatus}
                      onChange={(e) => setToolStatus(e.target.value as "Normal" | "Failed")}
                      className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                    >
                      <option value="Normal">Normal (Hardware Functional)</option>
                      <option value="Failed">Failed (Scanner / Handheld Glitch)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600">Downtime Minutes</label>
                    <input
                      type="number"
                      value={downtimeMinutes}
                      onChange={(e) => setDowntimeMinutes(Number(e.target.value))}
                      className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                    />
                  </div>
                </div>
                {toolStatus === "Failed" && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-600">Specific Hardware Problem</label>
                    <input
                      type="text"
                      value={toolProblem}
                      onChange={(e) => setToolProblem(e.target.value)}
                      placeholder="e.g. Bluetooth ring scanner disconnects repeatedly"
                      className="w-full mt-1 bg-slate-50 border border-rose-300 rounded-xl px-3 py-2 text-xs font-semibold text-rose-900"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION G */}
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
            <button
              onClick={() => toggleSection("sectionG")}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left font-bold text-xs text-slate-800 hover:bg-slate-50 cursor-pointer"
            >
              <span>SECTION G — DARK STORE ZONE CONGESTION</span>
              {openSections.sectionG ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            {openSections.sectionG && (
              <div className="p-5 pt-0 space-y-3 border-t border-slate-100 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600">Assigned Zone</label>
                    <select
                      value={zone}
                      onChange={(e) => setZone(e.target.value)}
                      className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                    >
                      <option value="aisle_1_4">Aisles 1–4 (High Velocity Ambient)</option>
                      <option value="aisle_4_8">Aisles 4–8 (Deep Storage & Fragile)</option>
                      <option value="cold_room">Cold Room & Chilled Zone</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600">Congestion Index</label>
                    <select
                      value={congestion}
                      onChange={(e) => setCongestion(e.target.value)}
                      className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                    >
                      <option value="normal">Normal Flow</option>
                      <option value="moderate">Moderate Restock Friction</option>
                      <option value="high">High Congestion</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION H */}
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
            <button
              onClick={() => toggleSection("sectionH")}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left font-bold text-xs text-slate-800 hover:bg-slate-50 cursor-pointer"
            >
              <span>SECTION H — HUMAN OBSERVATIONS & NOTES</span>
              {openSections.sectionH ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            {openSections.sectionH && (
              <div className="p-5 pt-0 space-y-3 border-t border-slate-100 pt-3">
                <label className="text-[11px] font-bold text-slate-600">Floor Observations</label>
                <textarea
                  rows={2}
                  value={observationNotes}
                  onChange={(e) => setObservationNotes(e.target.value)}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium"
                />
              </div>
            )}
          </div>

          {/* SECTION I */}
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
            <button
              onClick={() => toggleSection("sectionI")}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left font-bold text-xs text-slate-800 hover:bg-slate-50 cursor-pointer"
            >
              <span>SECTION I — INTERVENTION ACTION & OUTCOME</span>
              {openSections.sectionI ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            {openSections.sectionI && (
              <div className="p-5 pt-0 space-y-3 border-t border-slate-100 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600">Intervention Action</label>
                    <select
                      value={interventionAction}
                      onChange={(e) => setInterventionAction(e.target.value)}
                      className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                    >
                      <option value="no_action">None / Normal Shift</option>
                      <option value="buddy_walkthrough">Peer Buddy Walkthrough</option>
                      <option value="swap_hardware">Hardware Terminal Swap</option>
                      <option value="retrain_scan">Barcode Angle Retraining</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600">Outcome</label>
                    <select
                      value={actionOutcome}
                      onChange={(e) => setActionOutcome(e.target.value)}
                      className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                    >
                      <option value="Improved">Improved (Velocity Surged)</option>
                      <option value="Partial">Partial Improvement</option>
                      <option value="NoChange">No Change</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSaveActiveDay}
                    className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Day {selectedDay} Telemetry</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
