import React, { useState } from "react";
import {
  Zap,
  Target,
  Award,
  Lightbulb,
  ScanLine,
  Phone,
  Radio,
  Sliders,
  Sparkles,
} from "lucide-react";

interface CircularDialWidgetProps {
  pickRate: number;
  targetPickRate: number;
  accuracyRate: number;
  readinessScore?: number;
  onCallBuddy?: () => void;
  onScannerFix?: () => void;
  onAisleMap?: () => void;
  onOpenTarget?: () => void;
  isHindi?: boolean;
}

export type DialMode = "speed" | "accuracy" | "readiness";

export const CircularDialWidget: React.FC<CircularDialWidgetProps> = ({
  pickRate = 35,
  targetPickRate = 50,
  accuracyRate = 98,
  readinessScore,
  onCallBuddy,
  onScannerFix,
  onAisleMap,
  onOpenTarget,
  isHindi = false,
}) => {
  const [mode, setMode] = useState<DialMode>("speed");
  const [terminalConnected, setTerminalConnected] = useState<boolean>(true);
  const [activeCircleAction, setActiveCircleAction] = useState<string>("gauge");

  // Determine value and max for the dial based on mode
  let currentValue = pickRate;
  let targetValue = targetPickRate;
  let unit = isHindi ? "सामान/घंटा" : "picks/hr";
  let modeLabel = isHindi ? "पिक स्पीड" : "Pick Speed";
  let statusBadge = pickRate >= targetPickRate ? "Target Met" : "Ramping Steady";

  if (mode === "accuracy") {
    currentValue = accuracyRate;
    targetValue = 100;
    unit = "%";
    modeLabel = isHindi ? "स्कैन एक्यूरेसी" : "Scan Accuracy";
    statusBadge = accuracyRate >= 95 ? "Excellent (98%)" : "Needs Care";
  } else if (mode === "readiness") {
    currentValue = readinessScore ?? 0;
    targetValue = 100;
    unit = readinessScore !== undefined ? "% ready" : (isHindi ? "अनुपलब्ध" : "Unavailable");
    modeLabel = isHindi ? "फ्लोर रेडीनेस" : "Floor Readiness";
    statusBadge = readinessScore !== undefined
      ? (readinessScore >= 70 ? "On Track" : "Attention")
      : (isHindi ? "पर्याप्त साक्ष्य नहीं" : "Not enough evidence");
  }

  // Calculate angle for SVG arc (240 degree sweep from -120 to +120 or full 360)
  const percentage = Math.min(100, Math.max(0, (currentValue / targetValue) * 100));
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  // Sweep around 280 degrees for an open gauge, or 360
  const sweepDegree = 280;
  const strokeDashoffset = circumference - (percentage / 100) * (sweepDegree / 360) * circumference;

  // Generate 28 tick marks around the perimeter
  const totalTicks = 32;
  const ticks = Array.from({ length: totalTicks }).map((_, i) => {
    // Start angle at 130 deg, sweep around to 410 deg (280 degree arc)
    const angle = 130 + (i / (totalTicks - 1)) * sweepDegree;
    const rad = (angle * Math.PI) / 180;
    const x1 = 100 + 82 * Math.cos(rad);
    const y1 = 100 + 82 * Math.sin(rad);
    const x2 = 100 + 90 * Math.cos(rad);
    const y2 = 100 + 90 * Math.sin(rad);
    const isActive = (i / (totalTicks - 1)) * 100 <= percentage;
    return { x1, y1, x2, y2, isActive, key: i };
  });

  return (
    <div
      id="circular-telemetry-dial-widget"
      className="bg-white/10 backdrop-blur-md rounded-[28px] p-4 sm:p-5 border border-white/20 shadow-xl space-y-4 select-none relative overflow-hidden text-white"
    >
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-cyan-400/10 via-purple-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />

      {/* 1. Mode Pill Selector */}
      <div className="flex items-center justify-center gap-1.5 bg-black/30 p-1 rounded-full max-w-xs mx-auto border border-white/10">
        <button
          onClick={() => setMode("speed")}
          className={`flex-1 py-1 px-2.5 rounded-full text-xs font-bold transition-all cursor-pointer truncate ${
            mode === "speed"
              ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-xs"
              : "text-slate-200 hover:text-white"
          }`}
        >
          {isHindi ? "⚡ स्पीड" : "⚡ Speed"}
        </button>
        <button
          onClick={() => setMode("accuracy")}
          className={`flex-1 py-1 px-2.5 rounded-full text-xs font-bold transition-all cursor-pointer truncate ${
            mode === "accuracy"
              ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-xs"
              : "text-slate-200 hover:text-white"
          }`}
        >
          {isHindi ? "🎯 एक्यूरेसी" : "🎯 Accuracy"}
        </button>
        <button
          onClick={() => setMode("readiness")}
          className={`flex-1 py-1 px-2.5 rounded-full text-xs font-bold transition-all cursor-pointer truncate ${
            mode === "readiness"
              ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-xs"
              : "text-slate-200 hover:text-white"
          }`}
        >
          {isHindi ? "📈 रेडीनेस" : "📈 Readiness"}
        </button>
      </div>

      {/* 2. Four Quick Action Circular Buttons */}
      <div className="flex items-center justify-center gap-4 pt-1">
        {/* Action 1: Aisle Light / Map */}
        <button
          onClick={() => {
            setActiveCircleAction("light");
            if (onAisleMap) onAisleMap();
          }}
          title={isHindi ? "आइसल मैप" : "Aisle Guide"}
          className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
            activeCircleAction === "light"
              ? "bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 border-transparent shadow-md shadow-cyan-500/30 scale-105 font-bold"
              : "bg-white/10 text-white border-white/10 hover:border-white/30 hover:bg-white/20"
          }`}
        >
          <Lightbulb className="w-4 h-4" />
        </button>

        {/* Action 2: Scanner Lock / Fix */}
        <button
          onClick={() => {
            setActiveCircleAction("scanner");
            if (onScannerFix) onScannerFix();
          }}
          title={isHindi ? "स्कैनर चेक" : "Scanner Terminal"}
          className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
            activeCircleAction === "scanner"
              ? "bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 border-transparent shadow-md shadow-cyan-500/30 scale-105 font-bold"
              : "bg-white/10 text-white border-white/10 hover:border-white/30 hover:bg-white/20"
          }`}
        >
          <ScanLine className="w-4 h-4" />
        </button>

        {/* Action 3: Gauge / Pace Goal */}
        <button
          onClick={() => {
            setActiveCircleAction("gauge");
            if (onOpenTarget) onOpenTarget();
          }}
          title={isHindi ? "पिक टारगेट" : "Ramp Target"}
          className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
            activeCircleAction === "gauge"
              ? "bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 border-transparent shadow-md shadow-cyan-500/30 scale-105 font-bold"
              : "bg-white/10 text-white border-white/10 hover:border-white/30 hover:bg-white/20"
          }`}
        >
          <Target className="w-4 h-4" />
        </button>

        {/* Action 4: Floor Buddy */}
        <button
          onClick={() => {
            setActiveCircleAction("buddy");
            if (onCallBuddy) onCallBuddy();
          }}
          title={isHindi ? "विक्रम भैया को बुलाएं" : "Call Floor Buddy"}
          className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
            activeCircleAction === "buddy"
              ? "bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 border-transparent shadow-md shadow-cyan-500/30 scale-105 font-bold"
              : "bg-white/10 text-white border-white/10 hover:border-white/30 hover:bg-white/20"
          }`}
        >
          <Phone className="w-4 h-4" />
        </button>
      </div>

      {/* 3. The Circular Dial / Gauge */}
      <div className="relative flex items-center justify-center py-2">
        <svg
          viewBox="0 0 200 200"
          className="w-56 h-56 max-w-full drop-shadow-sm select-none"
        >
          <defs>
            <linearGradient id="purplePinkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
            <linearGradient id="centerCircleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0891b2" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
            <filter id="purpleGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#06b6d4" floodOpacity="0.35" />
            </filter>
          </defs>

          {/* Radial Tick Marks */}
          {ticks.map((tick) => (
            <line
              key={tick.key}
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
              stroke={tick.isActive ? "#22d3ee" : "rgba(255, 255, 255, 0.15)"}
              strokeWidth={tick.isActive ? "2.5" : "1.8"}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          ))}

          {/* Background Track Arc */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="5"
            strokeDasharray={`${(sweepDegree / 360) * circumference} ${circumference}`}
            transform="rotate(130 100 100)"
            strokeLinecap="round"
          />

          {/* Active Gradient Arc */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="url(#purplePinkGradient)"
            strokeWidth="5"
            strokeDasharray={`${(sweepDegree / 360) * circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(130 100 100)"
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />

          {/* Glowing Center Disc */}
          <circle
            cx="100"
            cy="100"
            r="46"
            fill="url(#centerCircleGradient)"
            filter="url(#purpleGlow)"
          />

          {/* Center Text (Value & Unit) */}
          <text
            x="100"
            y="94"
            textAnchor="middle"
            dominantBaseline="central"
            fill="#ffffff"
            className="font-black text-3xl tracking-tight"
            style={{ fontWeight: 900 }}
          >
            {mode === "readiness" && readinessScore === undefined ? "N/A" : currentValue}
            {(mode === "accuracy" || (mode === "readiness" && readinessScore !== undefined)) ? "%" : ""}
          </text>
          <text
            x="100"
            y="118"
            textAnchor="middle"
            dominantBaseline="central"
            fill="#e0f2fe"
            className="text-[9px] font-bold tracking-wider uppercase"
          >
            {unit}
          </text>
        </svg>

        {/* Floating Indicator Pill at Bottom */}
        <div className="absolute bottom-1 bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 shadow-xs flex items-center gap-1.5 text-xs font-bold text-white">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{statusBadge}</span>
        </div>
      </div>

      {/* 4. Terminal / Station Connection Row with Purple Toggle */}
      <div className="bg-black/30 rounded-2xl p-3.5 border border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-cyan-950 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-800/30">
            <Radio className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-white truncate leading-tight">
              {isHindi ? "हैंडहेल्ड टर्मिनल #104" : "Zebra Terminal #104"}
            </h4>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              {terminalConnected
                ? isHindi
                  ? "फ्लोर वाई-फाई कनेक्टेड"
                  : "Floor Wi-Fi Synced"
                : isHindi
                ? "डिस्कनेक्टेड"
                : "Disconnected"}
            </p>
          </div>
        </div>

        {/* Purple Toggle Switch */}
        <button
          type="button"
          onClick={() => setTerminalConnected(!terminalConnected)}
          className={`w-12 h-6.5 rounded-full transition-colors relative p-0.5 cursor-pointer ${
            terminalConnected
              ? "bg-gradient-to-r from-cyan-400 to-blue-500"
              : "bg-slate-700"
          }`}
        >
          <div
            className={`w-5.5 h-5.5 rounded-full bg-white shadow-xs transition-transform duration-200 ${
              terminalConnected ? "translate-x-5.5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </div>
  );
};
