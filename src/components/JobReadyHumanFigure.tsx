import React, { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Zap,
  Play,
  Dumbbell,
  FlaskConical,
  FileCheck2,
  Award,
  ChevronRight,
  Building2,
  PackageCheck,
  Volume2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  Lock,
  Check,
} from "lucide-react";
import {
  NewHire,
  CapabilityState,
  DARK_STORE_CAPABILITIES,
} from "../types";
import { evaluateDay10Outcome, assessReadiness } from "../services/intelligence";

interface JobReadyHumanFigureProps {
  newHire: NewHire;
  currentDay: number;
  isHindi?: boolean;
  onOpenModules?: () => void;
  onOpenWorkTools?: () => void;
  onOpenBuddy?: () => void;
}

interface CapabilityCategory {
  id: "learning" | "practice" | "simulation" | "assessment";
  title: string;
  titleHi: string;
  weight: number;
  completedText: string;
  completedTextHi: string;
  color: string;
  gradientId: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  icon: React.ReactNode;
  ratio: number;
  completedCount: number;
  totalCount: number;
}

export const JobReadyHumanFigure: React.FC<JobReadyHumanFigureProps> = ({
  newHire,
  currentDay,
  isHindi = false,
  onOpenModules,
  onOpenWorkTools,
  onOpenBuddy,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<
    "learning" | "practice" | "simulation" | "assessment"
  >("practice");

  const [activePillarModal, setActivePillarModal] = useState<CapabilityCategory | null>(null);
  const [activeCriteriaModal, setActiveCriteriaModal] = useState<any | null>(null);
  const [expandedStageIds, setExpandedStageIds] = useState<number[]>([3]);

  const capabilities = newHire.capabilities || {};
  const currentCapId = newHire.currentCapabilityId || 3;

  // Calculate demonstrated capabilities
  const demonstratedCount = (
    Object.values(capabilities) as CapabilityState[]
  ).filter(
    (c) =>
      c &&
      (c.evidence === "demonstrated" ||
        c.mastery === "proficient" ||
        c.mastery === "mastered")
  ).length;

  // Modules completed (out of 10)
  const modulesCompleted = newHire.modulesCompleted ?? Math.min(10, currentDay);
  const quizAvg = newHire.quizAverageScore ?? 94;

  // 4 Core Reference Image Pillars calculated from real intelligence state:
  // 1. Learning (20% weight) - Video & Theory LMS modules
  const learningCompleted = Math.min(12, Math.round((modulesCompleted / 10) * 12));
  const learningRatio = Math.min(1, modulesCompleted / 10);
  const learningPct = Math.round(learningRatio * 20);

  // 2. Practice (25% weight) - Floor exercises & Aisle drills
  const practiceTotal = 10;
  const practiceCompleted = Math.min(
    practiceTotal,
    Math.round((demonstratedCount / 20) * 10) + (currentDay >= 3 ? 2 : 1)
  );
  const practiceRatio = Math.min(1, practiceCompleted / practiceTotal);
  const practicePct = Math.round(practiceRatio * 25);

  // 3. Simulation (25% weight) - Practical terminal activities & mock orders
  const simTotal = 8;
  const simCompleted = Math.min(
    simTotal,
    Math.round((demonstratedCount / 20) * 8) + (currentDay >= 4 ? 2 : 1)
  );
  const simRatio = Math.min(1, simCompleted / simTotal);
  const simPct = Math.round(simRatio * 25);

  // 4. Assessment (30% weight) - Real floor shift verification & solo SLA tests
  const assessTotal = 3;
  const assessCompleted =
    currentDay >= 5 && demonstratedCount >= 10
      ? 3
      : currentDay >= 4
      ? 2
      : currentDay >= 3
      ? 1
      : 0;
  const assessRatio = assessCompleted / assessTotal;
  const assessPct = Math.round(assessRatio * 30);

  // Authoritative Overall Job Readiness calculation
  const overallReadiness = typeof newHire.overallReadinessScore === "number"
    ? (newHire.overallReadinessScore <= 1 ? Math.round(newHire.overallReadinessScore * 100) : Math.round(newHire.overallReadinessScore))
    : assessReadiness(capabilities, newHire);

  const categories: CapabilityCategory[] = [
    {
      id: "learning",
      title: "Learning",
      titleHi: "थ्योरी और वीडियो",
      weight: 20,
      completedText: `Video modules completed ${learningCompleted}/12`,
      completedTextHi: `वीडियो मॉड्यूल पूर्ण ${learningCompleted}/12`,
      color: "#3b82f6",
      gradientId: "grad-learning-blue",
      bgClass: "bg-blue-500",
      textClass: "text-blue-600",
      borderClass: "border-blue-200",
      icon: <Play className="w-3.5 h-3.5 fill-current" />,
      ratio: learningRatio,
      completedCount: learningCompleted,
      totalCount: 12,
    },
    {
      id: "practice",
      title: "Practice",
      titleHi: "फ्लोर अभ्यास",
      weight: 25,
      completedText: `Exercises completed ${practiceCompleted}/${practiceTotal}`,
      completedTextHi: `अभ्यास ड्रिल पूर्ण ${practiceCompleted}/${practiceTotal}`,
      color: "#10b981",
      gradientId: "grad-practice-green",
      bgClass: "bg-emerald-500",
      textClass: "text-emerald-600",
      borderClass: "border-emerald-200",
      icon: <Dumbbell className="w-3.5 h-3.5" />,
      ratio: practiceRatio,
      completedCount: practiceCompleted,
      totalCount: practiceTotal,
    },
    {
      id: "simulation",
      title: "Simulation",
      titleHi: "सिमुलेशन लैब",
      weight: 25,
      completedText: `Practical activities completed ${simCompleted}/${simTotal}`,
      completedTextHi: `प्रैक्टिकल एक्टिविटी पूर्ण ${simCompleted}/${simTotal}`,
      color: "#8b5cf6",
      gradientId: "grad-sim-purple",
      bgClass: "bg-purple-500",
      textClass: "text-purple-600",
      borderClass: "border-purple-200",
      icon: <FlaskConical className="w-3.5 h-3.5" />,
      ratio: simRatio,
      completedCount: simCompleted,
      totalCount: simTotal,
    },
    {
      id: "assessment",
      title: "Assessment",
      titleHi: "फ्लोर टेस्ट",
      weight: 30,
      completedText: `Final assessment passed ${assessCompleted}/${assessTotal}`,
      completedTextHi: `फाइनल टेस्ट पास ${assessCompleted}/${assessTotal}`,
      color: "#f59e0b",
      gradientId: "grad-assess-orange",
      bgClass: "bg-amber-500",
      textClass: "text-amber-600",
      borderClass: "border-amber-200",
      icon: <FileCheck2 className="w-3.5 h-3.5" />,
      ratio: assessRatio,
      completedCount: assessCompleted,
      totalCount: assessTotal,
    },
  ];

  const getPillarModalDetails = (id: string, score: number) => {
    switch (id) {
      case "learning":
        return {
          statusText: score >= 25 ? (isHindi ? "🏆 उत्कृष्ट प्रगति" : "🏆 Excellent Progress") : (isHindi ? "⚠️ ध्यान देने की आवश्यकता" : "⚠️ Needs Focus"),
          statusColor: score >= 25 ? "text-emerald-400 bg-emerald-500/10" : "text-amber-405 text-amber-400 bg-amber-500/10 border border-amber-500/20",
          onTrack: score >= 25 ? (isHindi ? "ट्रैक पर" : "ON TRACK") : (isHindi ? "सुधार आवश्यक" : "NEEDS IMPROVEMENT"),
          onTrackColor: score >= 25 ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300",
          desc: isHindi 
            ? "यह श्रेणी आपके सिद्धांत और वीडियो-आधारित एलएमएस मॉड्यूल प्रगति को मापती है।"
            : "This category measures your digital micro-module completion in our learning system (LMS).",
          currentStats: isHindi
            ? `आपके 3/10 मॉड्यूल्स पूरे हैं, जिससे आपका स्कोर 9% (कुल वेटेज: 20%) है।`
            : `You have completed 3 of 10 micro-modules, giving you a 6% score (out of 20% category weight).`,
          targetStats: isHindi
            ? "सर्टिफिकेशन के लिए न्यूनतम 8 मॉड्यूल्स (16% स्कोर) आवश्यक हैं।"
            : "Target requires at least 8 completed modules (16% score) to clear Day 10 handover.",
          guidance: isHindi
            ? "कृपया रोज़ाना 1 वीडियो मॉड्यूल पूरा करने पर ध्यान दें। शेल्फ और स्कैनर केयर गाइड को प्राथमिकता दें।"
            : "Focus on completing 1 learning module per day. Prioritize Shelf Alignment and Scanner Care guides to stay on track."
        };
      case "practice":
        return {
          statusText: score >= 20 ? (isHindi ? "🏆 उत्कृष्ट" : "🏆 Excellent") : (isHindi ? "⚠️ सुधार की आवश्यकता" : "⚠️ Needs Focus"),
          statusColor: score >= 20 ? "text-emerald-400 bg-emerald-500/10" : "text-amber-400 bg-amber-500/10",
          onTrack: score >= 20 ? (isHindi ? "ट्रैक पर" : "ON TRACK") : (isHindi ? "ट्रैक से बाहर" : "NOT ON TRACK"),
          onTrackColor: score >= 20 ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300",
          desc: isHindi
            ? "यह आपके फ्लोर पिकिंग गति और बारकोड स्कैनिंग सटीकता अभ्यास को मापता है।"
            : "This monitors your actual floor picking pace, transit accuracy, and scan success rates during exercises.",
          currentStats: isHindi
            ? `आप 114 PPH (पिक्स प्रति घंटा) की शानदार गति बनाए हुए हैं, जिससे आपका स्कोर 23% (कुल वेटेज: 25%) है।`
            : `You are averaging an outstanding 114 PPH (Picks Per Hour), giving you a 23% score (out of 25% category weight).`,
          targetStats: isHindi
            ? "लक्ष्य: 110+ पिक्स प्रति घंटा।"
            : "Target: Average above 110 picks per hour comfortably.",
          guidance: isHindi
            ? "आप पहले से ही बेहतरीन प्रदर्शन कर रहे हैं! Aisles 4-8 में सामान ढूंढते वक्त अपनी गति पर थोड़ा और ध्यान दें।"
            : "Your floor navigation is clean. Keep practicing in cold room zones to reduce searching lag even further."
        };
      case "simulation":
        return {
          statusText: score >= 15 ? (isHindi ? "🏆 अच्छा प्रदर्शन" : "🏆 Good Progress") : (isHindi ? "⚠️ अभ्यास करें" : "⚠️ Needs Focus"),
          statusColor: score >= 15 ? "text-cyan-300 bg-cyan-500/10" : "text-amber-400 bg-amber-500/10",
          onTrack: score >= 15 ? (isHindi ? "ट्रैक पर" : "ON TRACK") : (isHindi ? "ट्रैक से बाहर" : "NOT ON TRACK"),
          onTrackColor: score >= 15 ? "bg-cyan-500/20 text-cyan-300" : "bg-amber-500/20 text-amber-300",
          desc: isHindi
            ? "यह श्रेणी आपके सिम्युलेटेड वॉकथ्रू और मॉक ऑर्डर्स को पूरा करने को दर्शाती है।"
            : "This tracks simulated shelf alignment, complex orders, and virtual system diagnostics walkthroughs.",
          currentStats: isHindi
            ? `आपके 5/8 सिमुलेशन लैब अभ्यास पूरे हैं, जिससे आपका स्कोर 16% (कुल वेटेज: 25%) है।`
            : `You have cleared 5 of 8 simulation lab challenges, giving you a 16% score (out of 25% category weight).`,
          targetStats: isHindi
            ? "लक्ष्य: कम से कम 6 सिमुलेशन पूरे करना।"
            : "Target: Reach at least 6 completed simulations.",
          guidance: isHindi
            ? "अगला सिमुलेशन 'कठिन रैक और भारी सामान' पर आधारित है। इसे आज ही पूरा करें।"
            : "Your next simulation is 'Heavy Goods & High-Racks' navigation. Complete it today to boost this further."
        };
      case "assessment":
        return {
          statusText: score >= 15 ? (isHindi ? "🏆 स्वीकृत" : "🏆 Qualified") : (isHindi ? "⚠️ अधूरा" : "⚠️ Incomplete"),
          statusColor: score >= 15 ? "text-emerald-400 bg-emerald-500/10" : "text-rose-400 bg-rose-500/10 border border-rose-500/20",
          onTrack: score >= 15 ? (isHindi ? "ट्रैक पर" : "ON TRACK") : (isHindi ? "कार्रवाई आवश्यक" : "ACTION REQUIRED"),
          onTrackColor: score >= 15 ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300",
          desc: isHindi
            ? "यह श्रेणी आपकी मुख्य क्विज़ और floor buddy द्वारा किए गए लाइव आकलन को ट्रैक करती है।"
            : "This reflects your scores on core quizzes and floor-buddy signoffs for solo shift readiness.",
          currentStats: isHindi
            ? `आपका स्कोर 10% (कुल वेटेज: 30%) है। 1 क्विज़ लंबित है।`
            : `Your score is 10% (out of 30% weight) because you have 1 pending device assessment.`,
          targetStats: isHindi
            ? "लक्ष्य: 85% से अधिक औसत अंक।"
            : "Target: Average above 85% score in all tests and buddy signoffs.",
          guidance: isHindi
            ? "स्कैनर बैटरी केयर और होल्स्टर सेफ्टी क्विज़ को आज पूरा करें ताकि इस श्रेणी में प्रगति बढ़ सके।"
            : "Complete the pending scanner care quiz today. This is the only hurdle preventing your Assessment certification."
        };
      default:
        return null;
    }
  };

  const getCriteriaModalDetails = (critName: string) => {
    switch (critName) {
      case "Attendance":
      case "शिफ्ट अटेंडेंस":
        return {
          name: isHindi ? "शिफ्ट अटेंडेंस" : "Shift Attendance",
          status: "Completed ✓",
          statusColor: "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20",
          onTrack: "ON TRACK",
          onTrackColor: "bg-emerald-500/20 text-emerald-300",
          desc: isHindi
            ? "10-दिवसीय ऑनबोर्डिंग कार्यक्रम के दौरान आपकी शिफ्ट में उपस्थिति दर्ज की गई।"
            : "Attendance track during your 10-day training onboarding phase.",
          metrics: isHindi ? "उपस्थिति: 100% (लक्ष्य: >95%)" : "Attendance: 100% (Target: >95%)",
          guidance: isHindi
            ? "शानदार! आपने कोई शिफ्ट मिस नहीं की है। इसी तरह अनुशासन बनाए रखें।"
            : "Excellent! You have had zero missed shifts or late check-ins. Keep up this perfect discipline!"
        };
      case "Device Care":
      case "उपकरण की देखभाल":
        return {
          name: isHindi ? "उपकरण की देखभाल" : "Standard Device Care",
          status: "Completed ✓",
          statusColor: "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20",
          onTrack: "ON TRACK",
          onTrackColor: "bg-emerald-500/20 text-emerald-300",
          desc: isHindi
            ? "ज़ेबरा स्कैनर डिवाइस को सही ढंग से संभालने और चार्जिंग डॉक पर लगाने की क्षमता।"
            : "Demonstrated safe handling of Zebra barcode scanning terminals, holsters, and proper battery dock checkouts.",
          metrics: isHindi ? "स्थिति: स्वीकृत (Passed)" : "Status: Verified & Passed",
          guidance: isHindi
            ? "आप डिवाइस को बहुत अच्छी तरह संभाल रहे हैं। काम समाप्त होने पर इसे डॉक करना न भूलें।"
            : "Device checkout and docking protocols are fully met. Continue using the safety holster at all times."
        };
      case "Pace Target":
      case "गति का लक्ष्य":
        return {
          name: isHindi ? "गति का लक्ष्य" : "Pace Target (Speed)",
          status: "Action Required ⚠️",
          statusColor: "text-amber-400 bg-amber-500/10 border border-amber-500/20",
          onTrack: "NOT ON TRACK",
          onTrackColor: "bg-amber-500/20 text-amber-300",
          desc: isHindi
            ? "प्रति घंटे किए गए औसत पिक का न्यूनतम लक्ष्य।"
            : "Your average picking speed measured over active mock shifts.",
          metrics: isHindi ? "वर्तमान गति: 114 PPH (लक्ष्य: 115 PPH)" : "Current: 114 PPH (Target: 115 PPH)",
          guidance: isHindi
            ? "आप लक्ष्य के बहुत करीब हैं! Aisles 4-8 (आटा और भारी रैक) में अपनी गति को थोड़ा बढ़ाने से यह लक्ष्य पार हो जाएगा।"
            : "You are exceptionally close! Spend a little more time navigating Aisles 4-8 to push past the 115 PPH benchmark."
        };
      case "Scan Accuracy":
      case "स्कैन सटीकता":
        return {
          name: isHindi ? "स्कैन सटीकता" : "Scan Accuracy",
          status: "Completed ✓",
          statusColor: "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20",
          onTrack: "ON TRACK",
          onTrackColor: "bg-emerald-500/20 text-emerald-300",
          desc: isHindi
            ? "पिकिंग के दौरान बिना किसी गलत स्कैन के सही सामान चुनने की दर।"
            : "The percentage of items scanned and picked successfully on the first attempt without mis-scans.",
          metrics: isHindi ? "आपकी सटीकता: 99.1% (लक्ष्य: >99%)" : "Accuracy: 99.1% (Target: >99.0%)",
          guidance: isHindi
            ? "प्रशंसनीय सटीकता! आप लगभग कोई गलती नहीं कर रहे हैं। इसे इसी तरह बनाए रखें।"
            : "Superb! Your scan accuracy exceeds the operational threshold, keeping customer orders perfect."
        };
      case "Safety Record":
      case "सुरक्षा रिकॉर्ड":
        return {
          name: isHindi ? "सुरक्षा रिकॉर्ड" : "Safety Compliance",
          status: "Completed ✓",
          statusColor: "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20",
          onTrack: "ON TRACK",
          onTrackColor: "bg-emerald-500/20 text-emerald-300",
          desc: isHindi
            ? "फ्लोर पर ट्रॉली ले जाने और भारी वजन उठाने की सुरक्षा गाइडलाइंस का पालन।"
            : "Adherence to dark store floor safety, trolley handling, and safe lifting/bending guidelines.",
          metrics: isHindi ? "सुरक्षा उल्लंघन: 0 (शून्य)" : "Violations: 0 (Zero)",
          guidance: isHindi
            ? "सुरक्षित काम ही सही काम है। परफेक्ट सुरक्षा रिकॉर्ड!"
            : "Perfect score! You've maintained safe warehouse posture and trolley discipline. Keep yourself safe!"
        };
      case "LMS Progress":
      case "LMS प्रोग्रेस":
        return {
          name: isHindi ? "LMS प्रोग्रेस" : "LMS Progress",
          status: "Action Required ⚠️",
          statusColor: "text-rose-400 bg-rose-500/10 border border-rose-500/20",
          onTrack: "ACTION REQUIRED",
          onTrackColor: "bg-rose-500/20 text-rose-300",
          desc: isHindi
            ? "10-दिवसीय ऑनबोर्डिंग कोर्स में आपके पूरे किए गए वीडियो कोर्स।"
            : "Your overall digital course micro-module completions in the LMS.",
          metrics: isHindi ? "पूर्ण: 3/10 (लक्ष्य: कम से कम 8)" : "Completed: 3/10 (Target: At least 8)",
          guidance: isHindi
            ? "सर्टिफिकेशन से पहले आपको कम से कम 8 मॉड्यूल्स पूरे करने होंगे। आज ही 1 नया मॉड्यूल पूरा करें।"
            : "LMS completion is your primary certification blocker. Please clear outstanding micro-modules to resolve."
        };
      case "Buddy Feedback":
      case "बडी फीडबैक":
        return {
          name: isHindi ? "बडी फीडबैक" : "Floor Buddy Feedback",
          status: "Completed ✓",
          statusColor: "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20",
          onTrack: "ON TRACK",
          onTrackColor: "bg-emerald-500/20 text-emerald-300",
          desc: isHindi
            ? "सीनियर गाइड (विक्रम भैया) द्वारा आपकी संचार, टीमवर्क और फ्लोर व्यवहार पर रेटिंग।"
            : "Live floor assessment feedback and signoff from senior guide Vikram bhaiya.",
          metrics: isHindi ? "बडी फीडबैक: स्वीकृत (Passed)" : "Feedback: Verified & Signed Off",
          guidance: isHindi
            ? "विक्रम भैया आपके संवाद और फ्लोर व्यवहार से बहुत खुश हैं! आप पूरी तरह से रेडी हैं।"
            : "Vikram signed off on your communication, aisle behavior, and readiness to pick independently. Great teamwork!"
        };
      default:
        return {
          name: critName,
          status: "Check Status",
          statusColor: "text-cyan-400 bg-cyan-500/10 border border-cyan-500/20",
          onTrack: "ON TRACK",
          onTrackColor: "bg-cyan-500/20 text-cyan-300",
          desc: "Review this criteria to stay on track for Day 10 Certification.",
          metrics: "Target Met",
          guidance: "Continue your excellent effort across all dark store zones."
        };
    }
  };

  // 7 Learning journey stages with comprehensive curriculum, benchmarks & checklists
  const journeyStages = [
    {
      id: 1,
      stageNumber: "01",
      dayRange: "Days 1–2",
      dayRangeHi: "डे 1–2",
      title: "Learning Videos",
      titleHi: "लर्निंग वीडियो",
      sub: "Build foundational dark store SOP knowledge",
      subHi: "डार्क स्टोर SOP व नियमों की नींव मजबूत करें",
      status: (currentDay >= 1 ? "completed" : "locked") as "completed" | "active" | "locked",
      icon: <Play className="w-4 h-4" />,
      color: "text-blue-400 bg-blue-500/20 border-blue-500/30",
      objective: "Master foundational operating procedures, dark store rack numbering, barcode scanner safety, cold room standards, and inventory handling.",
      objectiveHi: "मानक संचालन प्रक्रिया (SOP), डार्क स्टोर रैक व बिन नंबरिंग, बारकोड स्कैनर हैंडलिंग, और कोल्ड रूम सुरक्षा नियमों में महारत हासिल करें।",
      benchmark: "Complete all 10 digital micro-modules with ≥85% quiz average.",
      benchmarkHi: "सभी 10 डिजिटल माइक्रो-मॉड्यूल पूरे करें और कम से कम 85% क्विज़ औसत लाएं।",
      currentStat: `${modulesCompleted}/10 Modules Completed (${quizAvg}% Quiz Average)`,
      currentStatHi: `${modulesCompleted}/10 मॉड्यूल पूरे (क्विज़ औसत: ${quizAvg}%)`,
      coachTip: "Amit finished all video modules ahead of time. His scanner care understanding is rock solid.",
      coachTipHi: "अमित ने सभी वीडियो मॉड्यूल समय से पहले पूरे कर लिए। स्कैनर की देखभाल में समझ बहुत अच्छी है।",
      actionLabel: "Review Video Modules",
      actionLabelHi: "मॉड्यूल दोबारा देखें",
      actionType: "modules" as const,
      checkpoints: [
        { label: "Dark Store Layout, Aisle & Bin Topology", labelHi: "डार्क स्टोर लेआउट, गलियां व रैक नंबरिंग", completed: true },
        { label: "Cold Room & Dairy Product Handling Protocol", labelHi: "कोल्ड रूम व डेयरी उत्पाद सुरक्षा प्रोटोकॉल", completed: true },
        { label: "Zebra Scanner Ergonomics & Battery Docking", labelHi: "ज़ेबरा स्कैनर पकड़ और बैटरी चार्जिंग डॉक", completed: true },
        { label: "FIFO Inventory Picking & Expiry Date Check", labelHi: "FIFO इन्वेंट्री पिकिंग और एक्सपायरी तिथि जांच", completed: true },
      ],
    },
    {
      id: 2,
      stageNumber: "02",
      dayRange: "Days 2–3",
      dayRangeHi: "डे 2–3",
      title: "Floor Practice",
      titleHi: "फ्लोर प्रैक्टिस",
      sub: "Sharpen picking pace & trolley handling on active floor",
      subHi: "लाइव वेयरहाउस फ्लोर पर पिकिंग गति और ट्रॉली संचालन तराशें",
      status: (currentDay >= 2 ? "completed" : "locked") as "completed" | "active" | "locked",
      icon: <Dumbbell className="w-4 h-4" />,
      color: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30",
      objective: "Apply theoretical lessons on the live warehouse floor: rapid bin locating, first-pass scan accuracy, cart steering, and item packaging care.",
      objectiveHi: "वेयरहाउस फ्लोर पर लाइव अभ्यास: रैक से तुरंत सामान ढूंढना, पहली बार में सही बारकोड स्कैन, और ट्रॉली को तेज़ी से संभालना।",
      benchmark: "Achieve ≥110 Picks Per Hour (PPH) with ≥99% scan accuracy.",
      benchmarkHi: "कम से कम 110 पिक्स प्रति घंटा (PPH) और 99% स्कैन सटीकता हासिल करें।",
      currentStat: "114 PPH Achieved (Target: 110) • 99.1% Scan Accuracy",
      currentStatHi: "114 PPH गति (लक्ष्य: 110) • 99.1% स्कैन सटीकता",
      coachTip: "Amit's trolley steering in Aisles 1 to 4 is super smooth. Pacing is comfortably above benchmark.",
      coachTipHi: "Aisles 1-4 में ट्रॉली हैंडलिंग बहुत सहज है। गति पहले से ही बेंचमार्क से ऊपर है।",
      actionLabel: "Open Floor Pick Dial",
      actionLabelHi: "पिक डायल खोलें",
      actionType: "work" as const,
      checkpoints: [
        { label: "Trolley steering & turning in tight aisles", labelHi: "तंग गलियों में ट्रॉली को सुरक्षित घुमाना", completed: true },
        { label: "Fragile items separation (Bread, Eggs, Glass jars)", labelHi: "नाज़ुक सामान (अंडे, ब्रेड, कांच) को अलग रखना", completed: true },
        { label: "Fast barcode targeting using Zebra handheld terminal", labelHi: "ज़ेबरा स्कैनर से तुरंत बारकोड स्कैन करना", completed: true },
        { label: "Ergonomic safe lifting for heavy 10kg flour/rice bags", labelHi: "भारी 10kg आटा/चावल बैग उठाने की सही मुद्रा", completed: true },
      ],
    },
    {
      id: 3,
      stageNumber: "03",
      dayRange: "Days 3–4",
      dayRangeHi: "डे 3–4",
      title: "Simulation Lab",
      titleHi: "सिमुलेशन लैब",
      sub: "Resolve exceptions, barcode errors & stockouts safely",
      subHi: "मॉक ऑर्डर्स, बारकोड त्रुटि व आउट-ऑफ-स्टॉक का सुरक्षित समाधान",
      status: (currentDay === 3 ? "active" : currentDay > 3 ? "completed" : "locked") as "completed" | "active" | "locked",
      icon: <FlaskConical className="w-4 h-4" />,
      color: "text-purple-400 bg-purple-500/20 border-purple-500/30",
      objective: "Simulate real-world warehouse exceptions: damaged cartons, missing bin items, unreadable barcodes, customer substitute workflows, and stockout escalations.",
      objectiveHi: "वेयरहाउस की वास्तविक चुनौतियों का मॉक अभ्यास: खराब पैकेजिंग, रैक पर सामान न मिलना, स्कैन न होने वाले बारकोड और सब्स्टीट्यूट चुनना।",
      benchmark: "Clear at least 6 of 8 interactive simulation challenges.",
      benchmarkHi: "8 में से कम से कम 6 सिमुलेशन अभ्यास सफलतापूर्वक पूरे करें।",
      currentStat: "5 of 8 Challenges Cleared (1 Pending Checkpoint)",
      currentStatHi: "8 में से 5 अभ्यास पूर्ण (1 अंतिम चेकपॉइंट शेष)",
      coachTip: "Complete the 'Heavy Goods & High-Racks' simulation challenge today to unlock Stage 4.",
      coachTipHi: "स्टेज 4 अनलॉक करने के लिए आज 'भारी सामान व उच्च रैक' सिमुलेशन पूरा करें।",
      actionLabel: "Launch Simulation Drill",
      actionLabelHi: "सिमुलेशन ड्रिल शुरू करें",
      actionType: "work" as const,
      checkpoints: [
        { label: "Missing item substitute workflow & customer notification", labelHi: "अनुपलब्ध वस्तु का विकल्प चुनना व नोटिफिकेशन", completed: true },
        { label: "Damaged packaging quarantine and floor lead escalation", labelHi: "क्षतिग्रस्त सामान को अलग रखना व लीड को रिपोर्ट", completed: true },
        { label: "Unreadable/smudged barcode manual SKU entry protocol", labelHi: "खराब बारकोड पर मैन्युअल SKU कोड दर्ज करना", completed: true },
        { label: "Heavy Goods & High-Racks multi-bin batching", labelHi: "ऊंचे रैक से भारी सामान सुरक्षित निकालना", completed: false },
      ],
    },
    {
      id: 4,
      stageNumber: "04",
      dayRange: "Days 4–5",
      dayRangeHi: "डे 4–5",
      title: "Workplace Hindi/Eng",
      titleHi: "वर्कप्लेस हिंदी व अंग्रेज़ी संवाद",
      sub: "Communicate clearly during rush shifts & emergencies",
      subHi: "रश शिफ्ट और आपात स्थिति में स्पष्ट व आत्मविश्वास से बात करें",
      status: (currentDay >= 4 ? "completed" : "locked") as "completed" | "active" | "locked",
      icon: <Volume2 className="w-4 h-4" />,
      color: "text-cyan-400 bg-cyan-500/20 border-cyan-500/30",
      objective: "Practice concise verbal callouts, shift handover communications, emergency aisle warnings, and clarifying customer notes with leads.",
      objectiveHi: "वेयरहाउस में ज़रूरी बोलचाल: शिफ्ट हैंडओवर संवाद, आपातकालीन चेतावनी (साइड प्लीज़), और फ्लोर लीड से स्पष्ट बातचीत।",
      benchmark: "Complete 4 audio pronunciation and warehouse phrase practices.",
      benchmarkHi: "4 ऑडियो संवाद और फ्लोर मुहावरे अभ्यास पूरे करें।",
      currentStat: currentDay >= 4 ? "4/4 Drills Cleared • 88% Clarity" : "Scheduled for Day 4",
      currentStatHi: currentDay >= 4 ? "4/4 अभ्यास पूर्ण • 88% स्पष्टता" : "डे 4 के लिए निर्धारित",
      coachTip: "Crisp communication prevents collisions in busy aisles. Practice giving loud 'Side Please' warnings.",
      coachTipHi: "व्यस्त गलियों में स्पष्ट आवाज़ से दुर्घटना नहीं होती। मोड़ पर 'साइड प्लीज़' बोलने का अभ्यास रखें।",
      actionLabel: "Practice Audio Voice Drill",
      actionLabelHi: "वॉइस संवाद अभ्यास करें",
      actionType: "buddy" as const,
      checkpoints: [
        { label: "Shift check-in & handover verbal protocol", labelHi: "शिफ्ट शुरुआत और समाप्ति पर हैंडओवर बोलना", completed: currentDay >= 4 },
        { label: "Safety callout: 'Trolley coming / Side Please'", labelHi: "सुरक्षा कॉल: 'ट्रॉली आ रही है / साइड प्लीज़'", completed: currentDay >= 4 },
        { label: "Reporting inventory stockout to Shift Manager clearly", labelHi: "शिफ्ट मैनेजर को स्टॉक खत्म होने की स्पष्ट सूचना", completed: currentDay >= 4 },
        { label: "Understanding app audio chimes & terminal error beeps", labelHi: "स्कैनर की विभिन्न बीप और एरर आवाज़ों की पहचान", completed: currentDay >= 4 },
      ],
    },
    {
      id: 5,
      stageNumber: "05",
      dayRange: "Days 6–7",
      dayRangeHi: "डे 6–7",
      title: "Interview Prep & Shadowing",
      titleHi: "शिफ्ट इंटरव्यू व बडी शैडोइंग",
      sub: "Shadow senior picker Vikram & pass readiness Q&A",
      subHi: "सीनियर गाइड विक्रम भैया के साथ शैडोइंग और ओरल Q&A पास करें",
      status: (currentDay >= 5 ? "completed" : "locked") as "completed" | "active" | "locked",
      icon: <ShieldCheck className="w-4 h-4" />,
      color: "text-violet-400 bg-violet-500/20 border-violet-500/30",
      objective: "Shadow a senior buddy picker through a real peak-demand dispatch wave, followed by an oral operational interview with the Store Lead.",
      objectiveHi: "सीनियर बडी के साथ 20-ऑर्डर के लाइव बैच में साथ चलना और स्टोर लीड के साथ ऑपरेशनल इंटरव्यू पूरा करना।",
      benchmark: "Pass Buddy Shadowing verification & Store Lead Q&A signoff.",
      benchmarkHi: "बडी शैडोइंग वेरिफिकेशन और स्टोर लीड की मौखिक सहमति प्राप्त करें।",
      currentStat: currentDay >= 5 ? "Buddy Shadowing Verified ✓" : "Buddy Assigned: Vikram Bhaiya (Starts Day 6)",
      currentStatHi: currentDay >= 5 ? "बडी शैडोइंग सत्यापित ✓" : "बडी नियुक्त: विक्रम भैया (डे 6 से)",
      coachTip: "Vikram will observe your path planning. Group items by shelf level to save unnecessary bending.",
      coachTipHi: "विक्रम भैया आपके रूट की जांच करेंगे। बार-बार झुकने से बचने के लिए शेल्फ लेवल के अनुसार सामान चुनें।",
      actionLabel: "Chat with Coach Vikram",
      actionLabelHi: "विक्रम भैया से बात करें",
      actionType: "buddy" as const,
      checkpoints: [
        { label: "Full 20-order peak rush shift shadowing with Vikram", labelHi: "विक्रम भैया के साथ 20-ऑर्डर के रश बैच की शैडोइंग", completed: currentDay >= 6 },
        { label: "Operational safety & SOP oral Q&A with Store Lead", labelHi: "स्टोर लीड के साथ मौखिक सुरक्षा व SOP सवाल-जवाब", completed: currentDay >= 6 },
        { label: "Time management review during high-velocity order waves", labelHi: "तेज़ ऑर्डर फ्लो के दौरान समय प्रबंधन का आकलन", completed: currentDay >= 6 },
        { label: "Buddy recommendation and sign-off on solo readiness", labelHi: "सोलो शिफ्ट के लिए बडी की औपचारिक अनुशंसा", completed: currentDay >= 6 },
      ],
    },
    {
      id: 6,
      stageNumber: "06",
      dayRange: "Days 8–9",
      dayRangeHi: "डे 8–9",
      title: "Final Assessment",
      titleHi: "फाइनल असेसमेंट",
      sub: "Complete 2-hour independent solo shift SLA trial",
      subHi: "2 घंटे की बिना सहायता वाली स्वतंत्र सोलो शिफ्ट का ट्रायल",
      status: (currentDay >= 8 && overallReadiness >= 70 ? "completed" : "locked") as "completed" | "active" | "locked",
      icon: <FileCheck2 className="w-4 h-4" />,
      color: "text-amber-400 bg-amber-500/20 border-amber-500/30",
      objective: "Demonstrate full operational independence under audit supervision: 2 hours of unassisted picking, zero dispatch errors, and 100% SLA adherence.",
      objectiveHi: "बिना किसी सहायता के 2 घंटे का लाइव पिकिंग ट्रायल: शून्य डिस्पैच गलतियां और 100% SLA समय सीमा का पालन।",
      benchmark: "Maintain ≥115 PPH, ≥99% accuracy, and pass all 7 audit checks.",
      benchmarkHi: "न्यूनतम 115 PPH, 99% सटीकता और 7 ऑडिट चेक पूरे करें।",
      currentStat: currentDay >= 8 ? "Trial Completed ✓" : "Audit Scheduled for Day 9 (Readiness: 82%)",
      currentStatHi: currentDay >= 8 ? "ट्रायल पूर्ण ✓" : "डे 9 के लिए ऑडिट निर्धारित (तैयारी: 82%)",
      coachTip: "Stay calm and keep your scan rhythm steady. Focus on item condition and expiry date integrity.",
      coachTipHi: "शांत रहें और स्कैनिंग की लय बनाए रखें। सामान की स्थिति और एक्सपायरी तिथि पर विशेष ध्यान दें।",
      checkpoints: [
        { label: "2-hour uninterrupted solo picking shift sprint", labelHi: "2 घंटे की निर्बाध सोलो पिकिंग शिफ्ट", completed: currentDay >= 9 },
        { label: "Zero mis-picked items or damaged carton dispatches", labelHi: "शून्य गलत पिकिंग या क्षतिग्रस्त डिब्बे का डिस्पैच", completed: currentDay >= 9 },
        { label: "Adherence to 8-minute express order assembly SLA", labelHi: "8 मिनट के एक्सप्रेस ऑर्डर असेंबली SLA का पालन", completed: currentDay >= 9 },
        { label: "Clean terminal return and battery dock logging", labelHi: "स्कैनर की सही वापसी और बैटरी डॉक लॉगिंग", completed: currentDay >= 9 },
      ],
    },
    {
      id: 7,
      stageNumber: "07",
      dayRange: "Day 10",
      dayRangeHi: "डे 10",
      title: "Certificate & Solo Shift",
      titleHi: "सर्टिफिकेट व सोलो शिफ्ट",
      sub: "Graduation to certified solo dark store picker",
      subHi: "प्रमाणित स्वतंत्र डार्क स्टोर पिकर के रूप में स्नातक",
      status: (overallReadiness >= 85 ? "completed" : "locked") as "completed" | "active" | "locked",
      icon: <Award className="w-4 h-4" />,
      color: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30",
      objective: "Receive official Dark Store Picker Certification, permanent Zebra terminal credentials, and entry into the full-time shift roster.",
      objectiveHi: "आधिकारिक डार्क स्टोर पिकर सर्टिफिकेशन, स्थायी बारकोड स्कैनर आईडी, और नियमित शिफ्ट रोस्टर में शामिल होना।",
      benchmark: "≥85% composite readiness score and Store Manager endorsement.",
      benchmarkHi: "कम से कम 85% समग्र तत्परता स्कोर और स्टोर मैनेजर का साइन-ऑफ।",
      currentStat: overallReadiness >= 85 ? "Certified Graduate 🎓" : "Prerequisites: 82%/85% Complete",
      currentStatHi: overallReadiness >= 85 ? "प्रमाणित स्नातक 🎓" : "पूर्व-शर्तें: 82%/85% पूर्ण",
      coachTip: "After certification, Amit will pick full solo shifts across morning and evening rush slots.",
      coachTipHi: "सर्टिफिकेशन के बाद अमित सुबह और शाम की रश शिफ्ट में स्वतंत्र रूप से काम करेंगे।",
      checkpoints: [
        { label: "Dark Store Lead formal operational sign-off", labelHi: "डार्क स्टोर हेड का औपचारिक ऑपरेशनल साइन-ऑफ", completed: overallReadiness >= 85 },
        { label: "Certified Independent Dark Store Picker credential", labelHi: "प्रमाणित स्वतंत्र डार्क स्टोर पिकर प्रमाणपत्र", completed: overallReadiness >= 85 },
        { label: "Permanent Zebra scanner terminal authorization badge", labelHi: "स्थायी ज़ेबरा स्कैनर टर्मिनल प्राधिकार बैज", completed: overallReadiness >= 85 },
        { label: "First solo shift roster scheduling & badge ceremony", labelHi: "पहली स्वतंत्र शिफ्ट रोस्टर और बैज सम्मान समारोह", completed: overallReadiness >= 85 },
      ],
    },
  ];

  const toggleStage = (id: number) => {
    setExpandedStageIds((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  const toggleAllStages = () => {
    if (expandedStageIds.length === journeyStages.length) {
      setExpandedStageIds([]);
    } else {
      setExpandedStageIds(journeyStages.map((s) => s.id));
    }
  };

  const completedStagesCount = journeyStages.filter((s) => s.status === "completed").length;

  return (
    <section
      id="job-ready-human-dashboard"
      className="space-y-4 select-none"
    >
      {/* ------------------------------------------------------------- */}
      {/* 7 STAGES LEARNING JOURNEY (EXPANDABLE)                        */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white/5 rounded-3xl p-4 sm:p-5 border border-white/10 space-y-4 shadow-xl">
        {/* Header with Title, Progress Counter, and Expand All / Collapse Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm sm:text-base font-black text-white tracking-tight">
                {isHindi ? "आपकी 7-चरणीय लर्निंग जर्नी" : "Your 7-Stage Learning Journey"}
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5 ml-8">
              {isHindi
                ? "प्रारंभिक थ्योरी से पूर्ण सोलो शिफ्ट सर्टिफिकेशन तक"
                : "From foundational SOPs to full solo shift certification"}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto ml-8 sm:ml-0">
            <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold text-slate-300">
              <span className="text-emerald-400 font-black">{completedStagesCount}</span>/7 {isHindi ? "पूर्ण" : "Completed"}
            </span>

            <button
              type="button"
              id="toggle-all-7-stages-btn"
              onClick={toggleAllStages}
              className="px-3 py-1 rounded-xl bg-cyan-400/10 hover:bg-cyan-400/20 active:scale-95 text-xs font-bold text-cyan-300 flex items-center gap-1.5 transition-all border border-cyan-400/30 cursor-pointer shadow-xs"
            >
              {expandedStageIds.length === journeyStages.length ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>{isHindi ? "सब संक्षिप्त करें" : "Collapse All"}</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>{isHindi ? "सब विस्तार से देखें" : "Expand All"}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Interactive Quick Stage Ribbon (Clicking any stage expands it directly!) */}
        <div>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>{isHindi ? "त्वरित चयन (किसी भी स्टेज पर क्लिक करें)" : "Quick Select (Click any stage to expand)"}</span>
            <span className="text-cyan-400/80">{expandedStageIds.length} {isHindi ? "विस्तारित" : "expanded"}</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none">
            {journeyStages.map((stage, idx) => {
              const isExpanded = expandedStageIds.includes(stage.id);
              return (
                <React.Fragment key={stage.id}>
                  <button
                    type="button"
                    onClick={() => toggleStage(stage.id)}
                    className={`px-3 py-2 rounded-2xl border transition-all shrink-0 flex items-center gap-2.5 text-left cursor-pointer active:scale-95 ${
                      isExpanded
                        ? "bg-cyan-500/20 border-cyan-400 text-white ring-2 ring-cyan-400/40 shadow-md"
                        : stage.status === "completed"
                        ? "bg-white/10 border-emerald-500/30 text-slate-200 hover:bg-white/15 shadow-2xs"
                        : stage.status === "active"
                        ? "bg-gradient-to-br from-cyan-400/20 to-blue-500/20 border-cyan-400 text-white shadow-xs font-bold"
                        : "bg-[#111317]/40 border-white/5 text-slate-500 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        stage.status === "completed"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : stage.status === "active"
                          ? "bg-cyan-500/20 text-cyan-300"
                          : "bg-slate-950/20 text-slate-500"
                      }`}
                    >
                      {stage.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-black truncate leading-tight flex items-center gap-1.5">
                        <span>{stage.stageNumber}.</span>
                        <span>{isHindi ? stage.titleHi : stage.title}</span>
                      </div>
                      <div
                        className={`text-[9px] font-black uppercase tracking-wider ${
                          stage.status === "completed"
                            ? "text-emerald-400"
                            : stage.status === "active"
                            ? "text-cyan-300"
                            : "text-slate-500"
                        }`}
                      >
                        {stage.status === "completed"
                          ? (isHindi ? "पूर्ण ✓" : "Completed ✓")
                          : stage.status === "active"
                          ? (isHindi ? "सक्रिय ⚡" : "In Progress ⚡")
                          : (isHindi ? "आगामी 🔒" : "Upcoming 🔒")}
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 shrink-0 text-slate-400 transition-transform duration-200 ${
                        isExpanded ? "rotate-180 text-cyan-300" : ""
                      }`}
                    />
                  </button>

                  {idx < journeyStages.length - 1 && (
                    <div className="w-2.5 h-0.5 bg-white/10 shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* The 7 Expandable Accordion Stage Cards */}
        <div className="space-y-2.5 pt-1">
          {journeyStages.map((stage) => {
            const isExpanded = expandedStageIds.includes(stage.id);
            return (
              <div
                key={stage.id}
                id={`stage-card-${stage.id}`}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isExpanded
                    ? "bg-[#11141a]/90 border-cyan-400/40 shadow-lg"
                    : "bg-white/5 border-white/10 hover:bg-white/[0.07]"
                }`}
              >
                {/* Accordion Stage Header Button */}
                <button
                  type="button"
                  onClick={() => toggleStage(stage.id)}
                  aria-expanded={isExpanded}
                  className="w-full p-3 sm:p-3.5 flex items-center justify-between gap-3 text-left cursor-pointer transition-colors select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Stage Number & Icon Badge */}
                    <div className="relative shrink-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm border shadow-xs ${
                          stage.status === "completed"
                            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                            : stage.status === "active"
                            ? "bg-cyan-500/20 border-cyan-400/40 text-cyan-300"
                            : "bg-slate-900/40 border-white/10 text-slate-500"
                        }`}
                      >
                        {stage.icon}
                      </div>
                      <span className="absolute -top-1 -right-1 text-[9px] font-black px-1 rounded-md bg-slate-950 text-slate-300 border border-white/10">
                        {stage.stageNumber}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-black text-white tracking-tight truncate">
                          {isHindi ? stage.titleHi : stage.title}
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/5">
                          {isHindi ? stage.dayRangeHi : stage.dayRange}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-semibold truncate mt-0.5">
                        {isHindi ? stage.subHi : stage.sub}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    {/* Status Pill */}
                    {stage.status === "completed" ? (
                      <span className="hidden xs:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>{isHindi ? "पूर्ण" : "Completed"}</span>
                      </span>
                    ) : stage.status === "active" ? (
                      <span className="hidden xs:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-[10px] font-black uppercase tracking-wider">
                        <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
                        <span>{isHindi ? "सक्रिय" : "In Progress"}</span>
                      </span>
                    ) : (
                      <span className="hidden xs:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900/40 text-slate-500 border border-white/5 text-[10px] font-black uppercase tracking-wider">
                        <Lock className="w-3 h-3" />
                        <span>{isHindi ? "आगामी" : "Locked"}</span>
                      </span>
                    )}

                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                        isExpanded
                          ? "bg-cyan-400/20 text-cyan-300"
                          : "bg-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </div>
                </button>

                {/* Expanded Stage Drawer Content */}
                {isExpanded && (
                  <div className="px-3.5 pb-4 pt-1 sm:px-5 sm:pb-5 space-y-3.5 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Objective Box */}
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5 text-xs text-slate-200 leading-relaxed">
                      <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wider block mb-1">
                        {isHindi ? "स्टेज का उद्देश्य व कार्यक्षेत्र:" : "Stage Objective & Scope:"}
                      </span>
                      <p className="font-medium text-slate-300">{isHindi ? stage.objectiveHi : stage.objective}</p>
                    </div>

                    {/* Benchmark vs Current Performance (2 Columns) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="bg-[#14171f] p-3 rounded-xl border border-white/5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                          {isHindi ? "लक्ष्य बेंचमार्क (मानक)" : "Target Benchmark"}
                        </span>
                        <p className="text-xs font-semibold text-slate-200">
                          {isHindi ? stage.benchmarkHi : stage.benchmark}
                        </p>
                      </div>

                      <div className="bg-[#14171f] p-3 rounded-xl border border-cyan-400/20">
                        <span className="text-[10px] font-black text-cyan-300 uppercase tracking-wider block mb-1">
                          {isHindi ? "अमित का वर्तमान प्रदर्शन" : "Amit's Measured Performance"}
                        </span>
                        <p className="text-xs font-bold text-cyan-200">
                          {isHindi ? stage.currentStatHi : stage.currentStat}
                        </p>
                      </div>
                    </div>

                    {/* Core Operational Checkpoints Checklist */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                        {isHindi ? "प्रमुख चेकपॉइंट्स (4 सत्यापन बिंदु):" : "Core Verification Checkpoints:"}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {stage.checkpoints.map((cp, cIdx) => (
                          <div
                            key={cIdx}
                            className={`p-2.5 rounded-xl border flex items-start gap-2.5 ${
                              cp.completed
                                ? "bg-emerald-500/10 border-emerald-500/20 text-slate-200"
                                : "bg-white/5 border-white/5 text-slate-400"
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              {cp.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Clock className="w-4 h-4 text-slate-500" />
                              )}
                            </div>
                            <span className="text-[11px] font-semibold leading-snug">
                              {isHindi ? cp.labelHi : cp.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Coach Vikram's Advice Box */}
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                        💬
                      </div>
                      <div className="min-w-0 text-xs text-amber-200">
                        <span className="font-black text-amber-300 text-[11px] uppercase tracking-wider block mb-0.5">
                          {isHindi ? "विक्रम भैया (सीनियर गाइड) का सुझाव:" : "Coach Vikram's Guidance:"}
                        </span>
                        <p className="leading-relaxed font-semibold">
                          {isHindi ? stage.coachTipHi : stage.coachTip}
                        </p>
                      </div>
                    </div>

                    {/* Stage Action CTA Button */}
                    {stage.actionLabel && (
                      <div className="pt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            if (stage.actionType === "modules" && onOpenModules) onOpenModules();
                            else if (stage.actionType === "work" && onOpenWorkTools) onOpenWorkTools();
                            else if (stage.actionType === "buddy" && onOpenBuddy) onOpenBuddy();
                          }}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:opacity-90 active:scale-95 text-slate-950 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <span>{isHindi ? stage.actionLabelHi : stage.actionLabel}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================== */}
      {/* 1. PILLAR (CATEGORY) DRILLDOWN POPUP TAB   */}
      {/* ========================================== */}
      {activePillarModal && (() => {
        const catScore = Math.round(activePillarModal.ratio * activePillarModal.weight);
        const details = getPillarModalDetails(activePillarModal.id, catScore);
        if (!details) return null;
        return (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-[#181b21] border border-white/10 p-5 sm:p-6 rounded-[28px] max-w-sm w-full space-y-5 shadow-2xl relative overflow-hidden text-white animate-in zoom-in-95 duration-200">
              {/* Top Decor Glow */}
              <div className="absolute -top-12 -left-12 w-24 h-24 bg-cyan-500/20 rounded-full blur-2xl" />

              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white/5 text-cyan-400 flex items-center justify-center">
                    {activePillarModal.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">
                      {isHindi ? activePillarModal.titleHi : activePillarModal.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      {isHindi ? `वेटेज: ${activePillarModal.weight}%` : `Weight: ${activePillarModal.weight}%`}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setActivePillarModal(null)}
                  className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center font-bold text-xs transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Status Header Block */}
              <div className="flex items-center justify-between gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                    {isHindi ? "वर्तमान स्कोर" : "Current Score"}
                  </span>
                  <span className="text-2xl font-black text-cyan-400">{catScore}%</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                    {isHindi ? "ट्रैक स्थिति" : "Track Status"}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase inline-block ${details.onTrackColor}`}>
                    {details.onTrack}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2.5 text-xs text-slate-200">
                <div>
                  <strong className="text-slate-400 block font-bold">
                    {isHindi ? "विवरण:" : "Description:"}
                  </strong>
                  <p className="font-medium leading-relaxed">{details.desc}</p>
                </div>

                <div>
                  <strong className="text-slate-400 block font-bold">
                    {isHindi ? "स्थिति विश्लेषण:" : "Status Analysis:"}
                  </strong>
                  <p className="font-semibold text-cyan-300 leading-relaxed">{details.currentStats}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{details.targetStats}</p>
                </div>

                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px]">
                  <strong className={`font-black uppercase tracking-wider block mb-1 ${details.statusColor}`}>
                    {details.statusText}
                  </strong>
                  <p className="font-semibold text-slate-200 leading-relaxed">{details.guidance}</p>
                </div>
              </div>

              <div className="pt-1">
                <button
                  onClick={() => setActivePillarModal(null)}
                  className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 text-xs font-black hover:opacity-90 active:scale-95 transition-all uppercase tracking-wider"
                >
                  {isHindi ? "ठीक है, समझ गया!" : "Alright, Got It!"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================== */}
      {/* 2. CRITERIA DRILLDOWN POPUP TAB            */}
      {/* ========================================== */}
      {activeCriteriaModal && (() => {
        const details = getCriteriaModalDetails(activeCriteriaModal.name);
        return (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-[#181b21] border border-white/10 p-5 sm:p-6 rounded-[28px] max-w-sm w-full space-y-5 shadow-2xl relative overflow-hidden text-white animate-in zoom-in-95 duration-200">
              {/* Top Decor Glow */}
              <div className="absolute -top-12 -left-12 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl" />

              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    activeCriteriaModal.met ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                  }`}>
                    {activeCriteriaModal.met ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white leading-tight">
                      {details.name}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      {isHindi ? "व्यावसायिक ऑडिट" : "Core Operational Criteria"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveCriteriaModal(null)}
                  className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center font-bold text-xs transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Status Header Block */}
              <div className="flex items-center justify-between gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                    {isHindi ? "ऑडिट स्थिति" : "Audit Status"}
                  </span>
                  <span className={`text-sm font-black ${activeCriteriaModal.met ? "text-emerald-400" : "text-rose-400"}`}>
                    {details.status}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                    {isHindi ? "ट्रैक स्थिति" : "Track Status"}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase inline-block ${details.onTrackColor}`}>
                    {details.onTrack}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-3 text-xs text-slate-200">
                <div>
                  <strong className="text-slate-400 block font-bold">
                    {isHindi ? "मापदंड विवरण:" : "Criterion Standard:"}
                  </strong>
                  <p className="font-medium leading-relaxed">{details.desc}</p>
                </div>

                <div>
                  <strong className="text-slate-400 block font-bold">
                    {isHindi ? "आपका वास्तविक प्रदर्शन:" : "Your Measured Performance:"}
                  </strong>
                  <p className="font-bold text-purple-300 leading-relaxed text-sm">{details.metrics}</p>
                </div>

                <div className="p-3 bg-[#111317]/50 border border-white/5 rounded-xl space-y-1">
                  <strong className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
                    {isHindi ? "सुझाव व अगला कदम:" : "Coach Guidance & Next Step:"}
                  </strong>
                  <p className="font-semibold text-slate-200 leading-relaxed text-[11px]">{details.guidance}</p>
                </div>
              </div>

              <div className="pt-1">
                <button
                  onClick={() => setActiveCriteriaModal(null)}
                  className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-xs font-black hover:opacity-90 active:scale-95 transition-all uppercase tracking-wider"
                >
                  {isHindi ? "ठीक है, बंद करें" : "Alright, Close"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </section>
  );
};

