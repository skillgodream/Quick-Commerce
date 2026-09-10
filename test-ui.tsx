import React from 'react';
export const CardFlow = () => {
    const isHindi = false;
    const skillDisplay = "actionable";
    const targetCapDef = { name: "Finding Locations" };
    const skillStatusBadge = "Needs practice";
    
    const status = {
        action: "Practice finding item locations",
        shortWhy: "You needed help finding items yesterday",
        target: "5 independent picks",
        primaryBtnText: "START"
    };
    
    return (
        <div className="flex flex-col items-center text-center mt-3 mb-4 w-full">
            {/* P0-B: NEXT SKILL */}
            <div className="flex flex-col items-center text-center mb-5 w-full px-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                NEXT SKILL TO IMPROVE
                </span>
                <div className="bg-black/20 rounded-xl p-3 border border-white/10 w-full max-w-[280px] flex flex-col items-center">
                    <h3 className="text-[14px] font-black text-white text-center leading-tight">{targetCapDef.name}</h3>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mt-1">
                        {skillStatusBadge}
                    </span>
                </div>
            </div>

            {/* P0-C: YESTERDAY -> TODAY */}
            <div className="flex flex-col w-full max-w-[280px] mb-5">
                <div className="flex flex-col bg-white/5 rounded-xl p-3 border border-white/5 relative">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">YESTERDAY</span>
                    <p className="text-[12px] font-semibold text-slate-200">{status.shortWhy}</p>
                    
                    <div className="flex justify-center my-2">
                        <div className="w-4 h-4 rounded-full bg-cyan-500/20 flex items-center justify-center">
                            <span className="text-cyan-400 text-[10px]">↓</span>
                        </div>
                    </div>
                    
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">TODAY</span>
                    <p className="text-[12px] font-semibold text-white">{status.action}</p>
                </div>
            </div>

            {/* P0-A: YOUR NEXT STEP */}
            <div className="flex flex-col items-center text-center w-full space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                    <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
                    YOUR NEXT STEP
                    </span>
                </div>
                
                <h2 className="text-lg font-black text-white leading-tight px-4">
                    {status.target || status.action}
                </h2>
                
                {/* Start Button */}
                <button className="mt-2 max-w-[180px] w-full py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-black text-sm">
                    {status.primaryBtnText}
                </button>
            </div>
        </div>
    );
};
