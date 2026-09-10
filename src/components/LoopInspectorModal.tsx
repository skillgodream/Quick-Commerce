import React from "react";
import { NewHire } from "../types";
import { Logo } from "./Logo";
import {
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Zap,
  Activity,
  User,
  ShieldCheck,
  FileCheck2,
  Sliders,
  X,
  Eye,
  Brain,
  Link,
  Target,
} from "lucide-react";

interface LoopInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  newHire: NewHire;
  currentDay: number;
}

export const LoopInspectorModal: React.FC<LoopInspectorModalProps> = ({
  isOpen,
  onClose,
  newHire,
  currentDay,
}) => {
  if (!isOpen) return null;

  const dayRecord =
    newHire.daysHistory.find((d) => d.dayNumber === currentDay) ||
    newHire.daysHistory[newHire.daysHistory.length - 1];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#1b1e26] rounded-3xl border border-white/10 max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-white">
        {/* Modal Header */}
        <div className="bg-[#13151b] text-white p-4 sm:p-5 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Logo size="sm" textColor="text-white" />
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Six Functions of One Intelligence
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Observe → Understand → Connect → Decide → Act → Check • {newHire.name} (Day {currentDay})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Sub-banner explaining the One Intelligence concept */}
        <div className="bg-cyan-500/10 border-b border-cyan-500/20 px-5 py-2.5 text-xs text-cyan-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-bold">One Continuous Intelligence Process:</span>
            <span className="text-cyan-200/90 font-medium">Not six separate agents, but six interconnected stages of single decision-making authority.</span>
          </div>
        </div>

        {/* Modal Content - 6 Steps with Simple Client Language */}
        <div className="p-4 sm:p-6 space-y-3.5 max-h-[75vh] overflow-y-auto">
          {/* Step 1: OBSERVE - What is happening? */}
          <div className="p-4 bg-[#13151b] rounded-3xl border border-white/5 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-2">
                <div className="w-6 h-6 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center justify-center text-xs font-black">
                  1
                </div>
                <span>STAGE 1: OBSERVE • What is happening?</span>
              </span>
              <span className="text-[11px] text-slate-500 font-bold">LMS + Floor Evidence</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="bg-[#1b1e26] p-3 rounded-2xl border border-white/5 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  1. Worker Shift Voice / Note
                </span>
                <p className="text-slate-200 font-medium italic">
                  "{dayRecord?.dailySignal?.rawText || "Confused where products are located in Aisles 4-8."}"
                </p>
              </div>

              <div className="bg-[#1b1e26] p-3 rounded-2xl border border-white/5 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  2. Supervisor Fast Observation
                </span>
                <div className="text-slate-200 font-medium">
                  State: <strong className="text-amber-400">{dayRecord?.managerSignal?.state || "Needs support"}</strong>
                </div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Category: {dayRecord?.managerSignal?.issueCategory || "Speed / Navigation"}
                </div>
                {dayRecord?.managerSignal?.notes && (
                  <p className="text-[10px] text-slate-400 italic mt-1 truncate">
                    "{dayRecord.managerSignal.notes}"
                  </p>
                )}
              </div>

              <div className="bg-[#1b1e26] p-3 rounded-2xl border border-white/5 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  3. Live Floor Pick Telemetry
                </span>
                <div className="text-slate-200 font-medium">
                  Actual Pace: <strong className="text-cyan-400">{dayRecord?.workSignal?.actualPickRate || 35} /hr</strong> (Target: {dayRecord?.workSignal?.targetPickRate || 50})
                </div>
                <div className="text-emerald-400 font-bold text-[11px] mt-0.5">
                  Scanning Accuracy: {dayRecord?.workSignal?.accuracyRate || 98}%
                </div>
                <div className="text-slate-450 text-[10px] mt-0.5">
                  Help Requests: {dayRecord?.workSignal?.helpRequestsCount ?? 0}
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: UNDERSTAND - Why is it happening? */}
          <div className="p-4 bg-[#13151b] rounded-3xl border border-white/5 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                <div className="w-6 h-6 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center text-xs font-black">
                  2
                </div>
                <span>STAGE 2: UNDERSTAND • Why is it happening?</span>
              </span>
              <span className="text-[11px] text-indigo-400 font-bold">Root Cause Synthesis</span>
            </div>

            <div className="bg-[#1b1e26] p-3.5 rounded-2xl border border-white/5 shadow-2xs grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-500 block">Extracted Friction</span>
                <span className="font-bold text-white text-xs">
                  {dayRecord?.dailySignal?.issue || "Rack navigation"}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 block">Confidence</span>
                <span className="font-bold text-white text-xs">
                  {dayRecord?.dailySignal?.confidence || "High"}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 block">Impact on Wave</span>
                <span className="font-bold text-amber-300 text-xs">
                  {dayRecord?.dailySignal?.possibleImpact || "Slow picking pace"}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 block">Signal Category</span>
                <span className="font-bold text-white text-xs">
                  {dayRecord?.dailySignal?.category || "Environment"}
                </span>
              </div>
            </div>
          </div>

          {/* Step 3: CONNECT - What skill/person/problem is connected? */}
          <div className="p-4 bg-[#13151b] rounded-3xl border border-white/5 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-2">
                <div className="w-6 h-6 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center text-xs font-black">
                  3
                </div>
                <span>STAGE 3: CONNECT • What skill, person, or problem is connected?</span>
              </span>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-purple-500/25 text-purple-300 border border-purple-500/30">
                {dayRecord?.identifiedPattern?.patternName || "Layout Familiarity"}
              </span>
            </div>

            <div className="bg-[#1b1e26] p-3.5 rounded-2xl border border-white/5 shadow-2xs text-xs space-y-1">
              <p className="text-slate-300 font-medium leading-relaxed">
                <strong className="text-purple-350">Diagnostic Connection: </strong>
                {dayRecord?.identifiedPattern?.diagnosis ||
                  "New hire reports spatial confusion in Aisles 4-8. Accuracy remains high (98%), confirming strong diligence. System links friction to Capability 3 (Rack & bin navigation) rather than a motivation or theoretical training problem."}
              </p>
              <div className="pt-1 flex items-center gap-3 text-[11px] text-slate-400 font-semibold">
                <span>Target Capability: #{dayRecord?.recommendedAction?.targetCapabilityId || 3}</span>
                <span>•</span>
                <span>Assigned Peer: {dayRecord?.recommendedAction?.targetActor || newHire.buddy}</span>
              </div>
            </div>
          </div>

          {/* Step 4: DECIDE - What should happen next? */}
          <div className="p-4 bg-[#13151b] rounded-3xl border border-white/5 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <div className="w-6 h-6 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center text-xs font-black">
                  4
                </div>
                <span>STAGE 4: DECIDE • What should happen next?</span>
              </span>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-500/25 text-amber-300 border border-amber-500/30 uppercase">
                {dayRecord?.recommendedAction?.decisionType ? dayRecord.recommendedAction.decisionType.replace(/_/g, " ") : "REINFORCE CURRENT"}
              </span>
            </div>

            <div className="bg-[#1b1e26] p-3.5 rounded-2xl border border-white/5 shadow-2xs text-xs space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-400">Adaptive Path Decision:</span>
                <span className="font-black text-amber-400">
                  Target Capability #{dayRecord?.recommendedAction?.targetCapabilityId || 3}
                </span>
              </div>
              <p className="text-slate-300 font-medium leading-relaxed">
                <strong className="text-amber-300">Adaptive Rationale: </strong>
                {dayRecord?.recommendedAction?.rationale ||
                  "Worker completed theoretical LMS modules, but real-world floor navigation shows friction. Intelligence chooses the smallest useful intervention rather than generic retraining."}
              </p>
            </div>
          </div>

          {/* Step 5: ACT - Who does what? */}
          <div className="p-4 bg-[#13151b] rounded-3xl border border-white/5 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-450 flex items-center gap-2">
                <div className="w-6 h-6 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center text-xs font-black">
                  5
                </div>
                <span>STAGE 5: ACT • Who does what? (Smallest Practical Action)</span>
              </span>
              <span className="text-[11px] text-slate-450 font-bold">
                Targeted Action
              </span>
            </div>

            <div className="bg-[#1b1e26] p-3.5 rounded-2xl border border-emerald-500/20 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-xs sm:text-sm">
                  {dayRecord?.recommendedAction?.title ||
                    "Buddy walkthrough of location navigation in Aisles 4-8"}
                </h4>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/10">
                  {dayRecord?.recommendedAction?.urgency || "Next Shift"}
                </span>
              </div>
              <p className="text-slate-300">
                {dayRecord?.recommendedAction?.description ||
                  "Pair with Senior Picker for a 15-minute floor walkthrough focusing on Aisles 4-8 rack codes."}
              </p>
              <div className="pt-2 flex items-center justify-between text-emerald-400 font-bold border-t border-white/5">
                <span>
                  Actor: {dayRecord?.recommendedAction?.targetActor || newHire.buddy}
                </span>
                <span className="text-emerald-400">
                  Step: {dayRecord?.recommendedAction?.smallestPracticalStep || "15-min walkthrough"}
                </span>
              </div>
            </div>
          </div>

          {/* Step 6: CHECK - Did it work? */}
          <div className="p-4 bg-[#13151b] rounded-3xl border border-white/5 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-teal-400 flex items-center gap-2">
                <div className="w-6 h-6 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center text-xs font-black">
                  6
                </div>
                <span>STAGE 6: CHECK • Did it work? (Feedback Loop Closed)</span>
              </span>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/10">
                {dayRecord?.actionOutcome?.improved ? dayRecord.actionOutcome.improved.toUpperCase() : "AWAITING OUTCOME"}
              </span>
            </div>

            <div className="bg-[#1b1e26] p-3.5 rounded-2xl border border-white/5 shadow-2xs text-xs space-y-1.5">
              <p className="text-slate-300 font-medium">
                <strong>Outcome check: </strong>
                {dayRecord?.actionOutcome?.notes ||
                  `Intervention scheduled. Once supervisor or buddy records check outcome, ${newHire.name.split(" ")[0]}'s capability ledger, support level, and ramp status are updated automatically.`}
              </p>
              <div className="text-slate-400 flex items-center gap-3 font-bold text-[11px] pt-1 border-t border-white/5">
                <span>Updated Status: <strong className="text-white">{dayRecord?.statusAtEnd || newHire.status}</strong></span>
                {dayRecord?.actionOutcome?.subsequentPickRate && (
                  <span className="text-emerald-400 font-black">
                    Subsequent Pick Pace: {dayRecord.actionOutcome.subsequentPickRate} items/hr
                  </span>
                )}
                {dayRecord?.actionOutcome?.improved === "yes" && (
                  <span className="text-emerald-400 font-bold">
                    ✓ Support Reduced (Autonomous Picking Resumed)
                  </span>
                )}
                {dayRecord?.actionOutcome?.improved === "no" && (
                  <span className="text-rose-400 font-bold">
                    ⚠ Failed Intervention Escalated (Treatment Memory)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#13151b] p-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl text-xs font-black text-slate-950 bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95 active:scale-95 transition-all cursor-pointer shadow-md border border-white/10"
          >
            Close Loop Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
