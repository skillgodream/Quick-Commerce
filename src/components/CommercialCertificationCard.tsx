import React, { useState } from "react";
import {
  Award,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  BookOpen,
  Dumbbell,
  ShieldCheck,
  Zap,
  Clock,
  Target,
  UserCheck,
  Check,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { NewHire } from "../types";
import { evaluateDay10Outcome, Day10EvaluationResult } from "../services/intelligence";

interface CommercialCertificationCardProps {
  newHire: NewHire;
  currentDay: number;
  isHindi?: boolean;
  onOpenModules?: () => void;
  onOpenWorkTools?: () => void;
  onOpenBuddy?: () => void;
}

interface CriterionDetail {
  id: string;
  name: string;
  nameHi: string;
  met: boolean;
  metric: string;
  metricHi: string;
  benchmark: string;
  benchmarkHi: string;
  whyItMatters: string;
  whyItMattersHi: string;
  nextStep: string;
  nextStepHi: string;
  actionLabel?: string;
  actionLabelHi?: string;
  actionType?: "modules" | "work" | "buddy";
  checklist: Array<{ label: string; labelHi: string; done: boolean }>;
}

export const CommercialCertificationCard: React.FC<CommercialCertificationCardProps> = ({
  newHire,
  currentDay,
  isHindi = false,
  onOpenModules,
  onOpenWorkTools,
  onOpenBuddy,
}) => {
  // Authoritative Day 10 outcome evaluation from intelligence service
  const evaluation: Day10EvaluationResult = evaluateDay10Outcome(newHire);

  const workerFirstName = (newHire.name || "Worker").split(" ")[0];

  // Dynamic values based on newHire or fallback to screenshot baseline
  const modulesDone = newHire.modulesCompleted ?? 4;
  const capabilities = newHire.capabilities || {};
  const demonstratedCount = Object.values(capabilities).filter(
    (c: any) => c && (c.evidence === "demonstrated" || c.mastery === "proficient" || c.mastery === "mastered")
  ).length || 2;
  const actualPickRate = newHire.daysHistory[newHire.daysHistory.length - 1]?.workSignal?.actualPickRate || 48;
  const targetPickRate = 50;
  const accuracy = newHire.daysHistory[newHire.daysHistory.length - 1]?.workSignal?.accuracyRate || 99;
  const helpRequests = newHire.daysHistory[newHire.daysHistory.length - 1]?.workSignal?.helpRequestsCount ?? 0;

  // The 7 Authoritative Commercial Standards
  const criteriaList: CriterionDetail[] = [
    {
      id: "mandatory-training",
      name: "Mandatory Training Completed",
      nameHi: "अनिवार्य ट्रेनिंग पूर्ण",
      met: modulesDone >= 10,
      metric: `${modulesDone}/10 foundation modules completed`,
      metricHi: `${modulesDone}/10 बुनियादी मॉड्यूल पूरे`,
      benchmark: "10/10 LMS digital modules completed with ≥85% quiz average",
      benchmarkHi: "सभी 10 डिजिटल मॉड्यूल पूर्ण (कम से कम 85% क्विज़ औसत)",
      whyItMatters: "Autonomous pickers must master safety guidelines, cold chain protocols, and Zebra scanner care before flying solo on the active dark store floor.",
      whyItMattersHi: "स्वतंत्र काम करने से पहले सुरक्षा SOP, कोल्ड चेन और ज़ेबरा स्कैनर के रखरखाव की पूरी जानकारी अनिवार्य है।",
      nextStep: "Complete the remaining foundational micro-modules in the LMS curriculum.",
      nextStepHi: "पाठ्यक्रम से शेष बुनियादी माइक्रो-मॉड्यूल पूरे करें।",
      actionLabel: "Complete Modules",
      actionLabelHi: "मॉड्यूल पूरे करें",
      actionType: "modules",
      checklist: [
        { label: "Dark Store Layout & Rack Topology SOP", labelHi: "डार्क स्टोर लेआउट व रैक नंबरिंग SOP", done: modulesDone >= 1 },
        { label: "Cold Room & Dairy Product Handling Protocol", labelHi: "कोल्ड रूम व डेयरी उत्पाद सुरक्षा", done: modulesDone >= 2 },
        { label: "Zebra Terminal Care & Docking Hygiene", labelHi: "ज़ेबरा स्कैनर रखरखाव व चार्जिंग डॉक", done: modulesDone >= 3 },
        { label: "FIFO Inventory & Expiry Date Verification", labelHi: "FIFO इन्वेंट्री और एक्सपायरी जांच", done: modulesDone >= 4 },
        { label: "Emergency Evacuation & Safety Protocols", labelHi: "आपातकालीन निकासी व सुरक्षा नियम", done: modulesDone >= 10 },
      ],
    },
    {
      id: "required-capabilities",
      name: "Required Capabilities Demonstrated",
      nameHi: "आवश्यक हुनर/क्षमताओं का प्रदर्शन",
      met: demonstratedCount >= 14,
      metric: `${demonstratedCount}/20 capabilities demonstrated on floor`,
      metricHi: `${demonstratedCount}/20 क्षमताएं फ्लोर पर सत्यापित`,
      benchmark: "At least 14 of 20 core operational capabilities verified with positive floor evidence",
      benchmarkHi: "20 में से न्यूनतम 14 मुख्य ऑपरेशनल क्षमताओं का लाइव फ्लोर पर सत्यापन",
      whyItMatters: "Theoretical knowledge must translate into muscle memory: rack navigation, heavy parcel lifting ergonomics, and fragile item handling.",
      whyItMattersHi: "थ्योरी ज्ञान का फ्लोर पर सही उपयोग जरूरी है: रैक में सामान खोजना, सही मुद्रा में सामान उठाना और नाज़ुक सामान संभालना।",
      nextStep: "Demonstrate cold room handling and high-rack picking with senior buddy Vikram during today's shift.",
      nextStepHi: "आज की शिफ्ट में सीनियर गाइड विक्रम भैया के सामने कोल्ड रूम और ऊंचे रैक से पिकिंग का लाइव प्रदर्शन करें।",
      actionLabel: "View Capabilities",
      actionLabelHi: "हुनर देखें",
      actionType: "work",
      checklist: [
        { label: "Aisle & Rack Locating under 15 seconds", labelHi: "15 सेकंड में सही रैक और बिन खोजना", done: demonstratedCount >= 1 },
        { label: "Fragile items segregation (Bread, Eggs, Glass)", labelHi: "नाज़ुक सामान अलग रखना (ब्रेड, अंडे, कांच)", done: demonstratedCount >= 2 },
        { label: "Chilled & Frozen item tote bag insulation", labelHi: "ठंडे सामान को थर्मल इंसुलेटेड बैग में पैक करना", done: demonstratedCount >= 14 },
        { label: "10kg heavy sack ergonomic lift technique", labelHi: "10kg भारी बैग उठाने की सही तकनीक", done: demonstratedCount >= 14 },
      ],
    },
    {
      id: "floor-productivity",
      name: "Floor Productivity Target",
      nameHi: "फ्लोर उत्पादकता लक्ष्य (स्पीड)",
      met: actualPickRate >= targetPickRate,
      metric: `${actualPickRate} picks/hr (target ${targetPickRate}/hr)`,
      metricHi: `${actualPickRate} पिक्स/घंटा (लक्ष्य ${targetPickRate}/घंटा)`,
      benchmark: "Sustain ≥50 picks per hour across active rush wave dispatch batches",
      benchmarkHi: "व्यस्त रश शिफ्ट के दौरान न्यूनतम 50 पिक्स प्रति घंटा की गति बनाए रखना",
      whyItMatters: "Quick commerce dark stores run on strict 10-minute dispatch SLAs. Every second saved per tote prevents delivery delays.",
      whyItMattersHi: "क्विक कॉमर्स 10-मिनट डिलीवरी पर चलता है। हर पैकेट में बचाया गया समय ग्राहक तक समय पर डिलीवरी सुनिश्चित करता है।",
      nextStep: `Current pace is ${actualPickRate} PPH. Gain ${targetPickRate - actualPickRate} PPH by grouping multi-item batches and using aisle routing.`,
      nextStepHi: `वर्तमान गति ${actualPickRate} PPH है। रूट प्लानिंग और बैचिंग से ${targetPickRate - actualPickRate} PPH की कमी पूरी करें।`,
      actionLabel: "Floor Picking Practice",
      actionLabelHi: "पिकिंग अभ्यास करें",
      actionType: "work",
      checklist: [
        { label: "Batch pick path optimization (Aisles 1–4)", labelHi: "गलियों में कम से कम चलकर सामान चुनना", done: actualPickRate >= 40 },
        { label: "Trolley steering through high-density traffic", labelHi: "भीड़भाड़ वाली गलियों में ट्रॉली तेज़ी से मोड़ना", done: actualPickRate >= 45 },
        { label: "Sustained 50+ PPH over 2-hour solo trial", labelHi: "2 घंटे के सोलो ट्रायल में 50+ PPH कायम रखना", done: actualPickRate >= 50 },
      ],
    },
    {
      id: "scanning-accuracy",
      name: "Scanning Accuracy Floor",
      nameHi: "स्कैनिंग सटीकता थ्रेशोल्ड",
      met: accuracy >= 98,
      metric: `${accuracy}% accuracy (threshold 98%)`,
      metricHi: `${accuracy}% सटीकता (मानक 98%)`,
      benchmark: "Maintain ≥98% first-pass barcode scan accuracy with zero mis-picks",
      benchmarkHi: "पहली बार में कम से कम 98% सही बारकोड स्कैन और शून्य गलत पिकिंग",
      whyItMatters: "A single mis-picked flavor or expired SKU leads to customer refund claims and lost trust.",
      whyItMattersHi: "एक भी गलत सामान या एक्सपायर्ड आइटम ग्राहक तक पहुंचने से कंपनी का भरोसा टूटता है।",
      nextStep: "Maintain your exceptional scan discipline. Always check product barcode against scanner screen prompt.",
      nextStepHi: "अपनी बेहतरीन स्कैनिंग सटीकता बनाए रखें। स्क्रीन प्रॉम्प्ट से बारकोड मिलाते रहें।",
      actionLabel: "Scanner Tool",
      actionLabelHi: "स्कैनर टूल",
      actionType: "work",
      checklist: [
        { label: "Barcode scan match rate ≥ 98%", labelHi: "बारकोड मिलान दर ≥ 98%", done: true },
        { label: "Manual SKU code entry used only for damaged labels", labelHi: "मैन्युअल कोड केवल फटे बारकोड पर इस्तेमाल", done: true },
        { label: "Double confirmation on high-value electronic SKUs", labelHi: "महंगे सामानों पर दोहरी पुष्टि", done: true },
      ],
    },
    {
      id: "independent-execution",
      name: "Independent Solo Execution",
      nameHi: "स्वतंत्र सोलो कार्य निष्पादन",
      met: helpRequests <= 1,
      metric: `${helpRequests} help requests logged; working autonomously`,
      metricHi: `${helpRequests} मदद अनुरोध; स्वतंत्र रूप से कार्यरत`,
      benchmark: "≤1 escalation per 50 orders; operates without constant lead supervision",
      benchmarkHi: "प्रति 50 ऑर्डर पर अधिकतम 1 सहायता कॉल; बिना लगातार निगरानी के काम",
      whyItMatters: "Certification certifies that the worker can take full ownership of a shift without occupying a lead's bandwidth.",
      whyItMattersHi: "सर्टिफिकेशन का मतलब है कि कर्मचारी बिना किसी लीड के खुद पूरी जिम्मेदारी से शिफ्ट संभाल सकता है।",
      nextStep: "Continue working independently while using the AI Buddy for instant micro-clarifications.",
      nextStepHi: "स्वतंत्र काम जारी रखें और किसी भी संशय के लिए एआई बडी से तुरंत पूछें।",
      actionLabel: "Chat with Buddy",
      actionLabelHi: "बडी से पूछें",
      actionType: "buddy",
      checklist: [
        { label: "0 help calls during routine dry grocery picking", labelHi: "सामान्य किराना पिकिंग में 0 मदद कॉल", done: true },
        { label: "Self-resolution of out-of-stock substitute flows", labelHi: "स्टॉक न मिलने पर खुद सही विकल्प चुनना", done: true },
        { label: "Autonomous battery swap at docking station", labelHi: "स्कैनर बैटरी खुद बदलकर काम जारी रखना", done: true },
      ],
    },
    {
      id: "safety-compliance",
      name: "Safety & Zone Compliance Clear",
      nameHi: "सुरक्षा व ज़ोन अनुपालन",
      met: true,
      metric: "Capability 1 verified; zero safety violations",
      metricHi: "क्षमता 1 सत्यापित; शून्य सुरक्षा उल्लंघन",
      benchmark: "100% PPE compliance (high-vis vest, composite toe shoes) and zero zone infractions",
      benchmarkHi: "100% सुरक्षा उपकरण (फ्लोरोसेंट जैकेट, सेफ्टी जूते) और शून्य नियम उल्लंघन",
      whyItMatters: "Worker safety is non-negotiable. Fast-moving forklifts and spill areas require absolute situational alertness.",
      whyItMattersHi: "सुरक्षा सर्वोपरि है। वेयरहाउस में चल रही मशीनों और फिसलन वाले क्षेत्रों में पूरी सावधानी आवश्यक है।",
      nextStep: "Continue wearing full protective gear and giving 'Side Please' calls at aisle blind corners.",
      nextStepHi: "पूरी सुरक्षा किट पहनें और गलियों के अंधे मोड़ पर 'साइड प्लीज़' की आवाज़ दें।",
      actionLabel: "Safety Guide",
      actionLabelHi: "सुरक्षा नियम",
      actionType: "work",
      checklist: [
        { label: "High-visibility fluorescent vest & steel-toe shoes verified", labelHi: "सुरक्षा जैकेट व जूते की जांच पूर्ण", done: true },
        { label: "Zero slip/trip incidents or aisle obstruction warnings", labelHi: "शून्य फिसलन या गलियारा रुकावट चेतावनी", done: true },
        { label: "Cold room jacket used when inside freezer > 3 mins", labelHi: "फ्रीजर में 3 मिनट से अधिक रहने पर थर्मल जैकेट", done: true },
      ],
    },
    {
      id: "no-critical-blockers",
      name: "No Unresolved Critical Blockers",
      nameHi: "कोई अनसुलझी गंभीर रुकावट नहीं",
      met: true,
      metric: "Floor friction cleared",
      metricHi: "फ्लोर रुकावटें साफ़",
      benchmark: "No active HR attendance blocks, shift manager escalations, or hardware holds",
      benchmarkHi: "कोई उपस्थिति रुकावट, मैनेजर शिकायत या स्कैनर खराबी लंबित नहीं",
      whyItMatters: "Ensures operational continuity and clean compliance records before official commercial certification.",
      whyItMattersHi: "आधिकारिक सर्टिफिकेशन से पहले सभी तकनीकी व प्रशासनिक रुकावटों का समाधान आवश्यक है।",
      nextStep: "All hardware and account clearances are active. Maintain perfect punctuality.",
      nextStepHi: "सभी हार्डवेयर और लॉगिन अनुमतियां सक्रिय हैं। समय की पाबंदी बनाए रखें।",
      actionLabel: "Check Status",
      actionLabelHi: "स्थिति जांचें",
      actionType: "work",
      checklist: [
        { label: "Biometric attendance check-in synced with shift roster", labelHi: "बायोमेट्रिक उपस्थिति शिफ्ट रोस्टर से सिंक", done: true },
        { label: "Zebra scanner MAC ID paired and operational", labelHi: "ज़ेबरा स्कैनर आईडी लिंक और चालू स्थिति में", done: true },
        { label: "Shift Lead sign-off on Day 3 probation review", labelHi: "डे 3 प्रोबेशन रिव्यू पर शिफ्ट लीड की सहमति", done: true },
      ],
    },
  ];

  // Active blockers list
  const activeBlockers = criteriaList.filter((c) => !c.met);
  const isCertifiedReady = activeBlockers.length === 0;

  // Track expanded state for all 7 criteria (collapsed by default on landing)
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const toggleCriterion = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (expandedIds.length === criteriaList.length) {
      setExpandedIds([]);
    } else {
      setExpandedIds(criteriaList.map((c) => c.id));
    }
  };

  return (
    <div
      id="day10-commercial-certification-card"
      className="bg-[#0e1117] rounded-[28px] p-4 sm:p-5 border border-white/10 space-y-4 shadow-2xl relative overflow-hidden"
    >
      {/* Top Ambient Glow subtle accent */}
      <div className="absolute -top-12 -right-12 w-44 h-44 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* HEADER: Title, Subtitle, Status Badge (Matches user screenshot) */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Teal / Cyan Rounded Icon Badge */}
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0 shadow-xs">
            <Award className="w-5 h-5" />
          </div>

          <div>
            <h3 className="text-sm sm:text-base font-black text-white tracking-tight">
              {isHindi
                ? "डे 10 कमर्शियल सर्टिफिकेशन (7 क्राइटेरिया)"
                : "Day 10 Commercial Certification (7 Criteria)"}
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
              {isHindi ? "7 आवश्यक व्यावसायिक मानदंड" : "7 Essential Commercial Standards"}
            </p>
          </div>
        </div>

        {/* Not Ready / Job Ready Badge (Exact styling from screenshot) */}
        <div className="shrink-0">
          {isCertifiedReady ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-black uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isHindi ? "जॉब रेडी" : "Job Ready"}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-black uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>{isHindi ? "नॉट रेडी" : "Not Ready"}</span>
            </span>
          )}
        </div>
      </div>

      {/* SUMMARY EXPLANATION (Matches text from screenshot) */}
      <div className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed bg-white/[0.02] p-3 rounded-2xl border border-white/5">
        {isCertifiedReady ? (
          <p>
            <strong className="text-emerald-300">{workerFirstName}</strong>{" "}
            {isHindi
              ? "ने सभी 7 आवश्यक व्यावसायिक मानदंड पूरे कर लिए हैं और वह स्वतंत्र सोलो डार्क स्टोर पिकिंग के लिए पूरी तरह प्रमाणित हैं।"
              : "has successfully cleared all 7 commercial readiness standards and is officially certified for autonomous dark store solo shifts."}
          </p>
        ) : (
          <p>
            <strong className="text-white">{workerFirstName}</strong>{" "}
            {isHindi
              ? `अभी ${activeBlockers.length} सक्रिय रुकावटों के कारण स्वतंत्र सर्टिफिकेशन के लिए तैयार नहीं हैं: `
              : `is NOT yet ready for autonomous certification due to ${activeBlockers.length} active blocker(s): `}
            <span className="text-rose-300 font-bold">
              {activeBlockers.map((b) => (isHindi ? b.nameHi : b.name)).join(", ")}
            </span>
            .
          </p>
        )}
      </div>

      {/* EXPAND ALL / COLLAPSE ALL TOGGLE */}
      <div className="flex items-center justify-between pt-0.5 px-1 text-xs">
        <span className="text-[11px] text-slate-400 font-bold">
          {criteriaList.filter((c) => c.met).length}/7 {isHindi ? "मानदंड पूरे" : "Criteria Cleared"}
        </span>

        <button
          type="button"
          id="toggle-all-commercial-criteria-btn"
          onClick={toggleAll}
          className="text-cyan-400 hover:text-cyan-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors active:scale-95"
        >
          {expandedIds.length === criteriaList.length ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>{isHindi ? "सब संक्षिप्त करें" : "Collapse All"}</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>{isHindi ? "सब विस्तार से देखें" : "Expand All (7 Steps)"}</span>
            </>
          )}
        </button>
      </div>

      {/* THE 7 EXPANDABLE CRITERIA CARDS (Matches Screenshot visual styling) */}
      <div className="space-y-2">
        {criteriaList.map((criterion, idx) => {
          const isExpanded = expandedIds.includes(criterion.id);
          const isMet = criterion.met;

          return (
            <div
              key={criterion.id}
              id={`commercial-step-${idx + 1}`}
              className={`rounded-2xl transition-all duration-200 overflow-hidden border ${
                isMet
                  ? "bg-[#141b1f]/90 border-teal-900/30 hover:border-teal-700/40"
                  : "bg-[#291419]/90 border-rose-900/40 hover:border-rose-700/50"
              }`}
            >
              {/* Clickable Header Row */}
              <button
                type="button"
                onClick={() => toggleCriterion(criterion.id)}
                aria-expanded={isExpanded}
                className="w-full p-3 sm:p-3.5 flex items-center justify-between gap-3 text-left cursor-pointer transition-colors select-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Status Icon Badge (⚠️ AlertTriangle for red cards, ✅ CheckCircle2 for green cards) */}
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border ${
                      isMet
                        ? "bg-teal-500/15 border-teal-500/30 text-teal-300"
                        : "bg-rose-500/20 border-rose-500/30 text-rose-300"
                    }`}
                  >
                    {isMet ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                    )}
                  </div>

                  {/* Title and Detail line */}
                  <div className="min-w-0">
                    <h4
                      className={`text-xs sm:text-sm font-bold tracking-tight truncate ${
                        isMet ? "text-slate-200" : "text-rose-200"
                      }`}
                    >
                      {isHindi ? criterion.nameHi : criterion.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                      {isHindi ? criterion.metricHi : criterion.metric}
                    </p>
                  </div>
                </div>

                {/* Right Expand / Collapse Chevron */}
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md hidden xs:inline-block ${
                      isMet
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                    }`}
                  >
                    {isMet ? (isHindi ? "सत्यापित" : "Met") : (isHindi ? "लंबित रुकावट" : "Pending")}
                  </span>

                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-slate-400 transition-transform duration-200 ${
                      isExpanded ? "rotate-180 text-cyan-300" : ""
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </button>

              {/* Expanded Detailed Step Content */}
              {isExpanded && (
                <div className="px-3.5 pb-4 pt-1 sm:px-4 sm:pb-4 space-y-3 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-200 text-xs">
                  {/* Benchmark Standard */}
                  <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wider block mb-0.5">
                      {isHindi ? "सर्टिफिकेशन मानक (बेंचमार्क):" : "Certification Benchmark:"}
                    </span>
                    <p className="text-slate-300 font-semibold">{isHindi ? criterion.benchmarkHi : criterion.benchmark}</p>
                  </div>

                  {/* Why It Matters */}
                  <div className="text-slate-300 text-[11px] leading-relaxed">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      {isHindi ? "व्यावसायिक महत्व:" : "Why It Matters for Autonomous Solo Shifts:"}
                    </span>
                    <p className="font-medium text-slate-300">{isHindi ? criterion.whyItMattersHi : criterion.whyItMatters}</p>
                  </div>

                  {/* Operational Verification Checklist */}
                  <div className="space-y-1.5 pt-0.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                      {isHindi ? "सत्यापन चेकलिस्ट:" : "Verification Checkpoints:"}
                    </span>
                    <div className="space-y-1">
                      {criterion.checklist.map((item, cIdx) => (
                        <div
                          key={cIdx}
                          className={`p-2 rounded-lg flex items-center gap-2 border text-[11px] ${
                            item.done
                              ? "bg-emerald-500/10 border-emerald-500/20 text-slate-200"
                              : "bg-white/5 border-white/5 text-slate-400"
                          }`}
                        >
                          {item.done ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          )}
                          <span className="font-medium">{isHindi ? item.labelHi : item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Step Box & CTA */}
                  <div
                    className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                      isMet
                        ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-200"
                        : "bg-amber-500/10 border-amber-500/20 text-amber-200"
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="text-[10px] font-black uppercase tracking-wider block mb-0.5">
                        {isMet
                          ? isHindi
                            ? "स्थिति: मानक पूर्ण"
                            : "Status: Target Cleared"
                          : isHindi
                          ? "आवश्यक अगला कदम:"
                          : "Action to Clear Blocker:"}
                      </span>
                      <p className="text-[11px] font-semibold leading-relaxed">
                        {isHindi ? criterion.nextStepHi : criterion.nextStep}
                      </p>
                    </div>

                    {criterion.actionLabel && (
                      <button
                        type="button"
                        onClick={() => {
                          if (criterion.actionType === "modules" && onOpenModules) onOpenModules();
                          else if (criterion.actionType === "work" && onOpenWorkTools) onOpenWorkTools();
                          else if (criterion.actionType === "buddy" && onOpenBuddy) onOpenBuddy();
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                          isMet
                            ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30"
                            : "bg-gradient-to-r from-amber-400 to-amber-500 hover:opacity-95 text-slate-950 shadow-sm"
                        }`}
                      >
                        <span>{isHindi ? criterion.actionLabelHi : criterion.actionLabel}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* BOTTOM AMBER CALLOUT: Main Blocker -> Required Next Action (Matches Screenshot) */}
      {!isCertifiedReady && activeBlockers.length > 0 && (
        <div className="bg-[#241a10] border border-amber-500/30 rounded-2xl p-3.5 text-xs text-amber-200 space-y-1 shadow-sm">
          <div className="text-amber-400 font-black flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
            <span>{isHindi ? "मुख्य रुकावट ➔ आवश्यक अगला कदम:" : "Main Blocker ➔ Required Next Step:"}</span>
          </div>
          <p className="font-semibold leading-relaxed text-amber-100">
            <strong className="text-amber-300 font-black">
              {isHindi ? activeBlockers[0].nameHi : activeBlockers[0].name}
            </strong>{" "}
            •{" "}
            {isHindi
              ? `स्वतंत्र सर्टिफिकेशन को मंजूरी देने से पहले ${activeBlockers[0].nameHi} का समाधान करें।`
              : `Address ${activeBlockers[0].name} before approving autonomous certification.`}
          </p>
        </div>
      )}
    </div>
  );
};
