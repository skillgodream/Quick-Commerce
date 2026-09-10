import React from "react";
import { OrganizationSummary, NewHire } from "../types";
import {
  Users,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Zap,
  Activity,
  ChevronRight,
  Store,
  Layers,
  Sparkles,
  Target,
  Clock,
  ShieldCheck,
} from "lucide-react";

interface OrganizationViewProps {
  summary: OrganizationSummary;
  newHires: NewHire[];
  onSelectHireForManager: (hireId: string) => void;
  onOpenLoopModal: () => void;
}

export const OrganizationView: React.FC<OrganizationViewProps> = ({
  summary,
  newHires,
  onSelectHireForManager,
  onOpenLoopModal,
}) => {
  const doingWellCount = newHires.filter((h) => h.status === "Doing well").length;
  const needsAttentionCount = newHires.filter((h) => h.status === "Needs attention").length;
  const atRiskCount = newHires.filter((h) => h.status === "At risk").length;

  return (
    <div className="max-w-md mx-auto px-4 py-3 space-y-4 pb-8 select-none text-white bg-[#14161d]">
      {/* ========================================================= */}
      {/* 1. TOP GREETING HEADER                                    */}
      {/* ========================================================= */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-1.5">
            <span>Store Operations</span>
            <span className="text-lg">🏬</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            {summary.storeName} • 14-Day Ramp Cohort
          </p>
        </div>

        {/* 5-Stage Loop Flow Action Pill */}
        <button
          onClick={onOpenLoopModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1b1e26] border border-white/10 hover:border-cyan-500/40 text-white text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
        >
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>Loop Flow</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* 2. HERO STATUS CARD                                       */}
      {/* ========================================================= */}
      <div className="bg-gradient-to-br from-indigo-950/40 via-indigo-900/40 to-slate-950/60 border border-indigo-500/20 text-white rounded-3xl p-4 sm:p-5 shadow-lg relative overflow-hidden transition-all">
        <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
        <div className="absolute -left-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-lg pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-white/10 border border-white/10 text-white backdrop-blur-xs">
              Cohort Ramp Velocity
            </span>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              92% Retention Target
            </span>
          </div>

          <div>
            <h2 className="text-lg sm:text-xl font-black leading-snug tracking-tight text-white">
              Dark Store #104 Ramp Health
            </h2>
            <p className="text-xs sm:text-sm font-normal text-slate-350 leading-relaxed mt-1">
              Early signal synthesis has reduced ramp-drop by catching aisle navigation bottlenecks on Day 3 before shift burnout.
            </p>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Store Avg Accuracy: <strong className="text-emerald-400">98.4%</strong></span>
            <span className="text-[11px] font-medium text-slate-400">
              Active Pickers: {newHires.length}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. 2x2 CHUNKY SQUIRCLE METRIC GRID                        */}
      {/* ========================================================= */}
      <div>
        <div className="flex items-center justify-between mb-2 px-0.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Cohort Breakdown
          </span>
          <span className="text-[11px] text-slate-500">Live floor census</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {/* Tile 1: Total New Hires (Blue) */}
          <div className="flex flex-col items-start justify-between p-3.5 sm:p-4 rounded-3xl bg-[#1b1e26] border border-white/10 shadow-xs">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shadow-xs mb-3">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-2xl font-black text-white block leading-none">
                {newHires.length}
              </span>
              <span className="text-[11px] text-slate-400 font-bold mt-1 block">
                Total Floor Pickers
              </span>
            </div>
          </div>

          {/* Tile 2: Doing Well (Emerald) */}
          <div className="flex flex-col items-start justify-between p-3.5 sm:p-4 rounded-3xl bg-[#1b1e26] border border-white/10 shadow-xs">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shadow-xs mb-3">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-2xl font-black text-emerald-450 block leading-none">
                {doingWellCount}
              </span>
              <span className="text-[11px] text-emerald-400 font-bold mt-1 block">
                On Expected Ramp
              </span>
            </div>
          </div>

          {/* Tile 3: Needs Attention (Amber) */}
          <div className="flex flex-col items-start justify-between p-3.5 sm:p-4 rounded-3xl bg-[#1b1e26] border border-white/10 shadow-xs">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shadow-xs mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-2xl font-black text-amber-450 block leading-none">
                {needsAttentionCount}
              </span>
              <span className="text-[11px] text-amber-400 font-bold mt-1 block">
                Floor Support Assigned
              </span>
            </div>
          </div>

          {/* Tile 4: At Risk (Rose) */}
          <div className="flex flex-col items-start justify-between p-3.5 sm:p-4 rounded-3xl bg-[#1b1e26] border border-white/10 shadow-xs">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-450 border border-rose-500/20 flex items-center justify-center shadow-xs mb-3">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-2xl font-black text-rose-450 block leading-none">
                {atRiskCount}
              </span>
              <span className="text-[11px] text-rose-400 font-bold mt-1 block">
                Urgent Attention
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. PICKERS NEEDING ATTENTION                              */}
      {/* ========================================================= */}
      <div>
        <div className="flex items-center justify-between mb-2 px-0.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Pickers Needing Attention Today
          </span>
          <span className="text-[11px] text-slate-500">Sorted by urgency</span>
        </div>

        <div className="space-y-2.5">
          {newHires
            .filter((h) => h.status !== "Doing well")
            .map((hire) => (
              <div
                key={hire.id}
                onClick={() => onSelectHireForManager(hire.id)}
                className="p-4 rounded-3xl bg-[#1b1e26] border border-white/10 hover:border-cyan-500/40 shadow-xs hover:shadow-md transition-all cursor-pointer group active:scale-98 text-white"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <img
                      src={hire.avatar}
                      alt={hire.name}
                      className="w-10 h-10 rounded-2xl object-cover border-2 border-slate-700 shrink-0 group-hover:border-cyan-500 transition-colors"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                        {hire.name}
                      </h4>
                      <span className="text-[11px] text-slate-400 font-medium">
                        Day {hire.currentDay} of 14 • Buddy: {hire.buddy.split(" ")[0]}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black shrink-0 ${
                      hire.status === "Needs attention"
                        ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                        : "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                    }`}
                  >
                    {hire.status}
                  </span>
                </div>

                <p className="mt-2 text-xs text-slate-350 leading-relaxed">
                  <strong className="text-white">Diagnosis: </strong>
                  {hire.statusReason}
                </p>

                {hire.recommendedActionSnippet && (
                  <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                    <span className="text-cyan-400 font-bold line-clamp-1">
                      👉 {hire.recommendedActionSnippet}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 group-hover:text-cyan-400 flex items-center gap-0.5 shrink-0">
                      Triage <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 5. 5-STAGE CENTRAL LOOP STRIP                             */}
      {/* ========================================================= */}
      <div
        onClick={onOpenLoopModal}
        className="bg-[#1b1e26] rounded-3xl p-4 sm:p-5 border border-white/10 shadow-xs cursor-pointer hover:border-indigo-500/40 transition-all active:scale-98"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white leading-tight">
                Continuous Coordination Loop
              </h3>
              <p className="text-[10px] text-slate-400">Observe → Understand → Connect → Act → Check</p>
            </div>
          </div>
          <span className="text-xs font-bold text-indigo-400 flex items-center gap-0.5">
            View Flow <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div className="grid grid-cols-5 gap-1.5 text-center">
          {[
            { step: "1", title: "Observe", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
            { step: "2", title: "Understand", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
            { step: "3", title: "Connect", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
            { step: "4", title: "Act", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
            { step: "5", title: "Check", color: "bg-teal-500/10 text-teal-400 border-teal-500/20" },
          ].map((s) => (
            <div key={s.step} className={`p-2 rounded-2xl border ${s.color}`}>
              <span className="text-[9px] font-black block">{s.step}</span>
              <span className="text-[10px] font-bold block truncate">{s.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 6. COMMON DARK STORE FRICTION POINTS                      */}
      {/* ========================================================= */}
      <div>
        <div className="flex items-center justify-between mb-2 px-0.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Aggregated Store Friction
          </span>
          <span className="text-[11px] text-slate-500">Store #104 bottlenecks</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {summary.commonProblems.map((prob, i) => (
            <div
              key={i}
              className="p-3.5 rounded-3xl bg-[#1b1e26] border border-white/10 shadow-xs space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs truncate max-w-[170px]">
                  {prob.problem}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-bold">
                  {prob.count} pickers
                </span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                {prob.impact}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
