import React, { useState } from "react";
import {
  Calendar,
  TrendingUp,
  ShieldCheck,
  Package,
  AlertTriangle,
  ArrowRight,
  Volume2,
  Sparkles,
  ThumbsUp,
  FileText,
  BookOpen,
} from "lucide-react";
import { NewHire, DayRecord } from "../types";
import { speakMessage, stopSpeaking } from "../utils/speech";

interface LearnerDailyReportCardProps {
  newHire: NewHire;
  currentDay: number;
  isHindi?: boolean;
  onOpenDashboard?: () => void;
  onOpenDetailedModal?: () => void;
  onOpenWorkTools?: () => void;
  onOpenBuddy?: () => void;
  onOpenModules?: () => void;
  isDashboardVariant?: boolean;
}

export const LearnerDailyReportCard: React.FC<LearnerDailyReportCardProps> = ({
  newHire,
  currentDay,
  isHindi = false,
  onOpenDashboard,
  onOpenDetailedModal,
  isDashboardVariant = false,
}) => {
  const [playingAudio, setPlayingAudio] = useState<boolean>(false);

  // 1. Resolve yesterday's completed day record
  const yesterdayNumber = Math.max(1, currentDay - 1);
  const isFirstDay = currentDay === 1;

  const yesterdayRecord: DayRecord | undefined = isFirstDay
    ? undefined
    : newHire.daysHistory.find((d) => d.dayNumber === yesterdayNumber) ||
      newHire.daysHistory.filter((d) => d.dayNumber < currentDay).pop();

  // 2. Extract key metrics from yesterday
  const prevWork = yesterdayRecord?.workSignal;
  const actualPace = prevWork?.actualPickRate ?? (isFirstDay ? 20 : 32);
  const targetPace = prevWork?.targetPickRate ?? (isFirstDay ? 25 : 35);
  const accuracy = prevWork?.accuracyRate ?? 99;
  const ordersCompleted = prevWork?.ordersCompleted ?? (isFirstDay ? 15 : 38);
  const targetOrders = prevWork?.targetOrders ?? (isFirstDay ? 20 : 42);

  // 3. Four-Pillar Weighted Model Calculation
  const completedCount = newHire.modulesCompleted ?? 3;
  const quizAvg = newHire.quizAverageScore ?? 94;

  const trainingScore = Math.min(100, Math.round(((completedCount / 3) * 50 + (quizAvg / 100) * 50)));
  const speedScore = Math.min(100, Math.round((actualPace / targetPace) * 100));
  const accuracyScore = Math.min(100, Math.round(accuracy));
  const ordersScore = Math.min(100, Math.round((ordersCompleted / targetOrders) * 100));

  const compositeScore = Math.round(
    trainingScore * 0.25 + speedScore * 0.30 + accuracyScore * 0.30 + ordersScore * 0.15
  );

  let statusLabel = isHindi ? "लक्ष्य पर" : "On Track";
  let statusColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (compositeScore < 65) {
    statusLabel = isHindi ? "ध्यान दें" : "Needs Attention";
    statusColor = "bg-red-50 text-red-700 border-red-200";
  } else if (compositeScore < 80) {
    statusLabel = isHindi ? "स्थिर रफ़्तार" : "Ramping Steady";
    statusColor = "bg-amber-50 text-amber-700 border-amber-200";
  }

  const prevDailySignal = yesterdayRecord?.dailySignal;
  const prevPattern = yesterdayRecord?.identifiedPattern;
  const prevActionOutcome = yesterdayRecord?.actionOutcome;

  const isPaceBelow = actualPace < targetPace - 3;
  const isShiftGood = compositeScore >= 75;

  // Audio speech narration
  const handlePlayAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (playingAudio) {
      stopSpeaking();
      setPlayingAudio(false);
      return;
    }

    const text = isHindi
      ? `कल का समग्र प्रदर्शन स्कोर ${compositeScore} प्रतिशत है। ट्रेनिंग ${trainingScore}%, पिकिंग स्पीड ${actualPace} सामान प्रति घंटा, एक्यूरेसी ${accuracy}%, और ${ordersCompleted} ऑर्डर पूरे हुए। स्थिति: ${statusLabel}।`
      : `Yesterday's overall daily performance score is ${compositeScore} percent. Training ${trainingScore} percent, pick rate ${actualPace} items per hour, ${accuracy} percent accuracy, and ${ordersCompleted} orders fulfilled. Status: ${statusLabel}.`;

    setPlayingAudio(true);
    speakMessage(text, isHindi, () => {
      setPlayingAudio(false);
    });
  };

  // Threshold calculations to identify individual underperforming (red) states
  const isTrainingRed = completedCount < 3 || quizAvg < 85;
  const isSpeedRed = actualPace < targetPace;
  const isAccuracyRed = accuracy < 95;
  const isOrdersRed = ordersCompleted < targetOrders;
  const anyCardRed = isTrainingRed || isSpeedRed || isAccuracyRed || isOrdersRed;

  const handleCardClick = () => {
    if (isDashboardVariant && onOpenDetailedModal) {
      onOpenDetailedModal();
    } else if (onOpenDashboard) {
      onOpenDashboard();
    }
  };

  return (
    <div
      id={isDashboardVariant ? "dashboard-yesterday-snapshot-card" : "yesterday-quick-snapshot-card"}
      onClick={handleCardClick}
      className={`rounded-[26px] p-4.5 sm:p-5 border shadow-xl space-y-3.5 cursor-pointer select-none transition-all hover:border-white/40 active:scale-[0.995] ${
        anyCardRed
          ? "border-red-500 bg-gradient-to-br from-[#1e0a0a] to-[#120505] shadow-[0_0_20px_rgba(239,68,68,0.25)] text-white animate-[pulse_3s_infinite]"
          : compositeScore < 65
          ? "border-red-500/40 bg-gradient-to-br from-red-900/20 to-red-950/40 backdrop-blur-md text-white"
          : "border-emerald-500/40 bg-gradient-to-br from-emerald-900/20 to-emerald-950/40 backdrop-blur-md text-white"
      }`}
    >
      {/* 1. HEADER: CLEAN "YESTERDAY SNAPSHOT" + COMPOSITE SCORE RING BADGE */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/10 text-white border border-white/10 flex items-center justify-center font-bold shadow-2xs">
            <Calendar className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <span className="text-lg sm:text-base sm:text-lg font-black uppercase tracking-wider text-white block">
              {isHindi ? "कल का स्नैपशॉट" : "YESTERDAY SNAPSHOT"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Circular badge with 89% without any text */}
          <div className={`w-12 h-12 rounded-full font-black text-sm flex items-center justify-center shadow-xs ${
            anyCardRed
              ? "bg-red-500/20 border border-red-500/40 text-red-300"
              : "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
          }`}>
            89%
          </div>

          
        </div>
      </div>

      {/* 2. 4-PILLAR METRIC GRID TILES */}
      <div className="grid grid-cols-4 gap-2 pt-0.5">
        {/* Pillar 1: Training Completion */}
        <div className={`p-2 rounded-xl flex flex-col justify-between space-y-2 hover:bg-white/5 transition-all ${
          isTrainingRed
            ? "bg-[#2c0f0f] border border-red-500/50 text-red-200 animate-[pulse_1.5s_infinite] shadow-[0_0_12px_rgba(239,68,68,0.5)]"
            : "bg-black/25 border border-white/5 text-slate-300"
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-tighter sm:tracking-wider truncate max-w-[50px] sm:max-w-full tracking-wider ${isTrainingRed ? "text-red-300" : "text-slate-300"}`}>
              {isHindi ? "ट्रेनिंग" : "Training"}
            </span>
            <div className="w-5 h-5 rounded-md hidden sm:flex bg-white/10 border border-white/10 text-purple-300 items-center justify-center shadow-2xs">
              🎓
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-black text-white leading-none">{completedCount}/3</span>
              {isTrainingRed && <span className="text-red-400 font-extrabold text-[10px] ml-1">⚠️</span>}
            </div>
          </div>
        </div>

        {/* Pillar 2: Pick Speed */}
        <div className={`p-2 rounded-xl flex flex-col justify-between space-y-2 hover:bg-white/5 transition-all ${
          isSpeedRed
            ? "bg-[#2c0f0f] border border-red-500/50 text-red-200 animate-[pulse_1.5s_infinite] shadow-[0_0_12px_rgba(239,68,68,0.5)]"
            : "bg-black/25 border border-white/5 text-slate-300"
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-tighter sm:tracking-wider truncate max-w-[50px] sm:max-w-full tracking-wider ${isSpeedRed ? "text-red-300" : "text-slate-300"}`}>
              {isHindi ? "स्पीड" : "Speed"}
            </span>
            <div className="w-5 h-5 rounded-md hidden sm:flex bg-white/10 border border-white/10 text-cyan-300 items-center justify-center shadow-2xs">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-black text-white leading-none">{actualPace}</span>
              {isSpeedRed && <span className="text-red-400 font-extrabold text-[10px] ml-1">⚠️</span>}
            </div>
          </div>
        </div>

        {/* Pillar 3: Scan Accuracy */}
        <div className={`p-2 rounded-xl flex flex-col justify-between space-y-2 hover:bg-white/5 transition-all ${
          isAccuracyRed
            ? "bg-[#2c0f0f] border border-red-500/50 text-red-200 animate-[pulse_1.5s_infinite] shadow-[0_0_12px_rgba(239,68,68,0.5)]"
            : "bg-black/25 border border-white/5 text-slate-300"
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-tighter sm:tracking-wider truncate max-w-[50px] sm:max-w-full tracking-wider ${isAccuracyRed ? "text-red-300" : "text-slate-300"}`}>
              {isHindi ? "एक्यूरेसी" : "Accuracy"}
            </span>
            <div className="w-5 h-5 rounded-md hidden sm:flex bg-white/10 border border-white/10 text-emerald-300 items-center justify-center shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-black text-white leading-none">{accuracy}%</span>
              {isAccuracyRed && <span className="text-red-400 font-extrabold text-[10px] ml-1">⚠️</span>}
            </div>
          </div>
        </div>

        {/* Pillar 4: Orders SLA */}
        <div className={`p-2 rounded-xl flex flex-col justify-between space-y-2 hover:bg-white/5 transition-all ${
          isOrdersRed
            ? "bg-[#2c0f0f] border border-red-500/50 text-red-200 animate-[pulse_1.5s_infinite] shadow-[0_0_12px_rgba(239,68,68,0.5)]"
            : "bg-black/25 border border-white/5 text-slate-300"
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-tighter sm:tracking-wider truncate max-w-[50px] sm:max-w-full tracking-wider ${isOrdersRed ? "text-red-300" : "text-slate-300"}`}>
              {isHindi ? "ऑर्डर" : "Orders"}
            </span>
            <div className="w-5 h-5 rounded-md hidden sm:flex bg-white/10 border border-white/10 text-blue-300 items-center justify-center shadow-2xs">
              <Package className="w-3.5 h-3.5 text-blue-400" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-black text-white leading-none">{ordersCompleted}</span>
              {isOrdersRed && <span className="text-red-400 font-extrabold text-[10px] ml-1">⚠️</span>}
            </div>
          </div>
        </div>
      </div>

      {/* 3. TACTILE ACTION FOOTER */}
      <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
        <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
          {isDashboardVariant ? (
            <>
              <FileText className="w-4 h-4 text-slate-400" />
              <span>{isHindi ? "पूरा विवरण देखें" : "Tap for full shift details"}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-slate-400" />
              <span>{isHindi ? "डैशबोर्ड रिपोर्ट देखें" : "Tap for full details"}</span>
            </>
          )}
        </span>
        <div className="text-xs font-bold text-slate-200 hover:text-white flex items-center gap-1 transition-colors">
          <span>{isHindi ? "विवरण →" : "Details →"}</span>
        </div>
      </div>
    </div>
  );
};
