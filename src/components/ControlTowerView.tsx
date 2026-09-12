import React, { useState } from "react";
import { NewHire, DARK_STORE_CAPABILITIES } from "../types";
import { MANDATORY_TRAINING_MODULES } from "../data/modulesData";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  HelpCircle,
  Layers
} from "lucide-react";

interface ControlTowerViewProps {
  newHire: NewHire;
  currentDay: number;
}

export const ControlTowerView: React.FC<ControlTowerViewProps> = ({ newHire, currentDay }) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const yesterdayNumber = Math.max(1, currentDay - 1);
  const yesterdayRecord =
    newHire.daysHistory.find((d) => d.dayNumber === yesterdayNumber) ||
    newHire.daysHistory.filter((d) => d.dayNumber < currentDay).pop();

  const prevPattern = yesterdayRecord?.identifiedPattern;
  const prevAction = yesterdayRecord?.recommendedAction;

  const categories = [
    "Foundations & Safety",
    "Core Fulfillment & Accuracy",
    "Exceptions & Pacing",
    "Dispatch & Autonomous Ops"
  ];

  const groupedCapabilities = categories.map((cat) => ({
    name: cat,
    skills: DARK_STORE_CAPABILITIES.filter((c) => c.category === cat),
  }));

  const isSkillRed = (skillId: number) => {
    const state = newHire.capabilities?.[skillId];
    if (state && (state.performance === "below_target" || state.performance === "needs_attention")) return true;
    if (skillId === newHire.currentCapabilityId && prevPattern && prevAction) return true;
    return false;
  };

  const getCategoryStatus = (skills: typeof DARK_STORE_CAPABILITIES) => {
    let needsAttentionCount = 0;
    let allInsufficient = true;
    for (const skill of skills) {
      const state = newHire.capabilities?.[skill.id];
      if (state && state.evidence !== "none") {
        allInsufficient = false;
      }
      if (isSkillRed(skill.id)) {
        needsAttentionCount++;
      }
    }
    if (needsAttentionCount > 0) return { status: "needs_attention", count: needsAttentionCount };
    if (allInsufficient) return { status: "insufficient", count: 0 };
    return { status: "green", count: 0 };
  };

  const getSkillEvidence = (skillId: number) => {
    const state = newHire.capabilities?.[skillId];
    if (skillId === newHire.currentCapabilityId && prevPattern) {
       return (prevPattern.connectedSignalSummary || []).join(" ");
    }
    if (state && state.notes) {
      return state.notes;
    }
    return "—";
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-6 text-slate-900 bg-[#f8fafc] min-h-screen pb-32">
      <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Capabilities</h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
            {newHire.name} &bull; Day {currentDay}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {groupedCapabilities.map((group) => {
          const { status, count } = getCategoryStatus(group.skills);
          const isExpanded = expandedCategory === group.name;

          return (
            <div key={group.name} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
              {/* Category Header */}
              <button
                className="w-full p-4 flex items-center justify-between text-left cursor-pointer active:bg-slate-50 transition-colors"
                onClick={() => setExpandedCategory(isExpanded ? null : group.name)}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl flex items-center justify-center ${
                    status === "green" ? "bg-emerald-100 text-emerald-700" :
                    status === "needs_attention" ? "bg-rose-100 text-rose-700" :
                    "bg-slate-100 text-slate-500"
                  }`}>
                    {status === "green" && <CheckCircle2 className="w-5 h-5" />}
                    {status === "needs_attention" && <ShieldAlert className="w-5 h-5" />}
                    {status === "insufficient" && <HelpCircle className="w-5 h-5" />}
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 leading-tight">{group.name}</h2>
                    <p className={`text-[11px] font-bold uppercase tracking-wider mt-0.5 ${
                      status === "green" ? "text-emerald-600" :
                      status === "needs_attention" ? "text-rose-600" :
                      "text-slate-500"
                    }`}>
                      {status === "green" ? "On Track" :
                       status === "needs_attention" ? `${count} skill${count > 1 ? 's' : ''} need attention` :
                       "Insufficient Evidence"}
                    </p>
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </button>

              {/* Category Content (Skills) */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-4">
                  {group.skills.map((skill) => {
                    const isRed = isSkillRed(skill.id);
                    const modules = MANDATORY_TRAINING_MODULES.filter((m) => m.mappedCapabilityIds.includes(skill.id));
                    const evidenceText = getSkillEvidence(skill.id);
                    
                    const isInterventionTarget = skill.id === newHire.currentCapabilityId && prevPattern && prevAction;

                    return (
                      <div key={skill.id} className={`bg-white rounded-xl border p-4 shadow-sm ${
                        isRed ? "border-rose-200" : "border-slate-200"
                      }`}>
                        {/* Skill Header */}
                        <div className="flex items-center gap-2 mb-3">
                          <h3 className="text-sm font-black text-slate-900">{skill.name}</h3>
                          {isRed && <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
                        </div>

                        {/* Skill Info */}
                        <div className="space-y-3">
                          {/* Module */}
                          <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Module</div>
                            <div className="text-xs font-semibold text-slate-700">
                              {modules.length > 0 ? modules.map(m => m.title).join(", ") : "—"}
                            </div>
                          </div>

                          {/* Evidence */}
                          <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Evidence</div>
                            <div className="text-xs font-medium text-slate-700 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                              {evidenceText}
                            </div>
                          </div>

                          {/* Intelligence Detail (Only for RED skills) */}
                          {isRed && (
                            <div className="pt-3 mt-3 border-t border-slate-100 space-y-4">
                              {isInterventionTarget ? (
                                <>
                                  <div>
                                    <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1">Solution</div>
                                    <div className="text-xs font-black text-indigo-950 bg-indigo-50 p-2 rounded-lg">
                                      {prevAction.title}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1">Why</div>
                                    <div className="text-xs font-medium text-indigo-900 bg-indigo-50/50 p-2 rounded-lg">
                                      {prevAction.description}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1">Check</div>
                                    <div className="text-xs font-bold text-indigo-900 bg-indigo-50 p-2 rounded-lg">
                                      {prevAction.smallestPracticalStep}
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <div>
                                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Solution</div>
                                  <div className="text-xs font-bold text-slate-600 bg-slate-100 p-2 rounded-lg">
                                    No active intervention yet. Wait for more evidence.
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
