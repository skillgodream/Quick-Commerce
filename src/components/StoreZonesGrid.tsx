import React, { useState } from "react";
import {
  Package,
  Layers,
  ThermometerSnowflake,
  ScanLine,
  Truck,
  UserCheck,
  CheckCircle2,
} from "lucide-react";

interface StoreZone {
  id: string;
  name: string;
  nameHindi: string;
  subtitle: string;
  subtitleHindi: string;
  icon: React.ReactNode;
  activeColor?: string;
  statusBadge?: string;
}

interface StoreZonesGridProps {
  onSelectZone?: (zoneId: string, zoneName: string) => void;
  onAisleSelect?: (zoneId?: string) => void;
  isHindi?: boolean;
  activeZoneId?: string;
  currentPickRate?: number;
  targetPickRate?: number;
}

export const StoreZonesGrid: React.FC<StoreZonesGridProps> = ({
  onSelectZone,
  onAisleSelect,
  isHindi = false,
  activeZoneId = "aisles_4_8",
}) => {
  const [selectedId, setSelectedId] = useState<string>(activeZoneId);

  const zones: StoreZone[] = [
    {
      id: "aisles_1_3",
      name: "Aisles 1–3",
      nameHindi: "आइसल 1 से 3",
      subtitle: "Snacks & Instant Food",
      subtitleHindi: "चिप्स, बिस्कुट और मैगी",
      icon: <Package className="w-7 h-7" />,
    },
    {
      id: "aisles_4_8",
      name: "Aisles 4–8",
      nameHindi: "आइसल 4 से 8",
      subtitle: "Atta, Rice & Racks",
      subtitleHindi: "आटा, दाल और भारी रैक",
      icon: <Layers className="w-7 h-7" />,
      statusBadge: isHindi ? "वर्तमान फोकस" : "Current Focus",
    },
    {
      id: "cold_room",
      name: "Cold Room",
      nameHindi: "कोल्ड रूम",
      subtitle: "Dairy & Chilled Milk",
      subtitleHindi: "दूध, दही और पनीर (Aisle 8)",
      icon: <ThermometerSnowflake className="w-7 h-7" />,
    },
    {
      id: "scanner_dock",
      name: "Scanner Bay",
      nameHindi: "स्कैनर डेस्क",
      subtitle: "Zebra Terminal Hub",
      subtitleHindi: "स्कैनर चार्जिंग और बैटरी",
      icon: <ScanLine className="w-7 h-7" />,
    },
    {
      id: "dispatch_table",
      name: "Dispatch Bay",
      nameHindi: "डिस्पैच टेबल",
      subtitle: "Tote Sorting & Bags",
      subtitleHindi: "टोट चेकिंग और पॉलीबैग",
      icon: <Truck className="w-7 h-7" />,
    },
    {
      id: "buddy_desk",
      name: "Floor Buddy",
      nameHindi: "विक्रम भैया",
      subtitle: "Senior Floor Guide",
      subtitleHindi: "फ्लोर गाइडेंस स्टेशन",
      icon: <UserCheck className="w-7 h-7" />,
    },
  ];

  const handleCardClick = (zone: StoreZone) => {
    setSelectedId(zone.id);
    if (onSelectZone) {
      onSelectZone(zone.id, isHindi ? zone.nameHindi : zone.name);
    }
    if (onAisleSelect) {
      onAisleSelect(zone.id);
    }
  };

  return (
    <div className="space-y-3 select-none text-white">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
          {isHindi ? "डार्क स्टोर ज़ोन" : "Dark Store Zones"}
        </span>
        <span className="text-xs text-cyan-400 font-bold">
          {isHindi ? "टैप करके दिशा देखें" : "Tap for guidance"}
        </span>
      </div>

      {/* 2x3 Squircle Grid Matching Clean Consistent Palette */}
      <div className="grid grid-cols-2 gap-3">
        {zones.map((zone) => {
          const isActive = selectedId === zone.id;
          return (
            <button
              key={zone.id}
              onClick={() => handleCardClick(zone)}
              className={`flex flex-col items-center justify-center p-4 rounded-[26px] transition-all duration-200 cursor-pointer text-center relative active:scale-96 ${
                isActive
                  ? "bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 shadow-lg shadow-cyan-950/15 ring-2 ring-cyan-400/40 font-bold"
                  : "bg-white/10 text-white border border-white/20 hover:border-white/30 hover:bg-white/20 shadow-2xs"
              }`}
            >
              {/* Red blinking circle or active badge */}
              {zone.id === "aisles_4_8" ? (
                <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                </span>
              ) : (
                zone.statusBadge && !isActive && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-slate-400" />
                )
              )}

              {/* Icon */}
              <div
                className={`mb-2 transition-transform ${
                  isActive ? "text-slate-950 scale-105" : "text-white"
                }`}
              >
                {zone.icon}
              </div>

              {/* Zone Name */}
              <span
                className={`text-sm font-black tracking-tight leading-tight block ${
                  isActive ? "text-slate-950" : "text-white"
                }`}
              >
                {isHindi ? zone.nameHindi : zone.name}
              </span>

              {/* Subtitle */}
              <span
                className={`text-[10px] mt-1 font-medium block truncate max-w-[140px] ${
                  isActive ? "text-slate-900 font-bold" : "text-slate-300"
                }`}
              >
                {isHindi ? zone.subtitleHindi : zone.subtitle}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
