import React, { useState } from "react";
import {
  X,
  Clock,
  Zap,
  Play,
  HelpCircle,
  Box,
  Target,
  Award,
  Check,
  ChevronRight,
} from "lucide-react";

interface CoordinateNavigationModuleViewProps {
  onClose: () => void;
  isHindi?: boolean;
  onOpenActivity?: (activityIndex: number) => void;
  completedActivities?: Record<string, boolean>;
}

export const CoordinateNavigationModuleView: React.FC<CoordinateNavigationModuleViewProps> = ({
  onClose,
  isHindi = false,
  onOpenActivity,
  completedActivities = {
    "act-3-1": true,
    "act-3-2": true,
    "act-3-3": true,
    "act-3-4": true,
    "act-3-5": true,
  },
}) => {
  const [activeSubModal, setActiveSubModal] = useState<number | null>(null);

  const activities = [
    {
      id: "act-3-1",
      category: isHindi ? "वीडियो पाठ" : "VIDEO LESSON",
      title: isHindi ? "डार्क स्टोर कोऑर्डिनेट डिकोडिंग..." : "Decoding Dark St...",
      fullTitle: isHindi
        ? "डार्क स्टोर कोऑर्डिनेट्स डिकोडिंग (आइसल-बे-शेल्फ)"
        : "Decoding Dark Store Coordinates (Aisle-Bay-Shelf)",
      iconType: "video",
      iconBg: "bg-[#E0F0FE]",
      iconColor: "text-[#1D63D8]",
      done: completedActivities["act-3-1"] ?? true,
      score: undefined,
    },
    {
      id: "act-3-2",
      category: isHindi ? "इंटरएक्टिव क्विज" : "INTERACTIVE QUIZ",
      title: isHindi ? "शेल्फ लेआउट..." : "Shelf Lay...",
      fullTitle: isHindi
        ? "शेल्फ लेआउट और बिन कोऑर्डिनेट क्विज"
        : "Shelf Layout & Bin Coordinate Quiz",
      iconType: "quiz",
      iconBg: "bg-[#FEF3C7]",
      iconColor: "text-[#D97706]",
      done: completedActivities["act-3-2"] ?? true,
      score: "90%",
    },
    {
      id: "act-3-3",
      category: isHindi ? "फ्लोर सिमुलेशन" : "FLOOR SIMULATION",
      title: isHindi ? "इंटरएक्टिव 3D डार्क..." : "Interactive 3D Da...",
      fullTitle: isHindi
        ? "इंटरएक्टिव 3D स्टोर नेविगेशन सिमुलेशन"
        : "Interactive 3D Dark Store Navigation Sim",
      iconType: "simulation",
      iconBg: "bg-[#DCFCE7]",
      iconColor: "text-[#059669]",
      done: completedActivities["act-3-3"] ?? true,
      score: undefined,
    },
    {
      id: "act-3-4",
      category: isHindi ? "फ्लोर प्रैक्टिस ड्रिल" : "FLOOR PRACTICE DRILL",
      title: isHindi ? "आइसल 1–8 फिजिकल..." : "Aisles 1–8 Physic...",
      fullTitle: isHindi
        ? "आइसल 1-8 फिजिकल लोकेशन सर्च प्रैक्टिस"
        : "Aisles 1–8 Physical Location Search Practice",
      iconType: "practice",
      iconBg: "bg-[#FEF3C7]",
      iconColor: "text-[#D97706]",
      done: completedActivities["act-3-4"] ?? true,
      score: undefined,
    },
    {
      id: "act-3-5",
      category: isHindi ? "नॉलेज असेसमेंट" : "KNOWLEDGE ASSESSMENT",
      title: isHindi ? "डे 3 स्पेशियल नेवि..." : "Day 3 Spatial Nav...",
      fullTitle: isHindi
        ? "डे 3 स्थानिक नेविगेशन प्रमाणन मूल्यांकन"
        : "Day 3 Spatial Navigation Assessment",
      iconType: "assessment",
      iconBg: "bg-[#F3E8FF]",
      iconColor: "text-[#9333EA]",
      done: completedActivities["act-3-5"] ?? true,
      score: "94%",
    },
  ];

  const renderIcon = (type: string, colorClass: string) => {
    switch (type) {
      case "video":
        return <Play className={`w-5 h-5 fill-current stroke-none ${colorClass}`} />;
      case "quiz":
        return <HelpCircle className={`w-5 h-5 ${colorClass}`} strokeWidth={2.4} />;
      case "simulation":
        return <Box className={`w-5 h-5 ${colorClass}`} strokeWidth={2.4} />;
      case "practice":
        return <Target className={`w-5 h-5 ${colorClass}`} strokeWidth={2.4} />;
      case "assessment":
        return <Award className={`w-5 h-5 ${colorClass}`} strokeWidth={2.4} />;
      default:
        return <Play className={`w-5 h-5 ${colorClass}`} />;
    }
  };

  return (
    <div
      id="coordinate-navigation-page"
      className="min-h-screen bg-[#F8F7F2] text-stone-900 pb-28 px-4 sm:px-5 pt-4 select-none font-sans antialiased animate-in fade-in duration-200"
    >
      <div className="max-w-md mx-auto space-y-4">
        {/* Top bar: Pill Tag on Left, Close X on Right */}
        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="inline-flex items-center">
            <span className="px-3.5 py-1.5 rounded-full text-xs sm:text-[13px] font-black uppercase tracking-wider bg-[#FCE8E4] text-[#C04838]">
              {isHindi ? "डे 3 · LMS-MOD-03" : "DAY 3 · LMS-MOD-03"}
            </span>
          </div>

          <div className="flex flex-col items-end gap-1">
            <button
              type="button"
              id="coord-nav-close-btn"
              onClick={onClose}
              className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors cursor-pointer"
              aria-label="Close page"
            >
              <X className="w-5 h-5" strokeWidth={2.2} />
            </button>
            <div className="flex items-center gap-1 text-xs font-bold text-stone-500">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              <span>65 min</span>
            </div>
          </div>
        </div>

        {/* Big Clean Title */}
        <div className="space-y-2 pt-0.5">
          <h1 className="text-2xl sm:text-[28px] font-black text-stone-900 tracking-tight leading-tight">
            {isHindi ? "कोऑर्डिनेट नेविगेशन" : "Coordinate Navigation"}
          </h1>
          <div className="h-px bg-stone-200/80" />
        </div>

        {/* Clean Description */}
        <p className="text-xs sm:text-[13.5px] text-stone-600 font-medium leading-relaxed">
          {isHindi
            ? "रैक-बे-शेल्फ-बिन (आइसल 1-8) नंबरिंग सिस्टम को पढ़ना और अधिक घनत्व वाले सामान को तुरंत ढूंढना।"
            : "Reading the Rack-Bay-Shelf-Bin coordinate numbering system (Aisles 1–8) and locating high-density products."}
        </p>

        {/* Highlight Banner: Maps to Coordinate Navigation */}
        <div className="bg-[#FCE8E4] rounded-2xl p-3 px-3.5 flex items-center gap-2 text-[#C04838] transition-all">
          <Zap className="w-4 h-4 shrink-0 fill-current" />
          <span className="text-xs sm:text-[13px] font-bold text-[#A83827]">
            {isHindi
              ? "हुनर संबंध: कोऑर्डिनेट नेविगेशन"
              : "Maps to: Coordinate Navigation"}
          </span>
        </div>

        {/* Section Heading: MODULE ACTIVITIES & 5 TASKS */}
        <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-stone-400 pt-2 px-1">
          <span>{isHindi ? "मॉड्यूल गतिविधियां" : "MODULE ACTIVITIES"}</span>
          <span>{isHindi ? "5 कार्य" : "5 TASKS"}</span>
        </div>

        {/* 5 Clean Activity Cards with Minimal Text */}
        <div className="space-y-2.5">
          {activities.map((act, index) => (
            <div
              key={act.id}
              id={`coord-activity-card-${index}`}
              onClick={() => {
                setActiveSubModal(index);
                if (onOpenActivity) onOpenActivity(index);
              }}
              className="bg-white rounded-2xl p-3 sm:p-3.5 shadow-2xs border border-stone-100/90 hover:border-stone-300 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99]"
            >
              {/* Left side: Colored squircle icon + category & minimal truncated title */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl ${act.iconBg} flex items-center justify-center shrink-0`}
                >
                  {renderIcon(act.iconType, act.iconColor)}
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-stone-400 block truncate">
                    {act.category}
                  </span>
                  <h3 className="text-xs sm:text-[13.5px] font-black text-stone-900 truncate leading-snug">
                    {act.title}
                  </h3>
                </div>
              </div>

              {/* Right side: Optional score pill + Done pill */}
              <div className="flex items-center gap-1.5 shrink-0">
                {act.score && (
                  <span className="bg-[#F1F5F9] text-stone-700 font-black text-[10.5px] sm:text-[11px] px-2.5 py-1 rounded-full">
                    {act.score}
                  </span>
                )}
                {act.done ? (
                  <span className="bg-[#DCFCE7] text-[#15803D] font-black text-[10.5px] sm:text-[11px] px-2.5 sm:px-3 py-1 rounded-full inline-flex items-center gap-1">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>{isHindi ? "पूर्ण" : "Done"}</span>
                  </span>
                ) : (
                  <span className="bg-stone-900 text-white font-bold text-[10.5px] px-2.5 py-1 rounded-full">
                    {isHindi ? "शुरू करें" : "Start"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Quick Modal when tapping on any activity */}
      {activeSubModal !== null && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-stone-200 space-y-4 animate-in fade-in zoom-in duration-150 text-stone-900">
            <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl ${activities[activeSubModal].iconBg} flex items-center justify-center shrink-0`}
                >
                  {renderIcon(
                    activities[activeSubModal].iconType,
                    activities[activeSubModal].iconColor
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">
                    {activities[activeSubModal].category}
                  </span>
                  <h4 className="text-sm font-black text-stone-900 line-clamp-1">
                    {activities[activeSubModal].fullTitle}
                  </h4>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveSubModal(null)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-stone-600 leading-relaxed bg-[#F8F7F2] p-3.5 rounded-2xl">
              {activeSubModal === 0 && (
                <p>
                  {isHindi
                    ? "इस 15-मिनट के वीडियो में डार्क स्टोर के रैक, बे, और शेल्फ कोऑर्डिनेट्स पढ़ने का व्यावहारिक तरीका समझाया गया है।"
                    : "Comprehensive video guide covering dark store coordinate systems (Rack-Bay-Shelf-Bin) across Aisles 1 to 8."}
                </p>
              )}
              {activeSubModal === 1 && (
                <p>
                  {isHindi
                    ? "शेल्फ और बिन लेआउट पर 10 प्रश्नों की क्विज। स्कोर: 90% (पास)।"
                    : "10-question evaluation testing spatial speed and bin address lookup. Score: 90% (Passed)."}
                </p>
              )}
              {activeSubModal === 2 && (
                <p>
                  {isHindi
                    ? "इंटरएक्टिव 3D फ्लोर सिमुलेशन जहां आपने 8 में से 8 पिक लोकेशन सफलतापूर्वक नेविगेट किए।"
                    : "Virtual 3D warehouse walk-through navigation. All 8 pick stations successfully mapped."}
                </p>
              )}
              {activeSubModal === 3 && (
                <p>
                  {isHindi
                    ? "फ्लोर पर सीनियर बडी के साथ 15-मिनट का फिजिकल वॉकिंग ड्रिल पूर्ण हुआ।"
                    : "Floor drill with senior buddy walking Aisles 1–8 to locate high-density fast-moving SKUs."}
                </p>
              )}
              {activeSubModal === 4 && (
                <p>
                  {isHindi
                    ? "डे 3 स्थानिक नेविगेशन का अंतिम प्रमाणन परीक्षण। स्कोर: 94%।"
                    : "Final Day 3 certification assessment covering coordinate read accuracy and pick route selection."}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between text-xs font-bold text-stone-500 px-1">
              <span>{isHindi ? "स्थिति:" : "Status:"}</span>
              <span className="text-emerald-600 font-black flex items-center gap-1">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                {isHindi ? "सफलतापूर्वक पूर्ण" : "Completed"}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setActiveSubModal(null)}
              className="w-full py-2.5 bg-stone-900 hover:bg-black text-white rounded-2xl font-bold text-xs cursor-pointer active:scale-98 transition-all"
            >
              {isHindi ? "बंद करें" : "Close"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
