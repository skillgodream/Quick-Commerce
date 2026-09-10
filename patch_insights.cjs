const fs = require('fs');
let code = fs.readFileSync('src/components/NewHireView.tsx', 'utf8');

const searchTarget = `            {/* Next Skill to Improve Section */}
            {(() => {
              const decisionType = currentRecord.recommendedAction?.decisionType;`;

if (!code.includes(searchTarget)) {
    console.error("Could not find start of target");
    process.exit(1);
}

const endTarget = `              return (
                <div className="flex flex-col items-center w-full px-2 mb-6 mt-2 relative z-10">
                  <div className="flex flex-col bg-black/20 rounded-xl p-4 border border-white/10 relative w-full max-w-[280px]">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{isHindi ? "कल" : "YESTERDAY"}</span>
                    <p className="text-[13px] font-semibold text-slate-200 leading-snug">{status.shortWhy}</p>
                    
                    <div className="flex justify-center my-3 relative">
                      <div className="w-full h-[1px] bg-white/10 absolute top-1/2 -translate-y-1/2 left-0"></div>
                      <div className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center relative z-10 shadow-sm shadow-cyan-900/20">
                        <span className="text-cyan-400 text-[10px] font-bold">↓</span>
                      </div>
                    </div>
                    
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{isHindi ? "आज" : "TODAY"}</span>
                    <p className="text-[13px] font-semibold text-white leading-snug">{status.action}</p>
                  </div>
                </div>
              );
            })()}`;

const startIndex = code.indexOf(searchTarget);
const endIndex = code.indexOf(endTarget) + endTarget.length;

const block = code.substring(startIndex, endIndex);

const wrappedBlock = `            {/* Insights Drawer Toggle */}
            <div className="flex justify-center mt-2 pb-2 relative z-10">
              <button 
                type="button"
                onClick={() => setIsInsightsExpanded(!isInsightsExpanded)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all cursor-pointer text-[10px] font-bold uppercase tracking-widest"
              >
                {isHindi ? "इंसाइड्स देखें" : "View Insights"}
                {isInsightsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {isInsightsExpanded && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
${block}
              </div>
            )}`;

code = code.substring(0, startIndex) + wrappedBlock + code.substring(endIndex);
fs.writeFileSync('src/components/NewHireView.tsx', code);
console.log("Patched successfully");
