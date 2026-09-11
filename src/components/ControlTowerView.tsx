import React from "react";
import { NewHire, CapabilityState } from "../types";
import { DARK_STORE_CAPABILITIES } from "../types";
import { MANDATORY_TRAINING_MODULES } from "../data/modulesData";
import { Network, Activity, BrainCircuit, ArrowRight } from "lucide-react";

interface ControlTowerViewProps {
  newHire: NewHire;
  currentDay: number;
}

export const ControlTowerView: React.FC<ControlTowerViewProps> = ({ newHire, currentDay }) => {
  const yesterdayNumber = Math.max(1, currentDay - 1);
  const yesterdayRecord = newHire.daysHistory.find(d => d.dayNumber === yesterdayNumber) ||
    newHire.daysHistory.filter(d => d.dayNumber < currentDay).pop();

  const prevPattern = yesterdayRecord?.identifiedPattern;
  const prevAction = yesterdayRecord?.recommendedAction;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8 space-y-10 text-slate-800 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col gap-1 border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Control Tower</h1>
        <p className="text-base font-medium text-slate-500">Learner Intelligence Model & Visualization &bull; {newHire.name} (Day {currentDay})</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* LEFT COLUMN: DIAGNOSIS & PRESCRIPTION */}
        <div className="lg:col-span-4 space-y-10">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 mb-2">
              <BrainCircuit className="w-5 h-5 stroke-[2]" />
              <h2 className="text-sm font-black uppercase tracking-widest">Diagnosis</h2>
            </div>
            {prevPattern ? (
              <div className="space-y-5">
                <div>
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">What is happening?</h3>
                  <div className="text-base font-bold text-slate-900">
                    {prevPattern.patternName}
                  </div>
                </div>
                <div>
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Why is it happening?</h3>
                  <div className="text-sm text-slate-700 leading-relaxed space-y-2">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-xs font-black">
                      {prevPattern.category}
                    </span>
                    <p className="font-medium">{prevPattern.diagnosis}</p>
                    {prevPattern.connectedSignalSummary && prevPattern.connectedSignalSummary.length > 0 && (
                      <ul className="mt-2 space-y-1 list-disc list-inside text-xs text-slate-500">
                        {prevPattern.connectedSignalSummary.map((sig, i) => <li key={i}>{sig}</li>)}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">No diagnosis generated.</p>
            )}
          </div>

          <div className="w-full h-px bg-slate-200"></div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-600 mb-2">
              <Activity className="w-5 h-5 stroke-[2]" />
              <h2 className="text-sm font-black uppercase tracking-widest">Prescription</h2>
            </div>
            {prevAction ? (
              <div className="space-y-5">
                <div>
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Solution</h3>
                  <div className="text-base font-bold text-slate-900">
                    {prevAction.title}
                    <div className="mt-1 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Target: {prevAction.targetActor}
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Why this solution?</h3>
                  <div className="text-sm text-slate-700 leading-relaxed font-medium">
                    {prevAction.description}
                  </div>
                </div>
                <div>
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Practical Step</h3>
                  <div className="text-sm text-emerald-700 font-medium">
                    {prevAction.smallestPracticalStep}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">No prescription generated.</p>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: CAPABILITY MAP */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center gap-2 text-slate-800 mb-6">
            <Network className="w-5 h-5 stroke-[2]" />
            <h2 className="text-sm font-black uppercase tracking-widest">Intelligence Map</h2>
          </div>
          
          <div className="space-y-12">
            {Object.entries(
              DARK_STORE_CAPABILITIES.reduce((acc, cap) => {
                if (!acc[cap.category]) acc[cap.category] = [];
                acc[cap.category].push(cap);
                return acc;
              }, {} as Record<string, typeof DARK_STORE_CAPABILITIES>)
            ).map(([category, skills]) => (
              <div key={category} className="space-y-6">
                <div className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-2">
                  Capability: {category}
                </div>
                
                <div className="space-y-8">
                  {skills.map(skill => {
                    const modules = MANDATORY_TRAINING_MODULES.filter(m => m.mappedCapabilityIds.includes(skill.id));
                    const capState = newHire.capabilities?.[skill.id];
                    
                    return (
                      <div key={skill.id} className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        
                        {/* SKILL */}
                        <div className="md:col-span-4">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Skill</div>
                          <div className="text-sm font-bold text-slate-900 leading-tight">{skill.name}</div>
                          <div className="text-xs text-slate-500 mt-1">{skill.description}</div>
                        </div>

                        {/* ARROW */}
                        <div className="hidden md:flex md:col-span-1 items-center justify-center text-slate-300">
                          <ArrowRight className="w-4 h-4" />
                        </div>

                        {/* MODULE */}
                        <div className="md:col-span-3">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Relevant Module(s)</div>
                          {modules.length > 0 ? (
                            <div className="space-y-1">
                              {modules.map(mod => (
                                <div key={mod.id} className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-1 rounded">
                                  {mod.title}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-slate-400 italic">No module assigned</div>
                          )}
                        </div>

                        {/* ARROW */}
                        <div className="hidden md:flex md:col-span-1 items-center justify-center text-slate-300">
                          <ArrowRight className="w-4 h-4" />
                        </div>

                        {/* EVIDENCE */}
                        <div className="md:col-span-3">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Actual Evidence</div>
                          {capState ? (
                            <div className="space-y-1">
                              <div className="flex flex-wrap gap-1 mb-2">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                                  capState.evidence === "demonstrated" ? "bg-emerald-100 text-emerald-700" :
                                  capState.evidence === "inconsistent" ? "bg-amber-100 text-amber-700" :
                                  capState.evidence === "emerging" ? "bg-blue-100 text-blue-700" :
                                  "bg-slate-200 text-slate-600"
                                }`}>
                                  {capState.evidence.replace("_", " ")}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                                  capState.performance === "on_target" || capState.performance === "exceeding" ? "bg-emerald-100 text-emerald-700" :
                                  capState.performance === "below_target" ? "bg-rose-100 text-rose-700" :
                                  "bg-slate-200 text-slate-600"
                                }`}>
                                  {capState.performance.replace("_", " ")}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 italic">"{capState.notes || "Assessed without additional notes."}"</p>
                              <div className="text-[9px] text-slate-400 uppercase tracking-wider mt-1">Assessed: {capState.lastAssessedAt}</div>
                            </div>
                          ) : (
                            <div className="text-xs text-slate-400 italic">No evidence recorded</div>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
