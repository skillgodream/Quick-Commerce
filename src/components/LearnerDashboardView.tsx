import React from "react";
import { NewHire, DARK_STORE_CAPABILITIES, CapabilityState } from "../types";
import { CheckCircle2, AlertCircle, Circle, BookOpen, Target, ArrowRight, ShieldAlert, Navigation } from "lucide-react";

interface LearnerDashboardViewProps {
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

export const LearnerDashboardView: React.FC<LearnerDashboardViewProps> = ({ newHire, currentDay }) => {
  const latestRecord = newHire.daysHistory?.[newHire.daysHistory.length - 1];
  const nextAction = latestRecord?.recommendedAction;
  
  // Check if we have sufficient evidence. 
  // If no work signals or low days, we might be building evidence.
  const hasWorkEvidence = newHire.daysHistory.some(d => d.workSignal && (d.workSignal.itemsPicked > 0 || d.workSignal.metrics));
  const isBuildingEvidence = !hasWorkEvidence || newHire.daysHistory.length < 2;

  const getCapState = (capId: number) => {
    return newHire.capabilities?.[capId];
  };

  const renderCapStateIcon = (state?: CapabilityState) => {
    if (!state || state.evidence === "none") return <Circle className="w-4 h-4 text-slate-300" />;
    if (state.performance === "below_target") return <AlertCircle className="w-4 h-4 text-amber-500" />;
    if (state.mastery === "mastered" || state.mastery === "proficient" || state.evidence === "demonstrated") return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    return <Circle className="w-4 h-4 text-slate-300" />;
  };

  const renderCapStateLabel = (state?: CapabilityState) => {
    if (!state || state.evidence === "none") return "Not yet assessed";
    if (state.performance === "below_target") return "Needs practice";
    if (state.mastery === "mastered" || state.mastery === "proficient" || state.evidence === "demonstrated") return "Demonstrated";
    return "Not yet assessed";
  };

  return (
    <div className="max-w-md mx-auto p-4 pb-36 select-none bg-slate-50 min-h-screen text-slate-900 space-y-6">
      
      {/* 1. MY STATUS */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">My Status</h2>
        {isBuildingEvidence ? (
          <div>
            <h3 className="text-xl font-bold text-slate-800">Still building evidence</h3>
            <p className="text-sm text-slate-500 mt-1">We need more real-work evidence from your shifts before updating your readiness.</p>
          </div>
        ) : (
          <div>
            <h3 className="text-xl font-bold text-slate-800">
              {newHire.status === "Doing well" ? "On Track" : newHire.status === "Needs attention" ? "Needs Attention" : "At Risk"}
            </h3>
            <p className="text-sm text-slate-600 mt-1">{latestRecord?.statusReason || "Your recent work is being reviewed."}</p>
          </div>
        )}
      </section>

      {/* 2. YOUR NEXT STEP */}
      {nextAction && (
        <section className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-5 shadow-sm border border-indigo-100">
          <h2 className="text-xs font-black uppercase tracking-wider text-indigo-400 mb-2">Your Next Step</h2>
          <div className="flex items-start gap-3">
            <div className="bg-indigo-500 text-white p-2 rounded-xl mt-1">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-indigo-900">{nextAction.title}</h3>
              <p className="text-sm text-indigo-700 mt-1">{nextAction.description}</p>
            </div>
          </div>
        </section>
      )}

      {/* 4. WHAT CHANGED */}
      {!isBuildingEvidence && latestRecord?.identifiedPattern && (
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">What Changed</h2>
          {(latestRecord.identifiedPattern.category === "Environment" || latestRecord.identifiedPattern.category === "Tool") ? (
            <div>
              <div className="flex items-center gap-2 mb-1 text-blue-600">
                <ShieldAlert className="w-4 h-4" />
                <h3 className="text-base font-bold">This wasn't a skill problem</h3>
              </div>
              <p className="text-sm text-slate-600 mt-1">The issue was related to the work environment/tool. More evidence will be checked after it is resolved.</p>
            </div>
          ) : (
            <div>
              <h3 className="text-base font-bold text-slate-800">{latestRecord.identifiedPattern.patternName || "Observation"}</h3>
              <p className="text-sm text-slate-600 mt-1">{latestRecord.identifiedPattern.diagnosis || ""}</p>
            </div>
          )}
        </section>
      )}

      {/* 3. WHAT YOU'RE BUILDING */}
      <section className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">What You're Building</h2>
        {LEARNING_METRICS.map(metric => (
          <div key={metric.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800">{metric.title}</h3>
            <p className="text-xs text-slate-500 mb-4">{metric.description}</p>
            <div className="space-y-3">
              {metric.capIds.map(capId => {
                const cap = DARK_STORE_CAPABILITIES.find(c => c.id === capId);
                const state = getCapState(capId);
                if (!cap) return null;
                return (
                  <div key={capId} className="flex items-start justify-between gap-3 p-2 rounded-lg bg-slate-50">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-700 leading-tight">{cap.name}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 bg-white px-2 py-1 rounded-md border border-slate-200">
                      {renderCapStateIcon(state)}
                      <span className="text-[10px] font-bold text-slate-600 uppercase">{renderCapStateLabel(state)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      {/* 6. INDEPENDENT WORK */}
      <section className="bg-slate-800 rounded-2xl p-5 text-white shadow-md">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Independent Work</h2>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold">Autonomous Picking</h3>
          <span className="text-2xl font-black text-emerald-400">{newHire.overallReadinessScore ?? 0}%</span>
        </div>
        <p className="text-sm text-slate-300">
          This outcome is unlocked when you have demonstrated enough safe, accurate, and fast capabilities on the floor.
        </p>
        {newHire.overallReadinessScore !== undefined && newHire.overallReadinessScore >= 80 && (
          <div className="mt-3 bg-emerald-500/20 text-emerald-300 p-2 rounded-lg text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>You are approaching independent work readiness!</span>
          </div>
        )}
      </section>

      {/* 5. YOUR JOURNEY */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">Your Journey</h2>
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-200">
          {newHire.daysHistory.map((record, index) => (
            <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-white bg-indigo-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <span className="text-[10px] font-bold">{record.dayNumber}</span>
              </div>
              <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-2.5rem)] p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-700">Day {record.dayNumber}</span>
                </div>
                <p className="text-sm text-slate-600">{record.statusReason || "Shift completed."}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
