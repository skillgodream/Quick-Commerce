const fs = require('fs');

let code = fs.readFileSync('src/components/JobReadyHumanFigure.tsx', 'utf8');

const searchStart = `  return (
    <section
      id="job-ready-human-dashboard"
      className="bg-white/10 border border-white/10 text-white rounded-[32px] p-4 sm:p-6 shadow-xl space-y-6 select-none backdrop-blur-md"
    >
      {/* =========================================================== */}
      {/* HERO BANNER & PROGRESS BREAKDOWN (MATCHING SCREENSHOT)      */}
      {/* =========================================================== */}`;

const searchEnd = `      {/* ------------------------------------------------------------- */}
      {/* DAY 10 COMMERCIAL CERTIFICATION AUDIT (7 CRITERIA)            */}
      {/* ------------------------------------------------------------- */}`;

const startIndex = code.indexOf(searchStart);
const endIndex = code.indexOf(searchEnd);

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find start or end block.");
  process.exit(1);
}

const before = code.substring(0, startIndex);
const after = code.substring(endIndex);

const newUI = `  return (
    <section
      id="job-ready-human-dashboard"
      className="bg-white/5 border border-white/10 text-white rounded-[24px] p-3 sm:p-4 shadow-xl space-y-4 select-none backdrop-blur-md"
    >
      {/* SLEEK COMPACT HERO & CATEGORIES */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Readiness % Widget */}
        <div className="bg-gradient-to-br from-violet-600/90 via-purple-600/90 to-indigo-700/90 rounded-[20px] p-3 shadow-lg shadow-purple-900/15 flex items-center gap-3 sm:w-1/3">
          <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.2)" strokeWidth="8" fill="transparent" />
              <circle
                cx="50" cy="50" r="40" stroke="#34d399" strokeWidth="8" strokeLinecap="round" fill="transparent"
                strokeDasharray={2 * Math.PI * 40}
                strokeDashoffset={2 * Math.PI * 40 * (1 - overallReadiness / 100)}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-black tracking-tighter text-white">{overallReadiness}%</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">{isHindi ? "रेडीनेस" : "Readiness"}</div>
            <div className="text-[11px] font-semibold text-purple-100 truncate">{isHindi ? "वेयरहाउस एसोसिएट" : "Warehouse Associate"}</div>
          </div>
        </div>

        {/* 4 Sleek Learning Pillars */}
        <div className="flex-1 grid grid-cols-4 gap-2">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const catScore = Math.round(cat.ratio * cat.weight);
            return (
              <div
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setActivePillarModal(cat);
                }}
                className={\`rounded-[16px] border p-2 flex flex-col justify-between items-center text-center cursor-pointer active:scale-95 transition-all \${
                  isSelected
                    ? "bg-gradient-to-br from-cyan-400 to-blue-600 border-transparent text-slate-950 shadow-md ring-1 ring-cyan-400"
                    : "bg-white/5 border-white/10 hover:bg-white/10 text-slate-300"
                }\`}
              >
                <div className={\`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mb-1 \${
                  isSelected ? "bg-slate-950/10 text-slate-950" : "bg-white/10 text-cyan-300"
                }\`}>
                  {cat.icon}
                </div>
                <div className="w-full">
                  <div className={\`text-[10px] font-black mb-1 \${isSelected ? "text-slate-950" : "text-white"}\`}>{catScore}%</div>
                  <div className={\`w-full h-1 rounded-full overflow-hidden \${isSelected ? "bg-slate-950/20" : "bg-white/10"}\`}>
                    <div
                      className={\`h-full rounded-full transition-all duration-500 \${isSelected ? "bg-slate-950" : "bg-cyan-400"}\`}
                      style={{ width: \`\${Math.round(cat.ratio * 100)}%\` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

`;

fs.writeFileSync('src/components/JobReadyHumanFigure.tsx', before + newUI + after);
