import React from "react";
import {
  Home,
  Columns,
  Clock,
  User,
  Activity,
} from "lucide-react";

export type LearnerSection = "home" | "modules" | "journey" | "dial" | "dashboard" | "buddy" | "control_tower";

interface FloatingGlassMenuProps {
  activeSection: LearnerSection;
  onSelectSection: (section: LearnerSection) => void;
  isHindi?: boolean;
  hasAttention?: boolean;
  buddyAssigned?: boolean;
}

export const FloatingGlassMenu: React.FC<FloatingGlassMenuProps> = ({
  activeSection,
  onSelectSection,
  isHindi = false,
  hasAttention = false,
  buddyAssigned = false,
}) => {
  const items: {
    id: LearnerSection;
    labelEn: string;
    labelHi: string;
    icon: React.ReactNode;
    activeIcon?: React.ReactNode;
    badge?: boolean;
  }[] = [
    {
      id: "home",
      labelEn: "Home",
      labelHi: "होम",
      icon: <Home className="w-5 h-5 stroke-[1.8]" />,
      badge: hasAttention,
    },
    {
      id: "modules",
      labelEn: "Modules",
      labelHi: "मॉड्यूल्स",
      icon: <Columns className="w-5 h-5 stroke-[1.8]" />,
    },
    {
      id: "dial",
      labelEn: "Telemetry",
      labelHi: "टेलीमेट्री",
      icon: <Clock className="w-5 h-5 stroke-[2]" />,
    },
    {
      id: "control_tower",
      labelEn: "Intelligence",
      labelHi: "बुद्धिमत्ता",
      icon: <Activity className="w-5 h-5 stroke-[1.8]" />,
    },
    {
      id: "dashboard",
      labelEn: "Dashboard",
      labelHi: "डैशबोर्ड",
      icon: <User className="w-5 h-5 stroke-[1.8]" />,
    },
  ];

  return (
    <div
      id="floating-glass-menu-container"
      className="fixed bottom-3 sm:bottom-4 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none"
    >
      <nav
        id="floating-apple-glass-menu"
        aria-label="Learner Bottom Navigation"
        className="pointer-events-auto max-w-md w-full bg-white rounded-[32px] px-3 py-2 flex items-center justify-around shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-stone-200/70 transition-all"
      >
        {items.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              id={`nav-btn-${item.id}`}
              type="button"
              onClick={() => onSelectSection(item.id)}
              className="flex-1 flex flex-col items-center justify-center py-1 transition-all cursor-pointer select-none active:scale-95"
            >
              <div className="relative">
                {isActive ? (
                  <div className="w-10 h-10 rounded-full bg-[#18181B] text-white flex items-center justify-center shadow-xs">
                    {item.icon}
                  </div>
                ) : (
                  <div className="w-8 h-8 flex items-center justify-center text-[#716F68] hover:text-[#18181B] transition-colors">
                    {item.icon}
                  </div>
                )}
                {item.badge && !isActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white animate-pulse" />
                )}
              </div>
              <span
                className={`text-[11px] leading-none mt-1 whitespace-nowrap ${
                  isActive ? "font-bold text-[#18181B]" : "font-medium text-[#716F68]"
                }`}
              >
                {isHindi ? item.labelHi : item.labelEn}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
