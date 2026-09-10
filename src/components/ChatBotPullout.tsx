import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  RotateCcw,
  CheckCircle2,
  Milestone,
  Target,
  ShieldCheck,
  Award,
  TrendingUp,
  Clock,
  ArrowRight,
  BookOpen,
  ChevronDown,
  Phone,
  Zap,
} from "lucide-react";
import { askCompanion, deriveLearnerRoadmap, CanonicalRoadmapStage } from "../services/intelligence";
import { speakMessage, stopSpeaking } from "../utils/speech";
import { NewHire } from "../types";

interface ChatBotPulloutProps {
  currentDay: number;
  learnerName?: string;
  buddyName?: string;
  isHindi?: boolean;
  onAlertBuddy?: () => void;
  newHire?: NewHire;
  onOpenFullScreenJourney?: () => void;
}

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
}

export const ChatBotPullout: React.FC<ChatBotPulloutProps> = ({
  currentDay,
  learnerName = "Rahul",
  buddyName = "Vikram",
  isHindi = false,
  onAlertBuddy,
  newHire,
  onOpenFullScreenJourney,
}) => {
  // Pill state: pre-hidden by default (isTucked = true)
  const [isTucked, setIsTucked] = useState<boolean>(true);
  // Drawer state: whether the full sidebar drawer is open
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  // Active drawer tab: "journey" | "chat"
  const [activeTab, setActiveTab] = useState<"journey" | "chat">("journey");

  // Journey state inside drawer
  const [expandedStageId, setExpandedStageId] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  // Touch gesture tracking for tactile swipe-to-pull
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current !== null) {
      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      if (deltaX < -25) {
        // Swiped left -> pull out!
        setIsTucked(false);
      } else if (deltaX > 25) {
        // Swiped right -> tuck back!
        setIsTucked(true);
      }
      touchStartX.current = null;
    }
  };

  // Chat conversation state
  const firstName = (learnerName || "Rahul").split(" ")[0];
  const buddyFirstName = (buddyName || "Vikram").split(" ")[0];

  const initialGreeting = isHindi
    ? `नमस्ते ${firstName}! 👋 मैं आपका AI फ्लोर साथी हूँ। मुझसे स्टोर के किसी भी काम, रैक लोकेशन, स्कैनर या सुरक्षा के बारे में कुछ भी पूछें!`
    : `Hello ${firstName}! 👋 I am your AI Floor Assistant. Ask me anything about store aisles, scanner fixes, cold rooms, or safety SOPs!`;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-welcome",
      sender: "bot",
      text: initialGreeting,
      timestamp: "Just now",
    },
  ]);

  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [buddyAlerted, setBuddyAlerted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Derive Journey Roadmap data
  const roadmapData = newHire
    ? deriveLearnerRoadmap(newHire, currentDay)
    : null;

  const currentStageIndex = roadmapData?.currentStageIndex ?? 1;
  const currentStage = roadmapData?.currentStage;
  const stages = roadmapData?.stages ?? [];
  const readinessScore = roadmapData?.readinessScore ?? 78;

  // Auto scroll to bottom of chat
  useEffect(() => {
    if (isDrawerOpen && activeTab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isDrawerOpen, activeTab]);

  // Focus input when opening chat tab
  useEffect(() => {
    if (isDrawerOpen && activeTab === "chat") {
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isDrawerOpen, activeTab]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend !== undefined ? textToSend : inputText).trim();
    if (!text || isThinking) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsThinking(true);

    try {
      const botReply = await askCompanion(text, currentDay);
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: botReply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
      speakMessage(botReply, isHindi);
    } catch (err) {
      const fallback = isHindi
        ? "माफ कीजियेगा, दोबारा पूछें या नीचे दिए गए आम सवालों में से चुनें।"
        : "Sorry, I could not process that. Please try again or tap a quick question.";
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: fallback,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      handleSendMessage(
        isHindi
          ? "आइसल 4 से 8 में सामान ढूंढने में मदद चाहिए।"
          : "I need help finding items in Aisles 4 to 8."
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = isHindi ? "hi-IN" : "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) handleSendMessage(transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
      handleSendMessage(
        isHindi
          ? "दूध और दही का कोल्ड रूम कहां है?"
          : "Where is the cold dairy room?"
      );
    }
  };

  const quickQuestions = isHindi
    ? [
        "दूध और दही का कोल्ड रूम कहां है?",
        "आइसल 4 से 8 में सामान कैसे ढूंढें?",
        "स्कैनर बारकोड नहीं पढ़ रहा",
        "सामान का पैकेट फटा हुआ है",
        "भारी सामान टोट में कैसे रखें?",
      ]
    : [
        "Where is the cold dairy room?",
        "How to locate items in Aisles 4-8?",
        "Scanner not reading barcode",
        "Damaged item protocol",
        "Heavy items tote packing order",
      ];

  const handleAlertFloorBuddy = () => {
    setBuddyAlerted(true);
    onAlertBuddy?.();
    const alertMsg: Message = {
      id: `buddy-alert-${Date.now()}`,
      sender: "bot",
      text: isHindi
        ? `🚨 आपके साथी ${buddyFirstName} को नोटिफिकेशन भेज दिया गया है! वो जल्द ही आपकी रैक पर आ रहे हैं।`
        : `🚨 Floor Buddy ${buddyFirstName} has been notified! They are heading to your aisle now.`,
      timestamp: "Just now",
    };
    setMessages((prev) => [...prev, alertMsg]);
  };

  const handlePlayJourneyAudio = () => {
    if (isPlayingAudio) {
      stopSpeaking();
      setIsPlayingAudio(false);
      return;
    }
    const currentTitle = currentStage
      ? isHindi
        ? currentStage.titleHi
        : currentStage.titleEn
      : "सफर";
    const currentMilestone = currentStage
      ? isHindi
        ? currentStage.milestoneHi
        : currentStage.milestoneEn
      : "लक्ष्य";
    const text = isHindi
      ? `10-दिन का जॉब-रेडी सफर। आप अभी डे ${currentDay}, स्टेज ${currentStageIndex + 1}: ${currentTitle} पर हैं। अगला लक्ष्य: ${currentMilestone}। आपकी तत्परता स्कोर ${readinessScore} प्रतिशत है।`
      : `10-Day Job-Ready Journey. You are on Day ${currentDay}, Stage ${currentStageIndex + 1}: ${currentTitle}. Next milestone: ${currentMilestone}. Your readiness score is ${readinessScore} percent.`;

    setIsPlayingAudio(true);
    speakMessage(text, isHindi, () => {
      setIsPlayingAudio(false);
    });
  };

  const getStageIcon = (key: CanonicalRoadmapStage["key"]) => {
    switch (key) {
      case "training":
        return <BookOpen className="w-4 h-4" />;
      case "capability":
        return <Target className="w-4 h-4" />;
      case "productivity":
        return <TrendingUp className="w-4 h-4" />;
      case "independent":
        return <UserCheck className="w-4 h-4" />;
      case "reliability":
        return <ShieldCheck className="w-4 h-4" />;
      case "job_ready":
        return <Award className="w-4 h-4" />;
      default:
        return <Milestone className="w-4 h-4" />;
    }
  };

  return (
    <>
      {/* ========================================================= */}
      {/* PURPLE HIDDEN SIDE BAR: DOCKED ON THE RIGHT SIDE           */}
      {/* ========================================================= */}
      {!isDrawerOpen && (
        <div
          id="purple-sidebar-dock"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="fixed right-0 top-[52%] -translate-y-1/2 z-40 select-none transition-all duration-300 ease-out"
        >
          {isTucked ? (
            /* Pre-hidden state: Ultra-tactile purple side bar pull-tab */
            <button
              id="purple-sidebar-pull-tab"
              type="button"
              onClick={() => setIsTucked(false)}
              title={isHindi ? "सफर व AI साथी (खींचें)" : "10-Day Journey & AI Companion (Pull)"}
              aria-label="Pull to open 10-Day Journey & AI Assistant"
              className="group flex flex-col items-center justify-center bg-gradient-to-l from-purple-800 via-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-600 text-white rounded-l-2xl w-6 sm:w-7 h-20 shadow-[-3px_6px_18px_rgba(101,52,199,0.55)] border-y border-l border-purple-300/40 cursor-pointer active:scale-95 transition-all hover:w-8 hover:shadow-[-4px_8px_24px_rgba(101,52,199,0.65)] py-2 gap-1.5"
            >
              <ChevronLeft className="w-4 h-4 text-white stroke-[2.8] animate-pulse group-hover:-translate-x-0.5 transition-transform" />
              <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center">
                <Milestone className="w-3.5 h-3.5 text-purple-100" />
              </div>
            </button>
          ) : (
            /* Pulled-Out state: Dual Journey & AI Companion pill docked on the right */
            <div className="flex items-center gap-1 animate-in slide-in-from-right duration-250 bg-white/95 backdrop-blur-md p-1 rounded-l-3xl shadow-[0_12px_36px_rgba(40,15,80,0.22)] border-y border-l border-purple-200 ring-1 ring-black/5">
              {/* Journey Quick Access Target */}
              <button
                id="sidebar-journey-pill-btn"
                type="button"
                onClick={() => {
                  setActiveTab("journey");
                  setIsDrawerOpen(true);
                }}
                title={isHindi ? "10-दिन का सफर देखें" : "Open 10-Day Journey"}
                className="group flex items-center gap-2 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white rounded-2xl py-2 px-3 cursor-pointer active:scale-95 transition-all shadow-md shadow-purple-600/20"
              >
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Milestone className="w-4 h-4 text-white" />
                </div>
                <div className="text-left leading-tight">
                  <span className="text-[10px] font-bold text-purple-200 uppercase tracking-wider block">
                    Day {currentDay}/10
                  </span>
                  <span className="text-xs font-black tracking-tight whitespace-nowrap">
                    {isHindi ? "10-दिन सफर" : "Journey"}
                  </span>
                </div>
              </button>

              {/* AI Chat Quick Access Target */}
              <button
                id="sidebar-chat-pill-btn"
                type="button"
                onClick={() => {
                  setActiveTab("chat");
                  setIsDrawerOpen(true);
                }}
                title={isHindi ? "AI साथी से पूछें" : "Ask AI Companion"}
                className="group flex items-center gap-2 bg-slate-50 hover:bg-purple-50 text-slate-800 hover:text-purple-900 border border-slate-200/80 rounded-2xl py-2 px-2.5 cursor-pointer active:scale-95 transition-all"
              >
                {/* Robot Avatar */}
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 100 100" className="w-6 h-6" aria-hidden="true">
                    <rect x="18" y="18" width="64" height="54" rx="27" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2.5" />
                    <rect x="11" y="38" width="8" height="14" rx="4" fill="#3B82F6" />
                    <rect x="81" y="38" width="8" height="14" rx="4" fill="#3B82F6" />
                    <rect x="25" y="30" width="50" height="28" rx="14" fill="#1E3A8A" />
                    <path d="M37 42 Q42 37 47 42" stroke="#38BDF8" strokeWidth="4" strokeLinecap="round" fill="none" />
                    <path d="M53 42 Q58 37 63 42" stroke="#38BDF8" strokeWidth="4" strokeLinecap="round" fill="none" />
                    <path d="M32 74 C32 74 38 88 50 88 C62 88 68 74 68 74 Z" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="2" />
                  </svg>
                </div>
                <div className="text-left leading-tight pr-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-black text-purple-700 whitespace-nowrap">
                      {isHindi ? "AI साथी" : "Ask AI"}
                    </span>
                    <Sparkles className="w-3 h-3 text-amber-500" />
                  </div>
                </div>
              </button>

              {/* Tuck back chevron button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsTucked(true);
                }}
                title={isHindi ? "छुपाएं (Tuck in)" : "Hide (Tuck in)"}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* PURPLE SIDEBAR DRAWER OVERLAY                              */}
      {/* ========================================================= */}
      {isDrawerOpen && (
        <div
          id="purple-sidebar-overlay"
          className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => {
            setIsDrawerOpen(false);
            setIsTucked(true);
          }}
        >
          <div
            id="purple-sidebar-drawer-panel"
            className="w-full max-w-sm sm:max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-250 select-none overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 1. Purple Drawer Header */}
            <div className="p-4 bg-gradient-to-r from-violet-850 via-purple-800 to-indigo-900 text-white flex items-center justify-between shadow-md shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
                  {activeTab === "journey" ? (
                    <Milestone className="w-6 h-6 text-purple-200" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white p-0.5 flex items-center justify-center">
                      <svg viewBox="0 0 100 100" className="w-6 h-6" aria-hidden="true">
                        <rect x="18" y="18" width="64" height="54" rx="27" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2.5" />
                        <rect x="11" y="38" width="8" height="14" rx="4" fill="#3B82F6" />
                        <rect x="81" y="38" width="8" height="14" rx="4" fill="#3B82F6" />
                        <rect x="25" y="30" width="50" height="28" rx="14" fill="#1E3A8A" />
                        <path d="M37 42 Q42 37 47 42" stroke="#38BDF8" strokeWidth="4" strokeLinecap="round" fill="none" />
                        <path d="M53 42 Q58 37 63 42" stroke="#38BDF8" strokeWidth="4" strokeLinecap="round" fill="none" />
                      </svg>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-black text-base text-white tracking-tight flex items-center gap-2">
                    <span>
                      {activeTab === "journey"
                        ? isHindi
                          ? "10-दिन का कौशल सफर"
                          : "10-Day Skill Journey"
                        : isHindi
                        ? "फ्लोर AI साथी"
                        : "Floor AI Assistant"}
                    </span>
                    <span className="text-[10px] font-extrabold bg-emerald-400 text-slate-950 px-2 py-0.5 rounded-full">
                      {activeTab === "journey" ? `DAY ${currentDay}` : "LIVE"}
                    </span>
                  </h3>
                  <p className="text-xs text-purple-200 font-medium">
                    {activeTab === "journey"
                      ? isHindi
                        ? "स्वतंत्र पिकर बनने की चरणबद्ध यात्रा"
                        : "Stage-by-stage solo handover roadmap"
                      : isHindi
                      ? "स्टोर से संबंधित कोई भी सवाल पूछें"
                      : "24/7 Floor guidance & aisle troubleshooting"}
                  </p>
                </div>
              </div>

              {/* Close Drawer Button */}
              <button
                type="button"
                onClick={() => {
                  setIsDrawerOpen(false);
                  setIsTucked(true);
                }}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 2. Top Switcher Segmented Control */}
            <div className="bg-purple-900/90 p-2 border-b border-purple-700/50 shrink-0">
              <div className="grid grid-cols-2 gap-1.5 bg-black/25 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveTab("journey")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    activeTab === "journey"
                      ? "bg-white text-purple-950 shadow-md scale-[1.02]"
                      : "text-purple-200 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Milestone className="w-4 h-4" />
                  <span>{isHindi ? "10-दिन सफर" : "10-Day Journey"}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === "journey" ? "bg-purple-100 text-purple-800" : "bg-white/15 text-white"
                  }`}>
                    6 Stages
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("chat")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    activeTab === "chat"
                      ? "bg-white text-purple-950 shadow-md scale-[1.02]"
                      : "text-purple-200 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>{isHindi ? "AI साथी (Chat)" : "AI Assistant"}</span>
                </button>
              </div>
            </div>

            {/* ========================================================= */}
            {/* TAB CONTENT: 10-DAY JOURNEY                               */}
            {/* ========================================================= */}
            {activeTab === "journey" && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {/* Journey Readiness Banner */}
                <div className="bg-gradient-to-br from-violet-700 via-purple-700 to-indigo-800 rounded-3xl p-4 text-white shadow-md relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-200">
                        {isHindi ? "तत्परता स्कोर" : "Job Readiness"}
                      </span>
                      <h4 className="text-xl font-black text-white mt-0.5 flex items-center gap-2">
                        <span>{readinessScore}%</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-400/25 text-emerald-200 border border-emerald-400/40">
                          {isHindi ? "प्रगति पर" : "On Track"}
                        </span>
                      </h4>
                      <p className="text-xs text-purple-100 mt-1">
                        {isHindi
                          ? `स्टेज ${currentStageIndex + 1}/6: ${currentStage?.titleHi || "कौशल प्रगति"}`
                          : `Stage ${currentStageIndex + 1}/6: ${currentStage?.titleEn || "Skill Progression"}`}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handlePlayJourneyAudio}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer shadow-sm ${
                        isPlayingAudio
                          ? "bg-rose-500 border-rose-400 text-white animate-pulse"
                          : "bg-white/15 hover:bg-white/25 border-white/20 text-white active:scale-95"
                      }`}
                      title="Listen to journey briefing"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Visual 6-Step Indicator */}
                  <div className="mt-3 pt-3 border-t border-white/15">
                    <div className="flex items-center justify-between gap-1">
                      {stages.map((st, idx) => {
                        const isDone = st.status === "completed";
                        const isCurrent = st.status === "current";
                        return (
                          <div
                            key={st.id}
                            className={`flex-1 h-2 rounded-full transition-all ${
                              isDone
                                ? "bg-emerald-400"
                                : isCurrent
                                ? "bg-white ring-2 ring-purple-300"
                                : "bg-white/20"
                            }`}
                            title={`Stage ${idx + 1}`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-[10px] text-purple-200 font-semibold mt-1.5">
                      <span>Day 0 (Induction)</span>
                      <span className="font-bold text-white">Day {currentDay}</span>
                      <span>Day 10 (Handover)</span>
                    </div>
                  </div>
                </div>

                {/* 6 Stages Timeline List */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <h5 className="text-xs font-black uppercase tracking-wider text-slate-500">
                      {isHindi ? "6 मुख्य चरण (Roadmap)" : "6 Canonical Stages"}
                    </h5>
                    <span className="text-[11px] font-bold text-purple-700">
                      {isHindi ? "टैप करके विवरण देखें" : "Tap for details"}
                    </span>
                  </div>

                  {stages.map((stage, idx) => {
                    const isDone = stage.status === "completed";
                    const isCurrent = stage.status === "current";
                    const isExpanded = expandedStageId === stage.id;

                    return (
                      <div
                        key={stage.id}
                        onClick={() => setExpandedStageId(isExpanded ? null : stage.id)}
                        className={`rounded-2xl border p-3.5 transition-all cursor-pointer ${
                          isCurrent
                            ? "bg-white border-purple-300 shadow-md ring-1 ring-purple-400/30"
                            : isDone
                            ? "bg-emerald-50/70 border-emerald-200 hover:bg-emerald-50"
                            : "bg-white border-slate-200 hover:bg-slate-50 opacity-80"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                isDone
                                  ? "bg-emerald-600 text-white"
                                  : isCurrent
                                  ? "bg-purple-600 text-white shadow-sm"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {isDone ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                getStageIcon(stage.key)
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                  Stage {stage.stageNumber}
                                </span>
                                {isCurrent && (
                                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-800">
                                    CURRENT
                                  </span>
                                )}
                              </div>
                              <h6 className="text-xs font-black text-slate-900 leading-tight">
                                {isHindi ? stage.titleHi : stage.titleEn}
                              </h6>
                            </div>
                          </div>

                          <ChevronDown
                            className={`w-4 h-4 text-slate-400 transition-transform ${
                              isExpanded ? "rotate-180 text-purple-600" : ""
                            }`}
                          />
                        </div>

                        {/* Expandable Details */}
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-slate-100 text-xs space-y-2 animate-in fade-in">
                            <div className="bg-purple-50/70 rounded-xl p-2.5 border border-purple-100 text-purple-950 space-y-1">
                              <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 block">
                                {isHindi ? "मुख्य लक्ष्य (Milestone):" : "Target Milestone:"}
                              </span>
                              <p className="font-semibold text-xs leading-relaxed">
                                {isHindi ? stage.milestoneHi : stage.milestoneEn}
                              </p>
                            </div>

                            <p className="text-slate-600 leading-relaxed text-[11px]">
                              {isHindi ? stage.shortDescHi : stage.shortDescEn}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Day-by-Day Milestone Targets */}
                <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs space-y-2.5">
                  <h5 className="text-xs font-black text-slate-900 flex items-center justify-between">
                    <span>{isHindi ? "10-दिवसीय माइलस्टोन लक्ष्य" : "10-Day Milestone Milestones"}</span>
                    <Award className="w-4 h-4 text-amber-500" />
                  </h5>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-800 font-black text-[10px] shrink-0">
                        Day 1-3
                      </span>
                      <div>
                        <strong className="text-slate-900 block font-bold text-xs">
                          {isHindi ? "सुरक्षा व मूल स्कैनर चालन" : "Safe & Steady Picker"}
                        </strong>
                        <span className="text-slate-500 text-[11px]">
                          {isHindi ? "सुरक्षा गियर, स्कैनर पेयरिंग, आइसल 1-4" : "PPE, scanner pairing, Aisles 1-4"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-800 font-black text-[10px] shrink-0">
                        Day 4-6
                      </span>
                      <div>
                        <strong className="text-slate-900 block font-bold text-xs">
                          {isHindi ? "सटीकता व गति (50 पिक/घंटा)" : "Core Consistency & Speed"}
                        </strong>
                        <span className="text-slate-500 text-[11px]">
                          {isHindi ? "नाजुक सामान, संतुलित टोट, 50 पिक/घंटा" : "Fragile handling, tote balance, 50 picks/hr"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-800 font-black text-[10px] shrink-0">
                        Day 7-10
                      </span>
                      <div>
                        <strong className="text-slate-900 block font-bold text-xs">
                          {isHindi ? "कोल्ड रूम व स्वतंत्र प्रमाणन" : "Solo Handover & Certification"}
                        </strong>
                        <span className="text-slate-500 text-[11px]">
                          {isHindi ? "कोल्ड चेन, बिना सहायता पूर्ण शिफ्ट, प्रमाणन" : "Cold chain, zero supervisor handholding"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fullscreen Journey Button */}
                {onOpenFullScreenJourney && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDrawerOpen(false);
                        setIsTucked(true);
                        onOpenFullScreenJourney();
                      }}
                      className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-98"
                    >
                      <span>{isHindi ? "पूर्ण 10-दिन सफर दृश्य खोलें" : "Open Fullscreen Journey View"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB CONTENT: AI ASSISTANT CHAT                            */}
            {/* ========================================================= */}
            {activeTab === "chat" && (
              <>
                {/* In-Person Buddy Alert Banner */}
                <div className="bg-purple-50 border-b border-purple-100 px-4 py-2 flex items-center justify-between text-xs shrink-0">
                  <div className="flex items-center gap-1.5 text-purple-900 font-semibold truncate">
                    <UserCheck className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                    <span className="truncate">
                      {isHindi
                        ? `साथी ${buddyFirstName} फ्लोर पर तैनात हैं`
                        : `Floor Buddy ${buddyFirstName} is nearby`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAlertFloorBuddy}
                    disabled={buddyAlerted}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all shrink-0 cursor-pointer ${
                      buddyAlerted
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-purple-600 hover:bg-purple-700 text-white shadow-2xs active:scale-95"
                    }`}
                  >
                    {buddyAlerted
                      ? isHindi
                        ? "बुलाया गया ✓"
                        : "Alerted ✓"
                      : isHindi
                      ? "फ्लोर पर बुलाएं"
                      : "Call to Aisle"}
                  </button>
                </div>

                {/* Conversation Messages Container */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/70">
                  {messages.map((msg) => {
                    const isBot = msg.sender === "bot";
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isBot ? "items-start" : "items-end"} space-y-1`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl p-3 text-xs sm:text-sm leading-relaxed shadow-2xs ${
                            isBot
                              ? "bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs"
                              : "bg-gradient-to-r from-violet-600 to-purple-700 text-white rounded-tr-xs"
                          }`}
                        >
                          <p>{msg.text}</p>
                        </div>

                        <div className="flex items-center gap-2 px-1 text-[10px] text-slate-400">
                          <span>{msg.timestamp}</span>
                          {isBot && (
                            <button
                              type="button"
                              onClick={() => speakMessage(msg.text, isHindi)}
                              className="hover:text-purple-600 transition-colors flex items-center gap-0.5 cursor-pointer"
                              title="Listen to answer"
                            >
                              <Volume2 className="w-3 h-3" />
                              <span>{isHindi ? "सुनें" : "Play"}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {isThinking && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 rounded-2xl p-3 max-w-[70%] shadow-2xs animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-purple-600 animate-bounce" />
                      <span className="w-2 h-2 rounded-full bg-purple-600 animate-bounce delay-100" />
                      <span className="w-2 h-2 rounded-full bg-purple-600 animate-bounce delay-200" />
                      <span>{isHindi ? "सोच रहा हूँ..." : "Checking store guide..."}</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Question Chips */}
                <div className="p-2.5 bg-white border-t border-slate-100 shrink-0">
                  <p className="text-[11px] font-bold text-slate-500 px-1 mb-1.5 flex items-center justify-between">
                    <span>{isHindi ? "आम सवाल (टैप करें):" : "Quick Questions (Tap to ask):"}</span>
                  </p>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {quickQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(q)}
                        disabled={isThinking}
                        className="text-[11px] font-semibold text-slate-700 hover:text-purple-700 bg-slate-100 hover:bg-purple-50 border border-slate-200/80 px-2.5 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer shrink-0 active:scale-95"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input Bar: Voice + Text */}
                <div className="p-3 bg-white border-t border-slate-200 shrink-0">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex items-center gap-2"
                  >
                    {/* Voice Input Button */}
                    <button
                      type="button"
                      onClick={handleVoiceInput}
                      disabled={isThinking}
                      className={`p-2.5 rounded-xl transition-all cursor-pointer shrink-0 shadow-xs ${
                        isListening
                          ? "bg-rose-600 text-white animate-pulse"
                          : "bg-violet-100 text-violet-700 hover:bg-violet-200"
                      }`}
                      title={isHindi ? "बोलकर पूछें" : "Tap to speak"}
                    >
                      {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>

                    {/* Text Field */}
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={
                        isListening
                          ? isHindi
                            ? "सुन रहा हूँ... बोलिए"
                            : "Listening... speak now"
                          : isHindi
                          ? "कोई भी सवाल लिखें..."
                          : "Ask me anything..."
                      }
                      disabled={isThinking || isListening}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
                    />

                    {/* Send Button */}
                    <button
                      type="submit"
                      disabled={isThinking || !inputText.trim()}
                      className="p-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 text-white disabled:opacity-40 shadow-xs hover:opacity-95 transition-all cursor-pointer shrink-0 active:scale-95"
                      title="Send"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
