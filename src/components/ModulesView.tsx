import React, { useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Lock,
  PlayCircle,
  HelpCircle,
  Cpu,
  Target,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  Award,
  AlertCircle,
  ArrowRight,
  X,
  Check,
  Zap,
  Play,
  ShieldCheck,
  ScanLine,
  MapPin,
  Snowflake,
  PackageCheck,
  Boxes,
  ShoppingCart,
  AlertTriangle,
  Trophy,
  Bell,
  Package,
  Layers,
  Truck,
} from "lucide-react";
import { NewHire, TrainingModule, ModuleActivity, DARK_STORE_CAPABILITIES } from "../types";
import { MANDATORY_TRAINING_MODULES } from "../data/modulesData";

import { CoordinateNavigationModuleView } from "./CoordinateNavigationModuleView";
export function checkDeanModuleGate(mod: TrainingModule, newHire: NewHire): { isGated: boolean; reason: string; correctiveAction: string } {
  const capabilities = newHire.capabilities || {};
  if (newHire.status === "At risk" || newHire.status === "Needs attention") {
    if (mod.dayNumber >= (newHire.currentDay || 3) + 1) {
      return {
        isGated: true,
        reason: `Dean's True Adaptive Hold: Day ${mod.dayNumber} (${mod.code}) is gated because ongoing telemetry indicates active floor friction and unmastered prerequisites.`,
        correctiveAction: `Manager / Buddy Corrective Action: Execute targeted 15-minute 1:1 floor walkthrough before unlocking Day ${mod.dayNumber}.`,
      };
    }
  }
  return { isGated: false, reason: "", correctiveAction: "" };
}

interface ModulesViewProps {
  newHire: NewHire;
  onUpdateHire?: (updatedHire: NewHire) => void;
  isHindi?: boolean;
  initialModuleId?: string | null;
  currentDay?: number;
}

export const ModulesView: React.FC<ModulesViewProps> = ({
  newHire,
  onUpdateHire,
  isHindi = false,
  initialModuleId = null,
  currentDay = 3,
}) => {
  const [activeTab, setActiveTab] = useState<"all" | "foundation" | "floor" | "cert">("all");
  const [activeCapabilityModal, setActiveCapabilityModal] = useState<number | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(
    initialModuleId || `lms-mod-0${Math.min(10, Math.max(1, (newHire.modulesCompleted || 3) + 1))}`
  );
  const [activeDetailModule, setActiveDetailModule] = useState<TrainingModule | null>(
    initialModuleId ? MANDATORY_TRAINING_MODULES.find((m) => m.id === initialModuleId) || null : null
  );
  const [activeActivityModal, setActiveActivityModal] = useState<{
    module: TrainingModule;
    activity: ModuleActivity;
  } | null>(null);
  const [quizAnswerSelected, setQuizAnswerSelected] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [practiceChecked, setPracticeChecked] = useState<boolean>(false);
  const [selectedSkillCategory, setSelectedSkillCategory] = useState<string>("basics");



  const SKILL_CATEGORIES = [
    {
      id: "basics",
      icon: ShieldCheck,
      titleHindi: "बुनियादी बातें और सुरक्षा",
      titleEnglish: "Basics & Safety",
      subtitleHindi: "नेविगेशन और सुरक्षा",
      subtitleEnglish: "Store tools & rules",
      skillIds: [1, 2, 3, 4, 5],
      hasNotification: false,
    },
    {
      id: "accuracy",
      icon: PackageCheck,
      titleHindi: "सटीकता और हैंडलिंग",
      titleEnglish: "Accuracy & Product Handling",
      subtitleHindi: "सही आइटम और पैकिंग",
      subtitleEnglish: "Quality & Packing",
      skillIds: [6, 7, 8, 10],
      hasNotification: false, 
    },
    {
      id: "exceptions",
      icon: AlertTriangle,
      titleHindi: "फ्लोर अपवाद",
      titleEnglish: "Floor Exceptions",
      subtitleHindi: "समस्या का समाधान",
      subtitleEnglish: "Problem solving",
      skillIds: [11, 12, 13, 18],
      hasNotification: false,
    },
    {
      id: "flow",
      icon: Zap,
      titleHindi: "गति और पूर्णता",
      titleEnglish: "Flow & Completion",
      subtitleHindi: "तेजी और डिस्पैच",
      subtitleEnglish: "Speed & Dispatch",
      skillIds: [9, 14, 15, 16, 17, 19],
      hasNotification: false,
    },
  ];

  const modulesCompletedCount = newHire.modulesCompleted ?? 3;
  const capabilities = newHire.capabilities || DARK_STORE_CAPABILITIES;
  const overallReadiness = (typeof newHire.overallReadinessScore === "number" ? (newHire.overallReadinessScore <= 1 ? Math.round(newHire.overallReadinessScore * 100) : Math.round(newHire.overallReadinessScore)) : 0);
  const completedIds = newHire.completedModuleIds || [
    "lms-mod-01",
    "lms-mod-02",
    "lms-mod-03",
  ];
  const quizAvg = newHire.quizAverageScore ?? 94;

  const handleCompleteActivity = (modId: string, actId: string) => {
    // If the learner completes the assessment/final activity, unlock/complete the module
    const currentCompletedCount = newHire.modulesCompleted || 0;
    const mod = MANDATORY_TRAINING_MODULES.find((m) => m.id === modId);
    if (!mod) return;

    if (!completedIds.includes(modId)) {
      const updatedCompletedIds = [...completedIds, modId];
      const newCompletedCount = updatedCompletedIds.length;

      // Update capability exposure (exposure = "exposed" without falsely marking floor mastery)
      const updatedCapabilities = { ...(newHire.capabilities || {}) };
      mod.mappedCapabilityIds.forEach((capId) => {
        if (!updatedCapabilities[capId]) {
          updatedCapabilities[capId] = {
            capabilityId: capId,
            exposure: "exposed",
            evidence: "none",
            performance: "unknown",
            mastery: "in_progress",
            lastAssessedAt: `Day ${mod.dayNumber} LMS Module`,
            reinforcementCount: 0,
          };
        } else if (updatedCapabilities[capId].exposure === "not_exposed") {
          updatedCapabilities[capId] = {
            ...updatedCapabilities[capId],
            exposure: "exposed",
          };
        }
      });

      const updatedHire: NewHire = {
        ...newHire,
        modulesCompleted: newCompletedCount,
        completedModuleIds: updatedCompletedIds,
        capabilities: updatedCapabilities,
      };

      if (onUpdateHire) {
        onUpdateHire(updatedHire);
      }
    }

    setActiveActivityModal(null);
  };

  const getActivityIcon = (type: ModuleActivity["type"]) => {
    switch (type) {
      case "video":
        return <PlayCircle className="w-4 h-4 text-blue-600" />;
      case "quiz":
        return <HelpCircle className="w-4 h-4 text-purple-600" />;
      case "simulation":
        return <Cpu className="w-4 h-4 text-emerald-600" />;
      case "practice":
        return <Target className="w-4 h-4 text-amber-600" />;
      case "assessment":
        return <FileCheck className="w-4 h-4 text-rose-600" />;
    }
  };

  const getActivityTypeName = (type: ModuleActivity["type"]) => {
    switch (type) {
      case "video":
        return isHindi ? "वीडियो पाठ" : "Video Lesson";
      case "quiz":
        return isHindi ? "इंटरएक्टिव क्विज" : "Interactive Quiz";
      case "simulation":
        return isHindi ? "फ्लोर सिमुलेशन" : "Floor Simulation";
      case "practice":
        return isHindi ? "प्रैक्टिकल ड्रिल" : "Floor Practice Drill";
      case "assessment":
        return isHindi ? "मॉड्यूल मूल्यांकन" : "Module Assessment";
    }
  };

  const getModuleDayIcon = (dayNumber: number) => {
    const iconClass = "w-7 h-7 sm:w-8 sm:h-8";
    switch (dayNumber) {
      case 1:
        return <ShieldCheck className={iconClass} />;
      case 2:
        return <ScanLine className={iconClass} />;
      case 3:
        return <Snowflake className={iconClass} />;
      case 4:
        return <ShoppingCart className={iconClass} />;
      case 5:
        return <Boxes className={iconClass} />;
      case 6:
        return <PackageCheck className={iconClass} />;
      case 7:
        return <Zap className={iconClass} />;
      case 8:
        return <FileCheck className={iconClass} />;
      case 9:
        return <Target className={iconClass} />;
      case 10:
        return <Trophy className={iconClass} />;
      default:
        return <BookOpen className={iconClass} />;
    }
  };

  const getModuleShortLabel = (dayNumber: number, hindiMode: boolean) => {
    const map: Record<number, { en: string; hi: string }> = {
      1: { en: "Store Safety", hi: "स्टोर सुरक्षा" },
      2: { en: "Scanner Basics", hi: "स्कैनर बेसिक्स" },
      3: { en: "Location Nav", hi: "लोकेशन नेविगेशन" },
      4: { en: "Cold Room", hi: "कोल्ड रूम" },
      5: { en: "Single Pick", hi: "सिंगल पिक" },
      6: { en: "Variant Check", hi: "वेरिएंट चेक" },
      7: { en: "Weighment", hi: "वजन जांच" },
      8: { en: "Fragile Care", hi: "नाजुक सामान" },
      9: { en: "Batch Pick", hi: "बैच पिक" },
      10: { en: "Certification", hi: "सर्टिफिकेशन" },
    };
    return hindiMode ? map[dayNumber]?.hi || `डे ${dayNumber}` : map[dayNumber]?.en || `Day ${dayNumber}`;
  };

  const filteredModules = MANDATORY_TRAINING_MODULES.filter((mod) => {
    if (activeTab === "foundation") return mod.dayNumber >= 1 && mod.dayNumber <= 3;
    if (activeTab === "floor") return mod.dayNumber >= 4 && mod.dayNumber <= 7;
    if (activeTab === "cert") return mod.dayNumber >= 8 && mod.dayNumber <= 10;
    return true;
  });


  const currentRecord = newHire.daysHistory.find(d => d.dayNumber === currentDay) || newHire.daysHistory[newHire.daysHistory.length - 1];
  const targetCapId = currentRecord?.recommendedAction?.targetCapabilityId;
  const targetCapDef = targetCapId ? DARK_STORE_CAPABILITIES.find(c => c.id === targetCapId) : null;

  const getModulesForCapability = (capId: number) => {
    return MANDATORY_TRAINING_MODULES.filter((m) => m.mappedCapabilityIds.includes(capId));
  };

  const getCapabilityStatus = (capId: number) => {
    const state = newHire.capabilities?.[capId];
    if (!state) return null;
    if (state.mastery === "mastered") return isHindi ? "मजबूत" : "Strong";
    if (state.mastery === "proficient") return isHindi ? "अच्छा" : "Good";
    if (state.performance === "below_target") return isHindi ? "अभ्यास की आवश्यकता है" : "Needs practice";
    if (state.mastery === "in_progress") return isHindi ? "विकासशील" : "Developing";
    return isHindi ? "विकासशील" : "Developing";
  };

  const getCapabilityStatusColor = (statusStr: string | null) => {
    if (statusStr === "Strong" || statusStr === "मजबूत") return "text-emerald-400";
    if (statusStr === "Good" || statusStr === "अच्छा") return "text-emerald-300";
    if (statusStr === "Needs practice" || statusStr === "अभ्यास की आवश्यकता है") return "text-amber-400";
    return "text-pink-400"; // Developing
  };

  const getCapabilityProgressText = (capId: number) => {
    const modules = getModulesForCapability(capId);
    if (modules.length === 0) return isHindi ? "कोई अभ्यास नहीं" : "No practice assigned yet";
    
    let totalAct = 0;
    let compAct = 0;
    modules.forEach((m) => {
        const isModCompleted = completedIds.includes(m.id);
        totalAct += m.activities.length;
        if (isModCompleted) {
            compAct += m.activities.length;
        } else {
            compAct += m.activities.filter(a => a.completed).length;
        }
    });
    
    if (totalAct === 0) return isHindi ? "0 / 0 पूर्ण" : "0 / 0 activities complete";
    if (compAct === totalAct) return isHindi ? "✓ पूर्ण" : "✓ Complete";
    return isHindi ? `${compAct} / ${totalAct} पूर्ण` : `${compAct} / ${totalAct} complete`;
  };
  
  const getCapabilityProgressRatio = (capId: number) => {
    const modules = getModulesForCapability(capId);
    let totalAct = 0;
    let compAct = 0;
    modules.forEach((m) => {
        const isModCompleted = completedIds.includes(m.id);
        totalAct += m.activities.length;
        if (isModCompleted) {
            compAct += m.activities.length;
        } else {
            compAct += m.activities.filter(a => a.completed).length;
        }
    });
    return { compAct, totalAct };
  };

  const capabilitiesToRender = DARK_STORE_CAPABILITIES.filter((cap) => {
      const hasModules = getModulesForCapability(cap.id).length > 0;
      const hasState = !!newHire.capabilities?.[cap.id];
      return hasModules || hasState;
  });

  const unmappedModules = MANDATORY_TRAINING_MODULES.filter((m) => !m.mappedCapabilityIds || m.mappedCapabilityIds.length === 0);

  return (
    <div className="animate-in fade-in duration-200 select-none pb-20 text-white bg-transparent">
      {/* ========================================================= */}
      {/* 1. HERO BANNER CARD (MODULE TRAINING CONTENT & EXACT BG)  */}
      {/* ========================================================= */}
      <div className="p-3 sm:p-4">
        <div 
          id="modules-hero-banner-card"
          className="module-banner-card-bg rounded-[32px] p-5 sm:p-6 text-white shadow-2xl border border-white/15 relative overflow-hidden space-y-4"
        >
          {/* Subtle soft ambient glow matching attachment palette */}
          <div className="absolute -top-14 -left-14 w-52 h-52 bg-blue-500/20 rounded-full blur-3xl pointer-events-none z-0" />
          <div className="absolute -bottom-14 -right-14 w-52 h-52 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none z-0" />

          {/* Real-time flowing visual and subtle halftone mesh dots */}
          <div className="absolute inset-0 dotted-halftone-pattern pointer-events-none opacity-20 z-0" />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0 space-y-3">
              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm leading-tight">
                  {isHindi ? "कोर्स पूर्णता" : "Course Completion"}
                </h2>
              </div>

              {/* Course Progress Bar */}
              <div className="pt-2 space-y-2 max-w-[290px]">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-300 uppercase tracking-widest text-[10px]">
                    {isHindi ? "कोर्स प्रगति" : "Course Progress"}
                  </span>
                  <span className="text-cyan-300 font-black">
                    {modulesCompletedCount} / 10 ({Math.round((modulesCompletedCount / 10) * 100)}%) {isHindi ? "पूर्ण" : "Completed"}
                  </span>
                </div>
                <div className="h-2.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/10 backdrop-blur-md shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 rounded-full transition-all duration-700 ease-out shadow-[0_0_12px_rgba(56,189,248,0.5)]"
                    style={{ width: `${Math.max(6, Math.round((modulesCompletedCount / 10) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Job Readiness Round Dial */}
            <div className="shrink-0 w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center relative mt-1">
              <div className="absolute inset-1.5 rounded-full bg-gradient-to-br from-white/10 via-blue-950/40 to-black/50 border border-white/15 shadow-[inset_0_3px_12px_rgba(255,255,255,0.1)] backdrop-blur-xs" />
              <svg className="w-full h-full -rotate-90 relative z-10" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.15)" strokeWidth="8" fill="transparent" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#34d399"
                  strokeWidth="8"
                  strokeLinecap="round"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 40}
                  strokeDashoffset={2 * Math.PI * 40 * (1 - overallReadiness / 100)}
                  className="transition-all duration-1000 ease-out drop-shadow-[0_0_8px_rgba(52,211,153,0.7)]"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-20">
                <span className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md leading-none font-sans">
                  {overallReadiness}%
                </span>
                <span className="text-[9px] font-black text-emerald-300 uppercase tracking-widest mt-1 drop-shadow-sm">
                  {isHindi ? "तैयार" : "Ready"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content wrapped in padding div to keep aligned */}
      <div className="px-4 pt-1 space-y-4">


      {/* ========================================================= */}
      {/* YOUR CURRENT FOCUS (TARGET CAPABILITY)                      */}
      {/* ========================================================= */}
      {targetCapDef && (
        <div className="bg-[#161820] border border-white/[0.08] rounded-2xl p-3.5 sm:p-4 shadow-lg flex items-center justify-between gap-3 text-white mb-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#0f1117] text-cyan-400 border border-white/[0.08] flex items-center justify-center shrink-0 shadow-xs">
              <Zap className="w-5 h-5 stroke-[1.6]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                  {isHindi ? "आपका वर्तमान ध्यान" : "Your Current Focus"}
                </h4>
              </div>
              <p className="text-[14px] text-cyan-300 font-medium truncate mt-0.5">
                {targetCapDef.name}
              </p>
              <p className="text-xs text-slate-400 font-normal truncate mt-0.5">
                {isHindi ? "अनुशंसित अभ्यास जारी रखें।" : "Continue the recommended practice."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MY JOB SKILLS (4 CATEGORY CARDS)                           */}
      {/* ========================================================= */}
      <div className="flex flex-col gap-3 pb-8 mt-3">
        <div className="flex items-center justify-between px-1 mb-0.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 stroke-[1.6]" />
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              {isHindi ? "सीखने के मेट्रिक्स" : "Learning Metrics"}
            </h3>
          </div>
          <span className="text-[11px] font-normal text-slate-400">
            {isHindi ? "4 श्रेणियां • 19 कौशल" : "4 Categories • 19 Capabilities"}
          </span>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 mb-2 flex gap-3 items-start">
          <BookOpen className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            {isHindi 
              ? "प्रशिक्षण पूरा करने का अर्थ स्वतः ही क्षमता प्रमाणित होना नहीं है। इस पृष्ठ पर दिखाया गया प्रशिक्षण कौशल निर्माण का समर्थन करता है, लेकिन वास्तविक क्षमता की पुष्टि डीन द्वारा फ्लोर के प्रदर्शन से की जाती है।"
              : "Training completion does not automatically equal demonstrated capability. The modules here support skill building, but actual capability is verified by Dean on the floor."}
          </p>
        </div>

        {/* 4 COMPACT CARDS IN 4-GRID PLACEMENT (NO TEXT, SLEEK ICONS) */}
        {/* 4 COMPACT CARDS IN 4-GRID PLACEMENT (NO TEXT, SLEEK ICONS) */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3 my-1">
          {SKILL_CATEGORIES.map((cat) => {
            const isSelected = selectedSkillCategory === cat.id;
            const IconComponent = cat.icon;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedSkillCategory(cat.id)}
                title={isHindi ? `${cat.titleHindi} - ${cat.subtitleHindi}` : `${cat.titleEnglish} - ${cat.subtitleEnglish}`}
                className={`relative aspect-square rounded-2xl sm:rounded-[22px] flex items-center justify-center transition-all duration-200 cursor-pointer select-none active:scale-95 shadow-sm ${
                  isSelected
                    ? "bg-gradient-to-b from-[#00d2ff] via-[#00aaff] to-[#0072ff] text-slate-950 shadow-cyan-500/25 ring-2 ring-cyan-300/60 scale-[1.02]"
                    : "bg-[#181a22] hover:bg-[#20232c] border border-white/[0.08] text-white hover:border-white/20"
                }`}
              >
                {/* Red alert dot if specified */}
                {cat.hasNotification && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#ef4444] shadow-[0_0_6px_#ef4444]" />
                )}

                {/* Centered Sleek Icon Only (Generous size, elegant stroke) */}
                <IconComponent
                  className={`w-8 h-8 sm:w-8.5 sm:h-8.5 transition-transform ${
                    isSelected ? "text-slate-950 stroke-[1.6] scale-105" : "text-white/95 stroke-[1.5]"
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Selected Category Skill Header & View-All Switcher */}
        {(() => {
          const activeCategoryObj = SKILL_CATEGORIES.find((c) => c.id === selectedSkillCategory);
          const skillsToDisplay = selectedSkillCategory === "all"
            ? DARK_STORE_CAPABILITIES
            : DARK_STORE_CAPABILITIES.filter((c) => activeCategoryObj?.skillIds.includes(c.id));

          return (
            <>
              {/* Empty space placeholder preserving layout height without text */}
              <div className="h-4 my-1" aria-hidden="true" />
              
              {selectedSkillCategory === "exceptions" && (
                <div className="mb-4 p-3 bg-[#1a1d27] border border-slate-700/50 rounded-xl">
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    {isHindi 
                      ? "अभी तक कोई समर्पित प्रशिक्षण मॉड्यूल नहीं है — ये कौशल फ्लोर पर सीखे और प्रदर्शित किए जाते हैं।"
                      : "No dedicated training module yet — these skills are learned and demonstrated on the floor."}
                  </p>
                </div>
              )}

              {skillsToDisplay.map((cap) => {
                const statusStr = getCapabilityStatus(cap.id);
                const statusColor = getCapabilityStatusColor(statusStr);
                const progText = getCapabilityProgressText(cap.id);
                const { compAct, totalAct } = getCapabilityProgressRatio(cap.id);
                
                return (
                  <div
                    key={cap.id}
                    onClick={() => setActiveCapabilityModal(cap.id)}
                    className="w-full flex flex-col gap-2 p-3.5 sm:p-4 transition-all duration-200 cursor-pointer select-none bg-[#14161f] border border-white/[0.07] rounded-2xl hover:border-cyan-400/30 shadow-xs"
                  >
                    <div className="flex items-start justify-between w-full">
                      <div className="flex flex-col">
                        <h3 className="text-[14px] sm:text-[15px] font-medium text-slate-100 leading-snug tracking-normal">
                          {cap.name}
                        </h3>
                        {statusStr ? (
                          <span className={`text-[11px] font-medium mt-1 ${statusColor}`}>
                            {statusStr}
                          </span>
                        ) : (
                          <span className="text-[11px] font-normal mt-1 text-slate-400">
                            {isHindi ? "शुरू नहीं हुआ" : "Not started"}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-1.5 flex items-center justify-between">
                      <div className="flex-1 mr-4">
                        <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500" 
                            style={{ width: totalAct > 0 ? `${(compAct / totalAct) * 100}%` : '0%' }}
                          />
                        </div>
                      </div>
                      <span className="text-[11px] font-normal text-slate-400 tracking-wide shrink-0">
                        {progText}
                      </span>
                    </div>
                  </div>
                );
              })}
            </>
          );
        })()}

        {unmappedModules.length > 0 && (
          <>
            <div className="flex items-center gap-2 mb-1 mt-4 px-1">
              <BookOpen className="w-4 h-4 text-pink-400 stroke-[1.6]" />
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                {isHindi ? "अन्य शिक्षा" : "Other Learning"}
              </h3>
            </div>
            {unmappedModules.map((mod) => (
              <div
                key={mod.id}
                onClick={() => {
                  setSelectedModuleId(mod.id);
                  setActiveDetailModule(mod);
                }}
                className="w-full flex flex-col gap-2 p-3.5 transition-all duration-200 cursor-pointer select-none bg-transparent rounded-2xl border border-white/[0.07] hover:bg-white/[0.04]"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-normal text-slate-200">{isHindi && mod.titleHi ? mod.titleHi : mod.title}</h3>
                  <span className="text-white/30 text-base font-light shrink-0">+</span>
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
                    <span className={`text-xs font-bold mt-1.5 block ${statusColor}`}>
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

{modules.length > 0 ? (
                <>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isHindi ? "आपकी शिक्षा" : "Your learning"}</span>
                    <p className="text-[14px] font-semibold text-slate-200">
                      {isHindi ? `${compAct} / ${totalAct} गतिविधियाँ पूर्ण` : `${compAct} / ${totalAct} activities complete`}
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
                </>
              ) : (
                <div className="mb-4 p-4 bg-[#1a1d27] border border-slate-700/50 rounded-xl">
                  <p className="text-sm text-slate-400 leading-relaxed font-medium">
                    {isHindi 
                      ? "अभी तक कोई समर्पित प्रशिक्षण मॉड्यूल नहीं है — ये कौशल फ्लोर पर सीखे और प्रदर्शित किए जाते हैं।"
                      : "No dedicated training module yet — these skills are learned and demonstrated on the floor."}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ========================================================= */}
      {/* 2.5 MODULE DETAIL MODAL                                   */}
      {/* ========================================================= */}
      {activeDetailModule && activeDetailModule.id === "lms-mod-03" && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#F8F7F2]">
          <CoordinateNavigationModuleView
            onClose={() => setActiveDetailModule(null)}
            isHindi={isHindi}
          />
        </div>
      )}

      {activeDetailModule && activeDetailModule.id !== "lms-mod-03" && (
        <div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 text-white">
          <div className="bg-[#1b1e26] rounded-3xl max-w-md w-full p-4 sm:p-5 shadow-2xl border border-white/10 max-h-[88vh] overflow-y-auto space-y-4 animate-in fade-in zoom-in duration-150">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-pink-500/10 text-pink-300 border border-pink-500/20">
                    Day {activeDetailModule.dayNumber} • {activeDetailModule.code}
                  </span>
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {activeDetailModule.durationMinutes} min
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white mt-1">
                  {isHindi && activeDetailModule.titleHi ? activeDetailModule.titleHi : activeDetailModule.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveDetailModule(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {isHindi && activeDetailModule.descriptionHi
                ? activeDetailModule.descriptionHi
                : activeDetailModule.description}
            </p>

            {/* Capability mapping tag */}
            <div className="flex items-center gap-1.5 text-xs text-pink-300 bg-pink-500/10 px-3 py-2 rounded-xl border border-pink-500/25">
              <Zap className="w-3.5 h-3.5 shrink-0 text-pink-450" />
              <span>
                <strong className="font-bold">{isHindi ? "हुनर संबंध:" : "Maps to:"}</strong>{" "}
                {activeDetailModule.mappedCapabilityIds
                  .map((cid) => {
                     const cap = DARK_STORE_CAPABILITIES.find((c) => c.id === cid);
                     return cap ? cap.name : `Cap ${cid}`;
                  })
                  .join(", ")}
              </span>
            </div>

            {checkDeanModuleGate(activeDetailModule, newHire).isGated && (
              <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-amber-300 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs font-black uppercase tracking-wider">Dean Pit-Stop Rule & Gating Active</span>
                </div>
                <p className="text-xs leading-relaxed font-medium">
                  {checkDeanModuleGate(activeDetailModule, newHire).reason}
                </p>
                <div className="p-2 rounded-xl bg-[#13151b] border border-amber-550/20 text-[11px] font-bold text-amber-400">
                  {checkDeanModuleGate(activeDetailModule, newHire).correctiveAction}
                </div>
              </div>
            )}

            {/* 5 Activities */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 px-0.5">
                <span>{isHindi ? "मॉड्यूल गतिविधियां:" : "Module Activities:"}</span>
                <span>{activeDetailModule.activities.length} tasks</span>
              </div>

              {activeDetailModule.activities.map((act) => {
                const isModCompleted = completedIds.includes(activeDetailModule.id);
                const isActCompleted = isModCompleted || act.completed;
                const isModLocked =
                  !isModCompleted &&
                  checkDeanModuleGate(activeDetailModule, newHire).isGated;

                return (
                  <div
                    key={act.id}
                    onClick={() => {
                      if (!isModLocked) {
                        setQuizAnswerSelected(null);
                        setQuizSubmitted(false);
                        setPracticeChecked(false);
                        setActiveActivityModal({ module: activeDetailModule, activity: act });
                      }
                    }}
                    className={`p-3 rounded-2xl flex items-center justify-between transition-all cursor-pointer ${
                      isModLocked
                        ? "bg-white/5 opacity-40 cursor-not-allowed"
                        : isActCompleted
                        ? "bg-[#13151b] border border-white/5 hover:border-pink-500/30"
                        : "bg-[#13151b] border border-pink-500/25 hover:border-pink-500/50 shadow-md"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-black/25 border border-white/5 shrink-0 text-pink-400">
                        {getActivityIcon(act.type)}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-slate-450 block uppercase tracking-wide">
                          {getActivityTypeName(act.type)}
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-white leading-tight block truncate">
                          {isHindi && act.titleHi ? act.titleHi : act.title}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {act.score !== undefined && (
                        <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                          {act.score}%
                        </span>
                      )}
                      {isActCompleted ? (
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/15">
                          ✓ {isHindi ? "पूर्ण" : "Done"}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-pink-300 bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/15 hover:bg-pink-500/20">
                          {isHindi ? "शुरू करें →" : "Start →"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Complete Module Button if Current */}
            {activeDetailModule.dayNumber === modulesCompletedCount + 1 && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    handleCompleteActivity(activeDetailModule.id, activeDetailModule.activities[4].id);
                    setActiveDetailModule(null);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-pink-550 to-rose-600 bg-pink-500 text-white rounded-2xl text-xs font-black shadow-lg hover:opacity-95 cursor-pointer active:scale-98 transition-all flex items-center justify-center gap-2 border border-white/10"
                >
                  <Award className="w-4 h-4 text-white" />
                  <span className="text-white">
                    {isHindi
                      ? `डे ${activeDetailModule.dayNumber} मॉड्यूल पूरा मार्क करें`
                      : `Complete Day ${activeDetailModule.dayNumber} Module`}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. INTERACTIVE ACTIVITY MODAL                             */}
      {/* ========================================================= */}
      {activeActivityModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 text-white">
          <div className="bg-[#1b1e26] rounded-3xl max-w-sm w-full p-4 sm:p-5 shadow-2xl border border-white/10 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-pink-500/15 text-pink-400 flex items-center justify-center border border-pink-500/25">
                  {getActivityIcon(activeActivityModal.activity.type)}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    {activeActivityModal.module.code} • {getActivityTypeName(activeActivityModal.activity.type)}
                  </span>
                  <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-1">
                    {isHindi && activeActivityModal.activity.titleHi
                      ? activeActivityModal.activity.titleHi
                      : activeActivityModal.activity.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setActiveActivityModal(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* VIDEO ACTIVITY CONTENT */}
            {activeActivityModal.activity.type === "video" && (
              <div className="space-y-3 text-xs text-slate-300">
                <div className="aspect-video bg-black/50 rounded-2xl flex flex-col items-center justify-center text-white p-4 text-center relative overflow-hidden border border-white/5">
                  <PlayCircle className="w-10 h-10 text-pink-400 mb-1 animate-pulse" />
                  <span className="font-bold text-xs">{activeActivityModal.activity.title}</span>
                  <span className="text-[10px] text-slate-450">Duration: {activeActivityModal.activity.durationMinutes} mins</span>
                </div>
                <div className="p-3 bg-[#13151b] rounded-2xl border border-white/5 space-y-1">
                  <span className="font-bold text-white block">
                    {isHindi ? "वीडियो सारांश व मुख्य नियम:" : "Key Takeaways:"}
                  </span>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    {isHindi
                      ? "1. हमेशा सेफ्टी शूज व ग्लव्स पहनें। 2. रैक से सामान उठाते समय नंबर क्रॉस-वेरिफाई करें।"
                      : "1. Follow standard aisle traffic rules. 2. Verify shelf rack-bay coordinates before picking."}
                  </p>
                </div>
                <button
                  onClick={() => setActiveActivityModal(null)}
                  className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-2xl text-xs font-black cursor-pointer border border-white/10"
                >
                  {isHindi ? "पाठ पूरा हुआ 👍" : "Mark Video Watched 👍"}
                </button>
              </div>
            )}

            {/* QUIZ ACTIVITY CONTENT */}
            {activeActivityModal.activity.type === "quiz" && (
              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-3 bg-[#13151b] border border-pink-500/20 rounded-2xl space-y-1">
                  <span className="font-bold text-pink-300 block">
                    {isHindi ? "प्रश्न 1:" : "Question 1 of 1:"}
                  </span>
                  <p className="text-xs font-medium text-white">
                    {isHindi
                      ? "टोट पैक करते समय भारी सामान (जैसे आटा, तेल) कहां रखना चाहिए?"
                      : "When packing a tote, where should heavy items (flour, oil cans) always be placed?"}
                  </p>
                </div>

                <div className="space-y-1.5">
                  {[
                    { en: "At the very bottom of the tote", hi: "टोट के सबसे नीचे तली में" },
                    { en: "On top of bread and eggs", hi: "ब्रेड और अंडों के ऊपर" },
                    { en: "In any random order", hi: "बिना किसी क्रम के कहीं भी" },
                  ].map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setQuizAnswerSelected(idx)}
                      className={`w-full p-2.5 rounded-2xl border text-left text-xs font-medium transition-all cursor-pointer ${
                        quizAnswerSelected === idx
                          ? "bg-pink-500 text-white border-transparent shadow-xs font-black"
                          : "bg-[#13151b] text-slate-200 border-white/5 hover:bg-white/5"
                      }`}
                    >
                      {idx === 0 ? "A" : idx === 1 ? "B" : "C"}. {isHindi ? opt.hi : opt.en}
                    </button>
                  ))}
                </div>

                {quizAnswerSelected !== null && !quizSubmitted && (
                  <button
                    onClick={() => setQuizSubmitted(true)}
                    className="w-full py-2.5 bg-pink-500 text-white rounded-2xl text-xs font-black cursor-pointer hover:bg-pink-400 border border-white/10"
                  >
                    {isHindi ? "उत्तर जमा करें" : "Submit Answer"}
                  </button>
                )}

                {quizSubmitted && (
                  <div className="p-3 bg-emerald-550/10 border border-emerald-500/25 rounded-2xl space-y-1 text-center">
                    <span className="text-xs font-bold text-emerald-400 block">
                      {quizAnswerSelected === 0
                        ? isHindi ? "✅ सही उत्तर! 100% स्कोर" : "✅ Correct! 100% Score"
                        : isHindi ? "❌ गलत उत्तर। भारी सामान हमेशा नीचे रहता है।" : "❌ Incorrect. Heavy items always go at the bottom."}
                    </span>
                    <button
                      onClick={() => setActiveActivityModal(null)}
                      className="mt-1 px-4 py-1.5 bg-emerald-600 text-white rounded-full text-xs font-bold cursor-pointer hover:bg-emerald-500"
                    >
                      {isHindi ? "जारी रखें" : "Continue"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* SIMULATION ACTIVITY CONTENT */}
            {activeActivityModal.activity.type === "simulation" && (
              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-3 bg-[#13151b] border border-pink-500/20 rounded-2xl space-y-1">
                  <span className="font-bold text-pink-300 block">
                    {isHindi ? "3D वर्चुअल सिमुलेशन टास्क:" : "Virtual Simulation Task:"}
                  </span>
                  <p className="text-[11px] text-slate-200 leading-snug">
                    {isHindi
                      ? "आइसल 5, बे 2, शेल्फ B पर जाएं और 1 किलो चीनी का बारकोड स्कैन करें।"
                      : "Navigate to Aisle 5, Bay 2, Shelf B and aim scanner at 1kg Sugar pouch."}
                  </p>
                </div>
                <div className="p-4 bg-black/45 text-emerald-400 rounded-2xl font-mono text-[11px] space-y-1 border border-white/5">
                  <div>&gt; Locating bin: A05-B02-S02... OK</div>
                  <div>&gt; Aiming ring laser at SKU: 890123456... OK</div>
                  <div>&gt; Barcode verified: MATCH (1000g)</div>
                </div>
                <button
                  onClick={() => setActiveActivityModal(null)}
                  className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-2xl text-xs font-black cursor-pointer border border-white/10"
                >
                  {isHindi ? "सिमुलेशन पास हुआ ✅" : "Pass Simulation Step ✅"}
                </button>
              </div>
            )}

            {/* PRACTICE / ASSESSMENT CONTENT */}
            {(activeActivityModal.activity.type === "practice" ||
              activeActivityModal.activity.type === "assessment") && (
              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-3 bg-[#13151b] border border-pink-500/20 rounded-2xl space-y-1">
                  <span className="font-bold text-pink-300 block">
                    {isHindi ? "फ्लोर प्रैक्टिकल चेकलिस्ट:" : "Floor Practice Verification:"}
                  </span>
                  <p className="text-[11px] text-slate-200 leading-snug">
                    {isHindi
                      ? "सीनियर बडी के साथ 10-मिनट का अभ्यास पूरा करें और चेकलिस्ट टिक करें।"
                      : "Perform practical drill with senior floor buddy and confirm completion."}
                  </p>
                </div>

                <label className="flex items-center gap-2.5 p-3 bg-[#13151b] border border-white/10 rounded-2xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={practiceChecked}
                    onChange={(e) => setPracticeChecked(e.target.checked)}
                    className="w-4 h-4 text-pink-500 bg-black border-white/15 rounded-md focus:ring-pink-500"
                  />
                  <span className="text-xs font-medium text-slate-200">
                    {isHindi
                      ? "मैंने सभी स्टेप्स बडी के साथ अभ्यास कर लिए हैं"
                      : "I have completed all drill steps with my buddy"}
                  </span>
                </label>

                <button
                  disabled={!practiceChecked}
                  onClick={() =>
                    handleCompleteActivity(
                      activeActivityModal.module.id,
                      activeActivityModal.activity.id
                    )
                  }
                  className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-2xl text-xs font-black disabled:opacity-40 cursor-pointer shadow-md border border-white/10"
                >
                  {isHindi ? "ड्रिल पूर्ण मार्क करें ✅" : "Mark Activity Complete ✅"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}


      </div>
    </div>
  );
};
