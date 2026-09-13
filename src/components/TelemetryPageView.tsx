import React, { useState } from "react";
import {
  Wifi,
  Package,
  Layers,
  Asterisk,
  LayoutGrid,
  Home,
  Columns,
  Clock,
  User,
  ArrowLeftRight, CheckCircle2, Check,
} from "lucide-react";
import { LearnerSection } from "../types";

interface TelemetryPageViewProps {
  onBack?: () => void;
  isHindi: boolean;
  onToggleLanguage?: () => void;
  activeSection: LearnerSection;
  onSelectSection: (section: LearnerSection) => void;
  onOpenScannerModal?: () => void;
  onOpenMapModal?: (zoneId?: string) => void;
  onOpenBuddyModal?: () => void;
  pickRate?: number;
}

export const TelemetryPageView: React.FC<TelemetryPageViewProps> = ({
  isHindi,
  onToggleLanguage,
  activeSection,
  onSelectSection,
  onOpenScannerModal,
  onOpenMapModal,
  onOpenBuddyModal,
  pickRate = 34,
}) => {
  const [isTerminalSynced, setIsTerminalSynced] = useState<boolean>(true);
  const [selectedZone, setSelectedZone] = useState<string>("aisles_1_3");

  // Gauge parameters
  // Circle radius 78 in 220x220 viewBox
  const radius = 78;
  const circumference = 2 * Math.PI * radius; // ~490.09
  // The arc covers approx 72.8% of circle starting from 12 o'clock and curving clockwise to ~8:45
  const arcPercentage = 0.728;
  const strokeDashoffset = circumference * (1 - arcPercentage);

  const handleZoneClick = (zoneId: string) => {
    setSelectedZone(zoneId);
    if (zoneId === "scanner_bay" && onOpenScannerModal) {
      onOpenScannerModal();
    } else if (onOpenMapModal) {
      onOpenMapModal(zoneId);
    }
  };

  return (
    <div className="min-h-screen bg-[#EBEAE5] text-stone-900 pb-28 pt-2 px-3 sm:px-4 font-sans select-none antialiased">
      <div className="max-w-md mx-auto space-y-3">
        {/* Top Header Label */}
        <div className="text-center pt-1 pb-0.5">
          <h1 className="text-xs sm:text-[13px] font-semibold text-stone-600 tracking-wide">
            {isHindi ? "टेलीमेट्री" : "Telemetry"}
          </h1>
        </div>

        {/* Top Card: Check-in Checkout & Language Toggle */}
        <div
          id="telemetry-top-header-card"
          className="bg-white rounded-[24px] sm:rounded-[26px] p-3 sm:p-3.5 flex items-center justify-between shadow-xs border border-black/[0.03]"
        >
          {/* Left: Icon & Store Info */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl bg-[#18181B] text-white flex items-center justify-center shrink-0 shadow-xs"
              aria-hidden="true"
            >
              <div className="flex items-center justify-center text-[13px] font-black tracking-tight select-none">
                <span>C</span>
                <ArrowLeftRight className="w-3.5 h-3.5 mx-0.5 stroke-[2.8]" />
                <span>C</span>
              </div>
            </div>

            <div>
              <h2 className="text-[14.5px] sm:text-[15px] font-bold text-[#18181B] leading-tight">
                {isHindi ? "चेक-इन चेकआउट" : "Check-in Checkout"}
              </h2>
              <p className="text-[12px] text-[#8E8C85] font-normal leading-tight mt-0.5">
                {isHindi ? "डार्क स्टोर · व्हाइटफील्ड" : "Dark Store · Whitefield"}
              </p>
            </div>
          </div>

          {/* Right: Pill Language Toggle */}
          {onToggleLanguage ? (
            <div className="bg-[#E5E4DE] rounded-full p-0.5 flex items-center">
              <button
                type="button"
                onClick={() => isHindi && onToggleLanguage()}
                className={`rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                  !isHindi
                    ? "bg-[#18181B] text-white shadow-xs"
                    : "text-[#716F68] hover:text-[#18181B]"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => !isHindi && onToggleLanguage()}
                className={`rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                  isHindi
                    ? "bg-[#18181B] text-white shadow-xs"
                    : "text-[#716F68] hover:text-[#18181B]"
                }`}
              >
                हिंदी
              </button>
            </div>
          ) : (
            <div className="bg-[#E5E4DE] rounded-full p-0.5 flex items-center">
              <span className="bg-[#18181B] text-white rounded-full px-3 py-1 text-xs font-bold">
                EN
              </span>
              <span className="text-[#716F68] px-3 py-1 text-xs font-medium">
                हिंदी
              </span>
            </div>
          )}
        </div>

        {/* Hero Card: Circular Ring Gauge Telemetry */}
        <div
          id="telemetry-hero-gauge-card"
          className="bg-white rounded-[32px] sm:rounded-[36px] py-8 sm:py-9 px-6 shadow-xs flex flex-col items-center justify-center border border-black/[0.03]"
        >
          {/* Circular Ring Gauge */}
          <div className="relative w-52 h-52 sm:w-56 sm:h-56 flex items-center justify-center">
            <svg
              viewBox="0 0 220 220"
              className="w-full h-full select-none -rotate-90"
            >
              {/* Neutral off-white / cream background track */}
              <circle
                cx="110"
                cy="110"
                r={radius}
                fill="none"
                stroke="#ECEAE3"
                strokeWidth="15"
              />

              {/* Bold Dark Active Arc (Starts at 12 o'clock, curves clockwise ~73% to ~8:45) */}
              <circle
                cx="110"
                cy="110"
                r={radius}
                fill="none"
                stroke="#18181B"
                strokeWidth="15"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-700 ease-out"
              />
            </svg>

            {/* Centered Digital Telemetry */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
              <span className="text-[54px] sm:text-[62px] font-black text-[#18181B] leading-none tracking-tight">
                {pickRate}
              </span>
              <span className="text-xs sm:text-[12.5px] font-bold tracking-widest text-[#8E8C85] uppercase mt-2">
                {isHindi ? "पिक्स / घंटा" : "PICKS / HR"}
              </span>
            </div>
          </div>

          {/* Bottom Status Pill */}
          <div className="mt-7 inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-[#F4F3EE]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3B8A64] shrink-0" />
            <span className="text-sm sm:text-[14.5px] font-semibold text-[#1F1E1B] tracking-tight">
              {isHindi ? "स्थिर गति (Ramping steady)" : "Ramping steady"}
            </span>
          </div>
        </div>

        {/* Zebra Terminal #104 Card */}
        <div
          id="telemetry-terminal-sync-card"
          className="bg-white rounded-[24px] sm:rounded-[26px] p-3.5 sm:p-4 flex items-center justify-between shadow-xs border border-black/[0.03]"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#F4F3EE] flex items-center justify-center text-[#18181B] shrink-0">
              <Wifi className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-[14.5px] sm:text-[15px] font-bold text-[#18181B] leading-tight">
                {isHindi ? "ज़ेब्रा टर्मिनल #104" : "Zebra Terminal #104"}
              </h3>
              <p className="text-xs text-[#8E8C85] font-normal leading-tight mt-0.5">
                {isHindi ? "फ्लोर वाई-फाई सिंक" : "Floor Wi-Fi synced"}
              </p>
            </div>
          </div>

          {/* iOS / Material style Toggle Switch */}
          <button
            type="button"
            role="switch"
            aria-checked={isTerminalSynced}
            onClick={() => setIsTerminalSynced((prev) => !prev)}
            className={`w-12 h-7 rounded-full transition-colors relative p-0.5 cursor-pointer select-none ${
              isTerminalSynced ? "bg-[#18181B]" : "bg-stone-300"
            }`}
            title={isTerminalSynced ? "Terminal Synced" : "Terminal Disconnected"}
          >
            <div
              className={`w-6 h-6 rounded-full bg-white shadow-xs transition-transform duration-200 ease-in-out ${
                isTerminalSynced ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Dark Store Zones Section */}
        <div id="telemetry-dark-store-zones" className="space-y-2.5 pt-0.5">
          {/* Section Header */}
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[15px] sm:text-[16px] font-bold text-[#18181B] tracking-tight">
              {isHindi ? "डार्क स्टोर ज़ोन" : "Dark store zones"}
            </h2>
            <button
              type="button"
              onClick={() => onOpenMapModal && onOpenMapModal()}
              className="text-[12px] sm:text-[12.5px] font-medium text-[#8E8C85] hover:text-[#18181B] transition-colors cursor-pointer"
            >
              {isHindi ? "मार्गदर्शन के लिए टैप करें" : "Tap for guidance"}
            </button>
          </div>

          {/* 2x2 Grid of Zone Cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
            {/* Zone 1: Aisles 1–3 (Dark Card) */}
            <div
              id="zone-card-aisles-1-3"
              onClick={() => handleZoneClick("aisles_1_3")}
              className={`rounded-[24px] sm:rounded-[26px] p-4 flex flex-col justify-between min-h-[145px] sm:min-h-[150px] shadow-xs cursor-pointer transition-all active:scale-98 ${
                selectedZone === "aisles_1_3"
                  ? "bg-[#181715] text-white hover:bg-black"
                  : "bg-white text-stone-900 border border-black/[0.03] hover:bg-stone-50"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  selectedZone === "aisles_1_3" ? "bg-white/10 text-white" : "bg-[#F4F3EE] text-[#18181B]"
                }`}
              >
                <Package className="w-5 h-5 stroke-[1.8]" />
              </div>

              <div className="mt-4">
                <h3
                  className={`text-[14.5px] sm:text-[15px] font-bold leading-tight ${
                    selectedZone === "aisles_1_3" ? "text-white" : "text-[#18181B]"
                  }`}
                >
                  {isHindi ? "आइसल 1–3" : "Aisles 1–3"}
                </h3>
                <p
                  className={`text-xs font-normal mt-0.5 leading-tight ${
                    selectedZone === "aisles_1_3" ? "text-stone-400" : "text-[#8E8C85]"
                  }`}
                >
                  {isHindi ? "स्नैक्स और इंस्टेंट फूड" : "Snacks & instant food"}
                </p>
              </div>
            </div>

            {/* Zone 2: Aisles 4–8 (White Card with Red Dot) */}
            <div
              id="zone-card-aisles-4-8"
              onClick={() => handleZoneClick("aisles_4_8")}
              className={`rounded-[24px] sm:rounded-[26px] p-4 flex flex-col justify-between min-h-[145px] sm:min-h-[150px] relative shadow-xs cursor-pointer transition-all active:scale-98 ${
                selectedZone === "aisles_4_8"
                  ? "bg-[#181715] text-white hover:bg-black"
                  : "bg-white text-stone-900 border border-black/[0.03] hover:bg-stone-50"
              }`}
            >
              {/* Red notification dot in top-right */}
              <span className="w-2 h-2 rounded-full bg-[#E05243] absolute top-4 right-4" />

              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  selectedZone === "aisles_4_8" ? "bg-white/10 text-white" : "bg-[#F4F3EE] text-[#18181B]"
                }`}
              >
                <Layers className="w-5 h-5 stroke-[1.8]" />
              </div>

              <div className="mt-4">
                <h3
                  className={`text-[14.5px] sm:text-[15px] font-bold leading-tight ${
                    selectedZone === "aisles_4_8" ? "text-white" : "text-[#18181B]"
                  }`}
                >
                  {isHindi ? "आइसल 4–8" : "Aisles 4–8"}
                </h3>
                <p
                  className={`text-xs font-normal mt-0.5 leading-tight ${
                    selectedZone === "aisles_4_8" ? "text-stone-400" : "text-[#8E8C85]"
                  }`}
                >
                  {isHindi ? "आटा, चावल और रैक" : "Atta, rice & racks"}
                </p>
              </div>
            </div>

            {/* Zone 3: Cold room (White Card) */}
            <div
              id="zone-card-cold-room"
              onClick={() => handleZoneClick("cold_room")}
              className={`rounded-[24px] sm:rounded-[26px] p-4 flex flex-col justify-between min-h-[145px] sm:min-h-[150px] shadow-xs cursor-pointer transition-all active:scale-98 ${
                selectedZone === "cold_room"
                  ? "bg-[#181715] text-white hover:bg-black"
                  : "bg-white text-stone-900 border border-black/[0.03] hover:bg-stone-50"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  selectedZone === "cold_room" ? "bg-white/10 text-white" : "bg-[#F4F3EE] text-[#18181B]"
                }`}
              >
                <Asterisk className="w-5 h-5 stroke-[2.5]" />
              </div>

              <div className="mt-4">
                <h3
                  className={`text-[14.5px] sm:text-[15px] font-bold leading-tight ${
                    selectedZone === "cold_room" ? "text-white" : "text-[#18181B]"
                  }`}
                >
                  {isHindi ? "कोल्ड रूम" : "Cold room"}
                </h3>
                <p
                  className={`text-xs font-normal mt-0.5 leading-tight ${
                    selectedZone === "cold_room" ? "text-stone-400" : "text-[#8E8C85]"
                  }`}
                >
                  {isHindi ? "डेयरी और ठंडा दूध" : "Dairy & chilled milk"}
                </p>
              </div>
            </div>

            {/* Zone 4: Scanner bay (White Card) */}
            <div
              id="zone-card-scanner-bay"
              onClick={() => handleZoneClick("scanner_bay")}
              className={`rounded-[24px] sm:rounded-[26px] p-4 flex flex-col justify-between min-h-[145px] sm:min-h-[150px] shadow-xs cursor-pointer transition-all active:scale-98 ${
                selectedZone === "scanner_bay"
                  ? "bg-[#181715] text-white hover:bg-black"
                  : "bg-white text-stone-900 border border-black/[0.03] hover:bg-stone-50"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  selectedZone === "scanner_bay" ? "bg-white/10 text-white" : "bg-[#F4F3EE] text-[#18181B]"
                }`}
              >
                <LayoutGrid className="w-5 h-5 stroke-[1.8]" />
              </div>

              <div className="mt-4">
                <h3
                  className={`text-[14.5px] sm:text-[15px] font-bold leading-tight ${
                    selectedZone === "scanner_bay" ? "text-white" : "text-[#18181B]"
                  }`}
                >
                  {isHindi ? "स्कैनर बे" : "Scanner bay"}
                </h3>
                <p
                  className={`text-xs font-normal mt-0.5 leading-tight ${
                    selectedZone === "scanner_bay" ? "text-stone-400" : "text-[#8E8C85]"
                  }`}
                >
                  {isHindi ? "ज़ेब्रा टर्मिनल हब" : "Zebra terminal hub"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Floor Checklist & Drills */}
        <div className="bg-white rounded-[32px] sm:rounded-[36px] p-4 sm:p-5 shadow-xs border border-black/[0.03] mt-2 relative overflow-hidden">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-2 pt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00D084] shrink-0 mt-1" />
              <h2 className="text-[13px] sm:text-[14px] font-black text-[#18181B] tracking-wide uppercase leading-tight max-w-[160px]">
                {isHindi ? "एक्टिव फ्लोर चेकलिस्ट व ड्रिल" : "Active Floor Checklist & Drills"}
              </h2>
            </div>
            <div className="bg-[#F4F3EE] px-3 py-1.5 rounded-[16px] shrink-0 text-center">
              <span className="text-[11px] font-bold text-[#18181B] leading-tight block">
                {isHindi ? "लाइव फ्लोर" : "Live Floor"}
              </span>
              <span className="text-[11px] font-bold text-[#18181B] leading-tight block">
                {isHindi ? "प्रैक्टिस" : "Practice"}
              </span>
            </div>
          </div>

          <div className="h-px w-full bg-[#F4F3EE] mb-4 absolute left-0 right-0" style={{ width: 'calc(100% + 40px)', marginLeft: '-20px' }} />

          {/* Progress Bar Container */}
          <div className="bg-[#F4F3EE] rounded-[16px] p-4 mb-4 mt-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-bold text-[#18181B]">
                {isHindi ? "आज का कार्य पूरा हुआ" : "Today's Task Completion"}
              </span>
              <span className="text-[13px] font-bold text-[#18181B]">
                0 / 11 {isHindi ? "पूरे हुए" : "Completed"}
              </span>
            </div>
            <div className="h-2 w-full bg-[#E5E4DE] rounded-full overflow-hidden">
              <div className="h-full bg-[#18181B] rounded-full w-0" />
            </div>
          </div>

          {/* Checklist Cards */}
          <div className="space-y-4">
            {/* Card 1 */}
            <div className="border border-stone-800 rounded-[28px] p-4 bg-white relative">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#18181B] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <CheckCircle2 className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-[#18181B] leading-tight truncate w-[160px] sm:w-[180px]">
                      {isHindi ? "आइसल 4-8 फिजिकल वॉकथ्रू..." : "Aisle 4-8 physical walkthr..."}
                    </h3>
                    <p className="text-[12px] text-[#8E8C85] mt-0.5 leading-tight truncate w-[160px] sm:w-[180px]">
                      {isHindi ? "फिजिकल शेल्फ की ऊंचाई और..." : "Review physical shelf heights an..."}
                    </p>
                  </div>
                </div>
                <div className="bg-[#18181B] px-3 py-1.5 rounded-[16px] shrink-0 text-center flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider leading-tight block">
                    {isHindi ? "मैप वॉक" : "MAP WALK"}
                  </span>
                </div>
              </div>
              
              <div className="h-px w-full bg-[#F4F3EE] mb-4 absolute left-0 right-0" style={{ width: 'calc(100% + 40px)', marginLeft: '-20px' }} />

              <div className="space-y-3 mb-4 mt-8">
                {/* Checkbox 1 */}
                <label className="flex items-start gap-3 p-3.5 rounded-[14px] border border-[#E5E4DE] bg-white cursor-pointer hover:bg-stone-50 transition-colors">
                  <input type="checkbox" className="mt-0.5 w-[18px] h-[18px] rounded-[4px] border-stone-300 text-[#18181B] focus:ring-[#18181B]" />
                  <span className="text-[13px] font-semibold text-[#18181B] leading-tight flex-1">
                    {isHindi ? "जांचें कि बिन के निर्देशांक पीडीए दिशानिर्देशों के अनुरूप हैं" : "Verify bin coordinates align with PDA guidelines"}
                  </span>
                </label>
                {/* Checkbox 2 */}
                <label className="flex items-start gap-3 p-3.5 rounded-[14px] border border-[#E5E4DE] bg-white cursor-pointer hover:bg-stone-50 transition-colors">
                  <input type="checkbox" className="mt-0.5 w-[18px] h-[18px] rounded-[4px] border-stone-300 text-[#18181B] focus:ring-[#18181B]" />
                  <span className="text-[13px] font-semibold text-[#18181B] leading-tight flex-1">
                    {isHindi ? "आइसल 4-8 में वर्टिकल लेवल लेबल (लेवल 1 से 5) ट्रेस करें" : "Trace vertical level labels (Levels 1 to 5) in Aisles 4-8"}
                  </span>
                </label>
                {/* Checkbox 3 */}
                <label className="flex items-start gap-3 p-3.5 rounded-[14px] border border-[#E5E4DE] bg-white cursor-pointer hover:bg-stone-50 transition-colors">
                  <input type="checkbox" className="mt-0.5 w-[18px] h-[18px] rounded-[4px] border-stone-300 text-[#18181B] focus:ring-[#18181B]" />
                  <span className="text-[13px] font-semibold text-[#18181B] leading-tight flex-1">
                    {isHindi ? "बडी विक्रम के साथ फ्लोर बारकोड की पुष्टि करें" : "Confirm floor barcode integrity with Buddy Vikram"}
                  </span>
                </label>
              </div>

              <div className="flex justify-end">
                <button type="button" className="bg-[#F4F3EE] hover:bg-[#E5E4DE] transition-colors px-4 py-2 rounded-xl text-[12px] font-bold text-[#18181B]">
                  {isHindi ? "सभी पूर्ण चिह्नित करें" : "Mark All Done"}
                </button>
              </div>
            </div>

            {/* Card 2 */}
            <div className="border border-[#E5E4DE] rounded-[28px] p-4 bg-[#F4F3EE]/50 relative">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white border border-[#E5E4DE] text-[#18181B] flex items-center justify-center shrink-0 shadow-xs">
                    <CheckCircle2 className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-[#18181B] leading-tight truncate w-[160px] sm:w-[180px]">
                      {isHindi ? "रिंग-स्कैनर द्वारा 50 ऑर्डर पिक करें..." : "Pick 50 orders via ring-..."}
                    </h3>
                    <p className="text-[12px] text-[#8E8C85] mt-0.5 leading-tight truncate w-[160px] sm:w-[180px]">
                      {isHindi ? "0 मिस-स्कैन के साथ पिक करें..." : "Pick with 0 mis-scans using li..."}
                    </p>
                  </div>
                </div>
                <div className="bg-[#E5E4DE] px-3 py-1.5 rounded-[16px] shrink-0 text-center flex items-center justify-center">
                  <span className="text-[10px] font-bold text-[#18181B] uppercase tracking-wider leading-tight block">
                    {isHindi ? "स्कैनर" : "SCANNER"}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Floating Bottom Navigation Bar matching screenshot */}
      <div
        id="telemetry-bottom-nav-container"
        className="fixed bottom-3 sm:bottom-4 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none"
      >
        <nav
          aria-label="Bottom Navigation"
          className="pointer-events-auto max-w-md w-full bg-white rounded-[32px] px-3 py-2 flex items-center justify-around shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-stone-200/70"
        >
          {/* 1. Home */}
          <button
            type="button"
            onClick={() => onSelectSection("home")}
            className="flex-1 flex flex-col items-center justify-center py-1 text-[#716F68] hover:text-[#18181B] transition-colors cursor-pointer active:scale-95"
          >
            <Home className="w-5 h-5 stroke-[1.8]" />
            <span className="text-[11px] font-semibold mt-1 leading-none">
              {isHindi ? "होम" : "Home"}
            </span>
          </button>

          {/* 2. Modules */}
          <button
            type="button"
            onClick={() => onSelectSection("modules")}
            className="flex-1 flex flex-col items-center justify-center py-1 text-[#716F68] hover:text-[#18181B] transition-colors cursor-pointer active:scale-95"
          >
            <Columns className="w-5 h-5 stroke-[1.8]" />
            <span className="text-[11px] font-semibold mt-1 leading-none">
              {isHindi ? "मॉड्यूल्स" : "Modules"}
            </span>
          </button>

          {/* 3. Telemetry (ACTIVE) */}
          <button
            type="button"
            onClick={() => onSelectSection("dial")}
            className="flex-1 flex flex-col items-center justify-center cursor-pointer select-none"
          >
            <div className="w-10 h-10 rounded-full bg-[#18181B] text-white flex items-center justify-center shadow-xs">
              <Clock className="w-5 h-5 stroke-[2]" />
            </div>
            <span className="text-[11px] font-bold text-[#18181B] mt-1 leading-none">
              {isHindi ? "टेलीमेट्री" : "Telemetry"}
            </span>
          </button>

          {/* 4. Dashboard */}
          <button
            type="button"
            onClick={() => onSelectSection("dashboard")}
            className="flex-1 flex flex-col items-center justify-center py-1 text-[#716F68] hover:text-[#18181B] transition-colors cursor-pointer active:scale-95"
          >
            <User className="w-5 h-5 stroke-[1.8]" />
            <span className="text-[11px] font-semibold mt-1 leading-none">
              {isHindi ? "डैशबोर्ड" : "Dashboard"}
            </span>
          </button>
        </nav>
      </div>
    </div>
  );
};
