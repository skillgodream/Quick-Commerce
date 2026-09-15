import React, { useState } from "react";
import {
  Play,
  Dumbbell,
  FlaskConical,
  FileCheck2,
  X,
  Languages,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Sun,
  Bookmark,
  Hash
} from "lucide-react";
import { NewHire, LearnerSection } from "../types";

interface DashboardHeaderProps {
  newHire: NewHire;
  currentDay: number;
  isHindi?: boolean;
  onToggleLanguage?: () => void;
  onSelectSection: (section: LearnerSection) => void;
}

interface PillarDetail {
  id: "learning" | "practice" | "simulation" | "assessment";
  title: string;
  titleHi: string;
  weight: number;
  progressPercent: number;
  metricLabel: string;
  metricLabelHi: string;
  statusBadge: string;
  statusBadgeHi: string;
  statusColor: string;
  onTrack: string;
  onTrackHi: string;
  onTrackClass: string;
  description: string;
  descriptionHi: string;
  currentPerformance: string;
  currentPerformanceHi: string;
  targetBenchmark: string;
  targetBenchmarkHi: string;
  actionGuidance: string;
  actionGuidanceHi: string;
  icon: React.ReactNode;
  accentColor: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  newHire,
  currentDay,
  isHindi = false,
  onToggleLanguage,
  onSelectSection,
}) => {
  const [activePillar, setActivePillar] = useState<PillarDetail | null>(null);

  const firstName = (newHire.name || "Amit").split(" ")[0];
  const modulesDone = newHire.completedModuleIds?.length ?? 0;

  // 4 pillars with rich contextual data
  const pillars: PillarDetail[] = [
    {
      id: "learning",
      title: "Learning",
      titleHi: "लर्निंग",
      weight: 20,
      progressPercent: Math.min(100, Math.round((modulesDone / 19) * 100)),
      metricLabel: `${modulesDone}/19 Modules Completed`,
      metricLabelHi: `${modulesDone}/19 मॉड्यूल पूर्ण`,
      statusBadge: "On Track",
      statusBadgeHi: "ट्रैक पर",
      statusColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
      onTrack: "ON TRACK",
      onTrackHi: "ट्रैक पर",
      onTrackClass: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      description:
        "Digital micro-learning modules covering standard dark store operating procedures, inventory safety, aisle scanning rules, and equipment handling.",
      descriptionHi:
        "डिजिटल माइक्रो-लर्निंग मॉड्यूल जो डार्क स्टोर की मानक संचालन प्रक्रिया, सुरक्षा, शेल्फ स्कैनिंग और उपकरण रखरखाव को कवर करते हैं।",
      currentPerformance: `Completed ${modulesDone} of 19 LMS modules with average quiz accuracy of ${newHire.quizAverageScore ?? 94}%.`,
      currentPerformanceHi: `19 में से ${modulesDone} मॉड्यूल पूरे, क्विज़ में औसत सटीकता ${newHire.quizAverageScore ?? 94}% है।`,
      targetBenchmark: "Complete all 19 LMS modules before Day 10 Certification.",
      targetBenchmarkHi: "डे 10 सर्टिफिकेशन से पहले 19 एलएमएस मॉड्यूल पूरे करें।",
      actionGuidance:
        "Focus on completing 'Cold Room & Dairy Safety' module today to stay ahead of schedule.",
      actionGuidanceHi:
        "समय पर रहने के लिए आज 'कोल्ड रूम व डेयरी सुरक्षा' मॉड्यूल पूरा करें।",
      icon: <Play className="w-4 h-4 fill-current" />,
      accentColor: "#38bdf8",
    },
    {
      id: "practice",
      title: "Practice",
      titleHi: "प्रैक्टिस",
      weight: 25,
      progressPercent: 92,
      metricLabel: "114 PPH (Target: 110)",
      metricLabelHi: "114 PPH (लक्ष्य: 110)",
      statusBadge: "Excellent",
      statusBadgeHi: "उत्कृष्ट",
      statusColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      onTrack: "ON TRACK",
      onTrackHi: "ट्रैक पर",
      onTrackClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      description:
        "Hands-on aisle picking drills, barcode scanner terminal navigation, and physical tote cart handling on the active warehouse floor.",
      descriptionHi:
        "फ्लोर पर लाइव पिकिंग अभ्यास, बारकोड स्कैनर नेविगेशन और कार्ट हैंडलिंग की व्यावहारिक ड्रिल।",
      currentPerformance:
        "Demonstrated 114 Picks Per Hour with 99.1% first-pass scan accuracy across Aisles 1 to 8.",
      currentPerformanceHi:
        "Aisles 1-8 में 114 पिक्स प्रति घंटा की गति और 99.1% स्कैन सटीकता हासिल की।",
      targetBenchmark: "Maintain above 110 Picks Per Hour consistently.",
      targetBenchmarkHi: "लगातार 110 पिक्स प्रति घंटा से अधिक गति बनाए रखें।",
      actionGuidance:
        "Your trolley handling is steady. Practice route efficiency in heavy cereal aisles to minimize step lag.",
      actionGuidanceHi:
        "ट्रॉली हैंडलिंग बहुत अच्छी है। भारी सामान की गलियों में रूट दक्षता और सुधारें।",
      icon: <Hash className="w-4 h-4" />,
      accentColor: "#10b981",
    },
    {
      id: "simulation",
      title: "Simulation",
      titleHi: "सिमुलेशन",
      weight: 25,
      progressPercent: 62,
      metricLabel: "5/8 Challenges Done",
      metricLabelHi: "5/8 अभ्यास पूर्ण",
      statusBadge: "In Progress",
      statusBadgeHi: "सक्रिय",
      statusColor: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      onTrack: "ON TRACK",
      onTrackHi: "ट्रैक पर",
      onTrackClass: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      description:
        "Simulated emergency scenarios, barcode exception resolution, damaged packaging handling, and stockout substitute workflows.",
      descriptionHi:
        "मॉक ऑर्डर्स, क्षतिग्रस्त बारकोड, अनुपलब्ध स्टॉक का विकल्प चुनने और टर्मिनल त्रुटि निवारण के सिमुलेशन।",
      currentPerformance:
        "Cleared 5 of 8 realistic floor challenges with zero critical escalation errors.",
      currentPerformanceHi:
        "8 में से 5 फ्लोर चुनौतियाँ सफलतापूर्वक पूरी कीं।",
      targetBenchmark: "Complete at least 6 interactive challenges before Day 7.",
      targetBenchmarkHi: "डे 7 से पहले कम से कम 6 सिमुलेशन अभ्यास पूरे करें।",
      actionGuidance:
        "Launch 'Heavy Goods & High-Racks' simulation today to clear your remaining verification checkpoint.",
      actionGuidanceHi:
        "अंतिम चेकपॉइंट पार करने के लिए आज 'भारी सामान व उच्च रैक' सिमुलेशन शुरू करें।",
      icon: <FlaskConical className="w-4 h-4" />,
      accentColor: "#a855f7",
    },
    {
      id: "assessment",
      title: "Assessment",
      titleHi: "असेसमेंट",
      weight: 30,
      progressPercent: 66,
      metricLabel: "2/3 Passed",
      metricLabelHi: "2/3 पास",
      statusBadge: "Action Needed",
      statusBadgeHi: "कार्रवाई आवश्यक",
      statusColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      onTrack: "ACTION REQUIRED",
      onTrackHi: "कार्रवाई आवश्यक",
      onTrackClass: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      description:
        "Formal floor audits, supervisor sign-offs, device dock compliance checks, and final solo shift readiness verification.",
      descriptionHi:
        "औपचारिक फ्लोर ऑडिट, सुपरवाइज़र साइन-ऑफ, ज़ेबरा स्कैनर डॉक चेक और सोलो शिफ्ट रेडीनेस वेरिफिकेशन।",
      currentPerformance:
        "Passed Attendance Audit and Buddy Observation. Pending scanner holster battery care sign-off.",
      currentPerformanceHi:
        "उपस्थिति और बडी ऑब्ज़र्वेशन पास। स्कैनर केयर साइन-ऑफ अभी लंबित है।",
      targetBenchmark: "Pass all 3 formal audits with 100% compliance.",
      targetBenchmarkHi: "सभी 3 ऑडिट 100% अनुपालन के साथ पास करें।",
      actionGuidance:
        "Complete the scanner handling check with your coach Vikram to clear this assessment.",
      actionGuidanceHi:
        "यह असेसमेंट पूरा करने के लिए अपने गाइड विक्रम भैया से स्कैनर हैंडलिंग जांच करवाएं।",
      icon: <Bookmark className="w-4 h-4" />,
      accentColor: "#f59e0b",
    },
  ];

  // Progression circle parameters for live readiness score
  const radius = 17;
  const strokeWidth = 3.5;
  const circumference = 2 * Math.PI * radius;
  const rawReadiness = newHire?.overallReadinessScore;
  const progressValue = typeof rawReadiness === "number"
    ? (rawReadiness <= 1 ? Math.round(rawReadiness * 100) : Math.round(rawReadiness))
    : 35;
  const clampedProgress = Math.min(100, Math.max(0, progressValue));
  const strokeDashoffset = circumference - (circumference * clampedProgress) / 100;

  return (
    <>
      <header
        id="dashboard-header-banner"
        className="px-1.5 sm:px-2 pt-1.5 sm:pt-2 pb-2 relative select-none"
      >
        <div className="relative z-10 bg-[#e5e5e5] rounded-[40px] p-5 sm:p-6 shadow-sm border border-slate-200/80 space-y-6">
          {/* Top row: Sun icon + Language Toggle */}
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-full bg-[#1c1c1c] text-white flex items-center justify-center shadow-md">
              <Sun className="w-5 h-5" />
            </div>
            
            {onToggleLanguage && (
              <div className="flex items-center bg-[#e2e1dc]/80 p-1 rounded-full text-[11px] font-bold">
                <button
                  type="button"
                  onClick={onToggleLanguage}
                  className={`px-3 py-1.5 rounded-full transition-all ${
                    !isHindi ? "bg-[#1c1c1c] text-white" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={onToggleLanguage}
                  className={`px-3 py-1.5 rounded-full transition-all ${
                    isHindi ? "bg-[#1c1c1c] text-white" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  हिंदी
                </button>
                </div>
            )}
          </div>

          {/* Title row */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="min-w-0">
              <h1 className="text-3xl font-black tracking-tight text-[#1c1c1c] truncate leading-tight">
                {isHindi ? "रोल रेडीनेस" : "Role Readiness"}
              </h1>
              <p className="text-[13px] font-semibold text-slate-500 tracking-wide mt-1 truncate">
                {isHindi ? "संबद्ध ट्रेनिंग मॉड्यूल्स" : "Affiliated training modules"}
              </p>
            </div>

            {/* Right side: Live circular progress ring */}
            <button
              id="dashboard-role-readiness-circle"
              onClick={() => onSelectSection("control_tower")}
              className="relative w-[60px] h-[60px] shrink-0 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 hover:scale-105 transition-transform cursor-pointer"
            >
              <svg
                className="absolute inset-0 w-full h-full -rotate-90 transform"
                viewBox="0 0 42 42"
              >
                <circle
                  cx="21"
                  cy="21"
                  r={radius}
                  stroke="#1c1c1c"
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <span className="text-[13px] font-black text-[#1c1c1c] tracking-tight z-10">
                {progressValue}%
              </span>
            </button>
          </div>

          {/* Bottom row: 4 interactive circular pillar icons */}
          <div className="grid grid-cols-4 gap-2.5 pt-2">
            {pillars.map((pillar) => (
              <button
                key={pillar.id}
                id={`header-pillar-${pillar.id}`}
                type="button"
                onClick={() => setActivePillar(pillar)}
                className="group flex flex-col items-center justify-center bg-white p-3 rounded-[20px] shadow-sm border border-slate-100 hover:border-slate-300 active:scale-95 transition-all cursor-pointer select-none"
              >
                <div
                  className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center transition-transform group-hover:scale-110 mb-2 text-[#1c1c1c]"
                >
                  {pillar.icon}
                </div>
                <span className="text-[12px] font-black text-[#1c1c1c] truncate max-w-full text-center">
                  {isHindi ? pillar.titleHi : pillar.title}
                </span>
                <span className="text-[10px] font-semibold text-slate-500 mt-1">
                  {pillar.weight}%
                </span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Detail Modal Popup for Clicked Pillar */}
      {activePillar && (
        <div
          id="pillar-detail-modal-overlay"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setActivePillar(null)}
        >
          <div
            id="pillar-detail-modal-card"
            className="bg-[#141824] border border-blue-500/30 text-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl space-y-4 relative overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top decorative glow */}
            <div
              className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-30 pointer-events-none"
              style={{ backgroundColor: activePillar.accentColor }}
            />

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md"
                  style={{
                    backgroundColor: `${activePillar.accentColor}25`,
                    color: activePillar.accentColor,
                    border: `1px solid ${activePillar.accentColor}50`,
                  }}
                >
                  {activePillar.icon}
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {isHindi ? activePillar.titleHi : activePillar.title}
                  </h3>
                  <p className="text-[11px] font-bold text-blue-200/70 uppercase tracking-wider">
                    {isHindi
                      ? `वेटेज: ${activePillar.weight}%`
                      : `Weightage: ${activePillar.weight}% of Total`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActivePillar(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status & Metrics Bar */}
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400 font-semibold">
                  {isHindi ? "स्थिति:" : "Status:"}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${activePillar.statusColor}`}
                >
                  {isHindi ? activePillar.statusBadgeHi : activePillar.statusBadge}
                </span>
              </div>
              <div className="text-right font-black text-cyan-300 text-xs">
                {isHindi ? activePillar.metricLabelHi : activePillar.metricLabel}
              </div>
            </div>

            {/* Pillar Description */}
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {isHindi ? activePillar.descriptionHi : activePillar.description}
            </p>

            {/* Current Performance & Target */}
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 text-blue-300 font-black text-[11px] uppercase tracking-wider">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{isHindi ? "वर्तमान प्रगति" : "Current Performance"}</span>
                </div>
                <p className="text-slate-200 text-xs leading-relaxed">
                  {isHindi
                    ? activePillar.currentPerformanceHi
                    : activePillar.currentPerformance}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 space-y-1">
                <div className="flex items-center gap-1.5 text-cyan-300 font-black text-[11px] uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isHindi ? "लक्ष्य मानदंड" : "Target Benchmark"}</span>
                </div>
                <p className="text-cyan-100 text-xs leading-relaxed">
                  {isHindi
                    ? activePillar.targetBenchmarkHi
                    : activePillar.targetBenchmark}
                </p>
              </div>
            </div>

            {/* Coach Action Guidance */}
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-amber-300 font-black text-[11px] uppercase tracking-wider">
                <ArrowRight className="w-3.5 h-3.5" />
                <span>{isHindi ? "अगला अनुशंसित कदम" : "Recommended Next Action"}</span>
              </div>
              <p className="text-amber-100/90 text-xs leading-relaxed">
                {isHindi
                  ? activePillar.actionGuidanceHi
                  : activePillar.actionGuidance}
              </p>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setActivePillar(null)}
              className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-950/20 active:scale-95 transition-all cursor-pointer hover:from-blue-500 hover:to-cyan-400"
            >
              {isHindi ? "समझ गया ✓" : "Got It ✓"}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
