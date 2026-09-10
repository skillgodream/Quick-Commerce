const fs = require('fs');

let code = fs.readFileSync('src/components/ModulesView.tsx', 'utf8');

const searchStrStart = `      {/* ========================================================= */}\n      {/* TODAY'S TRAINING GOAL SUMMARY CARD                         */}`;
const searchStrEnd = `      {/* ========================================================= */}\n      {/* 2.5 MODULE DETAIL MODAL                                   */}`;

const parts = code.split(searchStrStart);
const p1 = parts[0];
const p2 = parts[1].split(searchStrEnd)[1];

const newUI = `      {/* ========================================================= */}
      {/* YOUR CURRENT FOCUS (TARGET CAPABILITY)                      */}
      {/* ========================================================= */}
      {targetCapDef && (
        <div className="bg-[#1b1e26] border border-white/10 rounded-2xl p-4 shadow-xl flex items-center justify-between gap-3 text-white mb-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#13151b] text-cyan-400 border border-white/10 flex items-center justify-center shrink-0 font-black shadow-xs">
              <Zap className="w-5 h-5 fill-cyan-400/20" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-black text-white uppercase tracking-wide">
                  {isHindi ? "आपका वर्तमान ध्यान" : "Your Current Focus"}
                </h4>
              </div>
              <p className="text-[14px] text-cyan-400 font-bold truncate mt-1">
                {targetCapDef.name}
              </p>
              <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                {isHindi ? "अनुशंसित अभ्यास जारी रखें।" : "Continue the recommended practice."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MY JOB SKILLS (CAPABILITIES LIST)                         */}
      {/* ========================================================= */}
      <div className="flex flex-col gap-3.5 pb-8 mt-4">
        <div className="flex items-center gap-2 mb-1 px-1">
          <Sparkles className="w-4 h-4 text-pink-400" />
          <h3 className="text-[13px] font-black text-white uppercase tracking-widest">{isHindi ? "मेरे नौकरी कौशल" : "My Job Skills"}</h3>
        </div>

        {capabilitiesToRender.map((cap) => {
          const statusStr = getCapabilityStatus(cap.id);
          const statusColor = getCapabilityStatusColor(statusStr);
          const progText = getCapabilityProgressText(cap.id);
          const { compAct, totalAct } = getCapabilityProgressRatio(cap.id);
          
          return (
            <div
              key={cap.id}
              onClick={() => setActiveCapabilityModal(cap.id)}
              className="w-full flex flex-col gap-2 p-4 transition-all duration-300 cursor-pointer select-none bg-[#111317] border border-white/5 rounded-[24px] hover:border-[#ff007f]/45 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-start justify-between w-full">
                <div className="flex flex-col">
                  <h3 className="text-[15px] font-black text-white leading-snug tracking-tight">{cap.name}</h3>
                  {statusStr ? (
                    <span className={\`text-[11px] font-bold mt-1 \${statusColor}\`}>
                      {statusStr}
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold mt-1 text-slate-500">
                      {isHindi ? "शुरू नहीं हुआ" : "Not started"}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="mt-2 flex items-center justify-between">
                <div className="flex-1 mr-4">
                  <div className="h-2 w-full bg-black rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="h-full bg-pink-500 rounded-full transition-all duration-500" 
                      style={{ width: totalAct > 0 ? \`\${(compAct / totalAct) * 100}%\` : '0%' }}
                    />
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                  {progText}
                </span>
              </div>
            </div>
          );
        })}

        {unmappedModules.length > 0 && (
          <>
            <div className="flex items-center gap-2 mb-1 mt-4 px-1">
              <BookOpen className="w-4 h-4 text-pink-400" />
              <h3 className="text-[13px] font-black text-white uppercase tracking-widest">{isHindi ? "अन्य शिक्षा" : "Other Learning"}</h3>
            </div>
            {unmappedModules.map((mod) => (
              <div
                key={mod.id}
                onClick={() => {
                  setSelectedModuleId(mod.id);
                  setActiveDetailModule(mod);
                }}
                className="w-full flex flex-col gap-2 p-4 transition-all duration-300 cursor-pointer select-none bg-transparent rounded-[24px] border border-white/5 hover:bg-white/5"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">{isHindi && mod.titleHi ? mod.titleHi : mod.title}</h3>
                  <span className="text-white/20 text-lg font-light shrink-0">+</span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* ========================================================= */}
      {/* CAPABILITY DETAIL MODAL                                   */}
      {/* ========================================================= */}
      {activeCapabilityModal && (() => {
        const cap = DARK_STORE_CAPABILITIES.find(c => c.id === activeCapabilityModal);
        if (!cap) return null;
        
        const statusStr = getCapabilityStatus(cap.id);
        const statusColor = getCapabilityStatusColor(statusStr);
        const modules = getModulesForCapability(cap.id);
        const { compAct, totalAct } = getCapabilityProgressRatio(cap.id);
        
        return (
          <div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 text-white">
            <div className="bg-[#1b1e26] rounded-3xl max-w-md w-full p-5 shadow-2xl border border-white/10 max-h-[88vh] overflow-y-auto space-y-4 animate-in fade-in zoom-in duration-150">
              <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-[18px] font-black text-white leading-tight uppercase tracking-wide">
                    {cap.name}
                  </h3>
                  {statusStr && (
                    <span className={\`text-xs font-bold mt-1.5 block \${statusColor}\`}>
                      {statusStr}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setActiveCapabilityModal(null)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isHindi ? "आपकी शिक्षा" : "Your learning"}</span>
                <p className="text-[14px] font-semibold text-slate-200">
                  {isHindi ? \`\${compAct} / \${totalAct} गतिविधियाँ पूर्ण\` : \`\${compAct} / \${totalAct} activities complete\`}
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isHindi ? "आप क्या अभ्यास कर रहे हैं" : "What you're practising"}</span>
                <ul className="space-y-2">
                  {modules.map(mod => (
                    <li key={mod.id} className="flex items-start gap-2 text-[13px] font-medium text-slate-300">
                      <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-pink-500 shrink-0" />
                      <span>{isHindi && mod.titleHi ? mod.titleHi : mod.title}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setActiveCapabilityModal(null);
                    // Find first incomplete module, or just the first one
                    let nextMod = modules.find(m => !completedIds.includes(m.id));
                    if (!nextMod && modules.length > 0) nextMod = modules[0];
                    if (nextMod) {
                      setSelectedModuleId(nextMod.id);
                      setActiveDetailModule(nextMod);
                    }
                  }}
                  className="w-full py-3 bg-gradient-to-r from-pink-550 to-rose-600 bg-pink-500 text-white rounded-2xl text-[13px] font-black shadow-lg hover:opacity-95 cursor-pointer active:scale-98 transition-all flex items-center justify-center gap-2 border border-white/10"
                >
                  <span className="text-white">{isHindi ? "सीखना जारी रखें" : "CONTINUE LEARNING"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================= */}
      {/* 2.5 MODULE DETAIL MODAL                                   */}`;

code = p1 + newUI + p2;
fs.writeFileSync('src/components/ModulesView.tsx', code);
