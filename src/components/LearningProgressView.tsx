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
  ListCheck
} from "lucide-react";

interface LearningProgressViewProps {
  newHire: NewHire;
  currentDay: number;
}

export const LearningProgressView: React.FC<LearningProgressViewProps> = ({ newHire, currentDay }) => {
  const completedModuleSet = new Set(newHire.completedModuleIds || []);

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

  return (
    <div className="max-w-md mx-auto p-4 pb-32 space-y-5 bg-[#f8fafc] min-h-screen">
      {/* Page Title & Subtext */}
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Learning Progress</h1>
        <p className="text-xs font-semibold text-slate-500">
          Curriculum breakdown across 10 mandatory training days and activities.
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
                {totalModulesCompleted} <span className="text-xs font-semibold text-purple-300/70">/ 10</span>
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

      {/* Expand / Collapse All Controls */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
          10-Day Curriculum
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
