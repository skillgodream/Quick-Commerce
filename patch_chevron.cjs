const fs = require('fs');

let content = fs.readFileSync('src/components/NewHireView.tsx', 'utf8');

const oldBtn = `<button 
                type="button"
                onClick={() => setIsInsightsExpanded(!isInsightsExpanded)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all cursor-pointer text-[10px] font-bold uppercase tracking-widest"
              >
                {isHindi ? "इंसाइड्स देखें" : "View Insights"}
                {isInsightsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>`;

const newBtn = `<button 
                type="button"
                onClick={() => setIsInsightsExpanded(!isInsightsExpanded)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all cursor-pointer text-[10px] font-bold uppercase tracking-widest shadow-sm backdrop-blur-md"
              >
                {isInsightsExpanded ? <ChevronUp className="w-3.5 h-3.5 text-cyan-400" /> : <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />}
                {isHindi ? "इंसाइड्स देखें" : "Insights"}
              </button>`;

content = content.replace(oldBtn, newBtn);
fs.writeFileSync('src/components/NewHireView.tsx', content);
