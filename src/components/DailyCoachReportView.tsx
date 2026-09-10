import React, { useState } from "react";
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  Volume2,
  BookOpen,
} from "lucide-react";
import { NewHire, DayRecord } from "../types";
import { speakMessage, stopSpeaking } from "../utils/speech";
import { assessReadiness } from "../services/intelligence";

interface DailyCoachReportViewProps {
  newHire: NewHire;
  currentDay: number;
  isHindi?: boolean;
  onClose: () => void;
}

export const DailyCoachReportView: React.FC<DailyCoachReportViewProps> = ({
  newHire,
  currentDay,
  isHindi = false,
  onClose,
}) => {
  const [expandedCard, setExpandedCard] = useState<string | null>("yesterday_summary");
  const [playingAudio, setPlayingAudio] = useState<boolean>(false);

  // Resolve yesterday's record or previous session record
  const yesterdayDayNumber = Math.max(1, currentDay - 1);
  const yesterdayRecord: DayRecord | undefined =
    newHire.daysHistory.find((d) => d.dayNumber === yesterdayDayNumber) ||
    newHire.daysHistory[0];

  const workSignal = yesterdayRecord?.workSignal;
  const yOrders = workSignal?.ordersCompleted ?? 38;
  const yActualPace = workSignal?.actualPickRate ?? 42;
  const yTargetPace = workSignal?.targetPickRate ?? 50;
  const yAccuracy = workSignal?.accuracyRate ?? 98;
  const yScanAccuracy = yAccuracy;

  const readiness = typeof newHire.overallReadinessScore === "number"
    ? (newHire.overallReadinessScore <= 1 ? Math.round(newHire.overallReadinessScore * 100) : Math.round(newHire.overallReadinessScore))
    : (newHire.capabilities ? assessReadiness(newHire.capabilities, newHire) : 0);
  const completedModules = newHire.modulesCompleted ?? 3;
  const totalModules = 5;

  const handleAudioSummary = () => {
    if (playingAudio) {
      stopSpeaking();
      setPlayingAudio(false);
      return;
    }
    setPlayingAudio(true);
    const msg = isHindi
      ? `कल की रिपोर्ट (Day ${yesterdayDayNumber}): ऑर्डर ${yOrders}, सटीकता ${yAccuracy} प्रतिशत, और कुल तत्परता ${readiness} प्रतिशत है।`
      : `Yesterday's report for Day ${yesterdayDayNumber}. Orders completed ${yOrders}, accuracy ${yAccuracy} percent, and overall readiness ${readiness} percent.`;
    speakMessage(msg, isHindi, () => setPlayingAudio(false));
  };

  return (
    <div
      id="daily-coach-report-popup"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex justify-center items-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200 font-sans"
    >
      <div className="relative max-w-sm sm:max-w-md w-full bg-[#f4f7fc] text-slate-900 rounded-[36px] shadow-2xl border border-white/80 p-5 sm:p-6 space-y-4 my-auto max-h-[92vh] overflow-y-auto">
        
        {/* Top Header & Close */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-600/10 flex items-center justify-center text-purple-700 font-bold">
              📋
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                {isHindi ? "कल की दैनिक रिपोर्ट" : "Yesterday's Daily Report"}
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                {isHindi ? `Day ${yesterdayDayNumber} शिफ्ट सारांश` : `Day ${yesterdayDayNumber} Shift Summary`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleAudioSummary}
              className="p-2 rounded-full bg-slate-200/85 hover:bg-slate-300 text-purple-700 transition-all cursor-pointer"
              title="Listen aloud"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-200/85 hover:bg-slate-300 text-slate-700 transition-all cursor-pointer"
              title="Close popup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hero Summary Card for Yesterday with Percentage Ring / Dial */}
        <div className="relative bg-gradient-to-br from-indigo-700 via-purple-700 to-fuchsia-700 rounded-3xl p-5 text-white shadow-xl shadow-purple-600/25 overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          
          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between text-xs text-purple-200 font-medium">
              <span>{isHindi ? `Day ${yesterdayDayNumber} निष्पादन` : `Day ${yesterdayDayNumber} Execution`}</span>
              <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                {isHindi ? "समीक्षा पूर्ण" : "Reviewed"}
              </span>
            </div>

            {/* Percentage Ring / Dial */}
            <div className="flex items-center justify-center gap-5 py-1">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-white/20"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-white"
                    strokeDasharray={`${readiness}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-black tracking-tight">{readiness}%</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-white">
                  {isHindi ? "कुल तत्परता स्कोर" : "Overall Readiness"}
                </p>
                <p className="text-[11px] text-purple-200 leading-tight">
                  {isHindi ? "कल के प्रदर्शन के आधार पर अपडेटेड" : "Calculated from yesterday's metrics"}
                </p>
              </div>
            </div>

            {/* Split Metrics: Orders, Accuracy, Pace */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/20 text-center">
              <div className="bg-white/10 rounded-2xl p-2 backdrop-blur-xs">
                <p className="text-[10px] text-purple-200 uppercase font-semibold">Orders</p>
                <p className="text-sm font-black text-white">{yOrders}</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-2 backdrop-blur-xs">
                <p className="text-[10px] text-purple-200 uppercase font-semibold">Accuracy</p>
                <p className="text-sm font-black text-white">{yAccuracy}%</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-2 backdrop-blur-xs">
                <p className="text-[10px] text-purple-200 uppercase font-semibold">Pick Rate</p>
                <p className="text-sm font-black text-white">{yActualPace}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Training Journey Section (Placed right below hero banner) */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                {isHindi ? "ट्रेनिंग जर्नी प्रगति" : "Training Journey Progress"}
              </h4>
            </div>
            <span className="text-xs font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
              {completedModules}/{totalModules}
            </span>
          </div>

          <div className="space-y-2">
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-600 to-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.round((completedModules / totalModules) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {isHindi
                ? `आपने ${completedModules} मॉड्यूल सफलतापूर्वक पूरे कर लिए हैं।`
                : `You have successfully completed ${completedModules} out of ${totalModules} onboarding modules.`}
            </p>
          </div>
        </div>

        {/* Expandable Low-Text Cards (Popup Details) */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
            {isHindi ? "कल के मुख्य बिंदु (Tap to expand)" : "Yesterday's Highlights (Tap to expand)"}
          </h3>

          {/* CARD 1 — WHAT WENT WELL */}
          <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100 transition-all hover:shadow-md">
            <div
              onClick={() => setExpandedCard(expandedCard === "yesterday_summary" ? null : "yesterday_summary")}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-base">
                  🟢
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    {isHindi ? "क्या अच्छा रहा (What went well)" : "What went well"}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {isHindi ? `स्कैनिंग सटीकता ${yScanAccuracy}%` : `Stellar scanning accuracy (${yScanAccuracy}%)`}
                  </p>
                </div>
              </div>
              <button className="text-slate-400">
                {expandedCard === "yesterday_summary" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {expandedCard === "yesterday_summary" && (
              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1.5 animate-in fade-in">
                <p className="font-semibold text-slate-800">Yesterday's Achievement:</p>
                <p className="text-slate-600">
                  {isHindi
                    ? `कल ${yOrders} ऑर्डर सफलतापूर्वक पूरे किए गए। बारकोड स्कैनिंग में किसी प्रकार की त्रुटि नहीं पाई गई।`
                    : `Successfully fulfilled ${yOrders} orders yesterday with zero scanning errors and strong attention to item categorization.`}
                </p>
              </div>
            )}
          </div>

          {/* CARD 2 — NEEDS ATTENTION */}
          <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100 transition-all hover:shadow-md">
            <div
              onClick={() => setExpandedCard(expandedCard === "yesterday_attention" ? null : "yesterday_attention")}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-base">
                  🟠
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    {isHindi ? "ध्यान देने योग्य (Needs attention)" : "Needs attention"}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {isHindi ? `लक्ष्य गति (${yTargetPace}/hr) बनाम वास्तविक (${yActualPace}/hr)` : `Target pace (${yTargetPace}/hr) vs actual (${yActualPace}/hr)`}
                  </p>
                </div>
              </div>
              <button className="text-slate-400">
                {expandedCard === "yesterday_attention" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {expandedCard === "yesterday_attention" && (
              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1.5 animate-in fade-in">
                <p className="font-semibold text-slate-800">Coach Feedback:</p>
                <p className="text-slate-600">
                  {isHindi
                    ? "पिकिंग की गति में थोड़ा सुधार की गुंजाइश थी। पाथ ऑप्टिमाइजेशन का अभ्यास करने से गति बढ़ेगी।"
                    : "Pacing was slightly below shift target during peak hours. Brief aisle navigation practice will bridge this gap."}
                </p>
              </div>
            )}
          </div>

          {/* CARD 3 — NEXT RECOMMENDED STEP */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-3.5 shadow-sm border border-purple-200 transition-all">
            <div
              onClick={() => setExpandedCard(expandedCard === "yesterday_next" ? null : "yesterday_next")}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
                  🎯
                </div>
                <div>
                  <h4 className="text-sm font-bold text-purple-950">
                    {isHindi ? "अगला सुझावित कदम (Next step)" : "Next recommended step"}
                  </h4>
                  <p className="text-xs text-purple-700 font-medium">
                    {isHindi ? "5 मिनट का पाथ प्रैक्टिस" : "5-minute floor practice"}
                  </p>
                </div>
              </div>
              <button className="text-purple-600">
                {expandedCard === "yesterday_next" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {expandedCard === "yesterday_next" && (
              <div className="mt-3 pt-3 border-t border-purple-200/60 text-xs text-purple-900 space-y-1.5 animate-in fade-in">
                <p className="font-semibold">Action item:</p>
                <p className="text-purple-800">
                  {isHindi
                    ? "आज के शिफ्ट की शुरुआत से पहले एक बार 5 मिनट का सिमुलेशन अभ्यास अवश्य करें।"
                    : "Review yesterday's pick route map and complete a 5-minute simulation drill before today's shift starts."}
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Footer Close Button */}
        <div className="pt-1">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
          >
            {isHindi ? "बंद करें (Close Report)" : "Close Report"}
          </button>
        </div>

      </div>
    </div>
  );
};
