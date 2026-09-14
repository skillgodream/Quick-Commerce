import React, { useState, useEffect } from "react";
import {
  X,
  Play,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
  Activity,
  Layers,
  ArrowRight,
  TrendingUp,
  Clock,
  ShieldCheck,
  User,
  Check,
  Flame,
  Gauge,
  Box,
  Cpu,
  AlertOctagon,
  ArrowUpRight,
} from "lucide-react";
import { NewHire, DayRecord, WorkSignal, CandidatePattern } from "../types";
import {
  CANONICAL_CHECKIN_EMPLOYEES,
  mapToSimulatorEmployeeId,
  mapToCanonicalEmployeeId,
  SimulatorEvidenceItem,
} from "../services/simulatorEvidenceService";

interface EmbeddedSimulatorLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  newHires: NewHire[];
  activeHireId: string;
  currentDay: number;
  onSelectHire: (hireId: string) => void;
  onSelectDay: (day: number) => void;
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
  onPopulateTenDays: (hireId: string, scenarioProfile?: "normal" | "struggling" | "stellar" | "scanner_fail") => void;
  onPopulateEntireCohort: () => void;
  onResetCohort: () => void;
  onOpenLearnerView: () => void;
  onOpenManagerView: () => void;
}

export const EmbeddedSimulatorLabModal: React.FC<EmbeddedSimulatorLabModalProps> = ({
  isOpen,
  onClose,
  newHires,
  activeHireId,
  currentDay,
  onSelectHire,
  onSelectDay,
  onApplyTelemetry,
  onPopulateTenDays,
  onPopulateEntireCohort,
  onResetCohort,
  onOpenLearnerView,
  onOpenManagerView,
}) => {
  const [selectedHireId, setSelectedHireId] = useState(activeHireId || "nh-amit-03");
  const [selectedDay, setSelectedDay] = useState(currentDay || 4);

  // Form telemetry state
  const [pickRate, setPickRate] = useState<number>(58);
  const [targetPickRate, setTargetPickRate] = useState<number>(50);
  const [accuracyRate, setAccuracyRate] = useState<number>(96.6);
  const [ordersCompleted, setOrdersCompleted] = useState<number>(46);
  const [targetOrders, setTargetOrders] = useState<number>(65);

  // Hardware / Tool status
  const [toolStatus, setToolStatus] = useState<"Normal" | "Failed">("Normal");
  const [toolProblem, setToolProblem] = useState<string>("");

  // Error logging
  const [errorCount, setErrorCount] = useState<number>(2);
  const [errorCategory, setErrorCategory] = useState<string>("Misplaced items in cold aisle");

  // Zone & Environment
  const [selectedZone, setSelectedZone] = useState<string>("aisle_1_4");

  // Success flash feedback
  const [appliedFlash, setAppliedFlash] = useState<string | null>(null);

  // Sync internal state when opened or active employee changes
  useEffect(() => {
    if (isOpen) {
      setSelectedHireId(activeHireId || "nh-amit-03");
      setSelectedDay(currentDay || 4);
    }
  }, [isOpen, activeHireId, currentDay]);

  // Load telemetry values from existing day record if available
  useEffect(() => {
    const hire = newHires.find((h) => h.id === selectedHireId);
    if (hire) {
      const dayRec = hire.daysHistory?.find((d) => d.dayNumber === selectedDay);
      if (dayRec?.workSignal) {
        setPickRate(dayRec.workSignal.actualPickRate || 58);
        setTargetPickRate(dayRec.workSignal.targetPickRate || 50);
        setAccuracyRate(dayRec.workSignal.accuracyRate || 96.6);
        setOrdersCompleted(dayRec.workSignal.ordersCompleted || 46);
        setTargetOrders(dayRec.workSignal.targetOrders || 65);
      } else {
        // Sensible defaults based on day
        const defaultRate = Math.min(65, 30 + selectedDay * 5);
        setPickRate(defaultRate);
        setTargetPickRate(50);
        setAccuracyRate(96.5);
        setOrdersCompleted(Math.round(defaultRate * 0.8));
        setTargetOrders(65);
      }

      if (dayRec?.canonicalEvidence?.toolSystem) {
        setToolStatus(dayRec.canonicalEvidence.toolSystem.toolStatus === "Failed" ? "Failed" : "Normal");
        setToolProblem(dayRec.canonicalEvidence.toolSystem.toolProblem || "");
      } else {
        setToolStatus("Normal");
        setToolProblem("");
      }
    }
  }, [selectedHireId, selectedDay, newHires]);

  if (!isOpen) return null;

  const currentHire = newHires.find((h) => h.id === selectedHireId) || newHires[0];
  const simEmpCode = mapToSimulatorEmployeeId(currentHire?.id || "nh-rahul-01");

  // Apply single day telemetry
  const handleApplyCurrentDay = (autoNavigate: boolean = false) => {
    onSelectHire(selectedHireId);
    onSelectDay(selectedDay);

    onApplyTelemetry(selectedHireId, selectedDay, {
      workSignal: {
        dayNumber: selectedDay,
        targetPickRate,
        actualPickRate: Number(pickRate),
        accuracyRate: Number(accuracyRate),
        ordersCompleted: Number(ordersCompleted),
        targetOrders: Number(targetOrders),
      },
      toolStatus,
      toolProblem: toolStatus === "Failed" ? toolProblem || "Scanner screen frozen on bin validation" : undefined,
      errorCount,
      errorNotes: errorCount > 0 ? errorCategory : undefined,
      zone: selectedZone,
      autoNavigate,
    });

    setAppliedFlash(`✓ Injected Day ${selectedDay} Telemetry into ${currentHire.name} (${simEmpCode})`);
    setTimeout(() => setAppliedFlash(null), 3500);

    if (autoNavigate) {
      onClose();
    }
  };

  // Quick Preset Scenarios
  const applyPreset = (preset: "normal_ramp" | "scanner_failure" | "fragile_breakage" | "high_performer" | "amit_day0") => {
    if (preset === "amit_day0") {
      setSelectedHireId("nh-amit-03");
      setSelectedDay(0);
      setPickRate(58);
      setTargetPickRate(50);
      setAccuracyRate(96.6);
      setOrdersCompleted(46);
      setTargetOrders(65);
      setToolStatus("Normal");
      setToolProblem("");
      setErrorCount(2);
      setErrorCategory("Misplaced fragile items in cold aisle");
      setAppliedFlash("Loaded Amit Verma Day 0 Benchmark Preset (58 UPH / 96.6% Accuracy)");
    } else if (preset === "scanner_failure") {
      setPickRate(24);
      setAccuracyRate(92.0);
      setOrdersCompleted(18);
      setToolStatus("Failed");
      setToolProblem("Zebra TC52 Scanner beam uncalibrated and touchscreen unresponsive");
      setErrorCount(4);
      setErrorCategory("Barcode scan timeout in bulk pallet bay");
      setAppliedFlash("Loaded Hardware/Scanner Terminal Failure Scenario");
    } else if (preset === "fragile_breakage") {
      setPickRate(42);
      setAccuracyRate(84.5);
      setOrdersCompleted(32);
      setToolStatus("Normal");
      setToolProblem("");
      setErrorCount(5);
      setErrorCategory("Egg carton & bakery crush during tote packing");
      setAppliedFlash("Loaded Fragile & Cold Chain Accuracy Hazard Scenario");
    } else if (preset === "high_performer") {
      setPickRate(72);
      setAccuracyRate(99.5);
      setOrdersCompleted(68);
      setToolStatus("Normal");
      setToolProblem("");
      setErrorCount(0);
      setErrorCategory("Flawless execution");
      setAppliedFlash("Loaded High-Velocity Top Performer Surge Scenario");
    } else {
      setPickRate(54);
      setAccuracyRate(98.2);
      setOrdersCompleted(52);
      setToolStatus("Normal");
      setToolProblem("");
      setErrorCount(1);
      setErrorCategory("Minor shelf aisle hesitation");
      setAppliedFlash("Loaded Standard Day-Over-Day Ramp Scenario");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#12141a] border border-cyan-500/30 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100">
        
        {/* Top Header */}
        <div className="px-5 py-4 bg-[#181b24] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md">
              <Cpu className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight text-white">
                  Dark Store Simulator Lab
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-400/15 text-cyan-300 border border-cyan-400/30">
                  App-in-App Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Directly simulate & stream live telemetry for all 5 personas across Days 0–10
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Applied Notification Banner */}
        {appliedFlash && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/30 px-4 py-2 flex items-center gap-2 text-emerald-300 text-xs font-bold animate-in slide-in-from-top-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{appliedFlash}</span>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1 text-xs">
          
          {/* Section 1: Persona Picker (All 5 Employees) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                1. Select Persona / Dark Store Picker
              </label>
              <span className="text-[11px] font-mono text-cyan-400 font-bold">
                Active: {simEmpCode}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {CANONICAL_CHECKIN_EMPLOYEES.map((emp) => {
                const hire = newHires.find((h) => h.id === emp.id);
                const isSelected = selectedHireId === emp.id;
                const empCode = mapToSimulatorEmployeeId(emp.id);

                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => setSelectedHireId(emp.id)}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                      isSelected
                        ? "bg-cyan-500/20 border-cyan-400 shadow-md ring-2 ring-cyan-400/30 text-white"
                        : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-[11px] tracking-tight truncate">
                        {emp.name.split(" ")[0]}
                      </span>
                      <span className="text-[9px] font-mono font-bold text-cyan-300 px-1 py-0.5 rounded bg-cyan-950/60">
                        {empCode}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {hire?.status || "On Track"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Day Timeline Selector (Day 0 to Day 10) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                2. Select Journey Timeline Day
              </label>
              <span className="text-[11px] font-bold text-slate-300">
                Editing: <span className="text-cyan-400 font-black">Day {selectedDay}</span>
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((dayNum) => {
                const isSelected = selectedDay === dayNum;
                const hasExisting = currentHire?.daysHistory?.some((d) => d.dayNumber === dayNum);

                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => setSelectedDay(dayNum)}
                    className={`px-3 py-2 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 ring-2 ring-cyan-400"
                        : hasExisting
                        ? "bg-white/10 text-cyan-300 border border-cyan-500/30 hover:bg-white/15"
                        : "bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    Day {dayNum}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Scenario Buttons */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              ⚡ Quick Scenario Injections:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => applyPreset("amit_day0")}
                className="px-2.5 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/25 font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <span>⭐ Amit Day 0 (58 UPH / 96.6%)</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset("normal_ramp")}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 font-medium transition-all cursor-pointer"
              >
                <span>📈 Normal Progression</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset("scanner_failure")}
                className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25 font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <span>⚠️ Scanner Crash (24 UPH)</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset("fragile_breakage")}
                className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 font-medium transition-all cursor-pointer"
              >
                <span>🥚 Fragile Item Breakage</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset("high_performer")}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 font-medium transition-all cursor-pointer"
              >
                <span>🚀 Surge (72 UPH / 99.5%)</span>
              </button>
            </div>
          </div>

          {/* Section 3: Telemetry Sliders & Controls */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-cyan-400" />
                Telemetry Parameters (Day {selectedDay})
              </span>
              <span className="text-[10px] text-slate-400">
                Auto-calculates Closed Loop
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Pick Rate */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium">Pick Rate (UPH)</span>
                  <span className="font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                    {pickRate} / {targetPickRate} target
                  </span>
                </div>
                <input
                  type="range"
                  min={15}
                  max={90}
                  step={1}
                  value={pickRate}
                  onChange={(e) => setPickRate(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Accuracy Rate */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium">Accuracy Rate (%)</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded border ${
                    accuracyRate >= 98
                      ? "text-emerald-400 bg-emerald-950/80 border-emerald-500/30"
                      : accuracyRate >= 94
                      ? "text-amber-400 bg-amber-950/80 border-amber-500/30"
                      : "text-rose-400 bg-rose-950/80 border-rose-500/30"
                  }`}>
                    {accuracyRate}%
                  </span>
                </div>
                <input
                  type="range"
                  min={70}
                  max={100}
                  step={0.1}
                  value={accuracyRate}
                  onChange={(e) => setAccuracyRate(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Orders Completed */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium">Orders Completed</span>
                  <span className="font-mono font-bold text-slate-200">
                    {ordersCompleted} orders
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={85}
                  step={1}
                  value={ordersCompleted}
                  onChange={(e) => setOrdersCompleted(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Error Count */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium">Error Log Items</span>
                  <span className="font-mono font-bold text-rose-300">
                    {errorCount} errors
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={8}
                  step={1}
                  value={errorCount}
                  onChange={(e) => setErrorCount(Number(e.target.value))}
                  className="w-full accent-rose-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Hardware Tool Condition */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Box className="w-3.5 h-3.5 text-slate-400" />
                  Hardware / Zebra Terminal Status:
                </span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setToolStatus("Normal")}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      toolStatus === "Normal"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-white/5 text-slate-400"
                    }`}
                  >
                    ✓ Normal
                  </button>
                  <button
                    type="button"
                    onClick={() => setToolStatus("Failed")}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      toolStatus === "Failed"
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                        : "bg-white/5 text-slate-400"
                    }`}
                  >
                    ⚠️ Failed
                  </button>
                </div>
              </div>

              {toolStatus === "Failed" && (
                <input
                  type="text"
                  value={toolProblem}
                  onChange={(e) => setToolProblem(e.target.value)}
                  placeholder="Describe hardware issue (e.g., Scanner beam uncalibrated)..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-rose-500/40 text-rose-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-400"
                />
              )}
            </div>
          </div>

          {/* Section 4: Batch Actions */}
          <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="space-y-0.5 text-left">
              <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Cohort Batch Auto-Populator
              </div>
              <div className="text-[11px] text-slate-400">
                Populate all 10 days of Dark Store history across all 5 employees in 1 click
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  onPopulateTenDays(selectedHireId, "normal");
                  setAppliedFlash(`✓ Populated 10 Days of telemetry for ${currentHire.name}`);
                }}
                className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 font-bold transition-all cursor-pointer"
              >
                10 Days for {currentHire.name.split(" ")[0]}
              </button>

              <button
                type="button"
                onClick={() => {
                  onPopulateEntireCohort();
                  setAppliedFlash("✓ Populated 10 Days of realistic telemetry for all 5 employees!");
                }}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Populate All 5 Cohort</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="p-4 bg-[#181b24] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onResetCohort}
            className="text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Baseline
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleApplyCurrentDay(false)}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all cursor-pointer active:scale-98"
            >
              Apply to Day {selectedDay}
            </button>

            <button
              type="button"
              onClick={() => handleApplyCurrentDay(true)}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 text-slate-950 font-black shadow-lg shadow-cyan-500/30 hover:opacity-95 transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-2"
            >
              <span>Apply & View Dashboard</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
