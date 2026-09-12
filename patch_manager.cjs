const fs = require('fs');

let content = fs.readFileSync('src/components/ManagerView.tsx', 'utf8');

// The new section to insert
const newSection = `
      {/* ========================================================= */}
      {/* 5. DEAN INTELLIGENCE HANDOFF (Longitudinal & Treatment)   */}
      {/* ========================================================= */}
      <div className="bg-[#1b1e26] rounded-3xl p-4 sm:p-5 border border-white/10 shadow-xs space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white leading-tight">
              Dean's Intelligence
            </h3>
            <p className="text-[10px] text-slate-400">Cross-shift evidence & interventions</p>
          </div>
        </div>

        {(() => {
          // Parse diagnosis and longitudinal pattern
          let baseDiagnosis = currentRecord.identifiedPattern?.diagnosis || "Not enough evidence yet. Dean is waiting for more real-work evidence before drawing a conclusion.";
          let longPatternCategory = "";
          let longPatternEvidence = "";
          
          const parts = baseDiagnosis.split(" | Longitudinal Pattern (");
          if (parts.length > 1) {
            baseDiagnosis = parts[0];
            const longPatternRaw = parts[1];
            const endBracketIdx = longPatternRaw.indexOf("): ");
            if (endBracketIdx > -1) {
              longPatternCategory = longPatternRaw.substring(0, endBracketIdx);
              longPatternEvidence = longPatternRaw.substring(endBracketIdx + 3);
            }
          }

          // Is this an environmental blocker?
          const isEnvironmental = currentRecord.identifiedPattern?.category === "Environment";

          // Find treatment history
          const treatmentHistory = activeHire.daysHistory
            .filter(d => d.actionOutcome && d.recommendedAction)
            .map(d => ({
              day: d.dayNumber,
              problem: d.identifiedPattern?.patternName || "Observed Friction",
              intervention: d.recommendedAction?.title || "Intervention",
              outcome: d.actionOutcome?.improved,
              notes: d.actionOutcome?.notes,
              treatmentContext: d.actionOutcome?.treatmentContext
            }));

          return (
            <div className="space-y-4">
              {/* CURRENT UNDERSTANDING */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Understanding</span>
                {isEnvironmental ? (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                    <span className="text-xs font-bold text-rose-400 mb-1 block">Operational Blocker</span>
                    <p className="text-xs text-rose-200">{baseDiagnosis}</p>
                  </div>
                ) : (
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                    <p className="text-xs text-slate-300">{baseDiagnosis}</p>
                  </div>
                )}
              </div>

              {/* LONGITUDINAL PATTERN */}
              {longPatternCategory && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Active Pattern: {longPatternCategory}</span>
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                    <p className="text-xs text-indigo-200">
                      <strong>Dean noticed:</strong> {longPatternEvidence}
                    </p>
                  </div>
                </div>
              )}

              {/* ACTIVE ATTENTION / ACTION */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Action</span>
                {currentRecord.recommendedAction ? (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1">
                    <p className="text-xs font-bold text-emerald-400">{currentRecord.recommendedAction.title}</p>
                    <p className="text-[11px] text-emerald-200">{currentRecord.recommendedAction.description}</p>
                    <p className="text-[10px] text-emerald-400/80 pt-1">Assigned to: {currentRecord.recommendedAction.targetActor}</p>
                  </div>
                ) : (
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                    <p className="text-xs text-slate-400 italic">No active intervention yet. Wait for more evidence.</p>
                  </div>
                )}
              </div>

              {/* TREATMENT HISTORY */}
              {treatmentHistory.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Treatment History</span>
                  <div className="space-y-2">
                    {treatmentHistory.map((th, i) => (
                      <div key={i} className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-bold text-slate-400">Day {th.day}</span>
                          <span className={\`text-[10px] font-bold px-1.5 py-0.5 rounded-full \${
                            th.outcome === 'yes' ? 'bg-emerald-500/20 text-emerald-400' :
                            th.outcome === 'partial' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-rose-500/20 text-rose-400'
                          }\`}>
                            {th.outcome === 'yes' ? 'Improved' : th.outcome === 'partial' ? 'Partial' : 'No Change'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                          <span>{th.intervention}</span>
                        </div>
                        {th.treatmentContext?.remainingIssue && (
                          <div className="text-[11px] text-amber-300/90 pl-4 border-l border-amber-500/30">
                            <strong>Remaining Issue:</strong> {th.treatmentContext.remainingIssue}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>
`;

content = content.replace(
  "{/* ========================================================= */}\n      {/* 5. SUPERVISOR 5-SECOND OBSERVATION CARD                   */}",
  newSection + "\n      {/* ========================================================= */}\n      {/* 6. SUPERVISOR 5-SECOND OBSERVATION CARD                   */}"
);

fs.writeFileSync('src/components/ManagerView.tsx', content);
