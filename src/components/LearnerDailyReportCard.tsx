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
  if (compositeScore < 65) {
    statusLabel = isHindi ? "ध्यान दें" : "Needs Attention";
  } else if (compositeScore < 80) {
    statusLabel = isHindi ? "स्थिर रफ़्तार" : "Ramping Steady";
  }

  const isTrainingRed = completedCount < 3 || quizAvg < 85;
  const isSpeedRed = actualPace < targetPace;
  const isAccuracyRed = accuracy < 95;
  const isOrdersRed = ordersCompleted < targetOrders;
  const anyCardRed = isTrainingRed || isSpeedRed || isAccuracyRed || isOrdersRed;

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

  const handleCardClick = () => {
    if (isDashboardVariant && onOpenDetailedModal) {
      onOpenDetailedModal();
    } else if (onOpenDashboard) {
      onOpenDashboard();
    }
  };

  if (isDashboardVariant) {
    return (
      <div 
        id="dashboard-yesterday-snapshot-card"
        onClick={handleCardClick}
        className="mb-6 bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 cursor-pointer active:scale-[0.99] transition-transform"
      >
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <div className="w-[52px] h-[52px] rounded-[18px] bg-[#f0eee4] flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6 text-black stroke-[1.5]" />
            </div>
            <div className="pt-0.5">
              <h3 className="text-2xl font-black text-black leading-none tracking-tight mb-1">
                {isHindi ? "कल का" : "Yesterday"}<br/>{isHindi ? "स्नैपशॉट" : "snapshot"}
              </h3>
              <p className="text-[14px] text-slate-500 font-medium leading-snug">
                {isHindi ? `दिन ${Math.max(1, currentDay - 1)} शिफ्ट` : `Day ${Math.max(1, currentDay - 1)} shift`}<br/>{isHindi ? "निष्पादन और मेट्रिक्स" : "execution & metrics"}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <button 
              type="button" 
              onClick={handlePlayAudio}
              className="w-11 h-11 rounded-2xl bg-[#f0eee4] flex items-center justify-center hover:bg-[#e4e2d8] transition-colors"
            >
              <Volume2 className="w-5 h-5 text-black stroke-[2]" />
            </button>
            <div className="px-3.5 py-1.5 bg-[#111111] text-white rounded-full text-[15px] font-black tracking-wide shadow-sm">
              {compositeScore}%
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2.5 mb-6">
          {/* TRAINING */}
          <div className="bg-[#f0eee4] rounded-[22px] p-3 flex flex-col items-center text-center justify-between h-[116px]">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">
              TRAI...
            </span>
            <span className="text-3xl font-black text-black leading-none my-1 tracking-tight">
              {completedCount}/3
            </span>
            <span className="text-[12px] font-medium text-slate-600 leading-tight mb-1">
              {quizAvg}%<br/>quiz
            </span>
          </div>
          {/* SPEED */}
          <div className={`rounded-[22px] p-3 flex flex-col items-center text-center justify-between h-[116px] ${isSpeedRed ? "bg-[#f0eee4]" : "bg-[#f0eee4]"}`}>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">
              SPEED
            </span>
            <div className="flex items-center gap-1 my-1">
              <span className={`text-3xl font-black leading-none tracking-tight ${isSpeedRed ? "text-black" : "text-black"}`}>
                {actualPace}
              </span>
              {isSpeedRed && <AlertTriangle className="w-[18px] h-[18px] text-[#db4a39] stroke-[2.5]" />}
            </div>
            <span className="text-[12px] font-medium text-slate-600 leading-tight mb-1">
              target<br/>{targetPace}/h
            </span>
          </div>
          {/* ACCURACY */}
          <div className="bg-[#f0eee4] rounded-[22px] p-3 flex flex-col items-center text-center justify-between h-[116px]">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">
              ACC...
            </span>
            <span className="text-3xl font-black text-black leading-none my-1 tracking-tight">
              {accuracy}%
            </span>
            <span className="text-[12px] font-medium text-slate-600 leading-tight mb-1">
              <br/>Verified
            </span>
          </div>
          {/* ORDERS */}
          <div className={`rounded-[22px] p-3 flex flex-col items-center text-center justify-between h-[116px] ${isOrdersRed ? "bg-[#f0eee4]" : "bg-[#f0eee4]"}`}>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">
              ORDE...
            </span>
            <div className="flex items-center gap-1 my-1">
              <span className={`text-3xl font-black leading-none tracking-tight ${isOrdersRed ? "text-black" : "text-black"}`}>
                {ordersCompleted}
              </span>
              {isOrdersRed && <AlertTriangle className="w-[18px] h-[18px] text-[#db4a39] stroke-[2.5]" />}
            </div>
            <span className="text-[12px] font-medium text-slate-600 leading-tight mb-1">
              target<br/>{targetOrders}
            </span>
          </div>
        </div>

        <div className="border-t border-[#e5e5e5] pt-5 flex items-center justify-between">
          <div className="flex items-start gap-2.5">
            <FileText className="w-[18px] h-[18px] shrink-0 mt-0.5 text-slate-500 stroke-[1.5]" />
            <span className="text-[14px] font-medium max-w-[170px] leading-snug text-slate-600">
              {isHindi ? "विस्तृत रिपोर्ट देखें" : "Tap for full shift details & breakdown"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 pr-1">
            <span className="text-[16px] font-black text-black">{isHindi ? "विवरण" : "Details"}</span>
            <ArrowRight className="w-5 h-5 text-black stroke-[3]" />
          </div>
        </div>
      </div>
    );
  }

  // Fallback to the dark mode card for other contexts (e.g. today's goals landing view)
  return (
    <div
      id="yesterday-quick-snapshot-card"
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
          {/* Circular badge with compositeScore% without any text */}
          <div className={`w-12 h-12 rounded-full font-black text-sm flex items-center justify-center shadow-xs ${
            anyCardRed
              ? "bg-red-500/20 border border-red-500/40 text-red-300"
              : "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
          }`}>
            {compositeScore}%
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
          <Sparkles className="w-4 h-4 text-slate-400" />
          <span>{isHindi ? "डैशबोर्ड रिपोर्ट देखें" : "Tap for full details"}</span>
        </span>
        <div className="text-xs font-bold text-slate-200 hover:text-white flex items-center gap-1 transition-colors">
          <span>{isHindi ? "विवरण →" : "Details →"}</span>
        </div>
      </div>
    </div>
  );
};
