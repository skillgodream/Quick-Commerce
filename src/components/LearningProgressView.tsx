import React, { useState } from "react";
import { NewHire, DARK_STORE_CAPABILITIES, CapabilityState, DayRecord } from "../types";
import { MANDATORY_TRAINING_MODULES } from "../data/modulesData";
import { ChevronDown, ChevronUp, CheckCircle2, AlertCircle, ShieldAlert, Target, Info, Activity, BookOpen, Clock } from "lucide-react";

interface LearningProgressViewProps {
  newHire: NewHire;
  currentDay: number;
}

const LEARNING_METRICS = [
  {
    id: "basics",
    title: "Basics & Safety",
    description: "Navigating the store, tools, and protocols.",
    capIds: [1, 2, 3, 4, 5]
  },
  {
    id: "accuracy",
    title: "Accuracy & Product Handling",
    description: "Quality checking, careful packing, and variants.",
    capIds: [6, 7, 8, 10]
  },
  {
    id: "exceptions",
    title: "Floor Exceptions",
    description: "Solving problems independently.",
    capIds: [11, 12, 13, 18]
  },
  {
    id: "flow",
    title: "Flow & Completion",
    description: "Hitting target speeds and managing SLAs.",
    capIds: [9, 14, 15, 16, 17, 19]
  }
];

export const LearningProgressView: React.FC<LearningProgressViewProps> = ({ newHire, currentDay }) => {
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);

  const getCapState = (capId: number) => {
    return newHire.capabilities?.[capId];
  };

  const getMetricStatus = (capIds: number[]) => {
    let needsAttention = 0;
    let demonstrated = 0;
    let noEvidence = 0;
    
    capIds.forEach(id => {
      const state = getCapState(id);
      if (!state || state.evidence === "none") {
        noEvidence++;
      } else if (state.performance === "below_target") {
        needsAttention++;
      } else if (state.mastery === "mastered" || state.mastery === "proficient" || state.evidence === "demonstrated") {
        demonstrated++;
      }
    });

    if (needsAttention > 0) return { label: "Needs attention", type: "attention" };
    if (noEvidence === capIds.length) return { label: "Not yet assessed", type: "neutral" };
    if (demonstrated === capIds.length) return { label: "Strong", type: "good" };
    return { label: "Building", type: "building" };
  };

  const getCapabilityLabel = (state?: CapabilityState) => {
    if (!state || state.evidence === "none") return { label: "Not enough evidence", color: "text-slate-500 bg-slate-100" };
    if (state.performance === "below_target") return { label: "Needs attention", color: "text-rose-700 bg-rose-100" };
    if (state.mastery === "mastered" || state.mastery === "proficient" || state.evidence === "demonstrated") return { label: "Demonstrated", color: "text-emerald-700 bg-emerald-100" };
    return { label: "Building", color: "text-blue-700 bg-blue-100" };
  };

  const getEvidenceStory = (capId: number) => {
    const sortedHistory = [...(newHire.daysHistory || [])].sort((a,b) => b.dayNumber - a.dayNumber);
    for (const record of sortedHistory) {
      if (record.recommendedAction?.targetCapabilityId === capId) {
        return {
          observed: record.identifiedPattern?.connectedSignalSummary?.join(" ") || "Floor signals observed.",
          understood: record.identifiedPattern?.diagnosis || "Requires capability attention.",
          action: record.recommendedAction?.title,
          checked: record.actionOutcome?.improved ? `Intervention Outcome: ${record.actionOutcome.improved} - ${record.actionOutcome.notes}` : null
        };
      }
    }
    return null;
  };

  const latestRecord = [...(newHire.daysHistory || [])].sort((a,b) => b.dayNumber - a.dayNumber)[0];
  const activeAction = latestRecord?.recommendedAction;
  const activePattern = latestRecord?.identifiedPattern;

  return (
    <div className="max-w-md mx-auto p-4 pb-32 space-y-6 bg-[#f8fafc] min-h-screen">
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
          My Status
        </h2>
        <div className="text-xl font-bold text-slate-900">{newHire.statusLabel}</div>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Learning Progress</h1>
        <p className="text-sm font-medium text-slate-600 leading-snug">
          See what you're building, what needs attention, and what Dean has observed.
        </p>
      </div>

      <div className="space-y-4">
        {LEARNING_METRICS.map(metric => {
          const isExpanded = expandedMetric === metric.id;
          const status = getMetricStatus(metric.capIds);
          
          let activeActionForMetric = null;
          if (activeAction && activeAction.targetCapabilityId && metric.capIds.includes(activeAction.targetCapabilityId)) {
            activeActionForMetric = activeAction;
          }

          return (
            <div key={metric.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all">
              <div 
                className="p-4 flex items-center justify-between cursor-pointer select-none active:bg-slate-50 transition-colors"
                onClick={() => setExpandedMetric(isExpanded ? null : metric.id)}
              >
                <div>
                  <h2 className="text-base font-black text-slate-900 leading-tight mb-1">{metric.title}</h2>
                  <p className="text-xs font-medium text-slate-500 mb-2">{metric.description}</p>
                  <span className={`inline-block px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg ${
                    status.type === "attention" ? "bg-rose-100 text-rose-800" :
                    status.type === "good" ? "bg-emerald-100 text-emerald-800" :
                    status.type === "building" ? "bg-blue-100 text-blue-800" :
                    "bg-slate-100 text-slate-600"
                  }`}>
                    {status.label}
                  </span>
                </div>
                {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </div>

              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-6">
                  
                  {/* ATTENTION SECTION (If active intervention exists for this metric) */}
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" /> Dean's Attention
                    </h3>
                    {activeActionForMetric ? (
                      <div className="space-y-3">
                        <div>
                          <div className="text-[10px] font-bold text-indigo-400 uppercase">Action</div>
                          <div className="text-sm font-black text-indigo-950">{activeActionForMetric.title}</div>
                          <div className="text-xs font-semibold text-indigo-700 mt-0.5">Target: {activeActionForMetric.targetActor}</div>
                        </div>
                        {activePattern && (
                          <div>
                            <div className="text-[10px] font-bold text-indigo-400 uppercase">Why (Root Cause)</div>
                            <div className="text-xs font-medium text-indigo-900 leading-snug">{activePattern.diagnosis}</div>
                          </div>
                        )}
                        <div>
                          <div className="text-[10px] font-bold text-indigo-400 uppercase">Interim Status</div>
                          <div className="text-xs font-semibold text-indigo-900 bg-indigo-100/50 inline-block px-2 py-0.5 rounded mt-0.5">
                            {latestRecord?.statusAtEnd} - {latestRecord?.statusReason}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs font-medium text-indigo-800">
                        No active intervention yet. More evidence will help Dean understand what you need next.
                      </p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Capabilities</h3>
                    {metric.capIds.map(capId => {
                      const def = DARK_STORE_CAPABILITIES.find(c => c.id === capId);
                      if (!def) return null;
                      const state = getCapState(capId);
                      const stateLabel = getCapabilityLabel(state);
                      const story = getEvidenceStory(capId);
                      
                      const mappedModules = MANDATORY_TRAINING_MODULES.filter(m => m.mappedCapabilityIds.includes(capId));

                      return (
                        <div key={capId} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="text-sm font-bold text-slate-900">{def.name}</h4>
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${stateLabel.color}`}>
                              {stateLabel.label}
                            </span>
                          </div>

                          {/* Training Support */}
                          <div className="mb-4">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                              <BookOpen className="w-3 h-3" /> Training Support
                            </div>
                            {mappedModules.length > 0 ? (
                              <div className="text-xs font-semibold text-slate-700">
                                {mappedModules.map(m => m.title).join(", ")}
                              </div>
                            ) : (
                              <div className="text-xs font-semibold text-slate-500 italic">Learned on the floor</div>
                            )}
                          </div>

                          {/* Evidence Story */}
                          <div className="pt-3 border-t border-slate-100">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Evidence Story
                            </div>
                            {story ? (
                              <div className="space-y-3">
                                <div>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase block">What happened</span>
                                  <span className="text-xs text-slate-700 bg-slate-50 p-1.5 rounded block">{story.observed}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase block">What Dean understood</span>
                                  <span className="text-xs text-slate-700 bg-slate-50 p-1.5 rounded block">{story.understood}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Action</span>
                                  <span className="text-xs text-slate-700 font-semibold">{story.action}</span>
                                </div>
                                {story.checked && (
                                  <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Checked</span>
                                    <span className="text-xs text-slate-700">{story.checked}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-xs text-slate-500">Not enough evidence yet</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Solo Work Section */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base font-black text-emerald-950">Independent Work</h2>
        </div>
        <p className="text-xs font-medium text-emerald-800 leading-snug mb-3">
          As you build capabilities in the four areas above, you are progressing toward working fully independently.
        </p>
        <div className="bg-white/60 p-3 rounded-xl border border-emerald-100">
          <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">Current Readiness State</div>
          <div className="text-sm font-black text-emerald-900">
            {newHire.overallReadinessScore !== undefined ? `${(typeof newHire.overallReadinessScore === "number" ? (newHire.overallReadinessScore <= 1 ? Math.round(newHire.overallReadinessScore * 100) : Math.round(newHire.overallReadinessScore)) : 0)}% Evaluated Readiness` : "In Progress"}
          </div>
          <div className="text-xs font-semibold text-emerald-700 mt-1">{newHire.status}</div>
        </div>
      </div>

      {/* Training History */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h2 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-slate-400" /> Training History
        </h2>
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-semibold text-slate-600">Modules Completed</div>
          <div className="text-sm font-black text-slate-900">{newHire.completedModuleIds?.length ?? 0} / 10</div>
        </div>
        {newHire.quizAverageScore !== undefined && (
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-600">Quiz Average</div>
            <div className="text-sm font-black text-slate-900">{newHire.quizAverageScore}%</div>
          </div>
        )}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <p className="text-[10px] font-semibold text-slate-400 leading-tight">
            Training completed does not automatically mean capability demonstrated. Dean looks at real floor evidence.
          </p>
        </div>
      </div>
    </div>
  );
};
