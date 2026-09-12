const fs = require('fs');
let content = fs.readFileSync('src/components/NewHireView.tsx', 'utf8');

const newDashboardCode = `        {/* 4-Grid Visual Capability Dashboard */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {HOME_LEARNING_METRICS.map(metric => {
            // Check if any capability in this metric needs attention
            let hasAttention = false;
            let hasEvidence = false;
            
            metric.capIds.forEach(capId => {
              const state = newHire.capabilities?.[capId];
              if (state && state.evidence !== "none") {
                hasEvidence = true;
              }
              if (state && state.performance === "below_target") {
                hasAttention = true;
              }
            });

            return (
              <div 
                key={metric.id}
                onClick={() => {
                  if (onSelectSection) onSelectSection("learner_dashboard");
                }}
                className={\`rounded-2xl p-3 border \${hasAttention ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'} flex flex-col justify-between min-h-[88px] cursor-pointer active:scale-95 transition-all shadow-sm\`}
              >
                <div className="flex items-start justify-between gap-1 mb-2">
                  <span className={\`text-xs font-bold leading-tight \${hasAttention ? 'text-rose-900' : 'text-slate-700'}\`}>
                    {isHindi ? metric.titleHi : metric.titleEn}
                  </span>
                  {hasAttention && <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}
                </div>
                <div className="mt-auto">
                  <span className={\`text-[10px] font-black uppercase tracking-wider \${hasAttention ? 'text-rose-600' : 'text-slate-400'}\`}>
                    {hasAttention 
                      ? (isHindi ? "ध्यान आवश्यक" : "Needs attention") 
                      : (!hasEvidence 
                          ? (isHindi ? "पर्याप्त साक्ष्य नहीं" : "Not enough evidence") 
                          : (isHindi ? "ट्रैक पर" : "On track"))
                    }
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Current Focus Card - Coordinate Navigation */}`;

content = content.replace(
  /\{\/\* 4-Grid Visual Capability Dashboard \*\/\}[\s\S]*?\{\/\* Current Focus Card - Coordinate Navigation \*\/\}/,
  newDashboardCode
);

fs.writeFileSync('src/components/NewHireView.tsx', content);
