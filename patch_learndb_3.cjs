const fs = require('fs');
let content = fs.readFileSync('src/components/LearnerDashboardView.tsx', 'utf8');

const targetStr = `      {/* 4. WHAT CHANGED */}
      {!isBuildingEvidence && latestRecord?.identifiedPattern && (
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">What Changed</h2>
          <h3 className="text-base font-bold text-slate-800">{latestRecord.identifiedPattern.title}</h3>
          <p className="text-sm text-slate-600 mt-1">{latestRecord.identifiedPattern.description}</p>
        </section>
      )}`;

const replacement = `      {/* 4. WHAT CHANGED */}
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
      )}`;

content = content.replace(targetStr, replacement);
fs.writeFileSync('src/components/LearnerDashboardView.tsx', content);
