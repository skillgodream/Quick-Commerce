const fs = require('fs');

let file = fs.readFileSync('src/components/TodaysGoalLandingView.tsx', 'utf8');

// 1. Make hero banner smaller (remove some vertical padding)
file = file.replace(
  'className="bg-[#e5e5e5] rounded-[24px] px-5 py-5 shadow-sm space-y-4 select-none relative overflow-hidden text-black border border-slate-300/80"',
  'className="bg-[#e5e5e5] rounded-[24px] px-5 py-3.5 shadow-sm space-y-2 select-none relative overflow-hidden text-black border border-slate-300/80"'
);

// 2. Make number bigger and text smaller
const numberTarget = `<div className="flex items-center gap-4 sm:gap-5 pt-2 pb-2">
                <div className="flex items-baseline shrink-0">
                  <span 
                    className="font-medium text-black leading-none tracking-[-0.05em]"
                    style={{ fontSize: 'clamp(4.5rem, 20vw, 6rem)' }}
                  >
                    {String(displayedPercentage).padStart(2, '0')}
                  </span>
                  <span 
                    className="font-bold text-black/60 leading-none tracking-[-0.02em] ml-1 sm:ml-1.5"
                    style={{ fontSize: 'clamp(2rem, 8vw, 3rem)' }}
                  >
                    %
                  </span>
                </div>
                <div className="text-sm sm:text-base font-medium text-slate-700 leading-tight tracking-tight max-w-[120px]">
                  {dialSubtext}
                </div>
              </div>`;

const numberReplacement = `<div className="flex items-center gap-3 sm:gap-4 pt-1 pb-1">
                <div className="flex items-baseline shrink-0 leading-[0.85]">
                  <span 
                    className="font-medium text-black tracking-[-0.05em]"
                    style={{ fontSize: 'clamp(5rem, 22vw, 6.5rem)' }}
                  >
                    {String(displayedPercentage).padStart(2, '0')}
                  </span>
                  <span 
                    className="font-bold text-black/60 tracking-[-0.02em] ml-1 sm:ml-1.5"
                    style={{ fontSize: 'clamp(2.5rem, 9vw, 3.5rem)' }}
                  >
                    %
                  </span>
                </div>
                <div className="text-xs sm:text-sm font-medium text-slate-700 leading-tight tracking-tight max-w-[100px]">
                  {dialSubtext}
                </div>
              </div>`;
              
file = file.replace(numberTarget, numberReplacement);

// 3. Update Course Completion Box
const completionTarget = `{/* Progress Completion Tab positioned UNDER the banner */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-lg font-black text-black">
                {isHindi ? "कोर्स पूरा हुआ" : "Course Completion"}
              </span>
              <span className="text-2xl font-black text-black leading-none">
                {Math.round((completedCount / totalActivities) * 100)}%
              </span>
            </div>
            {/* Horizontal Progress Bar */}
            <div className="w-full h-3.5 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-black rounded-full transition-all duration-700 ease-out"
                style={{ width: \`\${(completedCount / totalActivities) * 100}%\` }}
              />
            </div>
            <div className="flex justify-start">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                {completedCount}/{totalActivities} TASKS
              </span>
            </div>
          </div>`;

const completionReplacement = `{/* Progress Completion Tab positioned UNDER the banner */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col gap-2.5 mx-2">
            <div className="flex items-center justify-between">
              <span className="text-base font-black text-black tracking-tight">
                {isHindi ? "कोर्स पूरा हुआ" : "Course Completion"}
              </span>
              <span className="text-lg font-black text-black leading-none">
                {Math.round((completedCount / totalActivities) * 100)}%
              </span>
            </div>
            {/* Horizontal Progress Bar */}
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#f97316] rounded-full transition-all duration-700 ease-out"
                style={{ width: \`\${(completedCount / totalActivities) * 100}%\` }}
              />
            </div>
            <div className="flex justify-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                {completedCount}/{totalActivities} TASKS
              </span>
            </div>
          </div>`;
          
file = file.replace(completionTarget, completionReplacement);

fs.writeFileSync('src/components/TodaysGoalLandingView.tsx', file);
