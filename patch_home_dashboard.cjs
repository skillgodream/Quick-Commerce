const fs = require('fs');
let content = fs.readFileSync('src/components/NewHireView.tsx', 'utf8');

const metricsDefinition = `
const HOME_LEARNING_METRICS = [
  {
    id: "basics",
    titleEn: "Basics & Safety",
    titleHi: "मूल बातें और सुरक्षा",
    capIds: [1, 2, 3, 4, 5]
  },
  {
    id: "accuracy",
    titleEn: "Accuracy & Product Handling",
    titleHi: "सटीकता और उत्पाद प्रबंधन",
    capIds: [6, 7, 8, 10]
  },
  {
    id: "exceptions",
    titleEn: "Floor Exceptions",
    titleHi: "फ़्लोर अपवाद",
    capIds: [11, 12, 13, 18]
  },
  {
    id: "flow",
    titleEn: "Flow & Completion",
    titleHi: "प्रवाह और समापन",
    capIds: [9, 14, 15, 16, 17, 19]
  }
];
`;

if (!content.includes('HOME_LEARNING_METRICS')) {
  content = content.replace(
    /interface NewHireViewProps \{/,
    metricsDefinition + '\ninterface NewHireViewProps {'
  );
}

const dashboardCode = `        {/* 4-Grid Visual Capability Dashboard */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {HOME_LEARNING_METRICS.map(metric => {
            // Check if any capability in this metric needs attention
            const hasAttention = metric.capIds.some(capId => {
              const state = newHire.capabilities?.[capId];
              return state && state.performance === "below_target";
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
                    {hasAttention ? (isHindi ? "ध्यान आवश्यक" : "Needs attention") : (isHindi ? "ट्रैक पर" : "On track")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Current Focus Card - Coordinate Navigation */}`;

if (!content.includes('4-Grid Visual Capability Dashboard')) {
  content = content.replace(
    /\{\/\* Current Focus Card - Coordinate Navigation \*\/\}/,
    dashboardCode
  );
}

fs.writeFileSync('src/components/NewHireView.tsx', content);
