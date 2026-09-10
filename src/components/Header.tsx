import React, { useState, useRef, useEffect } from "react";
import {
  Calendar,
  Sparkles,
  Zap,
  Activity,
  Eye,
  User,
  Sliders,
  ChevronRight,
  Gauge,
  Languages,
  UserCheck,
  FileSpreadsheet,
} from "lucide-react";
import { Logo } from "./Logo";
export type ActiveTab = "new_hire" | "manager" | "organization";

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentDay: number;
  onSelectDay: (day: number) => void;
  onResetDemo?: () => void;
  onOpenLoopModal: () => void;
  onOpenTelemetryDial?: () => void;
  onOpenBuddy?: () => void;
  onOpenOnboarding?: () => void;
  onOpenFeedModal?: () => void;
  onOpenClientDemo?: () => void;
  hasApiKey: boolean;
  doingWellCount?: number;
  needsAttentionCount?: number;
  atRiskCount?: number;
  isFramed?: boolean;
  onToggleFrame?: () => void;
  isHindi?: boolean;
  onToggleLanguage?: () => void;
  isHomeScreen?: boolean;
  learnerName?: string;
  buddyName?: string;
  onOpenSplash?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentDay,
  onSelectDay,
  onOpenLoopModal,
  onOpenTelemetryDial,
  onOpenBuddy,
  onOpenOnboarding,
  onOpenFeedModal,
  onOpenClientDemo,
  hasApiKey,
  doingWellCount = 8,
  needsAttentionCount = 3,
  atRiskCount = 1,
  isHindi = false,
  onToggleLanguage,
  isHomeScreen = true,
  learnerName = "Rahul",
  buddyName = "Vikram",
  onOpenSplash,
}) => {
  const [isEyeMenuOpen, setIsEyeMenuOpen] = useState(false);
  const eyeMenuRef = useRef<HTMLDivElement>(null);
  const firstName = (learnerName || "Rahul").split(" ")[0];

  // Close eye menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (eyeMenuRef.current && !eyeMenuRef.current.contains(event.target as Node)) {
        setIsEyeMenuOpen(false);
      }
    };
    if (isEyeMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEyeMenuOpen]);

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsEyeMenuOpen(false);
  };

  const handleSelectLoop = () => {
    onOpenLoopModal();
    setIsEyeMenuOpen(false);
  };

  const isBackstageActive = activeTab === "manager" || activeTab === "organization";

  return (
    <header className="bg-[#16181f]/95 backdrop-blur-md border-b border-white/10 sticky top-0 z-40 shadow-md">
      <div className="max-w-md mx-auto px-4 py-2.5">
        {/* Top bar: Brand + Live Tag + Actions */}
        <div className="flex items-center justify-between gap-2">
          {/* Brand Identity / Store Header */}
          <div
            onClick={onOpenSplash}
            role={onOpenSplash ? "button" : undefined}
            tabIndex={onOpenSplash ? 0 : undefined}
            title={onOpenSplash ? "View Checkin Checkout Splash Screen Animation" : undefined}
            className={`flex items-center gap-2 min-w-0 ${
              onOpenSplash
                ? "cursor-pointer group hover:opacity-90 active:scale-98 transition-all"
                : ""
            }`}
          >
            <Logo variant="compact" size="sm" />
            <span className="text-[11px] text-slate-300 font-medium truncate">• Dark Store #104</span>
          </div>

          {/* Right Action Icons: Language button visible everywhere, menu only on home screen */}
          <div className="flex items-center gap-1.5 shrink-0">

            {/* Language Toggle Button (Hindi / English) placed near Eye Icon */}
            {onToggleLanguage && (
              <button
                id="header-language-btn"
                onClick={onToggleLanguage}
                title={isHindi ? "Switch to English (अंग्रेजी में देखें)" : "हिंदी में बदलें (Switch to Hindi)"}
                aria-label="Toggle language"
                className="px-2.5 py-1.5 rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 shadow-2xs font-black text-xs"
              >
                <Languages className="w-4 h-4 text-cyan-400" />
                <span className="text-[11px] font-black uppercase text-cyan-400">
                  {isHindi ? "हिंदी" : "EN"}
                </span>
              </button>
            )}

            {/* Top Bar Menu Items (Client Demo & Eye Menu) - ONLY visible on Home Screen */}
            {(isHomeScreen || isBackstageActive) && (
              <>
                {/* Client Demo Story Quick Launcher */}
            {onOpenClientDemo && (
              <button
                id="header-client-demo-btn"
                onClick={onOpenClientDemo}
                title="Client Demo Story & Closed-Loop Scenarios"
                aria-label="Client Demo Story"
                className="px-2.5 py-1.5 rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-xs font-black text-xs"
              >
                <span className="text-xs">🎯</span>
                <span className="text-[11px] font-black tracking-tight hidden sm:inline">Demo</span>
              </button>
            )}

            {/* Eye Icon Button & Exclusive Backstage Dropdown Menu */}
            <div className="relative" ref={eyeMenuRef}>
              <button
                id="header-eye-btn"
                onClick={() => setIsEyeMenuOpen((prev) => !prev)}
                title="Management Views & Loop Flow"
                aria-label="Management Views & Loop Flow"
                aria-expanded={isEyeMenuOpen}
                className={`p-2 rounded-2xl transition-all cursor-pointer flex items-center justify-center relative active:scale-95 ${
                  isEyeMenuOpen || isBackstageActive
                    ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25 ring-2 ring-cyan-400/40"
                    : "text-slate-200 hover:text-white bg-white/10 hover:bg-white/20"
                }`}
              >
                <Eye className="w-4 h-4 stroke-[2.2]" />
                {/* Alert badge if any hires need attention or are at risk */}
                {(needsAttentionCount > 0 || atRiskCount > 0) && !isEyeMenuOpen && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#ff2a6d] ring-2 ring-[#16181f] animate-pulse" />
                )}
              </button>

              {/* Backstage Quick Popover Menu */}
              {isEyeMenuOpen && (
                <div
                  id="header-eye-popover"
                  className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#1b1e26] border border-white/10 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-white"
                >
                  <div className="px-3 py-1.5 border-b border-white/10 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
                      Operations Hub
                    </span>
                    <span className="text-[10px] font-bold text-cyan-400 bg-cyan-400/15 px-1.5 py-0.5 rounded-full">
                      Admin Access
                    </span>
                  </div>

                  <div className="p-1 space-y-1">
                    {/* Item 1: Supervisor */}
                    <button
                      id="eye-menu-supervisor"
                      onClick={() => handleSelectTab("manager")}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeTab === "manager"
                          ? "bg-white/10 text-cyan-400"
                          : "text-slate-200 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-1.5 rounded-lg ${
                            activeTab === "manager"
                              ? "bg-cyan-500 text-slate-950"
                              : "bg-white/10 text-slate-200"
                          }`}
                        >
                          <User className="w-3.5 h-3.5 stroke-[2.2]" />
                        </div>
                        <div className="text-left">
                          <div className="leading-tight">Supervisor</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            Floor triage & support
                          </div>
                        </div>
                      </div>
                      {(atRiskCount > 0 || needsAttentionCount > 0) && (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-[#ff2a6d] text-white">
                          {needsAttentionCount + atRiskCount}
                        </span>
                      )}
                    </button>

                    {/* Item 2: Store Ops */}
                    <button
                      id="eye-menu-store-ops"
                      onClick={() => handleSelectTab("organization")}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeTab === "organization"
                          ? "bg-white/10 text-cyan-400"
                          : "text-slate-200 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-1.5 rounded-lg ${
                            activeTab === "organization"
                              ? "bg-cyan-500 text-slate-950"
                              : "bg-white/10 text-slate-200"
                          }`}
                        >
                          <Zap className="w-3.5 h-3.5 stroke-[2.2]" />
                        </div>
                        <div className="text-left">
                          <div className="leading-tight">Store Ops</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            Cohort ramp health
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    {/* Item 3: Loop Flow */}
                    <button
                      id="eye-menu-loop-flow"
                      onClick={handleSelectLoop}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:bg-white/5 hover:text-white transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                          <Sliders className="w-3.5 h-3.5 stroke-[2.2]" />
                        </div>
                        <div className="text-left">
                          <div className="leading-tight">Loop Flow</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            6-stage intelligence cycle
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-md">
                        Inspect
                      </span>
                    </button>

                    {/* Item 4: Onboarding Welcome Screen */}
                    {onOpenOnboarding && (
                      <button
                        id="eye-menu-onboarding"
                        onClick={() => {
                          onOpenOnboarding();
                          setIsEyeMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                            <Sparkles className="w-3.5 h-3.5 stroke-[2.2]" />
                          </div>
                          <div className="text-left">
                            <div className="leading-tight">Onboarding Page</div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              Start my day landing
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md">
                          Intro
                        </span>
                      </button>
                    )}

                    {/* Item 5: Client Demo Story */}
                    {onOpenClientDemo && (
                      <button
                        id="eye-menu-client-demo"
                        onClick={() => {
                          onOpenClientDemo();
                          setIsEyeMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-violet-50 text-violet-600">
                            <Sparkles className="w-3.5 h-3.5 stroke-[2.2]" />
                          </div>
                          <div className="text-left">
                            <div className="leading-tight">Client Demo Story</div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              Demos 1–8 & 6-stage closed loop
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded-md">
                          Story
                        </span>
                      </button>
                    )}

                    {/* Item 6: Client Demo Work-Signal Feed (Google Sheet / Form Ingestor) */}
                    {onOpenFeedModal && (
                      <button
                        id="eye-menu-feed-ingestor"
                        onClick={() => {
                          onOpenFeedModal();
                          setIsEyeMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                            <FileSpreadsheet className="w-3.5 h-3.5 stroke-[2.2]" />
                          </div>
                          <div className="text-left">
                            <div className="leading-tight">Demo Signal Feed</div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              Form / Sheet 12-field live test
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                          Feed
                        </span>
                      </button>
                    )}

                    {/* Return to Learner Companion if in manager/org view */}
                    {isBackstageActive && (
                      <div className="pt-1 mt-1 border-t border-slate-100">
                        <button
                          id="eye-menu-return-learner"
                          onClick={() => handleSelectTab("new_hire")}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-all cursor-pointer"
                        >
                          <span>Back to Learner Companion</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
              </>
            )}
          </div>
        </div>

        {/* Second Row: Scenario Stepper for Manager */}
        {activeTab !== "new_hire" && (
          <>
            {/* Scenario Day Stepper (Rounded Squircles) */}
            <div className="mt-2.5 flex items-center justify-between gap-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/70 text-xs">
              <span className="px-2 text-slate-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 shrink-0">
                <Calendar className="w-3 h-3 text-slate-400" />
                Day:
              </span>

              <div className="grid grid-cols-4 gap-1 flex-1">
                <button
                  id="btn-day-1"
                  onClick={() => onSelectDay(1)}
                  className={`py-1.5 px-1 rounded-xl text-[11px] font-bold cursor-pointer transition-all text-center truncate ${
                    currentDay === 1
                      ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-xs font-black"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Day 1
                </button>
                <button
                  id="btn-day-3"
                  onClick={() => onSelectDay(3)}
                  className={`py-1.5 px-1 rounded-xl text-[11px] font-bold cursor-pointer transition-all text-center truncate ${
                    currentDay === 3
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs font-black"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Day 3 ⚠️
                </button>
                <button
                  id="btn-day-4"
                  onClick={() => onSelectDay(4)}
                  className={`py-1.5 px-1 rounded-xl text-[11px] font-bold cursor-pointer transition-all text-center truncate ${
                    currentDay === 4
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs font-black"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Day 4 🤝
                </button>
                <button
                  id="btn-day-5"
                  onClick={() => onSelectDay(5)}
                  className={`py-1.5 px-1 rounded-xl text-[11px] font-bold cursor-pointer transition-all text-center truncate ${
                    currentDay === 5
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs font-black"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Day 5 🎉
                </button>
              </div>
            </div>

            {/* Micro Status Badges (Supervisor & Ops) */}
            <div className="mt-2 flex items-center justify-between text-[11px] px-1 text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>
                  <strong className="text-slate-900">{doingWellCount}</strong> On Track
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>
                  <strong className="text-slate-900">{needsAttentionCount}</strong> Attention
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>
                  <strong className="text-slate-900">{atRiskCount}</strong> At Risk
                </span>
              </div>
              <button
                onClick={onOpenLoopModal}
                className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 cursor-pointer"
              >
                <Activity className="w-3 h-3" />
                Loop
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
};
