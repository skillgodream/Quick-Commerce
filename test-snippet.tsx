import React from 'react';
export const NextSkillCard = () => {
    const isInsufficientEvidence = false;
    const targetCapDef = { name: "Finding Locations" };
    const status = { shortWhy: "You needed help finding items yesterday." };
    
    return (
        <div className="mt-6 w-full max-w-sm mx-auto bg-black/20 rounded-xl p-4 border border-white/10 flex flex-col items-center text-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                Next Skill To Improve
            </span>
            {isInsufficientEvidence ? (
                <>
                    <h3 className="text-sm font-bold text-white mb-1">Not enough evidence yet.</h3>
                    <p className="text-xs text-slate-400">We'll keep observing your work to find your next improvement area.</p>
                </>
            ) : !targetCapDef ? (
                <>
                    <h3 className="text-sm font-bold text-emerald-400 mb-1">You're doing well.</h3>
                    <p className="text-xs text-slate-400">We'll keep observing your work to find your next improvement area.</p>
                </>
            ) : (
                <>
                    <h3 className="text-sm font-bold text-white">{targetCapDef.name}</h3>
                    <span className="text-xs font-semibold text-amber-400 mb-2 mt-0.5 block">Needs practice</span>
                    <p className="text-xs text-slate-300">{status.shortWhy}</p>
                    
                    <button className="mt-3 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-white hover:bg-white/20">
                        PRACTICE
                    </button>
                </>
            )}
        </div>
    );
};
