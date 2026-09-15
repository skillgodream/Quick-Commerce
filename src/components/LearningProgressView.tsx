import React, { useState } from "react";
import { NewHire } from "../types";
import { MANDATORY_TRAINING_MODULES } from "../data/modulesData";
import { 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  Video, 
  HelpCircle, 
  Cpu, 
  Target, 
  Award, 
  Check,
  ListCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  Flag,
  AlertTriangle
} from "lucide-react";

interface DayTrajectoryPoint {
  day: number;
  score: number;
  status: "Doing well" | "Needs attention" | "At risk" | "projected";
  trend: "up" | "down" | "stable";
  isCurrentDay: boolean;
  isPitStop: boolean;
  pitStopLabel?: string;
  isReadinessGate: boolean;
  isProjected: boolean;
  detailNote: string;
  workMetricText?: string;
}

function computeTrajectoryData(newHire: NewHire, currentDay: number): DayTrajectoryPoint[] {
  const history = newHire.daysHistory || [];
  const canonicalReadiness = typeof newHire.overallReadinessScore === "number"
    ? (newHire.overallReadinessScore <= 1 ? Math.round(newHire.overallReadinessScore * 100) : Math.round(newHire.overallReadinessScore))
    : 45;

  const points: DayTrajectoryPoint[] = [];
  const baseCurve = [20, 30, 40, 50, 60, 70, 78, 85, 92, 98];

  for (let d = 1; d <= 10; d++) {
    const isCurrentDay = d === currentDay;
    const isProjected = d > currentDay;
    const isPitStop1 = d === 4;
    const isPitStop2 = d === 8;
    const isReadinessGate = d === 10;
    const rec = history.find((h) => h.dayNumber === d);

    let score = baseCurve[d - 1];
    let status: "Doing well" | "Needs attention" | "At risk" | "projected" = "Doing well";
    let detailNote = "";
    let workMetricText = "";

    if (!isProjected) {
      if (rec) {
        status = rec.statusAtEnd || (newHire.status as any) || "Doing well";

        if (rec.workSignal) {
          const pickRate = rec.workSignal.actualPickRate || 0;
          const targetRate = rec.workSignal.targetPickRate || 45;
          const accuracy = rec.workSignal.accuracyRate || 98;
          workMetricText = `${pickRate} UPH • ${accuracy}% Acc`;

          const ratio = targetRate > 0 ? pickRate / targetRate : 1;
          if (status === "Doing well") {
            score = Math.min(98, Math.max(25, Math.round(baseCurve[d - 1] * Math.max(0.9, ratio))));
          } else if (status === "Needs attention") {
            score = Math.min(72, Math.max(22, Math.round(baseCurve[d - 1] * Math.min(0.85, ratio))));
          } else {
            score = Math.min(48, Math.max(15, Math.round(baseCurve[d - 1] * 0.65)));
          }
        } else {
          if (status === "Doing well") {
            score = Math.min(98, baseCurve[d - 1] + 5);
          } else if (status === "Needs attention") {
            score = Math.max(22, Math.min(70, baseCurve[d - 1] - 12));
          } else {
            score = Math.max(15, Math.min(45, baseCurve[d - 1] - 22));
          }
        }

        detailNote = rec.statusReason || rec.dailySignal?.summary || rec.recommendedAction?.title || "Onboarding shift completed";
      } else {
        status = isCurrentDay ? (newHire.status as any) : "Doing well";
        detailNote = isCurrentDay ? (newHire.statusReason || "Active onboarding shift") : "Shift completed";
      }

      if (isCurrentDay && canonicalReadiness > 0) {
        score = canonicalReadiness;
      }
    } else {
      status = "projected";
      const currentScore = points[currentDay - 1] ? points[currentDay - 1].score : canonicalReadiness;
      const daysRemaining = 10 - currentDay;
      const progressFraction = (d - currentDay) / (daysRemaining > 0 ? daysRemaining : 1);
      score = Math.round(currentScore + (98 - currentScore) * progressFraction);
      detailNote = d === 10 ? "Target: Final Commercial Readiness Gate" : `Projected Day ${d} floor capability target`;
    }

    let trend: "up" | "down" | "stable" = "stable";
    if (d > 1) {
      const prevScore = points[d - 2].score;
      const diff = score - prevScore;
      if (diff >= 3) trend = "up";
      else if (diff <= -3) trend = "down";
      else trend = "stable";
    }

    let pitStopLabel: string | undefined = undefined;
    if (isPitStop1) pitStopLabel = "Pit Stop #1";
    if (isPitStop2) pitStopLabel = "Pit Stop #2";

    points.push({
      day: d,
      score,
      status,
      trend,
      isCurrentDay,
      isPitStop: isPitStop1 || isPitStop2,
      pitStopLabel,
      isReadinessGate,
      isProjected,
      detailNote,
      workMetricText,
    });
  }

  return points;
}

interface LearningProgressViewProps {
  newHire: NewHire;
  currentDay: number;
}

export const LearningProgressView: React.FC<LearningProgressViewProps> = ({ newHire, currentDay }) => {
  const [selectedDay, setSelectedDay] = useState<number>(currentDay);
  const completedModuleSet = new Set(newHire.completedModuleIds || []);

  const trajectoryPoints = computeTrajectoryData(newHire, currentDay);
  const selectedPoint = trajectoryPoints.find((p) => p.day === selectedDay) || trajectoryPoints[Math.min(currentDay - 1, 9)];

  // Calculate day-by-day modules and activities status
  const daysData = MANDATORY_TRAINING_MODULES.map((mod) => {
    const isModuleCompleted = completedModuleSet.has(mod.id) || mod.dayNumber < currentDay;
    const activities = mod.activities.map((act) => {
      const isActCompleted = isModuleCompleted || Boolean(act.completed);
      return {
        ...act,
        isCompleted: isActCompleted,
      };
    });
    const completedActsCount = activities.filter((a) => a.isCompleted).length;
    const finalModuleCompleted = completedModuleSet.has(mod.id) || completedActsCount === mod.activities.length;

    return {
      ...mod,
      isCompleted: finalModuleCompleted,
      activities,
      completedActsCount,
    };
  });

  const totalModulesCompleted = daysData.filter((m) => m.isCompleted).length;
  const totalTasksCount = daysData.reduce((acc, m) => acc + m.activities.length, 0); // 50
  const totalTasksCompleted = daysData.reduce((acc, m) => acc + m.completedActsCount, 0);
  const overallProgressPct = Math.round((totalTasksCompleted / totalTasksCount) * 100);

  // State to track expanded day cards (default expand active day & first 3 days)
  const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    daysData.forEach((d) => {
      if (d.dayNumber === currentDay || d.dayNumber <= 3) {
        initial[d.dayNumber] = true;
      }
    });
    return initial;
  });

  const toggleDay = (dayNum: number) => {
    setExpandedDays((prev) => ({
      ...prev,
      [dayNum]: !prev[dayNum],
    }));
  };

  const toggleAll = (expand: boolean) => {
    const nextState: Record<number, boolean> = {};
    daysData.forEach((d) => {
      nextState[d.dayNumber] = expand;
    });
    setExpandedDays(nextState);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="w-3.5 h-3.5 text-blue-500" />;
      case "quiz":
        return <HelpCircle className="w-3.5 h-3.5 text-amber-500" />;
      case "simulation":
        return <Cpu className="w-3.5 h-3.5 text-purple-500" />;
      case "practice":
        return <Target className="w-3.5 h-3.5 text-emerald-500" />;
      case "assessment":
        return <Award className="w-3.5 h-3.5 text-rose-500" />;
      default:
        return <BookOpen className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  // SVG dimensions for compact trajectory graph
  const svgWidth = 360;
  const svgHeight = 145;
  const paddingLeft = 10;
  const paddingRight = 10;
  const paddingTop = 22;
  const paddingBottom = 26;
  const graphWidth = svgWidth - paddingLeft - paddingRight; // 340
  const graphHeight = svgHeight - paddingTop - paddingBottom; // 97

  const getX = (dayNum: number) => paddingLeft + ((dayNum - 1) / 9) * graphWidth;
  const getY = (scoreVal: number) => paddingTop + (1 - Math.min(100, Math.max(0, scoreVal)) / 100) * graphHeight;

  // Build SVG paths
  const loggedPoints = trajectoryPoints.filter((p) => !p.isProjected);
  const projectedPoints = trajectoryPoints.filter((p) => p.isProjected || p.day === currentDay);

  const loggedPathD = loggedPoints
    .map((p, idx) => `${idx === 0 ? "M" : "L"} ${getX(p.day)} ${getY(p.score)}`)
    .join(" ");

  const lastLoggedPoint = loggedPoints[loggedPoints.length - 1];
  const firstLoggedPoint = loggedPoints[0];

  const loggedAreaD = loggedPoints.length > 0
    ? `${loggedPathD} L ${getX(lastLoggedPoint.day)} ${paddingTop + graphHeight} L ${getX(firstLoggedPoint.day)} ${paddingTop + graphHeight} Z`
    : "";

  const projectedPathD = projectedPoints
    .map((p, idx) => `${idx === 0 ? "M" : "L"} ${getX(p.day)} ${getY(p.score)}`)
    .join(" ");

  return (
    <div className="max-w-md mx-auto p-4 pb-32 space-y-5 bg-[#f8fafc] min-h-screen">
      {/* Page Title & Subtext */}
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Learning Progress</h1>
        <p className="text-xs font-semibold text-slate-500">
          Curriculum breakdown across 10-day onboarding journey and 19 LMS modules.
        </p>
      </div>

      {/* Purple Summary Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 p-5 text-white shadow-xl border border-purple-800/40">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-[10px] font-black uppercase tracking-wider text-purple-200">
              <Sparkles className="w-3 h-3 text-purple-300" /> Overall Completion
            </span>
            <span className="text-xs font-black text-purple-300 font-mono">Day {currentDay} of 10</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Box 1: Modules Completed */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
              <div className="text-[10px] font-bold uppercase tracking-wider text-purple-200/80 mb-1 flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-purple-300" /> Modules Done
              </div>
              <div className="text-2xl font-black text-white tracking-tight">
                {totalModulesCompleted} <span className="text-xs font-semibold text-purple-300/70">/ 19</span>
              </div>
            </div>

            {/* Box 2: Tasks Completed */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
              <div className="text-[10px] font-bold uppercase tracking-wider text-purple-200/80 mb-1 flex items-center gap-1">
                <ListCheck className="w-3 h-3 text-purple-300" /> Tasks Completed
              </div>
              <div className="text-2xl font-black text-white tracking-tight">
                {totalTasksCompleted} <span className="text-xs font-semibold text-purple-300/70">/ {totalTasksCount}</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center text-[11px] font-bold text-purple-200">
              <span>Course Progress</span>
              <span className="font-mono text-purple-300">{overallProgressPct}%</span>
            </div>
            <div className="h-2.5 w-full bg-purple-950/80 rounded-full overflow-hidden p-0.5 border border-purple-700/40">
              <div 
                className="h-full bg-gradient-to-r from-purple-400 to-indigo-300 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${Math.max(5, overallProgressPct)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* SURGICAL UI ENHANCEMENT — MY PROGRESS TRAJECTORY GRAPH */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-sm space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200/60 flex items-center justify-center text-purple-700">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 leading-tight">Commercial Readiness Trajectory</h2>
              <p className="text-[11px] font-medium text-slate-500">Day 1 → Day 10 Onboarding Trajectory</p>
            </div>
          </div>

          {/* Health Status Pill */}
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
            newHire.status === "Doing well"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : newHire.status === "Needs attention"
              ? "bg-amber-50 text-amber-700 border border-amber-200"
              : "bg-rose-50 text-rose-700 border border-rose-200"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              newHire.status === "Doing well" ? "bg-emerald-500" : newHire.status === "Needs attention" ? "bg-amber-500" : "bg-rose-500"
            }`} />
            {newHire.status === "Doing well" ? "On Track" : newHire.status === "Needs attention" ? "Needs Attention" : "At Risk"}
          </span>
        </div>

        {/* Compact SVG Line Graph - Maximized Width */}
        <div className="relative pt-1 pb-0 select-none -mx-1.5">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible">
            <defs>
              <linearGradient id="loggedAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* 3 Health Zones (Light Understated Background Bands) */}
            {/* Green Zone (Healthy ≥ 75%) */}
            <rect
              x={paddingLeft}
              y={paddingTop}
              width={graphWidth}
              height={getY(75) - paddingTop}
              fill="rgba(236, 253, 245, 0.6)"
              rx="4"
            />
            {/* Amber Zone (Needs Attention 50-74%) */}
            <rect
              x={paddingLeft}
              y={getY(75)}
              width={graphWidth}
              height={getY(50) - getY(75)}
              fill="rgba(254, 243, 199, 0.5)"
            />
            {/* Red Zone (At Risk < 50%) */}
            <rect
              x={paddingLeft}
              y={getY(50)}
              width={graphWidth}
              height={paddingTop + graphHeight - getY(50)}
              fill="rgba(254, 226, 226, 0.5)"
              rx="4"
            />

            {/* Zone Divider Lines & Minimal Labels */}
            <line x1={paddingLeft} y1={getY(75)} x2={paddingLeft + graphWidth} y2={getY(75)} stroke="#10b981" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.4" />
            <line x1={paddingLeft} y1={getY(50)} x2={paddingLeft + graphWidth} y2={getY(50)} stroke="#f59e0b" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.4" />

            <text x={paddingLeft + 4} y={paddingTop + 10} fontSize="7" fontWeight="bold" fill="#059669" opacity="0.65">Healthy Zone (≥75%)</text>
            <text x={paddingLeft + 4} y={getY(75) + 9} fontSize="7" fontWeight="bold" fill="#d97706" opacity="0.65">Needs Attention (50-74%)</text>
            <text x={paddingLeft + 4} y={getY(50) + 9} fontSize="7" fontWeight="bold" fill="#e11d48" opacity="0.65">At Risk Zone (&lt;50%)</text>

            {/* Checkpoint Destination & Pit Stop Marker Lines */}
            {/* Day 4: Pit Stop #1 */}
            <line x1={getX(4)} y1={paddingTop} x2={getX(4)} y2={paddingTop + graphHeight} stroke="#94a3b8" strokeWidth="1" strokeDasharray="2,2" />
            <text x={getX(4)} y={paddingTop - 6} textAnchor="middle" fontSize="7" fontWeight="bold" fill="#64748b">Pit Stop #1</text>

            {/* Day 8: Pit Stop #2 */}
            <line x1={getX(8)} y1={paddingTop} x2={getX(8)} y2={paddingTop + graphHeight} stroke="#94a3b8" strokeWidth="1" strokeDasharray="2,2" />
            <text x={getX(8) - 2} y={paddingTop - 6} textAnchor="end" fontSize="7" fontWeight="bold" fill="#64748b">Pit Stop #2</text>

            {/* Day 10: Destination Readiness Marker */}
            <line x1={getX(10)} y1={paddingTop} x2={getX(10)} y2={paddingTop + graphHeight} stroke="#6366f1" strokeWidth="1.5" />
            <text x={getX(10)} y={paddingTop - 6} textAnchor="end" fontSize="7" fontWeight="900" fill="#4f46e5">Readiness Gate ★</text>

            {/* Logged Trajectory Gradient Fill */}
            {loggedAreaD && <path d={loggedAreaD} fill="url(#loggedAreaGrad)" />}

            {/* Logged Line Path */}
            {loggedPathD && (
              <path
                d={loggedPathD}
                fill="none"
                stroke="#6366f1"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Projected Line Path */}
            {projectedPathD && (
              <path
                d={projectedPathD}
                fill="none"
                stroke="#a5b4fc"
                strokeWidth="1.75"
                strokeDasharray="3,3"
                strokeLinecap="round"
              />
            )}

            {/* Interactive Data Points */}
            {trajectoryPoints.map((pt) => {
              const cx = getX(pt.day);
              const cy = getY(pt.score);
              const isSelected = pt.day === selectedDay;

              return (
                <g key={pt.day} className="cursor-pointer" onClick={() => setSelectedDay(pt.day)}>
                  {/* Invisible Tap Target for Mobile */}
                  <circle cx={cx} cy={cy} r="12" fill="transparent" />

                  {/* Selected Highlight Ring */}
                  {isSelected && (
                    <circle cx={cx} cy={cy} r="8" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="2,2" className="animate-spin-slow" />
                  )}

                  {/* Point Shape/Rendering */}
                  {pt.isCurrentDay ? (
                    <g>
                      <circle cx={cx} cy={cy} r="5.5" fill="#ffffff" stroke="#4f46e5" strokeWidth="2.5" />
                      <circle cx={cx} cy={cy} r="2.5" fill="#4f46e5" />
                    </g>
                  ) : pt.isReadinessGate ? (
                    <circle cx={cx} cy={cy} r="4.5" fill="#4f46e5" stroke="#ffffff" strokeWidth="1.5" />
                  ) : pt.isPitStop ? (
                    <circle cx={cx} cy={cy} r="4" fill="#ffffff" stroke="#64748b" strokeWidth="2" />
                  ) : pt.isProjected ? (
                    <circle cx={cx} cy={cy} r="2.5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
                  ) : (
                    <circle cx={cx} cy={cy} r="3" fill="#6366f1" />
                  )}
                </g>
              );
            })}

            {/* X-Axis Day Labels */}
            {trajectoryPoints.map((pt) => {
              const cx = getX(pt.day);
              const isSelected = pt.day === selectedDay;

              return (
                <text
                  key={`lbl-${pt.day}`}
                  x={cx}
                  y={paddingTop + graphHeight + 16}
                  textAnchor="middle"
                  fontSize={pt.isCurrentDay || pt.isPitStop || pt.isReadinessGate ? "8" : "7.5"}
                  fontWeight={pt.isCurrentDay || isSelected ? "900" : pt.isPitStop || pt.isReadinessGate ? "bold" : "500"}
                  fill={isSelected ? "#4f46e5" : pt.isCurrentDay ? "#1e293b" : "#64748b"}
                  className="cursor-pointer"
                  onClick={() => setSelectedDay(pt.day)}
                >
                  D{pt.day}
                </text>
              );
            })}
          </svg>
        </div>

        {/* Selected Day Contextual Tooltip / Detail Strip */}
        <div className="bg-slate-50/90 rounded-2xl p-3 border border-slate-200/80 flex items-center justify-between text-xs transition-all">
          <div className="space-y-0.5 min-w-0 pr-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-black text-slate-900 text-xs">Day {selectedPoint.day}</span>
              {selectedPoint.pitStopLabel && (
                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-black uppercase">
                  {selectedPoint.pitStopLabel}
                </span>
              )}
              {selectedPoint.isReadinessGate && (
                <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[9px] font-black uppercase">
                  Readiness Gate
                </span>
              )}
              {selectedPoint.isCurrentDay && (
                <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[9px] font-black uppercase">
                  Today
                </span>
              )}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                selectedPoint.trend === "up"
                  ? "bg-emerald-100 text-emerald-800"
                  : selectedPoint.trend === "down"
                  ? "bg-rose-100 text-rose-800"
                  : "bg-slate-200 text-slate-700"
              }`}>
                {selectedPoint.trend === "up" ? (
                  <>
                    <TrendingUp className="w-3 h-3 text-emerald-700" /> Improving
                  </>
                ) : selectedPoint.trend === "down" ? (
                  <>
                    <TrendingDown className="w-3 h-3 text-rose-700" /> Deteriorating
                  </>
                ) : (
                  <>
                    <Minus className="w-3 h-3 text-slate-600" /> Stable
                  </>
                )}
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-600 truncate">
              {selectedPoint.detailNote}
            </p>
          </div>

          <div className="text-right shrink-0 pl-2 border-l border-slate-200">
            <div className="text-sm font-black text-slate-900 font-mono tracking-tight">{selectedPoint.score}%</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              {selectedPoint.isProjected ? "Target" : "Readiness"}
            </div>
          </div>
        </div>
      </div>

      {/* Expand / Collapse All Controls */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
          10-Day Journey Roadmap
        </h2>
        <div className="flex items-center gap-2 text-xs font-bold text-purple-700">
          <button 
            onClick={() => toggleAll(true)}
            className="hover:underline cursor-pointer"
          >
            Expand All
          </button>
          <span className="text-slate-300">•</span>
          <button 
            onClick={() => toggleAll(false)}
            className="hover:underline cursor-pointer"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Days 1 to 10 Cards */}
      <div className="space-y-3">
        {daysData.map((dayItem) => {
          const isExpanded = Boolean(expandedDays[dayItem.dayNumber]);
          const isCurrentDay = dayItem.dayNumber === currentDay;

          return (
            <div
              key={dayItem.dayNumber}
              className={`bg-white rounded-2xl border transition-all duration-200 shadow-xs overflow-hidden ${
                isCurrentDay
                  ? "border-purple-300 ring-2 ring-purple-500/20"
                  : dayItem.isCompleted
                  ? "border-slate-200"
                  : "border-slate-200/80 opacity-90"
              }`}
            >
              {/* Day Header */}
              <div
                onClick={() => toggleDay(dayItem.dayNumber)}
                className="p-4 flex items-center justify-between cursor-pointer select-none hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl font-black text-xs flex flex-col items-center justify-center shrink-0 ${
                      dayItem.isCompleted
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : isCurrentDay
                        ? "bg-purple-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <span className="text-[9px] uppercase tracking-tighter opacity-80 leading-none">DAY</span>
                    <span className="text-sm font-black leading-none">{dayItem.dayNumber}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 font-mono">
                        {dayItem.code}
                      </span>
                      {isCurrentDay && (
                        <span className="text-[9px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 animate-pulse">
                          Today
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-black text-slate-900 mt-0.5 leading-snug">
                      {dayItem.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      dayItem.isCompleted
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : dayItem.completedActsCount > 0
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {dayItem.isCompleted ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completed
                      </>
                    ) : dayItem.completedActsCount > 0 ? (
                      <>
                        <Clock className="w-3 h-3 text-amber-600" /> {dayItem.completedActsCount}/{dayItem.activities.length} Done
                      </>
                    ) : (
                      <>Upcoming</>
                    )}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Day Details / Activities List */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-3">
                  <p className="text-xs font-medium text-slate-600 leading-relaxed">
                    {dayItem.description}
                  </p>

                  <div className="space-y-2 pt-1">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
                      <span>Activities & Tasks ({dayItem.activities.length})</span>
                      <span>{dayItem.durationMinutes} mins total</span>
                    </div>

                    <div className="space-y-1.5">
                      {dayItem.activities.map((act) => (
                        <div
                          key={act.id}
                          className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                            act.isCompleted
                              ? "bg-white border-emerald-100 text-slate-800"
                              : "bg-white border-slate-200/80 text-slate-500"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <div
                              className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                                act.isCompleted
                                  ? "bg-emerald-50 border border-emerald-200 text-emerald-600"
                                  : "bg-slate-100 text-slate-400"
                              }`}
                            >
                              {act.isCompleted ? (
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              ) : (
                                getActivityIcon(act.type)
                              )}
                            </div>
                            <span
                              className={`font-semibold truncate ${
                                act.isCompleted ? "text-slate-900" : "text-slate-600"
                              }`}
                            >
                              {act.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 font-mono text-[10px]">
                            {act.score !== undefined && (
                              <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-bold border border-purple-200">
                                {act.score}%
                              </span>
                            )}
                            <span className="text-slate-400 font-medium">
                              {act.durationMinutes}m
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

