import React, { useState, useEffect } from "react";
import { Header, ActiveTab } from "./components/Header";
import { NewHireView } from "./components/NewHireView";
import { ManagerView } from "./components/ManagerView";
import { OrganizationView } from "./components/OrganizationView";
import { OnboardingView } from "./components/OnboardingView";
import { LoopInspectorModal } from "./components/LoopInspectorModal";
import { TelemetryDialModal } from "./components/TelemetryDialModal";
import { GoogleFormFeedModal } from "./components/GoogleFormFeedModal";
import { ClientDemoModal } from "./components/ClientDemoModal";
import { ChatBotPullout } from "./components/ChatBotPullout";
import { SplashScreen } from "./components/SplashScreen";
import { LearnerSection } from "./components/FloatingGlassMenu";
import { initialCohort, initialOrgSummary } from "./data/seedData";
import {
  NewHire,
  DailySignal,
  ManagerSignal,
  WorkSignal,
  ActionOutcome,
  DayRecord,
} from "./types";
import { executeCoordinationLoop, askCompanion } from "./services/intelligence";
import {
  GoogleFormFeedPayload,
  adaptGoogleFormFeedRow,
} from "./services/googleFormFeedAdapter";

const STORAGE_KEY_HIRES = "checkin_checkout_cohort_v2";
const STORAGE_KEY_DAY = "checkin_checkout_day_v2";
const STORAGE_KEY_ACTIVE_HIRE = "checkin_checkout_active_hire_v2";

export default function App() {
  const [newHires, setNewHires] = useState<NewHire[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HIRES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Could not load saved state from localStorage:", e);
    }
    return initialCohort;
  });

  const [currentDay, setCurrentDay] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DAY);
      if (saved) {
        const parsed = Number(saved);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 14) {
          return parsed;
        }
      }
    } catch (e) {}
    return 3; // Starts at Day 3 where the MVP scenario pivots
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>("new_hire");
  const [activeHireId, setActiveHireId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_HIRE);
      if (saved) return saved;
    } catch (e) {}
    return "nh-rahul-01";
  });

  const [orgSummary, setOrgSummary] = useState(initialOrgSummary);
  const [isLoopModalOpen, setIsLoopModalOpen] = useState<boolean>(false);
  const [isTelemetryModalOpen, setIsTelemetryModalOpen] = useState<boolean>(false);
  const [isFeedModalOpen, setIsFeedModalOpen] = useState<boolean>(false);
  const [isClientDemoModalOpen, setIsClientDemoModalOpen] = useState<boolean>(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [isFramed, setIsFramed] = useState<boolean>(true);
  const [isHindi, setIsHindi] = useState<boolean>(false);
  const [learnerSection, setLearnerSection] = useState<LearnerSection>("home");
  // Splash Screen and Onboarding disabled by default so the home screen loads immediately matching user request
  const [showSplash, setShowSplash] = useState<boolean>(false);
  const [isOnboarding, setIsOnboarding] = useState<boolean>(false);

  // Clean up any legacy persisted onboarding state so onboarding always comes by default
  useEffect(() => {
    try {
      localStorage.removeItem("checkin_checkout_onboarding_state");
    } catch (e) {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HIRES, JSON.stringify(newHires));
    } catch (e) {
      console.warn("Failed to persist cohort state:", e);
    }
  }, [newHires]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DAY, String(currentDay));
    } catch (e) {}
  }, [currentDay]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_HIRE, activeHireId);
    } catch (e) {}
  }, [activeHireId]);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.hasApiKey) {
          setHasApiKey(true);
        }
      })
      .catch((err) => {
        console.warn("Could not check health endpoint:", err);
      });
  }, []);

  const activeHire = newHires.find((h) => h.id === activeHireId) || newHires[0];

  // Helper to update a hire's day record and recalculate coordination pattern through single execution authority
  const updateHireAndRecalculate = (
    hireId: string,
    dayNum: number,
    updater: (currentRecord: DayRecord, hire: NewHire) => Partial<DayRecord>
  ) => {
    setNewHires((prevHires) =>
      prevHires.map((hire) => {
        if (hire.id !== hireId) return hire;

        // Find or create record for dayNum
        const existingRecordIndex = hire.daysHistory.findIndex((d) => d.dayNumber === dayNum);
        const existingRecord: DayRecord =
          existingRecordIndex >= 0
            ? hire.daysHistory[existingRecordIndex]
            : {
                dayNumber: dayNum,
                date: `Day ${dayNum}`,
                workSignal: {
                  dayNumber: dayNum,
                  targetPickRate: 50,
                  actualPickRate: 35,
                  accuracyRate: 98,
                  ordersCompleted: 44,
                  targetOrders: 65,
                },
                statusAtEnd: hire.status,
                statusReason: hire.statusReason,
              };

        const partialUpdate = updater(existingRecord, hire);
        const mergedRecord: DayRecord = {
          ...existingRecord,
          ...partialUpdate,
        };

        const previousRecord = hire.daysHistory.find((d) => d.dayNumber === dayNum - 1);

        // AUTHORITATIVE SINGLE LOOP EXECUTION: Observe -> Understand -> Connect -> Act -> Check
        const execution = executeCoordinationLoop({
          hire,
          dayNumber: dayNum,
          dailySignal: mergedRecord.dailySignal,
          managerSignal: mergedRecord.managerSignal,
          workSignal: mergedRecord.workSignal,
          actionOutcome: mergedRecord.actionOutcome,
          previousRecord,
          existingAction: mergedRecord.recommendedAction,
        });

        mergedRecord.identifiedPattern = execution.pattern;
        mergedRecord.recommendedAction = execution.action;
        mergedRecord.statusAtEnd = execution.updatedStatus;
        mergedRecord.statusReason = execution.statusReason;

        // Update daysHistory array
        const newHistory = [...hire.daysHistory];
        if (existingRecordIndex >= 0) {
          newHistory[existingRecordIndex] = mergedRecord;
        } else {
          newHistory.push(mergedRecord);
        }

        // Return updated hire with real authoritative state
        return {
          ...hire,
          currentDay: Math.max(hire.currentDay, dayNum),
          status: mergedRecord.statusAtEnd,
          statusReason: mergedRecord.statusReason,
          recommendedActionSnippet: mergedRecord.recommendedAction?.title,
          currentCapabilityId: execution.currentCapabilityId,
          overallReadinessScore: execution.overallReadinessScore,
          capabilities: execution.updatedCapabilities,
          day10Evaluation: execution.day10Evaluation,
          daysHistory: newHistory,
        };
      })
    );
  };

  // 1. Daily Signal submitted by Frontline New Hire
  const handleDailySignalSubmitted = (signal: DailySignal) => {
    updateHireAndRecalculate(activeHire.id, currentDay, () => ({
      dailySignal: signal,
    }));
  };

  // 2. Manager Fast 5-sec signal submitted
  const handleManagerSignalSubmitted = (hireId: string, signal: ManagerSignal) => {
    updateHireAndRecalculate(hireId, currentDay, () => ({
      managerSignal: signal,
    }));
  };

  // 3. Work Signal manual or automated update
  const handleWorkSignalUpdated = (hireId: string, workSignal: WorkSignal) => {
    updateHireAndRecalculate(hireId, currentDay, () => ({
      workSignal,
    }));
  };

  // 4. Action Outcome recorded (Closing the loop)
  const handleActionOutcomeRecorded = (hireId: string, outcome: ActionOutcome) => {
    updateHireAndRecalculate(hireId, currentDay, (currentRecord) => {
      const updatedAction = currentRecord.recommendedAction
        ? { ...currentRecord.recommendedAction, status: "completed" as const }
        : undefined;

      const updatedWorkSignal: WorkSignal = {
        ...currentRecord.workSignal,
        actualPickRate: outcome.subsequentPickRate || 48,
        accuracyRate: outcome.subsequentAccuracy || 99,
      };

      return {
        actionOutcome: outcome,
        recommendedAction: updatedAction,
        workSignal: updatedWorkSignal,
      };
    });
  };

  // 5. Client Demo Work-Signal Feed Ingested (Google Form / Sheet adapter)
  const handleGoogleFormFeedIngested = (payload: GoogleFormFeedPayload) => {
    const knownHires = newHires.map((h) => ({ id: h.id, name: h.name }));
    const result = adaptGoogleFormFeedRow(payload, knownHires);

    if (result.modulesCompleted !== undefined) {
      setNewHires((prev) =>
        prev.map((h) =>
          h.id === result.newHireId
            ? { ...h, modulesCompleted: result.modulesCompleted }
            : h
        )
      );
    }

    // Switch view to the target hire & day
    setActiveHireId(result.newHireId);
    setCurrentDay(result.dayNumber);

    // Pass signals through authoritative updateHireAndRecalculate pipeline
    updateHireAndRecalculate(result.newHireId, result.dayNumber, () => {
      const partial: Partial<DayRecord> = {
        workSignal: result.workSignal,
        dailySignal: result.dailySignal,
        managerSignal: result.managerSignal,
      };
      if (result.actionOutcome) {
        partial.actionOutcome = result.actionOutcome;
      }
      return partial;
    });
  };

  // Select day in scenario
  const handleSelectDay = (day: number) => {
    setCurrentDay(day);
  };

  // Reset demo to initial state
  const handleResetDemo = () => {
    try {
      localStorage.removeItem(STORAGE_KEY_HIRES);
      localStorage.removeItem(STORAGE_KEY_DAY);
      localStorage.removeItem(STORAGE_KEY_ACTIVE_HIRE);
      localStorage.removeItem("checkin_checkout_onboarding_state");
    } catch (e) {}
    setNewHires(initialCohort);
    setCurrentDay(3);
    setActiveHireId("nh-rahul-01");
    setIsOnboarding(true);
    setLearnerSection("home");
  };

  const handleUpdateHire = (updatedHire: NewHire) => {
    setNewHires((prev) => prev.map((h) => (h.id === updatedHire.id ? updatedHire : h)));
  };

  const handleAskHelp = async (question: string) => {
    return askCompanion(question, currentDay);
  };

  const doingWellCount = newHires.filter((h) => h.status === "Doing well").length;
  const needsAttentionCount = newHires.filter((h) => h.status === "Needs attention").length;
  const atRiskCount = newHires.filter((h) => h.status === "At risk").length;

  return (
    <div
      className={`min-h-screen bg-[#0e1014] text-white flex flex-col font-sans antialiased transition-colors duration-300 ${
        isFramed ? "md:py-6 md:px-4" : ""
      }`}
    >
      {/* Brand Splash Screen Animation (CHECKIN dissolves -> CHECKOUT stays 4-5s) */}
      {showSplash && (
        <SplashScreen
          onFinish={() => setShowSplash(false)}
          stayDurationSeconds={4.5}
        />
      )}

      {/* Mobile Device Chassis Shell */}
      <div
        className={`w-full mx-auto flex flex-col transition-all duration-300 ${
          isOnboarding
            ? isFramed
              ? "max-w-[390px] md:rounded-[44px] md:shadow-[0_24px_60px_rgba(0,0,0,0.6)] md:overflow-hidden min-h-screen md:min-h-[844px] bg-[#14161d]"
              : "max-w-md min-h-screen bg-[#14161d]"
            : isFramed
            ? `max-w-md md:rounded-[36px] md:shadow-2xl md:border md:border-white/10 md:overflow-hidden md:ring-8 md:ring-slate-950 min-h-screen md:min-h-[850px] ${
                activeTab === "new_hire" && learnerSection === "journey"
                  ? "bg-[#eaedf2]"
                  : activeTab === "new_hire" && learnerSection === "modules"
                  ? "bg-[#0a0b0e]"
                  : "bg-[#14161d]"
              }`
            : `max-w-lg min-h-screen shadow-2xl ${
                activeTab === "new_hire" && learnerSection === "journey"
                  ? "bg-[#eaedf2]"
                  : activeTab === "new_hire" && learnerSection === "modules"
                  ? "bg-[#0a0b0e]"
                  : "bg-[#14161d]"
              }`
        }`}
      >
        {/* Subtle phone speaker notch for framed mobile experience on desktop (only during active shift views) */}
        {isFramed && !isOnboarding && (
          <div className={`hidden md:flex items-center justify-center pt-2 pb-1 border-b ${
            activeTab === "new_hire" && learnerSection === "journey"
              ? "bg-[#eaedf2] border-slate-300"
              : activeTab === "new_hire" && learnerSection === "modules"
              ? "bg-[#0a0b0e] border-white/5"
              : activeTab === "new_hire" && learnerSection === "dashboard"
              ? "bg-[#081b4e] border-transparent"
              : "bg-slate-950 border-white/5"
          }`}>
            <div className={`w-16 h-1 rounded-full ${
              activeTab === "new_hire" && learnerSection === "journey"
                ? "bg-slate-400"
                : "bg-white/20"
            }`}></div>
          </div>
        )}

        {/* 1. ONBOARDING FIRST PAGE (MOBILE UI FIRST PAGE) */}
        {isOnboarding ? (
          <OnboardingView
            onStartDay={() => setIsOnboarding(false)}
            learnerName={activeHire.name}
            isHindi={isHindi}
            onToggleLanguage={() => setIsHindi((prev) => !prev)}
          />
        ) : (
          <>
            {/* Global Mobile Header (Only during active shift views) */}
            {!(activeTab === "new_hire" && (learnerSection === "modules" || learnerSection === "home" || learnerSection === "journey" || learnerSection === "dashboard" || learnerSection === "dial")) && (
              <Header
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                currentDay={currentDay}
                onSelectDay={handleSelectDay}
                onResetDemo={handleResetDemo}
                onOpenLoopModal={() => setIsLoopModalOpen(true)}
                onOpenTelemetryDial={() => {
                  setActiveTab("new_hire");
                  setLearnerSection("dial");
                }}
                onOpenBuddy={() => {
                  setActiveTab("new_hire");
                  setLearnerSection("buddy");
                }}
                onOpenOnboarding={() => setIsOnboarding(true)}
                onOpenFeedModal={() => setIsFeedModalOpen(true)}
                onOpenClientDemo={() => setIsClientDemoModalOpen(true)}
                hasApiKey={hasApiKey}
                doingWellCount={doingWellCount}
                needsAttentionCount={needsAttentionCount}
                atRiskCount={atRiskCount}
                isFramed={isFramed}
                isHindi={isHindi}
                onToggleLanguage={() => setIsHindi((prev) => !prev)}
                isHomeScreen={activeTab === "new_hire" && learnerSection === "home"}
                learnerName={activeHire.name}
                buddyName={activeHire.buddy}
                onOpenSplash={() => setShowSplash(true)}
              />
            )}

            {/* Purple Hidden Side Bar: 10-Day Journey & AI Floor Companion */}
            <ChatBotPullout
              currentDay={currentDay}
              learnerName={activeHire.name}
              buddyName={activeHire.buddy}
              newHire={activeHire}
              isHindi={isHindi}
              onAlertBuddy={() => {
                setActiveTab("new_hire");
                setLearnerSection("buddy");
              }}
              onOpenFullScreenJourney={() => {
                setActiveTab("new_hire");
                setLearnerSection("journey");
              }}
            />

            {/* Main Experience View */}
            <main className="flex-1 overflow-y-auto">
              {activeTab === "new_hire" && (
                <NewHireView
                  newHire={activeHire}
                  currentDay={currentDay}
                  onDailySignalSubmitted={handleDailySignalSubmitted}
                  onAskHelp={handleAskHelp}
                  onSelectDay={handleSelectDay}
                  onUpdateHire={handleUpdateHire}
                  isHindi={isHindi}
                  onToggleLanguage={() => setIsHindi((prev) => !prev)}
                  setIsHindi={setIsHindi}
                  activeSection={learnerSection}
                  onSelectSection={setLearnerSection}
                  onOpenOnboarding={() => setIsOnboarding(true)}
                  onOpenManagerConsole={() => setActiveTab("manager")}
                  newHires={newHires}
                  onSelectHire={setActiveHireId}
                />
              )}

              {activeTab === "manager" && (
                <ManagerView
                  newHires={newHires}
                  activeHireId={activeHireId}
                  onSelectHire={(id) => setActiveHireId(id)}
                  currentDay={currentDay}
                  onManagerSignalSubmitted={handleManagerSignalSubmitted}
                  onWorkSignalUpdated={handleWorkSignalUpdated}
                  onActionOutcomeRecorded={handleActionOutcomeRecorded}
                />
              )}

              {activeTab === "organization" && (
                <OrganizationView
                  summary={orgSummary}
                  newHires={newHires}
                  onSelectHireForManager={(hireId) => {
                    setActiveHireId(hireId);
                    setActiveTab("manager");
                  }}
                  onOpenLoopModal={() => setIsLoopModalOpen(true)}
                />
              )}
            </main>
          </>
        )}
      </div>

      {/* Core Loop Inspector Modal */}
      <LoopInspectorModal
        isOpen={isLoopModalOpen}
        onClose={() => setIsLoopModalOpen(false)}
        newHire={activeHire}
        currentDay={currentDay}
      />

      {/* Direct Floor Telemetry / Temperature Gauge Modal */}
      <TelemetryDialModal
        isOpen={isTelemetryModalOpen}
        onClose={() => setIsTelemetryModalOpen(false)}
        newHire={activeHire}
        currentDay={currentDay}
      />

      {/* Client Demo Work-Signal Feed (Google Form / Sheet Ingestor) Modal */}
      <GoogleFormFeedModal
        isOpen={isFeedModalOpen}
        onClose={() => setIsFeedModalOpen(false)}
        newHires={newHires}
        onIngestFeed={handleGoogleFormFeedIngested}
        isHindi={isHindi}
      />

      {/* Interactive Client Demo Experience Hub */}
      <ClientDemoModal
        isOpen={isClientDemoModalOpen}
        onClose={() => setIsClientDemoModalOpen(false)}
        onRunScenario={handleGoogleFormFeedIngested}
        currentHire={activeHire}
        currentDay={currentDay}
        onOpenLoopInspector={() => setIsLoopModalOpen(true)}
        onSelectTab={setActiveTab}
        onResetDemo={handleResetDemo}
        isHindi={isHindi}
        onOpenSplash={() => setShowSplash(true)}
      />
    </div>
  );
}
