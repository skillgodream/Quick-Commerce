const fs = require('fs');
let code = fs.readFileSync('src/components/ModulesView.tsx', 'utf8');

const searchTarget = `        <div className="relative z-10">
          <div className="space-y-3.5">
            <div className="inline-block px-3 py-1 rounded-full bg-pink-500/10 backdrop-blur-md text-pink-300 text-[10px] font-black uppercase tracking-wider border border-pink-500/20">
              {isHindi ? "फीचर्ड प्रोग्राम" : "Featured"}
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-sm leading-tight">
                {isHindi ? "10-दिवसीय ट्रेनिंग और सर्टिफिकेशन" : "Certification & Training"}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold drop-shadow-xs">
                <span>⭐ 4.8</span>
                <span>•</span>
                <span>{isHindi ? \`\${modulesCompletedCount}/10 दिन पूर्ण\` : \`\${modulesCompletedCount}/10 Days Done\`}</span>
              </div>
            </div>
          </div>

          {/* Flat line progress bar */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold drop-shadow-sm">
              <span className="text-slate-200 uppercase tracking-widest text-[10px]">{isHindi ? "कोर्स प्रगति" : "Course Progress"}</span>
              <span className="text-pink-400 font-black">{Math.round((modulesCompletedCount / 10) * 100)}% {isHindi ? "पूर्ण" : "Completed"}</span>
            </div>
            <div className="h-2.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 backdrop-blur-md shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-pink-500 to-rose-600 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(255,0,127,0.5)]"
                style={{ width: \`\${Math.round((modulesCompletedCount / 10) * 100)}%\` }}
              />
            </div>
          </div>
        </div>`;

const replacement = `        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="space-y-3.5">
              <div className="inline-block px-3 py-1 rounded-full bg-pink-500/10 backdrop-blur-md text-pink-300 text-[10px] font-black uppercase tracking-wider border border-pink-500/20">
                {isHindi ? "फीचर्ड प्रोग्राम" : "Featured"}
              </div>

              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-sm leading-tight">
                  {isHindi ? "10-दिवसीय ट्रेनिंग और सर्टिफिकेशन" : "Certification & Training"}
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold drop-shadow-xs">
                  <span>⭐ 4.8</span>
                  <span>•</span>
                  <span>{isHindi ? \`\${modulesCompletedCount}/10 दिन पूर्ण\` : \`\${modulesCompletedCount}/10 Days Done\`}</span>
                </div>
              </div>
            </div>

            {/* Flat line progress bar */}
            <div className="mt-6 space-y-2 max-w-[280px]">
              <div className="flex items-center justify-between text-xs font-bold drop-shadow-sm">
                <span className="text-slate-200 uppercase tracking-widest text-[10px]">{isHindi ? "कोर्स प्रगति" : "Course Progress"}</span>
                <span className="text-pink-400 font-black">{Math.round((modulesCompletedCount / 10) * 100)}% {isHindi ? "पूर्ण" : "Completed"}</span>
              </div>
              <div className="h-2.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 backdrop-blur-md shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-pink-500 to-rose-600 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(255,0,127,0.5)]"
                  style={{ width: \`\${Math.round((modulesCompletedCount / 10) * 100)}%\` }}
                />
              </div>
            </div>
          </div>

          {/* Job Readiness Round Dial */}
          <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center relative mt-2">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.15)" strokeWidth="8" fill="transparent" />
              <circle
                cx="50" cy="50" r="42" stroke="#34d399" strokeWidth="8" strokeLinecap="round" fill="transparent"
                strokeDasharray={2 * Math.PI * 42}
                strokeDashoffset={2 * Math.PI * 42 * (1 - overallReadiness / 100)}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl sm:text-2xl font-black text-white tracking-tighter drop-shadow-md leading-none">{overallReadiness}%</span>
              <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mt-1 drop-shadow-sm">
                {isHindi ? "रेडीनेस" : "Ready"}
              </span>
            </div>
          </div>
        </div>`;

if (!code.includes(searchTarget)) {
    console.error("Target not found!");
    process.exit(1);
}

code = code.replace(searchTarget, replacement);
fs.writeFileSync('src/components/ModulesView.tsx', code);
