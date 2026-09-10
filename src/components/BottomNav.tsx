import React from "react";
import {
  Home,
  User,
  Zap,
  Sliders,
} from "lucide-react";
import { ActiveTab } from "./Header";

interface BottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenLoopModal: () => void;
  needsAttentionCount?: number;
  atRiskCount?: number;
  currentDay: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenLoopModal,
  needsAttentionCount = 3,
  atRiskCount = 1,
}) => {
  return (
    <nav
      id="mobile-bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 shadow-2xl px-5 py-3.5 max-w-lg mx-auto"
    >
      <div className="flex items-center justify-around gap-2">
        {/* Tab 1: Home / Companion (Matches 1st Icon in Reference) */}
        <button
          id="nav-tab-new-hire"
          onClick={() => setActiveTab("new_hire")}
          className={`flex-1 flex flex-col items-center justify-center py-2.5 px-3 rounded-2xl transition-all cursor-pointer active:scale-95 ${
            activeTab === "new_hire"
              ? "text-violet-600 font-black bg-violet-50/80"
              : "text-slate-400 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <div className="relative">
            <Home className="w-7 h-7 stroke-[2.2]" />
            {activeTab === "new_hire" && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500" />
            )}
          </div>
          <span className="text-xs mt-1 tracking-tight font-extrabold">
            Companion
          </span>
        </button>

        {/* Tab 2: Supervisor / User (Matches 2nd Icon in Reference) */}
        <button
          id="nav-tab-manager"
          onClick={() => setActiveTab("manager")}
          className={`flex-1 flex flex-col items-center justify-center py-2.5 px-3 rounded-2xl transition-all cursor-pointer relative active:scale-95 ${
            activeTab === "manager"
              ? "text-violet-600 font-black bg-violet-50/80"
              : "text-slate-400 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <div className="relative">
            <User className="w-7 h-7 stroke-[2.2]" />
            {(atRiskCount > 0 || needsAttentionCount > 0) && (
              <span className="absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-fuchsia-500 text-white ring-2 ring-white">
                {needsAttentionCount + atRiskCount}
              </span>
            )}
            {activeTab === "manager" && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500" />
            )}
          </div>
          <span className="text-xs mt-1 tracking-tight font-extrabold">
            Supervisor
          </span>
        </button>

        {/* Tab 3: Store Operations / Lightning Bolt (Matches 3rd Icon in Reference) */}
        <button
          id="nav-tab-organization"
          onClick={() => setActiveTab("organization")}
          className={`flex-1 flex flex-col items-center justify-center py-2.5 px-3 rounded-2xl transition-all cursor-pointer active:scale-95 ${
            activeTab === "organization"
              ? "text-violet-600 font-black bg-violet-50/80"
              : "text-slate-400 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <div className="relative">
            <Zap className="w-7 h-7 stroke-[2.2]" />
            {activeTab === "organization" && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500" />
            )}
          </div>
          <span className="text-xs mt-1 tracking-tight font-extrabold">
            Store Ops
          </span>
        </button>

        {/* Tab 4: 6-Stage Loop Flow / Gear / Sliders (Matches 4th Icon in Reference) */}
        <button
          id="nav-tab-loop"
          onClick={onOpenLoopModal}
          className="flex-1 flex flex-col items-center justify-center py-2.5 px-3 rounded-2xl transition-all cursor-pointer text-slate-400 hover:text-violet-600 hover:bg-violet-50/50 active:scale-95"
        >
          <div className="relative">
            <Sliders className="w-7 h-7 stroke-[2.2]" />
          </div>
          <span className="text-xs mt-1 tracking-tight font-extrabold text-violet-600">
            Loop Flow
          </span>
        </button>
      </div>
    </nav>
  );
};

