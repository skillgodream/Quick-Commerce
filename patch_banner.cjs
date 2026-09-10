const fs = require('fs');
let code = fs.readFileSync('src/components/ModulesView.tsx', 'utf8');

const heroStart = code.indexOf('{/* 1. HERO BANNER */}');
const heroEnd = code.indexOf('{/* Main content wrapped in padding div to keep aligned */}');

const originalHero = code.substring(heroStart, heroEnd);

const newHero = `{/* 1. HERO BANNER */}
      {/* ========================================================= */}
      <div 
        className="relative moving-dark-gradient rounded-b-[32px] rounded-t-none pt-10 pb-7 px-5 sm:px-6 text-white shadow-2xl border-b border-white/10 overflow-hidden"
      >
        {/* Real-time moving/flowing dark visual and halftone mesh dots as requested */}
        <div className="absolute inset-0 dotted-halftone-pattern rounded-b-[32px] pointer-events-none opacity-85 z-0" />

        {/* Subtle premium accent glow to lift the look */}
        <div className="absolute -top-16 -left-16 w-56 h-56 bg-pink-500/10 rounded-full blur-3xl pointer-events-none z-0" />
        <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-rose-600/10 rounded-full blur-3xl pointer-events-none z-0" />

        <div className="relative z-10">
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
        </div>
      </div>

      `;

code = code.replace(originalHero, newHero);
fs.writeFileSync('src/components/ModulesView.tsx', code);
