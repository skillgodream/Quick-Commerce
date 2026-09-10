import React, { useState } from "react";
import {
  CheckCircle2,
  Sparkles,
  Target,
  Award,
  ChevronRight,
  BookOpen,
  UserCheck,
  TrendingUp,
  ShieldCheck,
  Phone,
} from "lucide-react";
import { NewHire } from "../types";
import { deriveLearnerRoadmap, CanonicalRoadmapStage } from "../services/intelligence";
import { speakMessage, stopSpeaking } from "../utils/speech";

interface LearnerJourneyRoadmapProps {
  newHire: NewHire;
  currentDay: number;
  isHindi?: boolean;
  compact?: boolean;
  onNavigateToSection?: (section: "modules" | "buddy" | "dashboard") => void;
  onOpenWorkTools?: () => void;
  onSelectStage?: () => void;
}

export const LearnerJourneyRoadmap: React.FC<LearnerJourneyRoadmapProps> = ({
  newHire,
  currentDay,
  isHindi = false,
  compact = false,
  onNavigateToSection,
  onOpenWorkTools,
  onSelectStage,
}) => {
  const [showFullRoadmapModal, setShowFullRoadmapModal] = useState<boolean>(false);
  const [playingAudio, setPlayingAudio] = useState<boolean>(false);

  // Pure presentation derived directly from authoritative intelligence pipeline
  const roadmapData = deriveLearnerRoadmap(newHire, currentDay);
  const { currentStageIndex, currentStage, stages, readinessScore, destinationEn, destinationHi } = roadmapData;

  // Evaluate Handover Readiness based on authoritative intelligence & overall job readiness principles
  const isHandoverReady =
    readinessScore >= 85 &&
    (newHire.modulesCompleted ?? 0) >= 8 &&
    newHire.status === "Doing well" &&
    currentStageIndex === 5;

  const handoverBlocker = !isHandoverReady
    ? (newHire.modulesCompleted ?? 0) < 3
      ? isHindi
        ? "अनिवार्य सुरक्षा ट्रेनिंग अधूरी है"
        : "Mandatory training incomplete"
      : newHire.status === "At risk" || newHire.status === "Needs attention"
      ? isHindi
        ? "फ्लोर अभ्यास व सहायता जारी है"
        : "Floor practice & support active"
      : currentStageIndex < 5
      ? isHindi
        ? `स्टेज ${currentStage.stageNumber}/6 पर प्रगति जारी है`
        : `Progressing on Stage ${currentStage.stageNumber}/6`
      : isHindi
      ? "स्थिरता व प्रमाणन आवश्यक"
      : "Sustained shift consistency required"
    : undefined;

  const getStageIcon = (key: CanonicalRoadmapStage["key"]) => {
    switch (key) {
      case "training":
        return <BookOpen className="w-4 h-4" />;
      case "capability":
        return <Target className="w-4 h-4" />;
      case "independent":
        return <UserCheck className="w-4 h-4" />;
      case "productivity":
        return <TrendingUp className="w-4 h-4" />;
      case "reliability":
        return <ShieldCheck className="w-4 h-4" />;
      case "job_ready":
        return <Award className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  // Audio speech narration
  const handlePlayAudio = () => {
    if (playingAudio) {
      stopSpeaking();
      setPlayingAudio(false);
      return;
    }
    const text = isHindi
      ? `आपकी जॉब रेडी यात्रा। आप अभी स्टेज ${currentStage.stageNumber}: ${currentStage.titleHi} पर हैं। अगला लक्ष्य: ${currentStage.milestoneHi}। अंतिम मंजिल: ${destinationHi}।`
      : `Your Job-Ready Journey. You are currently at Stage ${currentStage.stageNumber}: ${currentStage.titleEn}. Next milestone: ${currentStage.milestoneEn}. Ultimate destination: ${destinationEn}.`;

    setPlayingAudio(true);
    speakMessage(text, isHindi, () => {
      setPlayingAudio(false);
    });
  };

  if (compact) {
    return (
      <div
        id="learner-job-ready-roadmap-compact"
        className="bg-white rounded-[24px] p-4 border border-slate-200/90 shadow-2xs space-y-3 select-none"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                {isHindi ? "कार्यकुशलता यात्रा" : "Job-Ready Journey"}
              </span>
              <h4 className="text-sm font-black text-slate-900 leading-tight">
                {isHindi
                  ? `स्टेज ${currentStage.stageNumber}: ${currentStage.titleHi}`
                  : `Stage ${currentStage.stageNumber}: ${currentStage.titleEn}`}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onNavigateToSection && onNavigateToSection("buddy")}
              className="p-1.5 rounded-full text-slate-400 hover:text-purple-600 transition-colors cursor-pointer"
              title="Call Buddy"
            >
              <Phone className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (onNavigateToSection) {
                  onNavigateToSection("dashboard");
                } else if (onSelectStage) {
                  onSelectStage();
                } else {
                  setShowFullRoadmapModal(true);
                }
              }}
              className="text-xs font-bold text-violet-700 hover:text-violet-900 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-full flex items-center gap-0.5 cursor-pointer transition-all"
            >
              <span>{isHindi ? "डैशबोर्ड" : "Dashboard"}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 6-segment progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-1.5 pt-0.5">
            {stages.map((stage) => {
              const isCompleted = stage.status === "completed";
              const isCurrent = stage.status === "current";
              return (
                <div
                  key={stage.id}
                  className={`flex-1 h-2.5 rounded-full transition-all ${
                    isCompleted
                      ? "bg-emerald-500"
                      : isCurrent
                      ? "bg-violet-600 ring-2 ring-violet-200"
                      : "bg-slate-200"
                  }`}
                  title={`${stage.stageNumber}. ${isHindi ? stage.titleHi : stage.titleEn}`}
                />
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 pt-0.5 font-medium">
            <span className="truncate">
              <strong className="text-slate-900 font-bold">{isHindi ? "लक्ष्य: " : "Milestone: "}</strong>
              {isHindi ? currentStage.milestoneHi : currentStage.milestoneEn}
            </span>
            <span
              className={`font-black shrink-0 ml-2 px-2.5 py-0.5 rounded-full text-xs border flex items-center gap-1 ${
                isHandoverReady
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-amber-50 text-amber-800 border-amber-200"
              }`}
            >
              {isHandoverReady
                ? isHindi
                  ? "✓ हैंडओवर तैयार"
                  : "✓ Ready for Handover"
                : isHindi
                ? "प्रगति पर"
                : "Building Readiness"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Short stage labels for mobile display
  const shortStageLabelEn = ["Learning", "Practice", "Ready", "Solo", "Speed", "Certified"];
  const shortStageLabelHi = ["सीखना", "अभ्यास", "तैयार", "अकेले", "स्पीड", "सर्टिफाइड"];

  return (
    <div
      id="learner-job-ready-roadmap-card"
      className="bg-transparent rounded-2xl p-2 sm:p-3 border border-white/10 select-none relative"
    >
      {/* 6-STAGE VISUAL PROGRESSION TRACK (JOURNEY PATH ONLY) */}
      <div className="relative pt-3 pb-2">
        {/* Connection line */}
        <div className="absolute top-7 left-4 right-4 h-1 bg-white/20 rounded-full z-0">
          <div
            className="h-full bg-cyan-400 rounded-full transition-all duration-700 shadow-xs"
            style={{
              width: `${(currentStageIndex / (stages.length - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Stage Nodes */}
        <div className="relative z-10 flex items-center justify-between">
          {stages.map((stage, idx) => {
            const isCompleted = stage.status === "completed";
            const isCurrent = stage.status === "current";
            const label = isHindi ? shortStageLabelHi[idx] : shortStageLabelEn[idx];

            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setShowFullRoadmapModal(true)}
                className="flex flex-col items-center group cursor-pointer"
                title={isHindi ? stage.titleHi : stage.titleEn}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isCompleted
                      ? "bg-emerald-400 text-slate-950 shadow-sm"
                      : isCurrent
                      ? "bg-cyan-400 text-slate-950 ring-4 ring-cyan-400/30 shadow-md scale-110"
                      : "bg-white/10 border-2 border-white/20 text-white/90 group-hover:border-white/40"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  ) : isCurrent ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-950 animate-pulse" />
                  ) : (
                    <span className="text-xs font-black">{stage.stageNumber}</span>
                  )}
                </div>
                <span
                  className={`text-[11px] sm:text-xs mt-2 font-bold truncate max-w-[56px] text-center ${
                    isCurrent ? "text-cyan-300 font-black drop-shadow-xs" : isCompleted ? "text-emerald-300" : "text-slate-400"
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* FULL ROADMAP EXPANDED MODAL */}
      {showFullRoadmapModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 text-white rounded-[28px] max-w-md w-full max-h-[88vh] overflow-y-auto p-5 space-y-4 shadow-2xl border border-white/10">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {isHindi ? "जॉब-रेडी रोडमैप (6 चरण)" : "Job-Ready Roadmap (6 Stages)"}
                  </h3>
                  <p className="text-xs text-slate-300 font-medium">
                    {isHindi ? "डार्क स्टोर पिकर बनने का पूरा सफर" : "Your path to Autonomous Dark Store Mastery"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFullRoadmapModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Stages Stack */}
            <div className="space-y-2.5">
              {stages.map((stage) => {
                const isCurrent = stage.status === "current";
                const isCompleted = stage.status === "completed";
                return (
                  <div
                    key={stage.id}
                    className={`rounded-2xl p-3.5 border transition-all ${
                      isCurrent
                        ? "bg-violet-950/40 border-violet-500/40 ring-2 ring-violet-500/20"
                        : isCompleted
                        ? "bg-emerald-950/30 border-emerald-500/30"
                        : "bg-black/20 border-white/5 opacity-75"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                            isCompleted
                              ? "bg-emerald-600 text-white"
                              : isCurrent
                              ? "bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white shadow-xs"
                              : "bg-white/10 text-slate-300"
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : getStageIcon(stage.key)}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white">
                            {isHindi ? stage.titleHi : stage.titleEn}
                          </h4>
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full inline-block mt-0.5 ${
                              isCompleted
                                ? "bg-emerald-500/20 text-emerald-300"
                                : isCurrent
                                ? "bg-purple-500/20 text-purple-300 animate-pulse"
                                : "bg-white/10 text-slate-400"
                            }`}
                          >
                            {isCompleted
                              ? isHindi ? "पूर्ण हुआ ✓" : "Completed ✓"
                              : isCurrent
                              ? isHindi ? "👉 अभी आप यहां हैं" : "👉 YOU ARE HERE"
                              : isHindi ? "आगामी चरण" : "Upcoming Stage"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                      {isHindi ? stage.shortDescHi : stage.shortDescEn}
                    </p>

                    <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                      <Target className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                      <span>
                        <strong className="font-bold text-white">{isHindi ? "लक्ष्य: " : "Milestone: "}</strong>
                        {isHindi ? stage.milestoneHi : stage.milestoneEn}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowFullRoadmapModal(false)}
                className="w-full py-3 bg-white text-slate-950 hover:bg-slate-100 rounded-2xl text-xs font-black shadow-xs cursor-pointer active:scale-98 transition-all"
              >
                {isHindi ? "समझ गया, वापस जाएं" : "Close Roadmap"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
