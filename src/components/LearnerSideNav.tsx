import React, { useState } from "react";
import { X, Compass, Target, Menu } from "lucide-react";
import { LearnerSection } from "../types";

interface LearnerSideNavProps {
  activeSection: LearnerSection;
  onSelectSection: (section: LearnerSection) => void;
  isHindi?: boolean;
}

export const LearnerSideNav: React.FC<LearnerSideNavProps> = ({
  activeSection,
  onSelectSection,
  isHindi = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed left-2 sm:left-4 bottom-24 z-[60] flex flex-col items-center gap-3">
      {/* Expanded Menu Items */}
      <div 
        className={"flex flex-col gap-3 transition-all duration-300 origin-bottom " + (
          isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-50 translate-y-10 pointer-events-none'
        )}
      >
        <button
          onClick={() => { onSelectSection("progress"); setIsOpen(false); }}
          className={"w-12 h-12 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.15)] border flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-95 " + (
            activeSection === "progress" ? "bg-indigo-600 text-white border-indigo-700" : "bg-white text-indigo-600 border-slate-200"
          )}
          title={isHindi ? "प्रगति" : "My Progress"}
        >
          <Target className="w-5 h-5 mb-0.5" />
          <span className="text-[8px] font-bold leading-none">{isHindi ? "प्रगति" : "Progress"}</span>
        </button>
      </div>
      
      {/* Main Pull-up Toggle Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={"w-12 h-12 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.15)] flex items-center justify-center transition-all hover:scale-105 active:scale-95 z-10 " + (
          isOpen ? 'bg-indigo-900 border-indigo-800 text-white' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
        )}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>
    </div>
  );
};
