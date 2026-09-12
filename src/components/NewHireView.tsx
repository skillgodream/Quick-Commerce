import React, { useState, useEffect } from "react";
import { NewHire, DailySignal, DARK_STORE_CAPABILITIES } from "../types";
import { MANDATORY_TRAINING_MODULES } from "../data/modulesData";
import {analyzeDailyReport} from "../services/intelligence";
import { speakMessage, stopSpeaking } from "../utils/speech";
import { CircularDialWidget } from "./CircularDialWidget";
import { StoreZonesGrid } from "./StoreZonesGrid";
import { JobReadyHumanFigure } from "./JobReadyHumanFigure";
import { ModulesView } from "./ModulesView";
import { TenDaySkillJourneyView } from "./TenDaySkillJourneyView";
import { FloatingGlassMenu, LearnerSection } from "./FloatingGlassMenu";
import { LearningProgressView } from "./LearningProgressView";
import { LearnerJourneyRoadmap } from "./LearnerJourneyRoadmap";
import { LearnerDailyReportCard } from "./LearnerDailyReportCard";
import { YesterdayShiftDetailModal } from "./YesterdayShiftDetailModal";
import { TodaysGoalLandingView } from "./TodaysGoalLandingView";
import { DailyCoachReportView } from "./DailyCoachReportView";
import { DashboardHeader } from "./DashboardHeader";
import { CommercialCertificationCard } from "./CommercialCertificationCard";
import { TelemetryPageView } from "./TelemetryPageView";
import { ControlTowerView } from "./ControlTowerView";
import { LearnerDashboardView } from "./LearnerDashboardView";
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  Calendar,
  AlertTriangle,
  FileText,
  Phone,
  CheckCircle2,
  AlertCircle,
  ThumbsUp,
  MapPin,
  ScanLine,
  UserCheck,
  X,
  Sparkles,
  Target,
  Zap,
  Home,
  BookOpen,
  Briefcase,
  MessageCircle,
  User,
  ArrowRight,
  ArrowLeft,
  ChevronRight, ChevronUp,
  Footprints,
  ShieldCheck,
  PackageCheck,
  RotateCcw,
  Clock,
  TrendingUp,
  Package,
  Award,
  Compass,
  Eye,
  Globe,
  ChevronDown,
  Check,
  Bell,
  ArrowUpRight,
  ArrowDownUp,
  ArrowDownRight,
  Snowflake,
  Truck,
} from "lucide-react";


const HOME_LEARNING_METRICS = [
  {
    id: "basics",
    titleEn: "Basics & Safety",
    titleHi: "मूल बातें और सुरक्षा",
    capIds: [1, 2, 3, 4, 5]
  },
  {
    id: "accuracy",
    titleEn: "Accuracy & Product Handling",
    titleHi: "सटीकता और उत्पाद प्रबंधन",
    capIds: [6, 7, 8, 10]
  },
  {
    id: "exceptions",
    titleEn: "Floor Exceptions",
    titleHi: "फ़्लोर अपवाद",
    capIds: [11, 12, 13, 18]
  },
  {
    id: "flow",
    titleEn: "Flow & Completion",
    titleHi: "प्रवाह और समापन",
    capIds: [9, 14, 15, 16, 17, 19]
  }
];

interface NewHireViewProps {
  newHire: NewHire;
  currentDay: number;
  onDailySignalSubmitted: (signal: DailySignal) => void;
  onAskHelp: (question: string) => Promise<string>;
  onSelectDay: (day: number) => void;
  onUpdateHire?: (updatedHire: NewHire) => void;
  isHindi?: boolean;
  onToggleLanguage?: () => void;
  setIsHindi?: (isHindi: boolean) => void;
  activeSection?: LearnerSection;
  onSelectSection?: (section: LearnerSection) => void;
  onOpenOnboarding?: () => void;
  onOpenManagerConsole?: () => void;
  newHires?: NewHire[];
  onSelectHire?: (hireId: string) => void;
}

export const NewHireView: React.FC<NewHireViewProps> = ({
  newHire,
  currentDay,
  onDailySignalSubmitted,
  onAskHelp,
  onUpdateHire,
  isHindi: propIsHindi,
  onToggleLanguage: propOnToggleLanguage,
  setIsHindi: propSetIsHindi,
  activeSection: propActiveSection,
  onSelectSection: propOnSelectSection,
  onOpenOnboarding,
  onOpenManagerConsole,
  newHires,
  onSelectHire,
}) => {
  // Current day record from authoritative state
  const currentRecord = newHire.daysHistory.find((d) => d.dayNumber === currentDay) || {
    dayNumber: currentDay,
    date: `Day ${currentDay}`,
    workSignal: {
      dayNumber: currentDay,
      targetPickRate: 50,
      actualPickRate: 35,
      accuracyRate: 98,
      ordersCompleted: 44,
      targetOrders: 65,
    },
    statusAtEnd: newHire.status,
    statusReason: newHire.statusReason,
  };

  // Language state: true = Hindi / Hinglish, false = Simple English (Default English)
  const [localIsHindi, setLocalIsHindi] = useState<boolean>(false);
  const isHindi = propIsHindi !== undefined ? propIsHindi : localIsHindi;
  const setIsHindi = propSetIsHindi || setLocalIsHindi;
  const handleToggleLanguage = propOnToggleLanguage || (() => setIsHindi(!isHindi));

  const totalModulesCount = MANDATORY_TRAINING_MODULES.length || 10;
  const completedModulesCount = newHire.completedModuleIds?.length ?? (newHire.modulesCompleted ?? 3);
  const courseCompletionPercentage = Math.round((completedModulesCount / totalModulesCount) * 100);

  // Automated Yesterday's Shift Metrics & Performance
  const yesterdayNumber = Math.max(1, currentDay - 1);
  const yesterdayRecord = newHire.daysHistory.find((d) => d.dayNumber === yesterdayNumber) ||
    newHire.daysHistory.filter((d) => d.dayNumber < currentDay).pop() ||
    newHire.daysHistory[0];

  const prevWork = yesterdayRecord?.workSignal;
  const actualPickRate = prevWork?.actualPickRate ?? (currentDay === 1 ? 20 : 32);
  const targetPickRate = prevWork?.targetPickRate ?? (currentDay === 1 ? 25 : 35);
  const isPickRateBad = actualPickRate < targetPickRate;

  const accuracyRate = prevWork?.accuracyRate ?? 99;
  const targetAccuracy = 98;
  const isAccuracyBad = accuracyRate < targetAccuracy;

  const ordersCompleted = prevWork?.ordersCompleted ?? (currentDay === 1 ? 15 : 38);
  const targetOrders = prevWork?.targetOrders ?? (currentDay === 1 ? 20 : 42);
  const isOrdersBad = ordersCompleted < targetOrders;

  const trainingScore = Math.min(100, Math.round(((completedModulesCount / 3) * 50 + ((newHire.quizAverageScore ?? 94) / 100) * 50)));
  const speedScore = Math.min(100, Math.round((actualPickRate / targetPickRate) * 100));
  const accuracyScore = Math.min(100, Math.round(accuracyRate));
  const ordersScore = Math.min(100, Math.round((ordersCompleted / targetOrders) * 100));
  const yesterdayShiftScore = Math.round(
    trainingScore * 0.25 + speedScore * 0.30 + accuracyScore * 0.30 + ordersScore * 0.15
  );
  const targetShiftScore = 90;
  const isShiftScoreBad = yesterdayShiftScore < targetShiftScore;

  // Automated Certification Readiness Evaluation
  const readinessEval = (newHire.day10Evaluation || { isCommercialReady: false, isReady: false, reasons: [], unresolvedBlockers: [], criteria: {} });
  const blockerCount = readinessEval.unresolvedBlockers.length;
  const isCertifiedReady = readinessEval.isReady;
  const automatedDate = yesterdayRecord?.date || (isHindi ? `दिन ${yesterdayNumber}` : `Day ${yesterdayNumber}`);
  const demonstratedCount = newHire.capabilitiesDemonstrated?.length || 2;

  // Active learner navigation tab: "home" | "modules" | "dial" | "dashboard" | "buddy"
  const [localActiveSection, setLocalActiveSection] = useState<LearnerSection>("home");
  const activeSection = propActiveSection !== undefined ? propActiveSection : localActiveSection;
  const setActiveSection = propOnSelectSection || setLocalActiveSection;

  // Learner Switcher Dropdown local states
  const [isLearnerDropdownOpen, setIsLearnerDropdownOpen] = useState<boolean>(false);
  const [showNextStepModal, setShowNextStepModal] = useState<boolean>(false);
  const learnerDropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const buttonEl = document.getElementById("home-learner-dropdown-btn");
      const popoverEl = document.getElementById("home-learner-dropdown-popover");
      if (
        buttonEl?.contains(event.target as Node) || 
        popoverEl?.contains(event.target as Node) ||
        (learnerDropdownRef.current && learnerDropdownRef.current.contains(event.target as Node))
      ) {
        return;
      }
      setIsLearnerDropdownOpen(false);
    };
    if (isLearnerDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isLearnerDropdownOpen]);

  // Active quick action modal
  const [activeModal, setActiveModal] = useState<"map" | "buddy" | "scanner" | "target" | "work" | "yesterday_detail" | null>(null);
  const [buddyAlertSent, setBuddyAlertSent] = useState<boolean>(false);
  const [showTodaysGoalView, setShowTodaysGoalView] = useState<boolean>(false);
  const [showDailyCoachReport, setShowDailyCoachReport] = useState<boolean>(false);
  const [selectedDeepLinkModuleId, setSelectedDeepLinkModuleId] = useState<string | null>(null);
  const [activeFloorTaskId, setActiveFloorTaskId] = useState<string | null>("t1");
  const [completedFloorTasks, setCompletedFloorTasks] = useState<Record<string, boolean>>({
    "t1_sub1": false,
    "t1_sub2": false,
    "t1_sub3": false,
    "t2_sub1": false,
    "t2_sub2": false,
    "t2_sub3": false,
    "t3_sub1": false,
    "t3_sub2": false,
    "t3_sub3": false,
    "t4_sub1": false,
    "t4_sub2": false,
  });

  const [completedWorkChecklist, setCompletedWorkChecklist] = useState<Record<string, boolean>>({
    walk: false,
    seal: false,
    pack: false,
  });
  const [completedScannerChecklist, setCompletedScannerChecklist] = useState<Record<string, boolean>>({
    laser: false,
    dist: false,
    battery: false,
  });
  const [completedTargetChecklist, setCompletedTargetChecklist] = useState<Record<string, boolean>>({
    orders: false,
    pacing: false,
    report: false,
  });

  // Voice recording & input states
  const [isListening, setIsListening] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showTextInput, setShowTextInput] = useState<boolean>(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // Latest companion exchange (minimalist conversation card instead of heavy chat wall)
  const [latestInteraction, setLatestInteraction] = useState<{
    userText: string;
    replyText: string;
    timestamp: string;
  } | null>(null);

  // Authoritative Overall Job Readiness calculation
  const authoritativeReadiness = (typeof newHire.overallReadinessScore === "number" ? (newHire.overallReadinessScore <= 1 ? Math.round(newHire.overallReadinessScore * 100) : Math.round(newHire.overallReadinessScore)) : 0);

  // Derive simple human state from existing intelligence ledger
  const isSupportCompleted = Boolean(
    currentRecord.actionOutcome && currentRecord.actionOutcome.improved
  );
  const isSupportAssigned = Boolean(
    !isSupportCompleted &&
      currentRecord.recommendedAction &&
      currentRecord.recommendedAction.status !== "completed"
  );
  const isNeedsHelp = Boolean(
    !isSupportCompleted &&
      !isSupportAssigned &&
      (currentRecord.statusAtEnd === "Needs attention" ||
        currentRecord.statusAtEnd === "At risk" ||
        (currentRecord.dailySignal && currentRecord.dailySignal.confidence === "Low"))
  );

  // Synchronize latest exchange on day change
  useEffect(() => {
    if (currentRecord.dailySignal) {
      setLatestInteraction({
        userText: currentRecord.dailySignal.rawText,
        replyText:
          currentRecord.dailySignal.companionResponse ||
          (isNeedsHelp
            ? `${newHire.buddy.split(" ")[0]} will help you with floor picking today. Accuracy is ${currentRecord.workSignal?.accuracyRate ?? 98}%, no stress!`
            : "Shift reported! Great work keeping high accuracy."),
        timestamp: currentRecord.dailySignal.timestamp || "Today",
      });
    } else {
      setLatestInteraction(null);
    }
    setBuddyAlertSent(false);
    setInputText("");
    setShowTextInput(false);
  }, [currentDay, newHire.id, newHire.buddy, currentRecord.dailySignal, currentRecord.workSignal, isNeedsHelp]);

  // Audio speech player
  const handlePlayAudio = (id: string, text: string) => {
    if (playingAudioId === id) {
      stopSpeaking();
      setPlayingAudioId(null);
    } else {
      setPlayingAudioId(id);
      speakMessage(text, isHindi);
      const wordCount = text.split(" ").length;
      const durationMs = Math.max(2500, (wordCount / 2.5) * 1000);
      setTimeout(() => {
        setPlayingAudioId((curr) => (curr === id ? null : curr));
      }, durationMs);
    }
  };

  // WhatsApp-style Voice Toggle
  const handleToggleVoice = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Friendly fallback in sandbox environments
      const sampleSpokenReports = isHindi
        ? [
            "भैया मुझे आइसल 4 से 8 में सामान ढूंढने में बहुत टाइम लग रहा है।",
            "दही और दूध का कोल्ड रूम कहां पर है?",
            "स्कैनर बारकोड नहीं पढ़ रहा है, लाल लाइट जल रही है।",
            "आज शिफ्ट अच्छी रही, 48 पैकेट फटाफट पैक कर दिए।",
          ]
        : [
            "I am taking too long to find items in Aisles 4 to 8.",
            "Where is the cold dairy room?",
            "The barcode scanner is not reading labels.",
            "Smooth shift today, picked items easily.",
          ];
      const randomText =
        sampleSpokenReports[Math.floor(Math.random() * sampleSpokenReports.length)];
      handleSendMessage(randomText);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = isHindi ? "hi-IN" : "en-IN";

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) handleSendMessage(transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch (e) {
      setIsListening(false);
      handleSendMessage(
        isHindi
          ? "मुझे आइसल 4 से 8 में सामान ढूंढने में देर लग रही है।"
          : "I am taking too long in aisles 4 to 8."
      );
    }
  };

  // Message dispatcher
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend !== undefined ? textToSend : inputText).trim();
    if (!text || isProcessing) return;

    setIsProcessing(true);
    setInputText("");

    try {
      const lower = text.toLowerCase();
      const isQuestion =
        text.includes("?") ||
        lower.includes("kahan") ||
        lower.includes("where") ||
        lower.includes("how") ||
        lower.includes("kya") ||
        lower.includes("kaise") ||
        lower.startsWith("can i");

      if (isQuestion) {
        const answer = await onAskHelp(text);
        setLatestInteraction({
          userText: text,
          replyText: answer,
          timestamp: "Just now",
        });
        handlePlayAudio("latest-interaction", answer);
      } else {
        const analyzed = await analyzeDailyReport(text, newHire.name, currentDay);
        const replyText =
          analyzed.companionResponse ||
          (isHindi
            ? `समझ गया ${newHire.name.split(" ")[0]}! ${newHire.buddy.split(" ")[0]} भैया को बता दिया है, वो आपको फ्लोर पर समझा देंगे।`
            : `Got it, ${newHire.name.split(" ")[0]}! Buddy ${newHire.buddy.split(" ")[0]} has been alerted to walk through with you.`);

        const signal: DailySignal = {
          id: `sig-${Date.now()}`,
          dayNumber: currentDay,
          rawText: text,
          inputMethod: "voice",
          issue: analyzed.issue || "Floor experience",
          confidence: (analyzed.confidence as any) || "Medium",
          possibleImpact: analyzed.possibleImpact || "Ramp adjustment",
          category: (analyzed.category as any) || "General",
          summary: analyzed.summary || text.slice(0, 80),
          companionResponse: replyText,
          timestamp: "Just now",
        };

        onDailySignalSubmitted(signal);
        setLatestInteraction({
          userText: text,
          replyText,
          timestamp: "Just now",
        });
        handlePlayAudio("latest-interaction", replyText);
      }
    } catch (err) {
      console.error(err);
      const fallbackReply = isHindi
        ? "आपकी बात नोट कर ली गई है।"
        : "I heard you! Noted for your shift.";
      setLatestInteraction({
        userText: text,
        replyText: fallbackReply,
        timestamp: "Just now",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Enhanced status & intelligent prescription content answering the 6 core questions
  const getStatusContent = () => {
    const accuracy = currentRecord.workSignal?.accuracyRate ?? 98;
    const actualPace = currentRecord.workSignal?.actualPickRate ?? 35;
    const targetPace = currentRecord.workSignal?.targetPickRate ?? 50;
    const buddyName = newHire.buddy.split(" ")[0];
    const supervisorName = newHire.supervisor.split(" ")[0];

    // 1. Tool / Hardware obstacle
    if (
      currentRecord.dailySignal?.category === "Tool" ||
      currentRecord.recommendedAction?.decisionType === "tool_remedy" ||
      currentRecord.identifiedPattern?.category === "Tool"
    ) {
      return {
        badge: isHindi ? "डिवाइस 🛠️" : "EQUIPMENT 🛠️",
        duration: "2 min",
        action: isHindi ? "स्कैनर लेंस साफ करें या बदलें" : "Clean scanner or swap at desk",
        shortWhy: isHindi ? "बारकोड पढ़ने में देरी सुधारें" : "Fix barcode read delay",
        target: isHindi ? "बीप के साथ तुरंत स्कैन होना चाहिए" : "Quick beep on every scan",
        primaryBtnText: isHindi ? "शुरू करें" : "START",
        primaryAction: () => setActiveModal("scanner"),
        secondaryBtnText: isHindi ? `${buddyName} को बताएं` : `Tell ${buddyName}`,
        secondaryAction: () => setActiveSection("buddy"),
      };
    }

    // 2. External store / facility bottleneck
    if (
      currentRecord.workSignal?.externalBottleneck ||
      currentRecord.identifiedPattern?.patternName.includes("Bottleneck") ||
      currentRecord.recommendedAction?.decisionType === "environment_support"
    ) {
      return {
        badge: isHindi ? "फ्लोर सूचना 🏢" : "FLOOR NOTICE 🏢",
        duration: isHindi ? "शिफ्ट लक्ष्य" : "This wave",
        action: isHindi ? "सावधानी से पिकिंग जारी रखें" : "Keep picking steady & safe",
        shortWhy: isHindi ? "कन्वेयर पर थोड़ा जाम है" : "Conveyor is moving slow",
        target: isHindi ? "98%+ सही स्कैन रखें" : "Keep 98%+ accuracy",
        primaryBtnText: isHindi ? "शुरू करें" : "START",
        primaryAction: () => setActiveModal("work"),
        secondaryBtnText: isHindi ? "स्टोर मैप" : "Store Map",
        secondaryAction: () => setActiveModal("map"),
      };
    }

    // 3. Support Completed / Intervention Succeeded (Intervention Memory)
    if (isSupportCompleted) {
      return {
        badge: isHindi ? "शाबाश 👍" : "SOLO READY 👍",
        duration: isHindi ? "सोलो शिफ्ट" : "Solo shift",
        action: isHindi ? "अकेले सोलो पिकिंग शुरू करें" : "Start solo order picking",
        shortWhy: isHindi ? "आपकी स्पीड अच्छी हो गई है" : "Pace is up with zero errors",
        target: isHindi ? "5 ऑर्डर अकेले पूरे करें" : "Pick 5 orders solo",
        primaryBtnText: isHindi ? "शुरू करें" : "START",
        primaryAction: () => setActiveModal("work"),
        secondaryBtnText: isHindi ? "साथी से बात करें" : `Talk to ${buddyName}`,
        secondaryAction: () => setActiveSection("buddy"),
      };
    }

    const targetCapId = currentRecord?.recommendedAction?.targetCapabilityId || newHire.currentCapabilityId || 3;
    const targetCapDef = DARK_STORE_CAPABILITIES.find((c) => c.id === targetCapId);
    const targetCapName = targetCapDef ? (targetCapDef.id === 3 ? "Finding locations" : targetCapDef.name) : "Finding locations";

    // 4. Support Assigned / Prescribed Walkthrough
    if (isSupportAssigned) {
      return {
        badge: isHindi ? "आज का मुख्य कदम 🤝" : "TODAY'S MAIN STEP 🤝",
        duration: "15 min",
        action: isHindi ? `${buddyName} भैया के साथ फ्लोर वॉक` : "Floor walk with Buddy",
        shortWhy: isHindi ? "सामान ढूंढने में सुधार करें" : "Improve location finding",
        target: isHindi ? "5 सामान बिना भटके पिक करें" : "Pick 5 items without backtracking",
        primaryBtnText: isHindi ? "शुरू करें" : "START",
        primaryAction: () => {
          setBuddyAlertSent(true);
          setActiveModal("buddy");
        },
        secondaryBtnText: isHindi ? "स्टोर मैप" : "Store Map",
        secondaryAction: () => setActiveModal("map"),
      };
    }

    // 5. Needs Help / Early Foundation
    if (isNeedsHelp) {
      return {
        badge: isHindi ? "अभ्यास 🤝" : "PRACTICE 🤝",
        duration: "10 min",
        action: isHindi ? "सामान ढूंढने का अभ्यास" : "Practice finding items",
        shortWhy: isHindi ? "शेल्फ कोड समझने में मदद लें" : "Learn shelf codes faster",
        target: isHindi ? "अगले 3 ऑर्डर सही पहचानें" : "Get next 3 shelf codes right",
        primaryBtnText: isHindi ? "शुरू करें" : "START",
        primaryAction: () => setActiveSection("buddy"),
        secondaryBtnText: isHindi ? "शिफ्ट टूल्स" : "Floor Tools",
        secondaryAction: () => setActiveModal("work"),
      };
    }

    // 6. Insufficient Evidence
    if (
      currentRecord.recommendedAction?.decisionType === "no_action_monitor" ||
      currentRecord.identifiedPattern?.category === "insufficient_evidence"
    ) {
      return {
        badge: isHindi ? "सामान्य काम 👍" : "NORMAL WORK 👍",
        duration: isHindi ? "आज की शिफ्ट" : "Shift goal",
        action: isHindi ? "आज का सामान्य काम जारी रखें" : "Continue today's normal work",
        shortWhy: isHindi ? "हम अभी आपके प्रदर्शन को समझ रहे हैं।" : "We're still learning about your performance.",
        target: "", // No target
        primaryBtnText: isHindi ? "शुरू करें" : "START",
        primaryAction: () => setActiveModal("work"),
        secondaryBtnText: isHindi ? "मॉड्यूल" : "Modules",
        secondaryAction: () => setActiveSection("modules"),
      };
    }

    // 7. Default Steady Ramp
    return {
      badge: isHindi ? "आज का मुख्य काम 👍" : "TODAY'S FOCUS 👍",
      duration: isHindi ? "आज की शिफ्ट" : "Shift goal",
      action: isHindi ? "सही सामान पिक और स्कैन करें" : "Pick & scan orders accurately",
      shortWhy: isHindi ? "स्पीड अपने आप बढ़ जाएगी" : "Accuracy builds good speed",
      target: isHindi ? "98%+ सही स्कैन रखें" : "Keep 98%+ accuracy",
      primaryBtnText: isHindi ? "शुरू करें" : "START",
      primaryAction: () => setActiveModal("work"),
      secondaryBtnText: isHindi ? "मॉड्यूल" : "Modules",
      secondaryAction: () => setActiveSection("modules"),
    };
  };

  const status = getStatusContent();

  if (showTodaysGoalView) {
    return (
      <TodaysGoalLandingView
        newHire={newHire}
        currentDay={currentDay}
        isHindi={isHindi}
        onToggleLanguage={() => setIsHindi(!isHindi)}
        onBack={() => setShowTodaysGoalView(false)}
        onSelectSection={setActiveSection}
        onUpdateHire={onUpdateHire}
        onOpenBuddy={() => setActiveSection("buddy")}
        onSelectModuleWithId={(modId) => {
          setSelectedDeepLinkModuleId(modId);
          setActiveSection("modules");
          setShowTodaysGoalView(false);
        }}
        onSelectFloorTask={(modalType) => {
          setActiveSection("dial");
          if (modalType === "map" || modalType === "buddy") {
            setActiveFloorTaskId("t1");
          } else if (modalType === "scanner") {
            setActiveFloorTaskId("t2");
          } else if (modalType === "work") {
            setActiveFloorTaskId("t3");
          } else if (modalType === "target") {
            setActiveFloorTaskId("t4");
          }
          setShowTodaysGoalView(false);
        }}
      />
    );
  }

  if (activeSection === "modules") {
    return (
      <div 
        id="modules-view-container" 
        className="max-w-md mx-auto pb-36 select-none min-h-screen relative bg-[#EEEEEE] text-slate-900 overflow-hidden animate-in fade-in duration-200"
      >
        {/* Content wrapper */}
        <div className="relative z-10">
          <ModulesView
            newHire={newHire}
            onUpdateHire={onUpdateHire}
            isHindi={isHindi}
            initialModuleId={selectedDeepLinkModuleId}
            currentDay={currentDay}
          />
        </div>
        <FloatingGlassMenu
          activeSection={activeSection}
          onSelectSection={setActiveSection}
          isHindi={isHindi}
          hasAttention={isNeedsHelp || isSupportAssigned}
          buddyAssigned={isSupportAssigned}
        />
      </div>
    );
  }

  if (activeSection === "home") {
    return (
      <div className="max-w-md mx-auto p-1.5 sm:p-2 pb-36 select-none min-h-screen bg-white text-slate-900 relative font-ref antialiased">
        
        {/* Full-Bleed Hero Banner containing Top Header and Readiness Score */}
        <div className="bg-gradient-to-b from-[#0E4AA9] to-[#021F54] rounded-[40px] px-5 pt-5 pb-12 mb-7 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4),0_15px_25px_-10px_rgba(0,0,0,0.2),inset_0_3px_8px_rgba(255,255,255,0.15),inset_0_-3px_8px_rgba(0,0,0,0.15)] flex flex-col text-white border border-white/10 relative overflow-hidden">
          
          {/* Top Header: Learner Profile Switcher (Left) & Manager Console / Bell / Language (Right) */}
          <div className="flex items-center justify-between mb-8 relative z-20">
            {/* Top-Left Learner Profile & Switcher Dropdown */}
            <div className="relative" ref={learnerDropdownRef}>
              <button
                id="home-learner-dropdown-btn"
                type="button"
                onClick={() => setIsLearnerDropdownOpen(!isLearnerDropdownOpen)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all cursor-pointer shadow-sm"
                title={newHire.name}
                aria-label="Learner profile"
              >
                <User className="w-5 h-5 text-white" />
              </button>

              {isLearnerDropdownOpen && newHires && newHires.length > 0 && (
                <div
                  id="home-learner-dropdown-popover"
                  className="absolute top-12 left-0 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1 text-slate-900"
                >
                  <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    {isHindi ? "प्रशिक्षु स्विच करें" : "Switch Learner Profile"}
                  </div>
                  {newHires.map((hire) => (
                    <button
                      key={hire.id}
                      onClick={() => {
                        if (onSelectHire) onSelectHire(hire.id);
                        setIsLearnerDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition-colors cursor-pointer ${
                        hire.id === newHire.id ? "bg-slate-100 text-black font-black" : "hover:bg-slate-50 text-slate-700 font-medium"
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-black text-black tracking-tight truncate">{hire.name}</p>
                        <p className="text-[10px] text-slate-500 tracking-tight truncate">{hire.role}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Top-Right Controls: Manager Console, Bell & Language Switcher */}
            <div className="flex items-center gap-2">
              {onOpenManagerConsole && (
                <button
                  type="button"
                  onClick={onOpenManagerConsole}
                  className="h-10 px-3 rounded-full bg-indigo-500 hover:bg-indigo-400 backdrop-blur-md border border-indigo-400 flex items-center justify-center gap-1.5 text-white transition-all cursor-pointer shadow-md"
                  title="Manager Console"
                >
                  <ShieldCheck className="w-4 h-4 text-white" />
                  <span className="text-xs font-bold whitespace-nowrap">Manager</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowNextStepModal(true)}
                className="relative w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all cursor-pointer shadow-sm"
                title="Action Highlights & Context"
              >
                <Bell className="w-5 h-5 text-white" />
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white/50 animate-pulse" />
              </button>

              {/* Language Toggle Pill: EN vs हिंदी */}
              <div className="bg-white/10 backdrop-blur-md rounded-full p-1 flex items-center gap-1 border border-white/20 shadow-sm">
                <button
                  type="button"
                  onClick={() => setIsHindi(false)}
                  className={`px-3 py-1 rounded-full text-xs font-black tracking-tight transition-all cursor-pointer ${
                    !isHindi ? "bg-white text-[#0E4AA9] shadow-xs" : "text-white hover:bg-white/10"
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setIsHindi(true)}
                  className={`px-3 py-1 rounded-full text-xs font-black tracking-tight transition-all cursor-pointer ${
                    isHindi ? "bg-white text-[#0E4AA9] shadow-xs" : "text-white hover:bg-white/10"
                  }`}
                >
                  हिंदी
                </button>
              </div>
            </div>
          </div>

          {/* Readiness Score Content */}
          <div className="flex flex-col items-center justify-center relative z-10 pt-2">
            
            {/* Circular Progress Gauge */}
            <div className="relative w-52 h-52 sm:w-60 sm:h-60 flex items-center justify-center mb-7 bg-[#e0e0e0] rounded-full shadow-[3px_3px_6px_#b8b8b8,-3px_-3px_6px_#ffffff]">
              <svg viewBox="0 0 180 180" className="w-full h-full -rotate-90 drop-shadow-md">
                {/* Background Track */}
                <circle
                  cx="90"
                  cy="90"
                  r="76"
                  fill="none"
                  stroke="rgba(0, 0, 0, 0.1)"
                  strokeWidth="14"
                />
                {/* Progress Arc */}
                <circle
                  cx="90"
                  cy="90"
                  r="76"
                  fill="none"
                  stroke="#0E4AA9"
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 76}
                  strokeDashoffset={(2 * Math.PI * 76) - ((authoritativeReadiness ?? 35) / 100) * (2 * Math.PI * 76)}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              
              {/* Center Content (Number and Label) */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
                <div className="flex items-baseline gap-1 mb-1">
                  <span 
                    className="font-bold text-slate-900 tracking-[-0.04em] leading-none font-sans"
                    style={{ fontSize: 'clamp(4.5rem, 15vw, 5.5rem)' }}
                  >
                    {authoritativeReadiness ?? 35}
                  </span>
                  <span className="text-2xl sm:text-3xl font-bold text-slate-700">
                    %
                  </span>
                </div>
                <span className="text-[11px] sm:text-[12px] font-bold text-slate-700 tracking-[0.15em] uppercase">
                  {isHindi ? "भूमिका तत्परता" : "Role Readiness"}
                </span>
              </div>
            </div>
            
            {/* Translucent tab under the circle */}
            <div className="relative z-10 inline-flex items-center justify-center gap-2.5 px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="text-xs sm:text-sm font-semibold text-white tracking-wide">
                {isHindi ? "प्रमाणन के लिए 6 दिन शेष" : "6 days to certification"}
              </span>
            </div>
          </div>
        </div>

        {/* Content Below Banner (add horizontal padding back since we removed it from the wrapper) */}
        <div className="px-4">
          {/* Status Pills Row */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 no-scrollbar">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black text-white text-xs font-black tracking-tight shadow-xs shrink-0">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="ref-num">Day {currentDay} / 10</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/80 text-black text-xs font-bold tracking-tight shadow-xs shrink-0">
            <span className="ref-num">{new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
          </div>
          <div
            onClick={() => setShowNextStepModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-100/90 border border-amber-300 text-amber-950 text-xs font-black tracking-tight shadow-xs shrink-0 cursor-pointer hover:bg-amber-200 transition-colors"
          >
            <span>{isHindi ? "ध्यान आवश्यक" : "Needs attention"}</span>
          </div>
        </div>

                        {/* 4-Grid Visual Capability Dashboard */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {HOME_LEARNING_METRICS.map(metric => {
            // Check if any capability in this metric needs attention
            let hasAttention = false;
            let hasEvidence = false;
            
            metric.capIds.forEach(capId => {
              const state = newHire.capabilities?.[capId];
              if (state && state.evidence !== "none") {
                hasEvidence = true;
              }
              if (state && state.performance === "below_target") {
                hasAttention = true;
              }
            });

            return (
              <div 
                key={metric.id}
                onClick={() => {
                  setActiveSection("learner_dashboard");
                }}
                className={`rounded-2xl p-3 border ${hasAttention ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'} flex flex-col justify-between min-h-[88px] cursor-pointer active:scale-95 transition-all shadow-sm`}
              >
                <div className="flex items-start justify-between gap-1 mb-2">
                  <span className={`text-xs font-bold leading-tight ${hasAttention ? 'text-rose-900' : 'text-slate-700'}`}>
                    {isHindi ? metric.titleHi : metric.titleEn}
                  </span>
                  {hasAttention && <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}
                </div>
                <div className="mt-auto">
                  <span className={`text-[10px] font-black uppercase tracking-wider ${hasAttention ? 'text-rose-600' : 'text-slate-400'}`}>
                    {hasAttention 
                      ? (isHindi ? "ध्यान आवश्यक" : "Needs attention") 
                      : (!hasEvidence 
                          ? (isHindi ? "पर्याप्त साक्ष्य नहीं" : "Not enough evidence") 
                          : (isHindi ? "ट्रैक पर" : "On track"))
                    }
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Current Focus Card - Coordinate Navigation */}
        <div
          id="home-current-focus-card"
          onClick={() => setShowTodaysGoalView(true)}
          className="bg-[#000000] text-white rounded-3xl p-4 border border-black shadow-md mb-20 sm:mb-24 flex items-center justify-between cursor-pointer hover:bg-neutral-900 transition-all active:scale-[0.99] group relative"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-yellow-400 shrink-0 group-hover:bg-white/15 transition-colors shadow-2xs">
              <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400 animate-icon-blink" />
            </div>
            <div>
              <span className="text-sm sm:text-base font-black tracking-widest text-white block uppercase">
                {isHindi ? "वर्तमान फोकस" : "CURRENT FOCUS"}
              </span>
            </div>
          </div>
          <div className="flex items-center pr-1 shrink-0">
            <div className="w-9 h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-yellow-400">
              <ArrowRight className="w-5 h-5 text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Course Completion Card */}
        <div 
          onClick={() => setActiveSection("modules")}
          className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs mb-6 space-y-3 cursor-pointer hover:border-slate-300 transition-all active:scale-[0.99] group"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-black tracking-tight group-hover:text-slate-800 transition-colors">
              {isHindi ? "आज के कार्य पूर्णता" : "Today's Task Completion"}
            </h2>
            <span className="ref-num text-lg font-black text-black tracking-[-0.04em]">
              {courseCompletionPercentage}%
            </span>
          </div>

          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-black rounded-full transition-all duration-500" 
              style={{ width: `${Math.max(4, courseCompletionPercentage)}%` }}
            />
          </div>
        </div>

                        {/* Yesterday's Shift Performance */}
        <div className="mb-6 space-y-3 bg-[#e0e0e0] p-4 sm:p-5 rounded-[32px]">
          <div className="px-1">
            <h3 className="text-[13px] font-black text-slate-800 tracking-wider uppercase">
              {isHindi ? "कल के मेट्रिक्स" : "Yesterday's Metrics"}
            </h3>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {[
              {
                id: "speed",
                label: isHindi ? "पिक स्पीड" : "Pick Speed",
                value: `${actualPickRate}`,
                unit: "/hr",
                icon: Zap,
                isBad: isPickRateBad,
              },
              {
                id: "accuracy",
                label: isHindi ? "एक्यूरेसी" : "Accuracy",
                value: `${accuracyRate}%`,
                unit: "",
                icon: CheckCircle2,
                isBad: isAccuracyBad,
              },
              {
                id: "orders",
                label: isHindi ? "ऑर्डर्स" : "Orders Done",
                value: `${ordersCompleted}`,
                unit: "",
                icon: Package,
                isBad: isOrdersBad,
              },
              {
                id: "score",
                label: isHindi ? "शिफ्ट स्कोर" : "Shift Score",
                value: `${yesterdayShiftScore}%`,
                unit: "",
                icon: Award,
                isBad: isShiftScoreBad,
              },
            ].map((metric) => {
              const IconComponent = metric.icon;
              return (
                <button
                  key={metric.id}
                  type="button"
                  onClick={() => setActiveModal("yesterday_detail")}
                  className={`relative rounded-2xl p-2.5 flex flex-col items-center justify-center text-center border transition-all cursor-pointer active:scale-95 group ${
                    metric.isBad 
                      ? "bg-rose-50/50 border-rose-200/80 shadow-2xs hover:border-rose-300 hover:bg-rose-50/80"
                      : "bg-white border-slate-200/80 shadow-2xs hover:border-slate-300"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-1.5 transition-colors ${
                    metric.isBad ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-700 group-hover:bg-slate-200"
                  }`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] font-bold tracking-tight leading-none mb-1.5 uppercase ${
                    metric.isBad ? "text-rose-700 font-black" : "text-slate-500"
                  }`}>
                    {metric.label}
                  </span>
                  <div className="flex items-baseline justify-center gap-0.5">
                    <span
                      className={`ref-num text-base sm:text-lg font-black leading-tight tracking-[-0.05em] ${
                        metric.isBad ? "text-rose-600" : "text-black"
                      }`}
                    >
                      {metric.value}
                    </span>
                    {metric.unit && (
                      <span className={`text-[9px] font-bold tracking-tight ${metric.isBad ? "text-rose-600" : "text-slate-500"}`}>
                        {metric.unit}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Ready / Not Ready for Certification Card */}
        <div 
          onClick={() => setActiveModal("yesterday_detail")}
          className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs mb-4 flex items-center justify-between cursor-pointer hover:border-slate-300 transition-all active:scale-[0.99] group"
        >
          <div className="flex items-center gap-3">
            <div className={`w-1.5 h-9 rounded-full shrink-0 ${isCertifiedReady ? "bg-emerald-500" : "bg-rose-500"}`} />
            <div>
              <h4 className="text-xs font-black text-black tracking-tight group-hover:text-slate-800 transition-colors">
                {isCertifiedReady
                  ? (isHindi ? "प्रमाणन के लिए तैयार" : "Ready for certification")
                  : (isHindi ? "प्रमाणन के लिए तैयार नहीं" : "Not ready for certification")}
              </h4>
              <p className="text-[11px] text-slate-500 font-medium tracking-tight mt-0.5">
                {isCertifiedReady
                  ? (isHindi ? `सभी 7 मानदंड उत्तीर्ण · ${automatedDate}` : `All 7 criteria cleared · ${automatedDate}`)
                  : (isHindi ? `${blockerCount} सक्रिय रुकावटें चिन्हित · ${automatedDate}` : `${blockerCount} active blocker${blockerCount === 1 ? "" : "s"} · ${automatedDate}`)}
              </p>
            </div>
          </div>
          <span className={`ref-num text-xs font-black px-3 py-1 rounded-full border shadow-2xs shrink-0 tracking-tight ${
            isCertifiedReady
              ? "text-emerald-700 bg-emerald-50 border-emerald-200/80"
              : "text-rose-700 bg-rose-50 border-rose-200/80"
          }`}>
            {isCertifiedReady
              ? (isHindi ? "0 ब्लॉकर्स · तैयार" : "0 blockers · Ready")
              : `${blockerCount} ${isHindi ? "ब्लॉकर्स" : blockerCount === 1 ? "blocker" : "blockers"}`}
          </span>
        </div>

        {/* Certification Criteria Checklist (Automated Fetched Data) */}
        <div className="bg-[#12141c] text-white rounded-3xl p-5 shadow-xl border border-slate-800 space-y-4 mb-24 font-ref">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-black text-white tracking-tight">
                {isCertifiedReady
                  ? (isHindi ? "प्रमाणन मानदंड स्थिति" : "Certification Criteria Status")
                  : (isHindi ? "प्रमाणन ब्लॉकर्स और मानदंड" : "Certification Criteria & Blockers")}
              </h3>
            </div>
            <span className="ref-num text-[10px] font-black uppercase tracking-wider text-slate-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
              {automatedDate}
            </span>
          </div>

          <div className="space-y-2">
            {[
              { 
                label: isHindi ? "अनिवार्य ट्रेनिंग पूरी" : "Mandatory training completed", 
                value: `${completedModulesCount}/${totalModulesCount}`, 
                met: completedModulesCount >= 10 
              },
              { 
                label: isHindi ? "आवश्यक क्षमताएं प्रदर्शित" : "Required capabilities demonstrated", 
                value: `${demonstratedCount}/20`, 
                met: demonstratedCount >= 14 
              },
              { 
                label: isHindi ? "फ्लोर उत्पादकता लक्ष्य" : "Floor productivity target", 
                value: `${actualPickRate}/${targetPickRate} picks/hr`, 
                met: !isPickRateBad 
              },
              { 
                label: isHindi ? "स्कैनिंग एक्यूरेसी" : "Scanning accuracy", 
                value: `${accuracyRate}%`, 
                met: !isAccuracyBad 
              },
              { 
                label: isHindi ? "समग्र शिफ्ट स्कोर" : "Overall shift score", 
                value: `${yesterdayShiftScore}% (${yesterdayShiftScore >= targetShiftScore ? (isHindi ? "उत्तीर्ण" : "Cleared") : (isHindi ? "प्रगति पर" : "In progress")})`, 
                met: !isShiftScoreBad 
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white/[0.04] border border-white/10 rounded-2xl p-3 flex items-center justify-between text-xs hover:bg-white/[0.07] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${item.met ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"}`} />
                  <span className="font-bold text-slate-200 tracking-tight">{item.label}</span>
                </div>
                <span className={`ref-num font-black tracking-tight ${item.met ? "text-emerald-400" : "text-rose-400 font-mono"}`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Highlights & Context Pop-out Modal */}
        {showNextStepModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200/90 space-y-5 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                    <Bell className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                    {isHindi ? "एक्शन हाइलाइट और संदर्भ" : "Action Highlights & Context"}
                  </h3>
                </div>
                <button
                  onClick={() => setShowNextStepModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-700">
                <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-2xl space-y-1">
                  <p className="font-bold text-amber-900 flex items-center gap-1.5">
                    <span>⚡</span> {isHindi ? "फ्लोर फोकस क्षेत्र" : "Aisles 4-8 Pick Rate Pacing"}
                  </p>
                  <p className="text-amber-800 leading-relaxed">
                    {isHindi
                      ? "आपके पिक रेट में 12% सुधार की आवश्यकता है। विक्रम भैया से संपर्क करें।"
                      : "Your current pick rate is tracking 12% below target in heavy grocery aisles. Connect with floor buddy Vikram."}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>🛡️</span> {isHindi ? "प्रमाणन विंडो अपडेट" : "Certification Window Status"}
                  </p>
                  <p className="text-slate-600 leading-relaxed">
                    {isHindi
                      ? "6 दिन शेष हैं। 3 आवश्यक ब्लॉकर्स को पूरा करें।"
                      : "6 days remaining before your final floor test. Complete 3 pending capability modules to unlock certification."}
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setShowNextStepModal(false)}
                  className="w-full py-3 bg-slate-900 text-white rounded-2xl text-xs font-extrabold cursor-pointer hover:bg-slate-800 transition-colors shadow-md"
                >
                  {isHindi ? "समझ गए" : "Got it, Return to Floor"}
                </button>
              </div>
            </div>
          </div>
        )}
        </div> {/* End of px-4 wrapper for content below banner */}

        <FloatingGlassMenu
          activeSection={activeSection}
          onSelectSection={setActiveSection}
          isHindi={isHindi}
          hasAttention={isNeedsHelp || isSupportAssigned}
          buddyAssigned={isSupportAssigned}
        />
      </div>
    );
  }

  if (activeSection === "dial") {
    return (
      <div className="relative min-h-screen bg-[#EBEAE5] animate-in fade-in duration-200">
        <TelemetryPageView
          isHindi={isHindi}
          onToggleLanguage={handleToggleLanguage}
          activeSection={activeSection}
          onSelectSection={setActiveSection}
          onOpenScannerModal={() => setActiveModal("scanner")}
          onOpenMapModal={() => setActiveModal("map")}
          onOpenBuddyModal={() => setActiveSection("buddy")}
          pickRate={34}
        />

        {/* ========================================================= */}
        {/* MODAL: DARK STORE AISLE & ITEM GUIDANCE                   */}
        {/* ========================================================= */}
        {activeModal === "map" && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-4 sm:p-5 shadow-2xl border border-slate-100 space-y-3.5 animate-in fade-in zoom-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-[#18181B] text-white flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {isHindi ? "डार्क स्टोर गाइड" : "Dark Store Aisle Map"}
                    </h3>
                    <p className="text-[11px] text-slate-500">Dark Store #104 · Whitefield</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-600">
                {isHindi
                  ? "सामान का प्रकार चुनें, साथी तुरंत दिशा बताएगा:"
                  : "Select an item to get instant floor directions:"}
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => {
                    setActiveModal(null);
                    handleSendMessage(
                      isHindi
                        ? "दही, दूध और पनीर का कोल्ड रूम कहां है?"
                        : "Where is the cold dairy section?"
                    );
                  }}
                  className="p-3 rounded-2xl border border-stone-200 bg-stone-50 text-left hover:bg-stone-100 cursor-pointer"
                >
                  <span className="font-bold text-stone-900 block">🥛 Dairy & Milk</span>
                  <span className="text-[10px] text-stone-600 font-semibold">Aisle 8 (Cold Room)</span>
                </button>

                <button
                  onClick={() => {
                    setActiveModal(null);
                    handleSendMessage(
                      isHindi
                        ? "आटा और चावल के भारी बैग किस रैक पर हैं?"
                        : "Where are heavy atta and rice bags located?"
                    );
                  }}
                  className="p-3 rounded-2xl border border-stone-200 bg-stone-50 text-left hover:bg-stone-100 cursor-pointer"
                >
                  <span className="font-bold text-stone-900 block">🌾 Atta & Rice</span>
                  <span className="text-[10px] text-stone-600 font-semibold">Aisles 4–8 (Racks)</span>
                </button>

                <button
                  onClick={() => {
                    setActiveModal(null);
                    handleSendMessage(
                      isHindi
                        ? "स्नैक्स, चिप्स और बिस्कुट कहां मिलेंगे?"
                        : "Where are snacks and chips located?"
                    );
                  }}
                  className="p-3 rounded-2xl border border-stone-200 bg-stone-50 text-left hover:bg-stone-100 cursor-pointer"
                >
                  <span className="font-bold text-stone-900 block">🍿 Snacks & Food</span>
                  <span className="text-[10px] text-stone-600 font-semibold">Aisles 1–3</span>
                </button>

                <button
                  onClick={() => {
                    setActiveModal(null);
                    handleSendMessage(
                      isHindi
                        ? "ज़ेब्रा स्कैनर और रिंग टूल कहां चार्ज होते हैं?"
                        : "Where is the scanner dock located?"
                    );
                  }}
                  className="p-3 rounded-2xl border border-stone-200 bg-stone-50 text-left hover:bg-stone-100 cursor-pointer"
                >
                  <span className="font-bold text-stone-900 block">⚡ Scanner Bay</span>
                  <span className="text-[10px] text-stone-600 font-semibold">Terminal #104 Hub</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL: ZEBRA TERMINAL SYNC & SCANNER                      */}
        {/* ========================================================= */}
        {activeModal === "scanner" && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-4 sm:p-5 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-[#18181B] text-white flex items-center justify-center">
                    <ScanLine className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {isHindi ? "ज़ेब्रा टर्मिनल व स्कैनर" : "Zebra Terminal #104"}
                    </h3>
                    <p className="text-[11px] text-slate-500">Floor Wi-Fi Synced · Online</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                  <p className="font-bold">✓ {isHindi ? "फ्लोर वाई-फाई सिंक सक्रिय है" : "Floor Wi-Fi Synced"}</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    {isHindi ? "टर्मिनल #104 रैक सर्वर से कनेक्टेड है" : "Terminal connected with 12ms floor latency"}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-stone-900">
                  <p className="font-bold">{isHindi ? "रिंग लेज़र दूरी" : "Ring Laser Alignment"}</p>
                  <p className="text-[11px] text-stone-600 mt-0.5">
                    {isHindi ? "बारकोड से 15 सेमी की दूरी पर बीम रखें" : "Keep laser red beam 15cm from barcode"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-full py-2.5 bg-[#18181B] text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-black"
              >
                {isHindi ? "पूर्ण हुआ" : "Done"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-3 space-y-4 pb-36 select-none">
      {/* ========================================================= */}
      {/* 1. HOME: WHERE AM I? WHAT TO DO NOW? WHY? WHO HELPS?       */}
      {/* ========================================================= */}


      {activeSection === "journey" && (
        <div className="-mx-4 -my-3 px-4 py-4 min-h-screen bg-[#eaedf2] pb-36">
          <TenDaySkillJourneyView
            newHires={[newHire]}
            activeHireId={newHire.id}
            onSelectHire={() => {}}
            currentDay={currentDay}
            isLearnerMode={true}
            isHindi={isHindi}
            onToggleLanguage={() => setIsHindi(!isHindi)}
            onNavigateToSection={(sec) => setActiveSection(sec)}
            onOpenTodaysGoal={() => setShowTodaysGoalView(true)}
          />

          {/* Quick Bridge Card to Floor Shift & Training Modules */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="bg-white/10 rounded-[28px] p-5 text-white shadow-xl border border-white/10 space-y-3 flex flex-col justify-between backdrop-blur-md">
              <div>
                <div className="flex items-center gap-1.5 text-cyan-300 text-xs font-black uppercase tracking-wider">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>{isHindi ? "शिफ्ट टूल्स" : "Floor Shift"}</span>
                </div>
                <p className="text-xs text-slate-350 mt-2 font-semibold leading-relaxed">
                  {isHindi ? "पिक रेट डायल, स्टोर मैप व गाइड" : "Pick dial, store zone map & guides"}
                </p>
              </div>
              <button
                onClick={() => setActiveModal("work")}
                className="w-full py-2.5 rounded-2xl bg-cyan-400 text-slate-950 text-xs font-black cursor-pointer shadow-md shadow-cyan-950/10 active:scale-95 transition-all hover:bg-cyan-300 uppercase tracking-wider"
              >
                {isHindi ? "टूल्स खोलें 🛠️" : "Floor Tools 🛠️"}
              </button>
            </div>

            <div className="bg-white/10 rounded-[28px] p-5 text-white shadow-xl border border-white/10 space-y-3 flex flex-col justify-between backdrop-blur-md">
              <div>
                <div className="flex items-center gap-1.5 text-purple-300 text-xs font-black uppercase tracking-wider">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{isHindi ? "एलएमएस मॉड्यूल" : "LMS Training"}</span>
                </div>
                <p className="text-xs text-slate-350 mt-2 font-semibold leading-relaxed">
                  {newHire.modulesCompleted ?? 3}/10 {isHindi ? "मॉड्यूल पूरे" : "Modules done"}
                </p>
              </div>
              <button
                onClick={() => setActiveSection("modules")}
                className="w-full py-2.5 rounded-2xl bg-purple-500 text-white text-xs font-black cursor-pointer shadow-md shadow-purple-950/10 active:scale-95 transition-all hover:bg-purple-400 uppercase tracking-wider"
              >
                {isHindi ? "मॉड्यूल देखें 📚" : "View Modules 📚"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. BUDDY: LET ME TALK TO SOMEONE (VOICE-FIRST & NATURAL)  */}
      {/* ========================================================= */}
      {activeSection === "buddy" && (
        <div className="space-y-4 animate-in fade-in duration-200 text-slate-900">
          {/* Buddy Profile & Live Floor Stance */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/Vikram%20Pic.jpeg"
                alt="Buddy Vikram"
                className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 shadow-xs"
              />
              <div>
                <h3 className="text-base font-extrabold text-slate-900">{newHire.buddy}</h3>
                <p className="text-xs text-slate-500 font-medium">Senior Floor Buddy</p>
                <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full inline-block mt-0.5 border border-emerald-200/60">
                  🟢 {isHindi ? "फ्लोर पर हैं (Aisles 4-8)" : "On Floor (Aisles 4-8)"}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setBuddyAlertSent(true);
                setActiveModal("buddy");
              }}
              className="px-3.5 py-2 bg-slate-900 text-white rounded-full text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all flex items-center gap-1.5 shrink-0 hover:bg-slate-800"
            >
              <Phone className="w-4 h-4 text-white" />
              <span>{isHindi ? "बुलाएं" : "Call to Rack"}</span>
            </button>
          </div>

          {/* Voice-First Push-to-Talk Action Bar */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-3.5">
            <div className="text-center space-y-1">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                {isHindi ? "विक्रम भैया से पूछें" : "Talk to Buddy Vikram"}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {isHindi
                  ? "माइक दबाकर सवाल बोलें, विक्रम भैया जवाब देंगे:"
                  : "Tap the mic and speak naturally. Vikram answers aloud:"}
              </p>
            </div>

            <button
              id="big-voice-speak-btn"
              type="button"
              onClick={handleToggleVoice}
              disabled={isProcessing}
              className={`w-full py-4 px-4 rounded-2xl font-extrabold text-base flex items-center justify-center gap-2.5 shadow-md active:scale-98 transition-all cursor-pointer ${
                isListening
                  ? "bg-rose-600 text-white ring-4 ring-rose-600/30 animate-pulse"
                  : "bg-slate-900 hover:bg-slate-800 text-white shadow-md shadow-slate-900/10"
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-5 h-5 animate-spin" />
                  <span>{isHindi ? "🔴 सुन रहा हूं... बोलिए" : "🔴 Listening... Speak now"}</span>
                </>
              ) : isProcessing ? (
                <>
                  <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>{isHindi ? "समझ रहा हूं..." : "Understanding question..."}</span>
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  <span>{isHindi ? "बोल कर पूछें (Tap to Speak)" : "Tap to Speak"}</span>
                </>
              )}
            </button>

            {/* Collapsible text typing fallback for noisy floor */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setShowTextInput(!showTextInput)}
                className="text-xs text-slate-400 hover:text-white font-semibold underline underline-offset-2 cursor-pointer"
              >
                {showTextInput
                  ? isHindi ? "टाइपिंग छुपाएं" : "Hide typing"
                  : isHindi ? "या लिख कर पूछें" : "Or type question"}
              </button>
            </div>

            {showTextInput && (
              <div className="flex items-center gap-2 animate-in fade-in duration-100">
                <input
                  id="learner-text-input"
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder={isHindi ? "सवाल लिखें..." : "Type your question..."}
                  disabled={isProcessing}
                  className="flex-1 text-sm px-4 py-2.5 rounded-2xl border border-white/10 bg-black/35 focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-2xs font-medium text-white"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={isProcessing || !inputText.trim()}
                  className="p-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white disabled:opacity-30 cursor-pointer transition-all active:scale-95 shrink-0"
                  title="Send"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Conversation Exchange Card */}
          {latestInteraction ? (
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {isHindi ? "विक्रम भैया का जवाब" : "Vikram's Answer"}
                </span>
                <button
                  onClick={() => handlePlayAudio("latest-interaction", latestInteraction.replyText)}
                  className="flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 px-3 py-1 rounded-full cursor-pointer border border-blue-200/60"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{isHindi ? "दोबारा सुनें" : "Replay"}</span>
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs sm:text-sm text-slate-700 italic">
                🗣️ "{latestInteraction.userText}"
              </div>

              <p className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed">
                {latestInteraction.replyText}
              </p>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={handleToggleVoice}
                  className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isHindi ? "दूसरा सवाल पूछें" : "Ask follow-up question"}</span>
                </button>
                <span className="text-xs text-slate-400 font-medium">{latestInteraction.timestamp}</span>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 text-xs sm:text-sm text-slate-700 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <p className="leading-snug font-medium">
                {isHindi
                  ? "माइक दबाकर बोलें या नीचे दिए गए आम सवालों में से एक चुनें।"
                  : "Tap the mic above or tap any quick question below."}
              </p>
            </div>
          )}

          {/* Voice Practice Situation Chips */}
          <div className="space-y-2 pt-1">
            <h4 className="text-xs font-bold text-slate-500 px-1">
              {isHindi ? "आम सवाल (टैप करें):" : "Quick Questions (Tap to Ask):"}
            </h4>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {(isHindi
                ? [
                    "आइसल 4 से 8 में सामान ढूंढना",
                    "दूध और दही का कोल्ड रूम कहां है?",
                    "स्कैनर बारकोड नहीं पढ़ रहा",
                    "सामान का पैकेट फटा हुआ है",
                    "भारी सामान टोट में कैसे रखें?",
                  ]
                : [
                    "Finding Aisles 4 to 8 items",
                    "Where is cold dairy?",
                    "Scanner not reading barcode",
                    "Damaged package check",
                    "Heavy items tote packing",
                  ]
              ).map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip)}
                  disabled={isProcessing}
                  className="px-3.5 py-2 rounded-full bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200/80 text-xs font-semibold whitespace-nowrap shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}



      {activeSection === "control_tower" && (
        <div className="relative z-10 min-h-screen bg-slate-50/50 -mx-4 -my-3 pb-36 animate-in fade-in duration-200">
          <ControlTowerView newHire={newHire} currentDay={currentDay} />
        </div>
      )}

      {activeSection === "progress" && (
        <div className="relative z-10 min-h-screen bg-slate-50/50 -mx-4 -my-3 pb-36 animate-in fade-in duration-200">
          <LearningProgressView newHire={newHire} currentDay={currentDay} />
        </div>
      )}

      {activeSection === "learner_dashboard" && (
        <div className="relative z-10 animate-in fade-in duration-200">
          <LearnerDashboardView newHire={newHire} currentDay={currentDay} />
        </div>
      )}
      {activeSection === "dashboard" && (
        <div className="space-y-4 animate-in fade-in duration-200 bg-white text-slate-900 min-h-screen pb-36 px-0 pt-0 -mx-4 -my-3">
          {/* Royal Blue Full-Bleed Dashboard Header */}
          <DashboardHeader
            newHire={newHire}
            currentDay={currentDay}
            isHindi={isHindi}
            onToggleLanguage={() => setIsHindi(!isHindi)}
          />

          {/* DAY 10 COMMERCIAL CERTIFICATION (7 CRITERIA) - 7 EXPANDABLE STEPS */}
          <CommercialCertificationCard
            newHire={newHire}
            currentDay={currentDay}
            isHindi={isHindi}
            onOpenModules={() => setActiveSection("modules")}
            onOpenWorkTools={() => setActiveModal("work")}
            onOpenBuddy={() => setActiveSection("buddy")}
          />

          {/* DAILY SHIFT REPORT & CONTINUITY (CLICKABLE FOR FULL SUMMARY MODAL) */}
          <LearnerDailyReportCard
            newHire={newHire}
            currentDay={currentDay}
            isHindi={isHindi}
            isDashboardVariant={true}
            onOpenDetailedModal={() => setActiveModal("yesterday_detail")}
            onOpenWorkTools={() => setActiveModal("work")}
            onOpenBuddy={() => setActiveSection("buddy")}
            onOpenModules={() => setActiveSection("modules")}
          />

        </div>
      )}

      {/* ========================================================= */}
      {/* FLOATING BAR MENU: APPLE GLASS TRANSLUCENT                */}
      {/* ========================================================= */}
      <FloatingGlassMenu
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        isHindi={isHindi}
        hasAttention={isNeedsHelp || isSupportAssigned}
        buddyAssigned={isSupportAssigned}
      />

      {/* ========================================================= */}
      {/* MODAL 1: DARK STORE AISLE & ITEM MAP                      */}
      {/* ========================================================= */}
      {activeModal === "map" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-4 sm:p-5 shadow-2xl border border-slate-100 space-y-3.5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-500 text-white flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {isHindi ? "डार्क स्टोर गाइड" : "Dark Store Aisle Map"}
                  </h3>
                  <p className="text-[11px] text-slate-500">Dark Store #104</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              {isHindi
                ? "सामान का प्रकार चुनें, साथी तुरंत दिशा बताएगा:"
                : "Select an item to get instant floor directions:"}
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => {
                  setActiveModal(null);
                  handleSendMessage(
                    isHindi
                      ? "दही, दूध और पनीर का कोल्ड रूम कहां है?"
                      : "Where is the cold dairy section?"
                  );
                }}
                className="p-3 rounded-2xl border border-blue-200 bg-blue-50/70 text-left hover:bg-blue-100 cursor-pointer"
              >
                <span className="font-bold text-blue-950 block">🥛 Dairy & Milk</span>
                <span className="text-[10px] text-blue-700 font-semibold">Aisle 8 (Cold Room)</span>
              </button>

              <button
                onClick={() => {
                  setActiveModal(null);
                  handleSendMessage(
                    isHindi
                      ? "चिप्स, बिस्कुट और स्नैक्स कहां रखे हैं?"
                      : "Where are chips and snacks?"
                  );
                }}
                className="p-3 rounded-2xl border border-amber-200 bg-amber-50/70 text-left hover:bg-amber-100 cursor-pointer"
              >
                <span className="font-bold text-amber-950 block">🍪 Snacks & Maggi</span>
                <span className="text-[10px] text-amber-700 font-semibold">Aisles 1 & 2 (Front)</span>
              </button>

              <button
                onClick={() => {
                  setActiveModal(null);
                  handleSendMessage(
                    isHindi
                      ? "आटा, चावल और तेल की बोरियां कहां हैं?"
                      : "Where is flour, rice and oil?"
                  );
                }}
                className="p-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 text-left hover:bg-emerald-100 cursor-pointer"
              >
                <span className="font-bold text-emerald-950 block">🌾 Atta, Rice & Oil</span>
                <span className="text-[10px] text-emerald-700 font-semibold">Aisles 4, 5, 6</span>
              </button>

              <button
                onClick={() => {
                  setActiveModal(null);
                  handleSendMessage(
                    isHindi
                      ? "साबुन और सर्फ कहां रखे हैं?"
                      : "Where are soaps and cleaning?"
                  );
                }}
                className="p-3 rounded-2xl border border-purple-200 bg-purple-50/70 text-left hover:bg-purple-100 cursor-pointer"
              >
                <span className="font-bold text-purple-950 block">🧼 Soaps & Surf</span>
                <span className="text-[10px] text-purple-700 font-semibold">Aisle 7</span>
              </button>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 bg-slate-900 text-white rounded-2xl text-xs font-bold cursor-pointer"
            >
              {isHindi ? "बंद करें" : "Close Guide"}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: CALL BUDDY VIKRAM                                */}
      {/* ========================================================= */}
      {activeModal === "buddy" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in duration-150 text-center">
            <div className="flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center">
              <img
                src="/Vikram%20Pic.jpeg"
                alt="Buddy Vikram"
                className="w-20 h-20 rounded-full object-cover border-4 border-emerald-500 shadow-md mb-2"
              />
              <h3 className="text-base font-bold text-slate-900">
                {newHire.buddy}
              </h3>
              <p className="text-xs text-slate-500 font-medium">Senior Floor Buddy</p>
              <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full mt-1.5 border border-emerald-200">
                🟢 {isHindi ? "फ्लोर पर एक्टिव हैं" : "On Duty on Floor"}
              </span>
            </div>

            {buddyAlertSent ? (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
                <p className="text-xs font-bold text-emerald-900">
                  {isHindi ? "✅ विक्रम भैया को सूचना भेज दी गई!" : "✅ Alert sent to Vikram!"}
                </p>
                <p className="text-[11px] text-emerald-800">
                  {isHindi
                    ? "वो 2 मिनट में आपके रैक के पास पहुंच रहे हैं।"
                    : "He will walk over to your rack in 2 minutes."}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => setBuddyAlertSent(true)}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-bold shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                  <span>
                    {isHindi ? "विक्रम भैया को यहां बुलाओ" : "Call Vikram to My Rack"}
                  </span>
                </button>

                <p className="text-[11px] text-slate-500">
                  {isHindi
                    ? "अगर कोई सामान नहीं मिल रहा तो तुरंत पूछें, झिझकें नहीं।"
                    : "Never hesitate to ask your buddy. They are here to help you ramp up!"}
                </p>
              </div>
            )}

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold cursor-pointer"
            >
              {isHindi ? "वापस जाएं" : "Back to Shift"}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: SCANNER TROUBLESHOOTING                          */}
      {/* ========================================================= */}
      {activeModal === "scanner" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-4 sm:p-5 shadow-2xl border border-slate-100 space-y-3.5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-600 text-white flex items-center justify-center">
                  <ScanLine className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {isHindi ? "स्कैनर काम ना करे तो?" : "Scanner Troubleshooting"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isHindi ? "2 मिनट का आसान हल" : "2 quick fixes"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700">
              <p className="text-[11px] font-black uppercase text-purple-700 tracking-wider">
                {isHindi ? "सामान उठाने की प्रक्रिया और जांच सूची" : "PICKING PROCESS & CHECKLIST"}
              </p>

              <div
                onClick={() => setCompletedScannerChecklist(prev => ({ ...prev, laser: !prev.laser }))}
                className={`p-3 border rounded-2xl flex items-start gap-2.5 cursor-pointer transition-all active:scale-98 ${
                  completedScannerChecklist.laser ? "bg-emerald-50 border-emerald-200" : "bg-purple-50/70 border-purple-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={completedScannerChecklist.laser}
                  onChange={() => {}}
                  className="w-4 h-4 rounded mt-0.5 accent-emerald-600 shrink-0"
                />
                <div className="min-w-0">
                  <strong className={`block font-bold ${completedScannerChecklist.laser ? "line-through text-slate-500" : "text-purple-950"}`}>
                    {isHindi ? "लाल शीशा साफ करें" : "Clean red laser glass"}
                  </strong>
                  <p className="text-[11px] text-purple-900 mt-0.5">
                    {isHindi
                      ? "स्कैनर के आगे का ग्लास अपनी टी-शर्ट या सूखे कपड़े से पोंछें।"
                      : "Dust often blocks the laser. Wipe the front glass with a dry cloth."}
                  </p>
                </div>
              </div>

              <div
                onClick={() => setCompletedScannerChecklist(prev => ({ ...prev, dist: !prev.dist }))}
                className={`p-3 border rounded-2xl flex items-start gap-2.5 cursor-pointer transition-all active:scale-98 ${
                  completedScannerChecklist.dist ? "bg-emerald-50 border-emerald-200" : "bg-blue-50/70 border-blue-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={completedScannerChecklist.dist}
                  onChange={() => {}}
                  className="w-4 h-4 rounded mt-0.5 accent-emerald-600 shrink-0"
                />
                <div className="min-w-0">
                  <strong className={`block font-bold ${completedScannerChecklist.dist ? "line-through text-slate-500" : "text-blue-950"}`}>
                    {isHindi ? "दूरी सही रखें (15 सेमी)" : "Hold 15cm from barcode"}
                  </strong>
                  <p className="text-[11px] text-blue-900 mt-0.5">
                    {isHindi
                      ? "स्कैनर को पैकेट से बहुत चिपकाएं नहीं, 15 सेमी दूर रखकर ट्रिगर दबाएं।"
                      : "Don't press against the label. Keep 15cm distance."}
                  </p>
                </div>
              </div>

              <div
                onClick={() => setCompletedScannerChecklist(prev => ({ ...prev, battery: !prev.battery }))}
                className={`p-3 border rounded-2xl flex items-start gap-2.5 cursor-pointer transition-all active:scale-98 ${
                  completedScannerChecklist.battery ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={completedScannerChecklist.battery}
                  onChange={() => {}}
                  className="w-4 h-4 rounded mt-0.5 accent-emerald-600 shrink-0"
                />
                <div className="min-w-0">
                  <strong className={`block font-bold ${completedScannerChecklist.battery ? "line-through text-slate-500" : "text-slate-900"}`}>
                    {isHindi ? "बैटरी स्टेटस व रीसेट" : "Battery status & Reset"}
                  </strong>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {isHindi
                      ? "चेक करें कि लाइट हरी जल रही है या नहीं। जरूरत पड़ने पर रीसेट दबाएं।"
                      : "Check ring scanner green indicator light. Reset if needed."}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 bg-slate-900 text-white rounded-2xl text-xs font-bold cursor-pointer"
            >
              {isHindi ? "समझ गया 👍" : "Got it 👍"}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: TODAY'S TARGET & RAMP GOAL                      */}
      {/* ========================================================= */}
      {activeModal === "target" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-4 sm:p-5 shadow-2xl border border-slate-100 space-y-3.5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {isHindi ? "आज का पिकिंग लक्ष्य" : "Today's Target"}
                  </h3>
                  <p className="text-[11px] text-slate-500">Day {currentDay} of 14</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-950 block">
                    {isHindi ? "एक्यूरेसी (सही सामान)" : "Scanning Accuracy"}
                  </span>
                  <span className="text-[11px] text-emerald-700">Target: 95%+</span>
                </div>
                <span className="text-lg font-black text-emerald-700">98% 👍</span>
              </div>

              <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-blue-950 block">
                    {isHindi ? "पिक स्पीड (सामान/घंटा)" : "Pick Speed"}
                  </span>
                  <span className="text-[11px] text-blue-700">
                    {isSupportCompleted ? "After walkthrough" : "Day 3 ramp expectation"}
                  </span>
                </div>
                <span className="text-lg font-black text-blue-700">
                  {isSupportCompleted ? "48/hr" : "35 / 50"}
                </span>
              </div>

              {/* Actionable checklists inside Target card */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {isHindi ? "लक्ष्य प्राप्ति हेतु आवश्यक कदम" : "STEPS FOR TODAY'S GOAL"}
                </p>

                <div
                  onClick={() => setCompletedTargetChecklist(prev => ({ ...prev, orders: !prev.orders }))}
                  className={`p-2.5 border rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
                    completedTargetChecklist.orders ? "bg-emerald-50/70 border-emerald-200" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={completedTargetChecklist.orders}
                    onChange={() => {}}
                    className="w-3.5 h-3.5 accent-emerald-600 rounded shrink-0"
                  />
                  <span className={`text-xs font-bold ${completedTargetChecklist.orders ? "line-through text-slate-400" : "text-slate-800"}`}>
                    {isHindi ? "फिंगर स्कैनर से 50 ऑर्डर पैक करें" : "Pick 50 orders via finger scanner"}
                  </span>
                </div>

                <div
                  onClick={() => setCompletedTargetChecklist(prev => ({ ...prev, pacing: !prev.pacing }))}
                  className={`p-2.5 border rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
                    completedTargetChecklist.pacing ? "bg-emerald-50/70 border-emerald-200" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={completedTargetChecklist.pacing}
                    onChange={() => {}}
                    className="w-3.5 h-3.5 accent-emerald-600 rounded shrink-0"
                  />
                  <span className={`text-xs font-bold ${completedTargetChecklist.pacing ? "line-through text-slate-400" : "text-slate-800"}`}>
                    {isHindi ? "45 से अधिक UPH की स्पीड बनाए रखें" : "Maintain >45 UPH picking pace"}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed px-1">
                {isHindi
                  ? "💡 याद रखें: शुरुआत में एक्यूरेसी (सही सामान उठाना) स्पीड से ज्यादा जरूरी है। स्पीड अपने आप बढ़ जाएगी!"
                  : "💡 Remember: High accuracy is more important than raw speed. Speed naturally builds up as you memorize the aisles."}
              </p>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 bg-slate-900 text-white rounded-2xl text-xs font-bold cursor-pointer"
            >
              {isHindi ? "समझ गया 👍" : "Got it 👍"}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: FULL FLOOR REFERENCE TOOLS MODAL                */}
      {/* ========================================================= */}
      {activeModal === "work" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-slate-50 rounded-3xl max-w-md w-full p-4 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {isHindi ? "ऑन-फ्लोर शिफ्ट टूल्स" : "On-Floor Shift Tools"}
                  </h3>
                  <p className="text-[10px] text-slate-500">Dark Store #104 • Day {currentDay}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Dial */}
            <CircularDialWidget
              pickRate={currentRecord.pickRate || 35}
              targetPickRate={50}
              accuracyRate={currentRecord.errorRate === 0 ? 100 : Math.max(88, Math.round(100 - (currentRecord.errorRate || 2) * 4))}
              readinessScore={authoritativeReadiness}
              onCallBuddy={() => setActiveModal("buddy")}
              onScannerFix={() => setActiveModal("scanner")}
              onAisleMap={() => setActiveModal("map")}
              onOpenTarget={() => setActiveModal("target")}
              isHindi={isHindi}
            />

            {/* Store Zones Grid */}
            <StoreZonesGrid
              onSelectZone={(zoneId, zoneName) => {
                setActiveModal(null);
                if (zoneId === "aisles_4_8") {
                  handleSendMessage(
                    isHindi
                      ? "आइसल 4 से 8 में सामान ढूंढने में देर लग रही है, मदद चाहिए।"
                      : "Taking longer in Aisles 4-8. Where are the bulk grocery items?"
                  );
                } else if (zoneId === "cold_room") {
                  handleSendMessage(
                    isHindi
                      ? "दूध और दही का कोल्ड रूम कहां है?"
                      : "Where is the cold room for dairy and frozen milk?"
                  );
                } else if (zoneId === "scanner_dock") {
                  setActiveModal("scanner");
                } else if (zoneId === "buddy_desk") {
                  setActiveModal("buddy");
                } else {
                  handleSendMessage(
                    isHindi
                      ? `${zoneName} के बारे में बताएं`
                      : `Guide me to ${zoneName}`
                  );
                }
              }}
              isHindi={isHindi}
              activeZoneId={currentDay === 3 ? "aisles_4_8" : "aisles_1_3"}
            />

            {/* Daily Quality & Safety Checklists */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                {isHindi ? "गुणवत्ता व सुरक्षा एसओपी एक्टिविटी" : "QUALITY & SAFETY SOP CHECKLIST"}
              </p>

              <div
                onClick={() => setCompletedWorkChecklist(prev => ({ ...prev, walk: !prev.walk }))}
                className={`p-2.5 border rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
                  completedWorkChecklist.walk ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={completedWorkChecklist.walk}
                  onChange={() => {}}
                  className="w-3.5 h-3.5 accent-emerald-600 rounded shrink-0"
                />
                <span className={`text-xs font-bold ${completedWorkChecklist.walk ? "line-through text-slate-400" : "text-slate-800"}`}>
                  {isHindi ? "कोल्ड रूम डेयरी 90-सेकंड एसओपी और सील" : "Cold Room dairy 90-sec retrieval SOP"}
                </span>
              </div>

              <div
                onClick={() => setCompletedWorkChecklist(prev => ({ ...prev, seal: !prev.seal }))}
                className={`p-2.5 border rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
                  completedWorkChecklist.seal ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={completedWorkChecklist.seal}
                  onChange={() => {}}
                  className="w-3.5 h-3.5 accent-emerald-600 rounded shrink-0"
                />
                <span className={`text-xs font-bold ${completedWorkChecklist.seal ? "line-through text-slate-400" : "text-slate-800"}`}>
                  {isHindi ? "इंसुलेटेड बैग सीलिंग और टोट लेबल जांचें" : "Insulated bag sealing & tote check"}
                </span>
              </div>

              <div
                onClick={() => setCompletedWorkChecklist(prev => ({ ...prev, pack: !prev.pack }))}
                className={`p-2.5 border rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
                  completedWorkChecklist.pack ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={completedWorkChecklist.pack}
                  onChange={() => {}}
                  className="w-3.5 h-3.5 accent-emerald-600 rounded shrink-0"
                />
                <span className={`text-xs font-bold ${completedWorkChecklist.pack ? "line-through text-slate-400" : "text-slate-800"}`}>
                  {isHindi ? "मल्टी-टोट्स पैकेजिंग SOP पूर्ण करें" : "Complete Multi-Totes Packaging SOP"}
                </span>
              </div>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 bg-slate-900 text-white rounded-2xl text-xs font-bold cursor-pointer"
            >
              {isHindi ? "बंद करें" : "Close Floor Tools"}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 6: YESTERDAY SHIFT FULL DETAIL MODAL               */}
      {/* ========================================================= */}
      {activeModal === "yesterday_detail" && (
        <YesterdayShiftDetailModal
          newHire={newHire}
          currentDay={currentDay}
          isHindi={isHindi}
          onClose={() => setActiveModal(null)}
          onOpenWorkTools={() => {
            setActiveModal("work");
          }}
          onOpenModules={() => {
            setActiveModal(null);
            setActiveSection("modules");
          }}
          onOpenBuddy={() => {
            setActiveModal(null);
            setActiveSection("buddy");
          }}
        />
      )}

      {/* ========================================================= */}
      {/* DAILY COACH REPORT VIEW (SEPARATE SPART / REPORT PAGE)   */}
      {/* ========================================================= */}
      {showDailyCoachReport && (
        <DailyCoachReportView
          newHire={newHire}
          currentDay={currentDay}
          isHindi={isHindi}
          onClose={() => setShowDailyCoachReport(false)}
        />
      )}

      {/* Global Bottom Navigation Floating Glass Menu */}
      <FloatingGlassMenu
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        isHindi={isHindi}
        hasAttention={isNeedsHelp || isSupportAssigned}
        buddyAssigned={isSupportAssigned}
      />
    </div>
  );
};
