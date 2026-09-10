import React, { useState } from "react";
import { CircularDialWidget } from "./CircularDialWidget";
import { StoreZonesGrid } from "./StoreZonesGrid";
import { X, Briefcase, Sparkles, MapPin, ScanLine, Phone } from "lucide-react";
import { NewHire } from "../types";
import { assessReadiness } from "../services/intelligence";

interface TelemetryDialModalProps {
  isOpen: boolean;
  onClose: () => void;
  newHire: NewHire;
  currentDay: number;
}

export const TelemetryDialModal: React.FC<TelemetryDialModalProps> = ({
  isOpen,
  onClose,
  newHire,
  currentDay,
}) => {
  const [isHindi, setIsHindi] = useState<boolean>(false);
  const [subModal, setSubModal] = useState<"map" | "scanner" | "buddy" | "target" | null>(null);
  const [buddyAlertSent, setBuddyAlertSent] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentRecord = newHire.daysHistory.find((d) => d.dayNumber === currentDay) || {
    workSignal: { actualPickRate: 35, targetPickRate: 50, accuracyRate: 98 },
    pickRate: 35,
    targetPickRate: 50,
    errorRate: 2,
  };

  const actualPickRate = currentRecord.workSignal?.actualPickRate || currentRecord.pickRate || 35;
  const targetPickRate = currentRecord.workSignal?.targetPickRate || currentRecord.targetPickRate || 50;
  const accuracyRate = currentRecord.workSignal?.accuracyRate || 98;
  const readinessScore = typeof newHire.overallReadinessScore === "number"
    ? (newHire.overallReadinessScore <= 1 ? Math.round(newHire.overallReadinessScore * 100) : Math.round(newHire.overallReadinessScore))
    : (newHire.capabilities ? assessReadiness(newHire.capabilities, newHire) : undefined);

  return (
    <div
      id="telemetry-dial-page-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-[#1b1e26] rounded-3xl max-w-md w-full p-4 sm:p-5 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl border border-white/10 text-white">
        {/* Header bar */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 flex items-center justify-center shadow-sm">
              <Briefcase className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black text-white tracking-tight">
                  {isHindi ? "फ्लोर टेलीमेट्री डायल" : "Floor Telemetry Dial"}
                </h3>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Day {currentDay}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {newHire.name} • {newHire.role} • Dark Store #104
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsHindi(!isHindi)}
              className="text-[11px] font-bold px-2 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors cursor-pointer"
            >
              {isHindi ? "English" : "हिंदी"}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* The Round Circle Temperature / Gauge Widget */}
        <CircularDialWidget
          pickRate={actualPickRate}
          targetPickRate={targetPickRate}
          accuracyRate={accuracyRate}
          readinessScore={readinessScore}
          onCallBuddy={() => setSubModal("buddy")}
          onScannerFix={() => setSubModal("scanner")}
          onAisleMap={() => setSubModal("map")}
          onOpenTarget={() => setSubModal("target")}
          isHindi={isHindi}
        />

        {/* Store Zones Grid */}
        <StoreZonesGrid
          onSelectZone={(zoneId) => {
            if (zoneId === "scanner_dock") {
              setSubModal("scanner");
            } else if (zoneId === "buddy_desk") {
              setSubModal("buddy");
            } else {
              setSubModal("map");
            }
          }}
          isHindi={isHindi}
          activeZoneId={currentDay === 3 ? "aisles_4_8" : "aisles_1_3"}
        />

        {/* Quick Done / Back Button */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 rounded-2xl text-xs font-black cursor-pointer shadow-md hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-1.5 border border-white/10"
        >
          <span>{isHindi ? "वापस जाएं • ठीक है" : "Back to Screen"}</span>
        </button>
      </div>

      {/* Sub-modals for quick triggers from within the dial */}
      {subModal === "map" && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1b1e26] rounded-3xl p-5 max-w-sm w-full space-y-3 shadow-2xl border border-white/10 text-white animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-cyan-400" />
                {isHindi ? "स्टोर नेविगेशन गाइड" : "Store Layout Guide"}
              </span>
              <button onClick={() => setSubModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300">
              {isHindi
                ? "आइसल 1-3: स्नैक्स व बिस्कुट | आइसल 4-8: बल्क दाल व तेल | कोल्ड रूम: डेयरी व दूध"
                : "Aisles 1-3: Snacks & Beverages | Aisles 4-8: Bulk Staple & Flour | Cold Room: Dairy"}
            </p>
            <button
              onClick={() => setSubModal(null)}
              className="w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black rounded-xl text-xs"
            >
              {isHindi ? "समझ गया" : "Got it"}
            </button>
          </div>
        </div>
      )}

      {subModal === "scanner" && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1b1e26] rounded-3xl p-5 max-w-sm w-full space-y-3 shadow-2xl border border-white/10 text-white animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm flex items-center gap-1.5">
                <ScanLine className="w-4 h-4 text-cyan-400" />
                {isHindi ? "स्कैनर ट्रबलशूट" : "Scanner Terminal Quick Fix"}
              </span>
              <button onClick={() => setSubModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
              {isHindi
                ? "1. ग्लास लेंस को कपड़े से साफ करें।\n2. 15 सेमी की दूरी से बारकोड स्कैन करें।\n3. लाल बत्ती आने पर डॉक #2 से नई बैटरी लें।"
                : "1. Wipe laser glass clean with cloth.\n2. Hold at 15cm distance at 45° angle.\n3. Swap battery at Dock #2 if red light blinks."}
            </p>
            <button
              onClick={() => setSubModal(null)}
              className="w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black rounded-xl text-xs"
            >
              {isHindi ? "ठीक है" : "Close"}
            </button>
          </div>
        </div>
      )}

      {subModal === "buddy" && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1b1e26] rounded-3xl p-5 max-w-sm w-full space-y-3 shadow-2xl border border-white/10 text-white animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-emerald-400" />
                {isHindi ? "विक्रम भैया को कॉल" : "Call Floor Buddy"}
              </span>
              <button onClick={() => setSubModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300">
              {buddyAlertSent
                ? isHindi
                  ? "✅ विक्रम भैया को अलर्ट भेजा गया है! वे 2 मिनट में आइसल पर आ रहे हैं।"
                  : "✅ Vikram has been alerted! He is heading to your aisle in 2 mins."
                : isHindi
                ? "क्या आप विक्रम भैया (फ्लोर बडी) को तुरंत सहायता के लिए बुलाना चाहते हैं?"
                : "Would you like to send an instant ping to Floor Buddy Vikram?"}
            </p>
            {!buddyAlertSent ? (
              <button
                onClick={() => setBuddyAlertSent(true)}
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs"
              >
                {isHindi ? "हाँ, बडी को अलर्ट भेजें 🚨" : "Send Urgent Ping 🚨"}
              </button>
            ) : (
              <button
                onClick={() => {
                  setBuddyAlertSent(false);
                  setSubModal(null);
                }}
                className="w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black rounded-xl text-xs"
              >
                {isHindi ? "बंद करें" : "Done"}
              </button>
            )}
          </div>
        </div>
      )}

      {subModal === "target" && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1b1e26] rounded-3xl p-5 max-w-sm w-full space-y-3 shadow-2xl border border-white/10 text-white animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                {isHindi ? "पिक टारगेट विवरण" : "Shift Target Breakdown"}
              </span>
              <button onClick={() => setSubModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs space-y-1.5 text-slate-300">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span>{isHindi ? "वर्तमान गति" : "Current Rate"}:</span>
                <span className="font-bold text-white">{actualPickRate} picks/hr</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span>{isHindi ? "डे 3 लक्ष्य" : "Day 3 Target"}:</span>
                <span className="font-bold text-white">{targetPickRate} picks/hr</span>
              </div>
              <div className="flex justify-between py-1">
                <span>{isHindi ? "डे 5 अंतिम लक्ष्य" : "Day 5 Target"}:</span>
                <span className="font-bold text-cyan-400">65 picks/hr</span>
              </div>
            </div>
            <button
              onClick={() => setSubModal(null)}
              className="w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black rounded-xl text-xs"
            >
              {isHindi ? "ठीक है" : "Close"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
