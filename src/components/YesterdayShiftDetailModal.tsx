import React from "react";
import {
  X,
  Calendar,
  TrendingUp,
  ShieldCheck,
  Package,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Wrench,
  Clock,
  Sparkles,
  Target,
  ArrowRight,
  GraduationCap,
} from "lucide-react";
import { NewHire, DayRecord, DARK_STORE_CAPABILITIES } from "../types";

interface YesterdayShiftDetailModalProps {
  newHire: NewHire;
  currentDay: number;
  isHindi?: boolean;
  onClose: () => void;
  onOpenWorkTools?: () => void;
  onOpenModules?: () => void;
  onOpenBuddy?: () => void;
}

export const YesterdayShiftDetailModal: React.FC<YesterdayShiftDetailModalProps> = ({
  newHire,
  currentDay,
  isHindi = false,
  onClose,
  onOpenWorkTools,
  onOpenModules,
  onOpenBuddy,
}) => {
  const yesterdayNumber = Math.max(1, currentDay - 1);
  const isFirstDay = currentDay === 1;

  const yesterdayRecord: DayRecord | undefined = isFirstDay
    ? undefined
    : newHire.daysHistory.find((d) => d.dayNumber === yesterdayNumber) ||
      newHire.daysHistory.filter((d) => d.dayNumber < currentDay).pop();

  const buddyName = newHire.buddy.split(" ")[0];
  const supervisorName = newHire.supervisor.split(" ")[0];

  // Work metrics
  const prevWork = yesterdayRecord?.workSignal;
  const actualPace = prevWork?.actualPickRate ?? (isFirstDay ? 20 : 32);
  const targetPace = prevWork?.targetPickRate ?? (isFirstDay ? 25 : 35);
  const paceDiff = actualPace - targetPace;
  const accuracy = prevWork?.accuracyRate ?? 99;
  const ordersCompleted = prevWork?.ordersCompleted ?? (isFirstDay ? 15 : 38);
  const targetOrders = prevWork?.targetOrders ?? (isFirstDay ? 20 : 42);

  const prevDailySignal = yesterdayRecord?.dailySignal;
  const prevManagerSignal = yesterdayRecord?.managerSignal;
  const prevActionOutcome = yesterdayRecord?.actionOutcome;

  // Good/Bad status
  const isShiftGood =
    prevActionOutcome?.improved === "yes" || (actualPace >= targetPace && accuracy >= 98);

  // LMS modules snapshot
  const totalModules = 10;
  const completedCount = newHire.modulesCompleted ?? 3;
  const quizAvg = newHire.quizAverageScore ?? 94;

  const trainingScore = Math.min(100, Math.round(((completedCount / 3) * 50 + (quizAvg / 100) * 50)));
  const speedScore = Math.min(100, Math.round((actualPace / targetPace) * 100));
  const accuracyScore = Math.min(100, Math.round(accuracy));
  const ordersScore = Math.min(100, Math.round((ordersCompleted / targetOrders) * 100));

  const compositeScore = Math.round(
    trainingScore * 0.25 + speedScore * 0.30 + accuracyScore * 0.30 + ordersScore * 0.15
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-slate-50 rounded-[32px] max-w-lg w-full p-4 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200">
        
        {/* 1. MODAL HEADER */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-violet-600 text-white flex items-center justify-center font-bold shadow-md">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  {isHindi ? `पूरा शिफ्ट विवरण • दिन ${yesterdayNumber}` : `FULL SHIFT BREAKDOWN • DAY ${yesterdayNumber}`}
                </span>
                <span
                  className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                    isShiftGood
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : "bg-amber-100 text-amber-900 border-amber-300"
                  }`}
                >
                  {isShiftGood ? (isHindi ? "👍 सही रहा" : "👍 GOOD SHIFT") : (isHindi ? "⚠️ सुधार चाहिए" : "⚠️ NEEDS WORK")}
                </span>
              </div>
              <h2 className="text-base font-black text-slate-900 leading-tight mt-0.5">
                {isHindi ? `कल का संपूर्ण कार्य एवं ट्रेनिंग सारांश` : `Yesterday's Complete Work & Training Summary`}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* COMPOSITE 4-PILLAR SCORE BANNER */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 text-white shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-300 block">
                {isHindi ? "समग्र दैनिक प्रदर्शन स्कोर" : "Composite Daily Performance Score"}
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-black text-white">{compositeScore}%</span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {compositeScore >= 80 ? "✓ On Track" : "⚠️ Ramping Steady"}
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-xl font-black text-violet-200">
              🎯
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-white/10 text-center">
            <div className="bg-white/5 rounded-xl p-1.5">
              <span className="text-[9px] text-violet-300 block font-bold">Training 25%</span>
              <span className="text-xs font-black text-white">{trainingScore}%</span>
            </div>
            <div className="bg-white/5 rounded-xl p-1.5">
              <span className="text-[9px] text-violet-300 block font-bold">Speed 30%</span>
              <span className="text-xs font-black text-white">{speedScore}%</span>
            </div>
            <div className="bg-white/5 rounded-xl p-1.5">
              <span className="text-[9px] text-violet-300 block font-bold">Accuracy 30%</span>
              <span className="text-xs font-black text-white">{accuracyScore}%</span>
            </div>
            <div className="bg-white/5 rounded-xl p-1.5">
              <span className="text-[9px] text-violet-300 block font-bold">Orders 15%</span>
              <span className="text-xs font-black text-white">{ordersScore}%</span>
            </div>
          </div>
        </div>

        {/* 2. SECTION 1: WORK PERFORMANCE & FLOOR METRICS */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-violet-600" />
              <span>{isHindi ? "1. फ्लोर वर्क नंबर्स व शिफ्ट मेट्रिक्स" : "1. Floor Work Numbers & Performance"}</span>
            </span>
            <span className="text-[11px] font-bold text-slate-500">
              {yesterdayRecord?.date || `Day ${yesterdayNumber}`}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Metric 1 */}
            <div className="p-2.5 rounded-xl bg-violet-50/70 border border-violet-100 space-y-0.5">
              <span className="text-[10px] font-bold text-violet-700 block">
                {isHindi ? "पिक रफ़्तार" : "Pick Speed"}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-black text-slate-900">{actualPace}</span>
                <span className="text-[10px] text-slate-500 font-bold">/hr</span>
              </div>
              <span className="text-[9px] text-slate-600 font-medium block">
                {isHindi ? `लक्ष्य: ${targetPace}/hr (${paceDiff >= 0 ? `+${paceDiff}` : paceDiff})` : `Goal: ${targetPace}/hr (${paceDiff >= 0 ? `+${paceDiff}` : paceDiff})`}
              </span>
            </div>

            {/* Metric 2 */}
            <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 space-y-0.5">
              <span className="text-[10px] font-bold text-emerald-700 block">
                {isHindi ? "स्कैनिंग एक्यूरेसी" : "Accuracy"}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-black text-slate-900">{accuracy}%</span>
              </div>
              <span className="text-[9px] text-emerald-700 font-bold block">
                ✓ {isHindi ? "0 त्रुटियां" : "0 scan errors"}
              </span>
            </div>

            {/* Metric 3 */}
            <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 space-y-0.5">
              <span className="text-[10px] font-bold text-blue-700 block">
                {isHindi ? "ऑर्डर डिस्पैच" : "Orders Done"}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-black text-slate-900">{ordersCompleted}</span>
                <span className="text-[10px] text-slate-500 font-bold">/{targetOrders}</span>
              </div>
              <span className="text-[9px] text-blue-700 font-semibold block">
                {isHindi ? "100% समय पर" : "100% On-Time"}
              </span>
            </div>
          </div>

          {prevWork?.gapIdentified && (
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-700 flex items-start gap-2">
              <Target className="w-3.5 h-3.5 text-violet-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-slate-900">{isHindi ? "फ्लोर विश्लेषण: " : "Shift Analysis: "}</strong>
                <span>{prevWork.gapIdentified}</span>
              </div>
            </div>
          )}
        </div>

        {/* 3. SECTION 2: LMS & TRAINING MODULES SUMMARY */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-purple-600" />
              <span>{isHindi ? "2. ट्रेनिंग व एलएमएस मॉड्यूल स्थिति" : "2. Training Modules & Quiz Mastery"}</span>
            </span>
            <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
              {completedCount}/{totalModules} {isHindi ? "मॉड्यूल पूरे" : "Completed"}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {/* Module 1 */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900 block">
                    {isHindi ? "स्टोर सुरक्षा, पीपीई व ज़ोन गाइड" : "Store Safety & PPE Guidelines"}
                  </span>
                  <span className="text-[10px] text-slate-500">DSP-01 • Verified Day 1</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                100% {isHindi ? "पास" : "Passed"}
              </span>
            </div>

            {/* Module 2 */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900 block">
                    {isHindi ? "हैंडहेल्ड टर्मिनल व रिंग स्कैनर" : "Handheld Terminal & Ring Scanner"}
                  </span>
                  <span className="text-[10px] text-slate-500">DSP-02 • Verified Day 1</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                95% {isHindi ? "पास" : "Passed"}
              </span>
            </div>

            {/* Module 3 */}
            <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-600 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900 block">
                    {isHindi ? "आइसल, रैक व शेल्फ कोऑर्डिनेट्स" : "Aisle, Rack & Shelf Coordinates"}
                  </span>
                  <span className="text-[10px] text-purple-700 font-semibold">DSP-03 • Completed Day 2</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-md border border-purple-300">
                {quizAvg}% {isHindi ? "क्विज़ स्कोर" : "Quiz Score"}
              </span>
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between text-[11px] text-slate-600">
            <span>
              {isHindi ? `औसत क्विज़ स्कोर: ` : `Average Quiz Score: `}
              <strong className="text-slate-900 font-bold">{quizAvg}%</strong>
            </span>
            {onOpenModules && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenModules();
                }}
                className="font-bold text-purple-700 hover:text-purple-900 underline underline-offset-2 cursor-pointer"
              >
                {isHindi ? "सभी मॉड्यूल देखें →" : "View All Modules →"}
              </button>
            )}
          </div>
        </div>

        {/* 4. SECTION 3: FLOOR CONTEXT, SIGNALS & INTERVENTIONS */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3">
          <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>{isHindi ? "3. फ्लोर सहयोग, साथी व फीडबैक" : "3. Floor Collaboration & Coaching"}</span>
          </span>

          <div className="space-y-2 text-xs">
            {/* Buddy signal */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span>🤝 {isHindi ? `साथी (${buddyName})` : `Floor Buddy (${buddyName})`}</span>
                </span>
                <span className="text-[10px] text-slate-500">
                  {prevDailySignal?.timestamp || "09:30 AM"}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                {prevDailySignal?.rawText ||
                  (isHindi
                    ? "विक्रम भैया के साथ पिकिंग अभ्यास किया। स्पीड में सुधार जारी है।"
                    : "Practiced picking routines with buddy. Pacing and coordinate recognition is building.")}
              </p>
            </div>

            {/* Supervisor signal */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span>📋 {isHindi ? `सुपरवाइजर (${supervisorName})` : `Supervisor (${supervisorName})`}</span>
                </span>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  {prevManagerSignal?.state || "Doing well"}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                {prevManagerSignal?.notes ||
                  (isHindi
                    ? "अच्छी उपस्थिति और फोकस। ऑर्डर एक्यूरेसी 99% मजबूत रही।"
                    : "Good shift attendance. Scanning discipline maintained at 99% accuracy.")}
              </p>
            </div>
          </div>
        </div>

        {/* 5. FOOTER BUTTONS */}
        <div className="flex items-center gap-2 pt-2">
          {onOpenWorkTools && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenWorkTools();
              }}
              className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer transition-all shadow-xs active:scale-98 text-center"
            >
              {isHindi ? "शिफ्ट टूल्स खोलें 🛠️" : "Floor Shift Tools 🛠️"}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold cursor-pointer transition-all active:scale-98"
          >
            {isHindi ? "बंद करें" : "Close"}
          </button>
        </div>

      </div>
    </div>
  );
};
