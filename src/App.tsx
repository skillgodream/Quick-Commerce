import React, { useState, useEffect, useRef } from "react";
import { Header, ActiveTab } from "./components/Header";
import { NewHireView } from "./components/NewHireView";
import { ManagerView } from "./components/ManagerView";
import { OrganizationView } from "./components/OrganizationView";
import { LoopInspectorModal } from "./components/LoopInspectorModal";
import { TelemetryDialModal } from "./components/TelemetryDialModal";
import { SyncSimulatorModal } from "./components/SyncSimulatorModal";
import { ChatBotPullout } from "./components/ChatBotPullout";
import { SplashScreen } from "./components/SplashScreen";
import { LearnerSection } from "./types";
import { LearnerSideNav } from "./components/LearnerSideNav";
import { initialCohort, initialOrgSummary } from "./data/seedData";
import {
  NewHire,
  DailySignal,
  ManagerSignal,
  WorkSignal,
  ActionOutcome,
  DayRecord,
  CandidatePattern,
} from "./types";
import { executeCoordinationLoop, executeCoordinationLoopAsync, askCompanion, analyzeOutcomeNotes, analyzeLongitudinalHistory, LoopExecutionInput } from "./services/intelligence";
import {
  fetchSimulatorEvidence,
  adaptSimulatorToLoopInput,
  applyEvidenceToCohort,
} from "./services/simulatorEvidenceService";
import { subscribeToFirestoreEvidence, fetchEvidenceFromFirestore, pushEvidenceToFirestore } from "./services/firestoreSyncService";
import { SimulatorLabView } from "./components/SimulatorLabView";
import { BottomNav } from "./components/BottomNav";

const STORAGE_KEY_HIRES = "checkin_checkout_cohort_v5";
const STORAGE_KEY_DAY = "checkin_checkout_day_v5";
const STORAGE_KEY_ACTIVE_HIRE = "checkin_checkout_active_hire_v5";

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
    return 4; // Default to Day 4 populated active shift
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
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [isSimulatorLabOpen, setIsSimulatorLabOpen] = useState<boolean>(false);
  const [isSyncingCohort, setIsSyncingCohort] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [isFramed, setIsFramed] = useState<boolean>(true);
  const [isHindi, setIsHindi] = useState<boolean>(false);
  const [learnerSection, setLearnerSection] = useState<LearnerSection>("home");
  const [showSplash, setShowSplash] = useState<boolean>(false);

  // Real-time Cloud Firestore continuous listener (sub-second broadcast from Simulator)
  useEffect(() => {
    const unsubscribe = subscribeToFirestoreEvidence((liveEvidence) => {
      if (liveEvidence && liveEvidence.length > 0) {
        setNewHires((prevCohort) => {
          return applyEvidenceToCohort(prevCohort, liveEvidence, undefined);
        });
        setLastSyncedTime(new Date().toLocaleTimeString());
      }
    });
    return () => unsubscribe();
  }, []);

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

  // Automatically connect to live Simulator on startup and ingest all journey evidence
  useEffect(() => {
    handleSyncAllCohort();
  }, []);

  const activeHire = newHires.find((h) => h.id === activeHireId) || newHires[0];
  // The current active hire's day is their own authoritative journey day
  const effectiveDay = activeHire.currentDay || currentDay || 4;


  const updateHireAndRecalculateAsync = async (
    hireId: string,
    dayNum: number,
    updater: (currentRecord: DayRecord, hire: NewHire) => Partial<DayRecord>,
    candidatePattern?: CandidatePattern,
    historyText?: string
  ) => {
    const currentHire = newHires.find(h => h.id === hireId);
    if (!currentHire) return;

    const existingRecordIndex = currentHire.daysHistory.findIndex((d) => d.dayNumber === dayNum);
    const existingRecord: DayRecord =
      existingRecordIndex >= 0
        ? currentHire.daysHistory[existingRecordIndex]
        : {
            dayNumber: dayNum,
            date: `Day ${dayNum}`,
            statusAtEnd: currentHire.status,
            statusReason: currentHire.statusReason,
          };

    const partialUpdate = updater(existingRecord, currentHire);
    const mergedRecord: DayRecord = {
      ...existingRecord,
      ...partialUpdate,
    };

    const previousRecord = currentHire.daysHistory.find((d) => d.dayNumber === dayNum - 1);

    const baseInput: LoopExecutionInput = {
      hire: currentHire,
      dayNumber: dayNum,
      dailySignal: mergedRecord.dailySignal,
      managerSignal: mergedRecord.managerSignal,
      workSignal: mergedRecord.workSignal,
      actionOutcome: mergedRecord.actionOutcome,
      previousRecord,
      existingAction: mergedRecord.recommendedAction,
      candidatePattern,
      canonicalEvidence: mergedRecord.canonicalEvidence,
    };

    let finalLoopInput = baseInput;

    try {
      const simRes = await fetchSimulatorEvidence({
        employeeId: hireId,
        journeyDay: dayNum,
      });
      if (simRes.success && simRes.evidence.length > 0) {
        finalLoopInput = adaptSimulatorToLoopInput(baseInput, simRes.evidence);
        const evFingerprint = JSON.stringify(simRes.evidence.map((ev) => ev.canonicalEvidence || ev));
        const evIds = simRes.evidence.map((ev) => ev.id || ev.evidence_id || ev.evidenceId || "").filter(Boolean).join(",");
        const currentSyncFingerprint = `${hireId}-day${dayNum}-evs:${evIds}:${evFingerprint}`;
        const isUserSubmission = Boolean(partialUpdate.dailySignal || partialUpdate.managerSignal || partialUpdate.actionOutcome);
        if (!isUserSubmission && lastSyncedKeyRef.current === currentSyncFingerprint) {
          return;
        }
        lastSyncedKeyRef.current = currentSyncFingerprint;
      } else {
        // Simulator has NO saved evidence for this employee/day
        finalLoopInput = adaptSimulatorToLoopInput(baseInput, []);
        const currentSyncFingerprint = `${hireId}-day${dayNum}-evs:EMPTY`;
        const isUserSubmission = Boolean(partialUpdate.dailySignal || partialUpdate.managerSignal || partialUpdate.actionOutcome);
        if (!isUserSubmission && lastSyncedKeyRef.current === currentSyncFingerprint) {
          return;
        }
        lastSyncedKeyRef.current = currentSyncFingerprint;
      }
    } catch (err) {
      finalLoopInput = adaptSimulatorToLoopInput(baseInput, []);
    }

    const execution = await executeCoordinationLoopAsync(finalLoopInput, historyText || "");

    setNewHires((prevHires) =>
      prevHires.map((hire) => {
        if (hire.id !== hireId) return hire;

        const updatedMergedRecord = {
          ...mergedRecord,
          workSignal: finalLoopInput.workSignal,
          canonicalEvidence: finalLoopInput.canonicalEvidence,
          actionOutcome: mergedRecord.actionOutcome,
        };
        updatedMergedRecord.identifiedPattern = execution.pattern;
        updatedMergedRecord.recommendedAction = execution.action;
        updatedMergedRecord.statusAtEnd = execution.updatedStatus;
        updatedMergedRecord.statusReason = execution.statusReason;

        // Authoritative Outcome and Floor Check Guard
        if (mergedRecord.managerSignal?.state === "Doing well" || mergedRecord.actionOutcome?.improved === "yes") {
          if (updatedMergedRecord.recommendedAction) {
            updatedMergedRecord.recommendedAction.status = "completed";
          }
          updatedMergedRecord.statusAtEnd = "Doing well";
          updatedMergedRecord.statusReason =
            mergedRecord.actionOutcome?.notes ||
            mergedRecord.managerSignal?.notes ||
            "Intervention completed successfully; pick pace recovered.";

          // Ensure target capability is proficient and on_target in execution.updatedCapabilities
          const targetCapId = updatedMergedRecord.recommendedAction?.targetCapabilityId || execution.currentCapabilityId || 3;
          if (execution.updatedCapabilities[targetCapId]) {
            execution.updatedCapabilities[targetCapId].performance = "on_target";
            execution.updatedCapabilities[targetCapId].evidence = "demonstrated";
            execution.updatedCapabilities[targetCapId].mastery = "proficient";
          }
          if (execution.updatedCapabilities[3]) {
            execution.updatedCapabilities[3].performance = "on_target";
            execution.updatedCapabilities[3].evidence = "demonstrated";
            execution.updatedCapabilities[3].mastery = "proficient";
          }
        } else if (mergedRecord.actionOutcome?.improved === "partial") {
          updatedMergedRecord.statusAtEnd = "Needs attention";
          updatedMergedRecord.statusReason =
            mergedRecord.actionOutcome.notes ||
            "Partial improvement observed; ongoing buddy support.";
        } else if (mergedRecord.actionOutcome?.improved === "no") {
          updatedMergedRecord.statusAtEnd = "At risk";
          updatedMergedRecord.statusReason =
            mergedRecord.actionOutcome.notes ||
            "Intervention stalled; reassessing root cause.";
        }

        const newHistory = [...hire.daysHistory];
        const updatedExistingRecordIndex = hire.daysHistory.findIndex((d) => d.dayNumber === dayNum);
        
        if (updatedExistingRecordIndex >= 0) {
          newHistory[updatedExistingRecordIndex] = updatedMergedRecord;
        } else {
          newHistory.push(updatedMergedRecord);
        }

        return {
          ...hire,
          currentDay: Math.max(hire.currentDay, dayNum),
          status: updatedMergedRecord.statusAtEnd,
          statusReason: updatedMergedRecord.statusReason,
          recommendedActionSnippet: updatedMergedRecord.recommendedAction?.title,
          currentCapabilityId: execution.currentCapabilityId,
          overallReadinessScore: execution.overallReadinessScore,
          capabilities: execution.updatedCapabilities,
          day10Evaluation: execution.day10Evaluation,
          daysHistory: newHistory,
        };
      })
    );
  };

  // Force sync all cohort members from the shared Cloud Database or Simulator API
  const handleSyncAllCohort = async () => {
    setIsSyncingCohort(true);
    lastSyncedKeyRef.current = null;
    try {
      const fsRecords = await fetchEvidenceFromFirestore();
      if (fsRecords && fsRecords.length > 0) {
        setNewHires((prevCohort) => applyEvidenceToCohort(prevCohort, fsRecords, undefined));
        setLastSyncedTime(new Date().toLocaleTimeString());
      } else {
        const simRes = await fetchSimulatorEvidence();
        if (simRes.success && simRes.evidence.length > 0) {
          setNewHires((prevCohort) => applyEvidenceToCohort(prevCohort, simRes.evidence, undefined));
          setLastSyncedTime(new Date().toLocaleTimeString());
        }
      }
    } catch (e) {
      console.warn("Error during cohort simulator sync:", e);
    } finally {
      setIsSyncingCohort(false);
    }
  };

  // Helper to update a hire's day record and recalculate coordination pattern through single execution authority
  const updateHireAndRecalculate = (
    hireId: string,
    dayNum: number,
    updater: (currentRecord: DayRecord, hire: NewHire) => Partial<DayRecord>,
    candidatePattern?: CandidatePattern
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
          candidatePattern,
        });

        mergedRecord.identifiedPattern = execution.pattern;
        mergedRecord.recommendedAction = execution.action;
        mergedRecord.statusAtEnd = execution.updatedStatus;
        mergedRecord.statusReason = execution.statusReason;

        // Authoritative Outcome Preservation Guard
        if (mergedRecord.actionOutcome) {
          if (mergedRecord.recommendedAction) {
            mergedRecord.recommendedAction.status = "completed";
          }
          if (mergedRecord.actionOutcome.improved === "yes") {
            mergedRecord.statusAtEnd = "Doing well";
            mergedRecord.statusReason =
              mergedRecord.actionOutcome.notes ||
              "Intervention completed successfully; pick pace recovered.";
          } else if (mergedRecord.actionOutcome.improved === "partial") {
            mergedRecord.statusAtEnd = "Needs attention";
            mergedRecord.statusReason =
              mergedRecord.actionOutcome.notes ||
              "Partial improvement observed; ongoing buddy support.";
          } else if (mergedRecord.actionOutcome.improved === "no") {
            mergedRecord.statusAtEnd = "At risk";
            mergedRecord.statusReason =
              mergedRecord.actionOutcome.notes ||
              "Intervention stalled; reassessing root cause.";
          }
        }

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

  const lastSyncedKeyRef = useRef<string | null>(null);

  // Automatic startup & active learner/day synchronization with Simulator API
  useEffect(() => {
    if (!activeHireId || !currentDay) return;
    updateHireAndRecalculateAsync(activeHireId, currentDay, () => ({}));
  }, [activeHireId, currentDay]);

  // Helper for longitudinal pattern discovery
const fetchLongitudinalPattern = async (hireId: string, dayNum: number, extraUpdate: any): Promise<{ pattern?: CandidatePattern, historyText: string }> => {
    const hire = newHires.find(h => h.id === hireId);
    if (!hire) return { historyText: "" };
    
    let historyText = "";
    const maxDay = Math.max(hire.daysHistory.length, dayNum);
    for (let i = 1; i <= maxDay; i++) {
       const rec = hire.daysHistory.find(d => d.dayNumber === i) || { dayNumber: i };
       let daily = rec.dailySignal;
       let mgr = rec.managerSignal;
       let wrk = rec.workSignal;
       let out = rec.actionOutcome;
       if (i === dayNum) {
          if (extraUpdate.dailySignal) daily = extraUpdate.dailySignal;
          if (extraUpdate.managerSignal) mgr = extraUpdate.managerSignal;
          if (extraUpdate.workSignal) wrk = extraUpdate.workSignal;
          if (extraUpdate.actionOutcome) out = extraUpdate.actionOutcome;
       }
       
       const lines = [];
       if (daily) lines.push(`- Self-report: ${daily.rawText} (${daily.issue || 'No issue'})`);
       if (mgr) lines.push(`- Manager: ${mgr.state} - ${mgr.notes}`);
       if (wrk) lines.push(`- Perf: Rate ${wrk.actualPickRate}/${wrk.targetPickRate}, Acc ${wrk.accuracyRate}%`);
       if (out) lines.push(`- Outcome: ${out.notes || ''} (Improved: ${out.improved})`);
       
       if (lines.length > 0) {
         historyText += `Day ${i}:` + lines.join("\n") + "\n";
       }
    }
    
    if (historyText.trim().length > 0) {
      const pattern = await analyzeLongitudinalHistory(historyText);
      return { pattern, historyText };
    }
    return { historyText };
  };

  // 1. Daily Signal submitted by Frontline New Hire
  const handleDailySignalSubmitted = async (signal: DailySignal) => {
    const { pattern, historyText } = await fetchLongitudinalPattern(activeHire.id, currentDay, { dailySignal: signal });
    await updateHireAndRecalculateAsync(activeHire.id, currentDay, () => ({
      dailySignal: signal,
    }), pattern, historyText);
  };

  // 2. Manager Fast 5-sec signal submitted
  const handleManagerSignalSubmitted = async (hireId: string, signal: ManagerSignal) => {
    const targetDay = signal.dayNumber || currentDay;
    const { pattern, historyText } = await fetchLongitudinalPattern(hireId, targetDay, { managerSignal: signal });
    await updateHireAndRecalculateAsync(hireId, targetDay, (currentRecord) => {
      if (signal.state === "Doing well") {
        const effectiveTarget = currentRecord.workSignal?.targetPickRate || 50;
        // Parse speed from note if present e.g. "Pick speed up to 46 items/hr"
        const speedMatch = signal.notes?.match(/(\d+)\s*(?:items|picks|uph|\/hr)/i);
        const observedSpeed = speedMatch ? Number(speedMatch[1]) : Math.max(effectiveTarget + 2, (currentRecord.workSignal?.actualPickRate || 0) + 10);
        
        const updatedWorkSignal: WorkSignal = {
          ...currentRecord.workSignal,
          dayNumber: targetDay,
          targetPickRate: effectiveTarget,
          actualPickRate: observedSpeed,
          accuracyRate: currentRecord.workSignal?.accuracyRate || 99,
          hasWorkEvidence: true,
        };

        const updatedAction = currentRecord.recommendedAction
          ? { ...currentRecord.recommendedAction, status: "completed" as const }
          : undefined;

        const autoOutcome: ActionOutcome = {
          id: `out-floor-${Date.now()}`,
          actionId: currentRecord.recommendedAction?.id || "act-default",
          dayNumber: targetDay,
          performedBy: signal.managerName || "Shift Supervisor",
          performedAt: "Floor Check completed",
          improved: "yes",
          notes: signal.notes || "Supervisor confirmed doing well on floor check.",
          subsequentPickRate: observedSpeed,
          subsequentAccuracy: updatedWorkSignal.accuracyRate,
        };

        return {
          managerSignal: signal,
          workSignal: updatedWorkSignal,
          recommendedAction: updatedAction,
          actionOutcome: currentRecord.actionOutcome || autoOutcome,
        };
      }

      return {
        managerSignal: signal,
      };
    }, pattern, historyText);
  };

  // 3. Work Signal manual or automated update
  const handleWorkSignalUpdated = async (hireId: string, workSignal: WorkSignal) => {
    const targetDay = workSignal.dayNumber || currentDay;
    const { pattern, historyText } = await fetchLongitudinalPattern(hireId, targetDay, { workSignal });
    await updateHireAndRecalculateAsync(hireId, targetDay, () => ({
      workSignal,
    }), pattern, historyText);
  };

  // 4. Action Outcome recorded (Closing the loop)
  const handleActionOutcomeRecorded = async (hireId: string, outcome: ActionOutcome) => {
    const targetDay = outcome.dayNumber || currentDay;
    
    // Add AI Outcome Interpretation
    let treatmentContext = undefined;
    if (outcome.notes) {
       // Get the action title if available
       const hire = newHires.find(h => h.id === hireId);
       const currentRecord = hire?.daysHistory.find(d => d.dayNumber === targetDay);
       const actionTitle = currentRecord?.recommendedAction?.title;
       treatmentContext = await analyzeOutcomeNotes(outcome.notes, actionTitle);
    }
    
    const augmentedOutcome = { ...outcome, treatmentContext };

    const { pattern, historyText } = await fetchLongitudinalPattern(hireId, targetDay, { actionOutcome: augmentedOutcome });

    await updateHireAndRecalculateAsync(hireId, targetDay, (currentRecord) => {
      const updatedAction = currentRecord.recommendedAction
        ? { ...currentRecord.recommendedAction, status: "completed" as const }
        : undefined;

      const effectiveTarget = currentRecord.workSignal?.targetPickRate || 50;
      const subsequentRate = outcome.subsequentPickRate || (outcome.improved === "yes" ? Math.max(52, effectiveTarget + 2) : currentRecord.workSignal?.actualPickRate || 40);

      const updatedWorkSignal: WorkSignal = {
        ...currentRecord.workSignal,
        dayNumber: targetDay,
        targetPickRate: effectiveTarget,
        actualPickRate: subsequentRate,
        accuracyRate: outcome.subsequentAccuracy || 99,
        hasWorkEvidence: true,
      };

      return {
        actionOutcome: augmentedOutcome,
        recommendedAction: updatedAction,
        workSignal: updatedWorkSignal,
      };
    }, pattern, historyText);

    // Also persist the outcome into the shared cloud database so all views and the simulator stay aligned
    try {
      pushEvidenceToFirestore([{
        evidence_id: `ev-outcome-${hireId}-d${targetDay}-${Date.now()}`,
        employee_id: hireId,
        journey_day: targetDay,
        evidence_type: "action_outcome",
        evidence_kind: "observed",
        value: augmentedOutcome.improved,
        notes: augmentedOutcome.notes,
        payload: augmentedOutcome,
        canonicalEvidence: {
          outcome: {
            improved: augmentedOutcome.improved,
            notes: augmentedOutcome.notes,
            subsequentPickRate: augmentedOutcome.subsequentPickRate,
            subsequentAccuracy: augmentedOutcome.subsequentAccuracy,
          },
        },
        timestamp: new Date().toISOString(),
      }]).catch((err) => {
        console.warn("Could not push action outcome to Firestore:", err);
      });
    } catch (e) {
      // Non-blocking
    }
  };

  // Select day in scenario
  const handleSelectDay = (day: number) => {
    lastSyncedKeyRef.current = null;
    setCurrentDay(day);
  };

  // Reset demo to initial state
  const handleResetDemo = () => {
    lastSyncedKeyRef.current = null;
    try {
      localStorage.removeItem(STORAGE_KEY_HIRES);
      localStorage.removeItem(STORAGE_KEY_DAY);
      localStorage.removeItem(STORAGE_KEY_ACTIVE_HIRE);
    } catch (e) {}
    setNewHires(initialCohort);
    setCurrentDay(1);
    setActiveHireId("nh-rahul-01");
    setLearnerSection("home");
  };

  const handleUpdateHire = (updatedHire: NewHire) => {
    setNewHires((prev) => prev.map((h) => (h.id === updatedHire.id ? updatedHire : h)));
  };

  // Embedded Simulator Lab Handlers (App-in-App Direct Telemetry)
  const handleApplySimulatorTelemetry = (
    hireId: string,
    dayNum: number,
    telemetry: {
      workSignal: WorkSignal;
      toolStatus?: "Normal" | "Failed";
      toolProblem?: string;
      errorCount?: number;
      errorNotes?: string;
      zone?: string;
      autoNavigate?: boolean;
    }
  ) => {
    setActiveHireId(hireId);
    setCurrentDay(dayNum);

    updateHireAndRecalculate(hireId, dayNum, (existingRecord) => {
      const canonicalEv: any = {
        ...(existingRecord.canonicalEvidence || {}),
        id: `sim-${hireId}-d${dayNum}-${Date.now()}`,
        timestamp: new Date().toISOString(),
        employeeId: hireId,
        journeyDay: dayNum,
        workSignal: telemetry.workSignal,
        floorObservations: {
          ...((existingRecord.canonicalEvidence as any)?.floorObservations || {}),
          errorCount: telemetry.errorCount ?? 0,
          zone: telemetry.zone || "aisle_1_4",
          notes: telemetry.errorNotes || "",
        },
        toolSystem: {
          toolStatus: telemetry.toolStatus || "Normal",
          toolProblem: telemetry.toolProblem,
        },
      };

      return {
        workSignal: telemetry.workSignal,
        canonicalEvidence: canonicalEv,
      };
    });

    if (telemetry.autoNavigate) {
      setActiveTab("new_hire");
      setLearnerSection("home");
    }
  };

  const handlePopulateTenDaysForHire = (hireId: string) => {
    interface BenchmarkPoint {
      day: number;
      pickRate: number;
      targetPickRate: number;
      accuracy: number;
      ordersCompleted: number;
      targetOrders: number;
      errorCount: number;
      notes: string;
      toolStatus?: "Normal" | "Failed";
      toolProblem?: string;
    }

    const BENCHMARKS: Record<string, BenchmarkPoint[]> = {
      "nh-amit-03": [
        { day: 0, pickRate: 58, targetPickRate: 50, accuracy: 96.6, ordersCompleted: 46, targetOrders: 65, errorCount: 2, notes: "Day 0 dark store onboarding scan benchmark" },
        { day: 1, pickRate: 38, targetPickRate: 50, accuracy: 95.0, ordersCompleted: 32, targetOrders: 65, errorCount: 3, notes: "Aisle 1-3 basic orientation" },
        { day: 2, pickRate: 44, targetPickRate: 50, accuracy: 96.2, ordersCompleted: 38, targetOrders: 65, errorCount: 2, notes: "Barcode orientation improving" },
        { day: 3, pickRate: 48, targetPickRate: 50, accuracy: 97.0, ordersCompleted: 42, targetOrders: 65, errorCount: 1, notes: "Consistent scanner grip" },
        { day: 4, pickRate: 52, targetPickRate: 50, accuracy: 97.5, ordersCompleted: 48, targetOrders: 65, errorCount: 1, notes: "On target pick pacing" },
        { day: 5, pickRate: 56, targetPickRate: 50, accuracy: 98.0, ordersCompleted: 52, targetOrders: 65, errorCount: 1, notes: "High accuracy maintained" },
        { day: 6, pickRate: 60, targetPickRate: 50, accuracy: 98.4, ordersCompleted: 56, targetOrders: 65, errorCount: 0, notes: "Batch picking smooth" },
        { day: 7, pickRate: 62, targetPickRate: 50, accuracy: 98.8, ordersCompleted: 59, targetOrders: 65, errorCount: 0, notes: "Cold room handling clear" },
        { day: 8, pickRate: 65, targetPickRate: 50, accuracy: 99.0, ordersCompleted: 62, targetOrders: 65, errorCount: 0, notes: "Autonomous floor flow" },
        { day: 9, pickRate: 68, targetPickRate: 50, accuracy: 99.2, ordersCompleted: 64, targetOrders: 65, errorCount: 0, notes: "Exceptional velocity" },
        { day: 10, pickRate: 70, targetPickRate: 50, accuracy: 99.5, ordersCompleted: 65, targetOrders: 65, errorCount: 0, notes: "Commercial certified ready" },
      ],
      "nh-rahul-01": [
        { day: 0, pickRate: 40, targetPickRate: 50, accuracy: 94.0, ordersCompleted: 30, targetOrders: 65, errorCount: 4, notes: "Day 0 orientation" },
        { day: 1, pickRate: 42, targetPickRate: 50, accuracy: 95.0, ordersCompleted: 34, targetOrders: 65, errorCount: 3, notes: "Aisle 1-4 standard picking" },
        { day: 2, pickRate: 45, targetPickRate: 50, accuracy: 95.5, ordersCompleted: 38, targetOrders: 65, errorCount: 2, notes: "Steady pace" },
        { day: 3, pickRate: 42, targetPickRate: 50, accuracy: 94.8, ordersCompleted: 35, targetOrders: 65, errorCount: 3, notes: "Aisle 4-8 bottleneck detected" },
        { day: 4, pickRate: 40, targetPickRate: 50, accuracy: 94.2, ordersCompleted: 33, targetOrders: 65, errorCount: 4, notes: "Bottleneck in deep aisles 4-8" },
        { day: 5, pickRate: 49, targetPickRate: 50, accuracy: 96.5, ordersCompleted: 44, targetOrders: 65, errorCount: 1, notes: "Post buddy intervention recovery" },
        { day: 6, pickRate: 54, targetPickRate: 50, accuracy: 97.2, ordersCompleted: 48, targetOrders: 65, errorCount: 1, notes: "Fast routing across all aisles" },
        { day: 7, pickRate: 58, targetPickRate: 50, accuracy: 97.8, ordersCompleted: 54, targetOrders: 65, errorCount: 1, notes: "Above target velocity" },
        { day: 8, pickRate: 62, targetPickRate: 50, accuracy: 98.2, ordersCompleted: 58, targetOrders: 65, errorCount: 0, notes: "Clean batch handling" },
        { day: 9, pickRate: 65, targetPickRate: 50, accuracy: 98.6, ordersCompleted: 62, targetOrders: 65, errorCount: 0, notes: "Autonomous picking" },
        { day: 10, pickRate: 68, targetPickRate: 50, accuracy: 99.0, ordersCompleted: 65, targetOrders: 65, errorCount: 0, notes: "Fully certified" },
      ],
      "nh-priya-02": [
        { day: 0, pickRate: 35, targetPickRate: 50, accuracy: 92.0, ordersCompleted: 28, targetOrders: 65, errorCount: 5, notes: "Day 0 orientation" },
        { day: 1, pickRate: 38, targetPickRate: 50, accuracy: 93.0, ordersCompleted: 30, targetOrders: 65, errorCount: 4, notes: "Aisle 1-4 standard picking" },
        { day: 2, pickRate: 39, targetPickRate: 50, accuracy: 92.5, ordersCompleted: 31, targetOrders: 65, errorCount: 5, notes: "Scanner Bluetooth lag" },
        { day: 3, pickRate: 36, targetPickRate: 50, accuracy: 91.0, ordersCompleted: 28, targetOrders: 65, errorCount: 6, notes: "Bluetooth ring scanner hardware malfunction", toolStatus: "Failed", toolProblem: "Bluetooth ring scanner pairing disconnects repeatedly" },
        { day: 4, pickRate: 35, targetPickRate: 50, accuracy: 90.5, ordersCompleted: 27, targetOrders: 65, errorCount: 7, notes: "Tool blocked - Hardware replacement pending", toolStatus: "Failed", toolProblem: "Bluetooth ring scanner pairing disconnects repeatedly" },
        { day: 5, pickRate: 50, targetPickRate: 50, accuracy: 97.0, ordersCompleted: 45, targetOrders: 65, errorCount: 1, notes: "Hardware swapped to Terminal B4. Immediate velocity surge" },
        { day: 6, pickRate: 55, targetPickRate: 50, accuracy: 97.8, ordersCompleted: 50, targetOrders: 65, errorCount: 1, notes: "Strong pace" },
        { day: 7, pickRate: 59, targetPickRate: 50, accuracy: 98.2, ordersCompleted: 55, targetOrders: 65, errorCount: 0, notes: "High accuracy" },
        { day: 8, pickRate: 63, targetPickRate: 50, accuracy: 98.6, ordersCompleted: 59, targetOrders: 65, errorCount: 0, notes: "Autonomous picking" },
        { day: 9, pickRate: 66, targetPickRate: 50, accuracy: 99.0, ordersCompleted: 63, targetOrders: 65, errorCount: 0, notes: "Certified level performance" },
        { day: 10, pickRate: 69, targetPickRate: 50, accuracy: 99.4, ordersCompleted: 65, targetOrders: 65, errorCount: 0, notes: "Fully certified" },
      ],
      "nh-sneha-04": [
        { day: 0, pickRate: 42, targetPickRate: 50, accuracy: 95.0, ordersCompleted: 34, targetOrders: 65, errorCount: 3, notes: "Day 0 orientation" },
        { day: 1, pickRate: 46, targetPickRate: 50, accuracy: 96.0, ordersCompleted: 38, targetOrders: 65, errorCount: 2, notes: "Aisle 1-4 standard picking" },
        { day: 2, pickRate: 48, targetPickRate: 50, accuracy: 96.5, ordersCompleted: 40, targetOrders: 65, errorCount: 2, notes: "Consistent progress" },
        { day: 3, pickRate: 51, targetPickRate: 50, accuracy: 97.0, ordersCompleted: 44, targetOrders: 65, errorCount: 1, notes: "On target" },
        { day: 4, pickRate: 54, targetPickRate: 50, accuracy: 97.5, ordersCompleted: 48, targetOrders: 65, errorCount: 1, notes: "Fast picker" },
        { day: 5, pickRate: 58, targetPickRate: 50, accuracy: 98.0, ordersCompleted: 52, targetOrders: 65, errorCount: 0, notes: "High pace and accuracy" },
        { day: 6, pickRate: 61, targetPickRate: 50, accuracy: 98.5, ordersCompleted: 56, targetOrders: 65, errorCount: 0, notes: "Smooth multi-order batching" },
        { day: 7, pickRate: 64, targetPickRate: 50, accuracy: 98.8, ordersCompleted: 60, targetOrders: 65, errorCount: 0, notes: "Top quartile picker" },
        { day: 8, pickRate: 67, targetPickRate: 50, accuracy: 99.1, ordersCompleted: 63, targetOrders: 65, errorCount: 0, notes: "Autonomous floor leader" },
        { day: 9, pickRate: 70, targetPickRate: 50, accuracy: 99.4, ordersCompleted: 65, targetOrders: 65, errorCount: 0, notes: "Peak velocity" },
        { day: 10, pickRate: 72, targetPickRate: 50, accuracy: 99.6, ordersCompleted: 65, targetOrders: 65, errorCount: 0, notes: "Fully certified" },
      ],
      "nh-neha-05": [
        { day: 0, pickRate: 36, targetPickRate: 50, accuracy: 93.0, ordersCompleted: 28, targetOrders: 65, errorCount: 4, notes: "Day 0 orientation" },
        { day: 1, pickRate: 39, targetPickRate: 50, accuracy: 94.0, ordersCompleted: 31, targetOrders: 65, errorCount: 3, notes: "Aisle 1-4 standard picking" },
        { day: 2, pickRate: 42, targetPickRate: 50, accuracy: 94.5, ordersCompleted: 34, targetOrders: 65, errorCount: 3, notes: "Steady learning" },
        { day: 3, pickRate: 45, targetPickRate: 50, accuracy: 95.0, ordersCompleted: 38, targetOrders: 65, errorCount: 2, notes: "Improving speed" },
        { day: 4, pickRate: 48, targetPickRate: 50, accuracy: 96.0, ordersCompleted: 42, targetOrders: 65, errorCount: 2, notes: "Good focus" },
        { day: 5, pickRate: 52, targetPickRate: 50, accuracy: 97.0, ordersCompleted: 46, targetOrders: 65, errorCount: 1, notes: "On target" },
        { day: 6, pickRate: 56, targetPickRate: 50, accuracy: 97.6, ordersCompleted: 50, targetOrders: 65, errorCount: 1, notes: "Consistent progress" },
        { day: 7, pickRate: 60, targetPickRate: 50, accuracy: 98.2, ordersCompleted: 55, targetOrders: 65, errorCount: 0, notes: "High accuracy maintained" },
        { day: 8, pickRate: 63, targetPickRate: 50, accuracy: 98.7, ordersCompleted: 59, targetOrders: 65, errorCount: 0, notes: "Autonomous floor pace" },
        { day: 9, pickRate: 66, targetPickRate: 50, accuracy: 99.1, ordersCompleted: 63, targetOrders: 65, errorCount: 0, notes: "Reliable performer" },
        { day: 10, pickRate: 68, targetPickRate: 50, accuracy: 99.4, ordersCompleted: 65, targetOrders: 65, errorCount: 0, notes: "Fully certified" },
      ]
    };

    setNewHires((prevCohort) => {
      return prevCohort.map((hire) => {
        if (hire.id !== hireId) return hire;

        const benchmarkSequence: BenchmarkPoint[] = BENCHMARKS[hireId] || Array.from({ length: 11 }, (_, i) => ({
          day: i,
          pickRate: 40 + i * 3,
          targetPickRate: 50,
          accuracy: Math.min(99.5, 94.0 + i * 0.55),
          ordersCompleted: Math.min(65, 30 + i * 3.5),
          targetOrders: 65,
          errorCount: Math.max(0, 4 - Math.floor(i / 2)),
          notes: `Day ${i} telemetry progression`,
        }));

        let updatedHire = { ...hire };
        const newDaysHistory: DayRecord[] = [...(hire.daysHistory || [])];

        for (const pt of benchmarkSequence) {
          const workSignal: WorkSignal = {
            dayNumber: pt.day,
            targetPickRate: pt.targetPickRate,
            actualPickRate: pt.pickRate,
            accuracyRate: pt.accuracy,
            ordersCompleted: pt.ordersCompleted,
            targetOrders: pt.targetOrders,
            gapIdentified: pt.notes,
            hasWorkEvidence: true,
          };

          const canonicalEv: any = {
            id: `sim-${hire.id}-d${pt.day}-${Date.now()}`,
            timestamp: new Date().toISOString(),
            employeeId: hire.id,
            journeyDay: pt.day,
            workSignal,
            floorObservations: {
              errorCount: pt.errorCount,
              zone: "aisle_1_4",
              notes: pt.notes,
            },
            toolSystem: {
              toolStatus: pt.toolStatus || "Normal",
              toolProblem: pt.toolProblem,
            },
          };

          const existingIdx = newDaysHistory.findIndex((d) => d.dayNumber === pt.day);
          const existingRec: DayRecord =
            existingIdx >= 0
              ? newDaysHistory[existingIdx]
              : {
                  dayNumber: pt.day,
                  date: pt.day === 0 ? "Day 0" : `Day ${pt.day}`,
                  statusAtEnd: "Doing well",
                  statusReason: pt.notes,
                };

          const merged: DayRecord = {
            ...existingRec,
            workSignal,
            canonicalEvidence: canonicalEv,
          };

          const prevRec = newDaysHistory.find((d) => d.dayNumber === pt.day - 1);
          const execution = executeCoordinationLoop({
            hire: updatedHire,
            dayNumber: pt.day,
            dailySignal: merged.dailySignal,
            managerSignal: merged.managerSignal,
            workSignal: merged.workSignal,
            actionOutcome: merged.actionOutcome,
            previousRecord: prevRec,
            existingAction: merged.recommendedAction,
          });

          merged.identifiedPattern = execution.pattern;
          merged.recommendedAction = execution.action;
          merged.statusAtEnd = execution.updatedStatus;
          merged.statusReason = execution.statusReason;

          if (existingIdx >= 0) {
            newDaysHistory[existingIdx] = merged;
          } else {
            newDaysHistory.push(merged);
          }

          updatedHire = {
            ...updatedHire,
            currentDay: Math.max(updatedHire.currentDay, pt.day),
            status: merged.statusAtEnd,
            statusReason: merged.statusReason,
            capabilities: execution.updatedCapabilities || updatedHire.capabilities,
            overallReadinessScore: execution.overallReadinessScore ?? updatedHire.overallReadinessScore,
            day10Evaluation: execution.day10Evaluation ?? updatedHire.day10Evaluation,
          };
        }

        updatedHire.daysHistory = newDaysHistory.sort((a, b) => a.dayNumber - b.dayNumber);
        return updatedHire;
      });
    });

    setActiveHireId(hireId);
    setCurrentDay(10);
  };

  const handlePopulateEntireCohort = () => {
    for (const h of newHires) {
      handlePopulateTenDaysForHire(h.id);
    }
  };

  // Precise batch populate up to a specified historical date and prune all future days
  const handleBatchPopulateHistoryAndSetPresentDay = (
    hireId: string,
    presentDay: number,
    endHistoryDay: number,
    pattern: string
  ) => {
    setActiveHireId(hireId);
    setCurrentDay(presentDay);

    setNewHires((prevHires) =>
      prevHires.map((hire) => {
        if (hire.id !== hireId) return hire;

        const newHistoryList: DayRecord[] = [];

        for (let d = 0; d <= endHistoryDay; d++) {
          let dPick = 50;
          let dAcc = 96.0;
          let dOrders = 45;
          let dErr = 2;
          let dTool: "Normal" | "Failed" = "Normal";
          let dToolProb = "";
          let dZone = "aisle_1_4";
          let dNotes = `Day ${d} shift telemetry`;

          if (pattern === "struggling" || hireId === "nh-rahul-01") {
            if (d === 4) {
              dPick = 40; dAcc = 94.2; dOrders = 33; dErr = 4; dZone = "aisle_4_8"; dNotes = "Aisles 4-8 bottleneck searching for items.";
            } else if (d >= 5) {
              dPick = Math.min(68, 49 + (d - 5) * 4); dAcc = 96.5 + (d - 5) * 0.5; dOrders = 44 + (d - 5) * 4; dErr = 1; dNotes = "Recovered after peer walkthrough.";
            } else {
              dPick = 42 + d * 1.5; dAcc = 94.5 + d * 0.3; dOrders = 30 + d * 2; dErr = 3;
            }
          } else if (pattern === "hardware" || hireId === "nh-priya-02") {
            if (d === 3 || d === 4) {
              dPick = 35; dAcc = 90.5; dOrders = 27; dErr = 6; dTool = "Failed"; dToolProb = "Bluetooth ring scanner disconnects repeatedly";
              dNotes = "Scanner dropped pairing repeatedly.";
            } else if (d >= 5) {
              dPick = Math.min(68, 50 + (d - 5) * 3.5); dAcc = 97.0 + (d - 5) * 0.5; dOrders = 45 + (d - 5) * 4; dErr = 1;
              dNotes = "Swapped to Terminal B4. Velocity restored.";
            } else {
              dPick = 38 + d * 1.5; dAcc = 93.0 + d * 0.5; dOrders = 30 + d * 2; dErr = 4;
            }
          } else if (pattern === "stellar" || hireId === "nh-amit-03") {
            if (d === 0) {
              dPick = 58; dAcc = 96.6; dOrders = 46; dErr = 2; dNotes = "Day 0 dark store onboarding scan benchmark";
            } else {
              dPick = Math.min(72, Math.round(38 + d * 3.2)); dAcc = Number((95.0 + d * 0.45).toFixed(1));
              dOrders = Math.min(65, Math.round(30 + d * 3.5)); dErr = Math.max(0, 3 - Math.floor(d / 3));
              dNotes = `Day ${d} Amit top quartile progression`;
            }
          } else {
            dPick = Math.min(68, Math.round(36 + d * 3.2)); dAcc = Number((93.5 + d * 0.6).toFixed(1));
            dOrders = Math.min(65, Math.round(28 + d * 3.7)); dErr = Math.max(0, 4 - Math.floor(d / 2));
            dNotes = `Day ${d} steady ramp telemetry`;
          }

          const wrkSignal: WorkSignal = {
            dayNumber: d,
            targetPickRate: 50,
            actualPickRate: Math.round(dPick),
            accuracyRate: Number(dAcc.toFixed(1)),
            ordersCompleted: Math.min(65, Math.round(dOrders)),
            targetOrders: 65,
            gapIdentified: dNotes,
            hasWorkEvidence: true,
          };

          const canonicalEv: any = {
            id: `sim-${hireId}-d${d}-${Date.now()}`,
            timestamp: new Date().toISOString(),
            employeeId: hireId,
            journeyDay: d,
            workSignal: wrkSignal,
            floorObservations: {
              errorCount: dErr,
              zone: dZone,
              notes: dNotes,
            },
            toolSystem: {
              toolStatus: dTool,
              toolProblem: dToolProb,
            },
          };

          const prevRec = d > 0 ? newHistoryList[d - 1] : undefined;

          const dayRec: DayRecord = {
            dayNumber: d,
            date: `Day ${d}`,
            statusAtEnd: "Doing well",
            statusReason: dNotes,
            workSignal: wrkSignal,
            canonicalEvidence: canonicalEv,
          };

          const execution = executeCoordinationLoop({
            hire,
            dayNumber: d,
            workSignal: wrkSignal,
            dailySignal: dayRec.dailySignal,
            managerSignal: dayRec.managerSignal,
            actionOutcome: dayRec.actionOutcome,
            previousRecord: prevRec,
          });

          dayRec.identifiedPattern = execution.pattern;
          dayRec.recommendedAction = execution.action;
          dayRec.statusAtEnd = execution.updatedStatus;
          dayRec.statusReason = execution.statusReason;

          newHistoryList.push(dayRec);
        }

        const lastRec = newHistoryList[newHistoryList.length - 1];

        return {
          ...hire,
          currentDay: presentDay,
          status: lastRec?.statusAtEnd || hire.status,
          statusReason: lastRec?.statusReason || hire.statusReason,
          recommendedActionSnippet: lastRec?.recommendedAction?.title,
          daysHistory: newHistoryList, // Strictly contains only Day 0 to endHistoryDay! Future days pruned.
        };
      })
    );
  };

  // Set present day and prune any future days beyond presentDay - 1
  const handleSetPresentDayPruned = (hireId: string, presentDay: number) => {
    setActiveHireId(hireId);
    setCurrentDay(presentDay);

    setNewHires((prevHires) =>
      prevHires.map((hire) => {
        if (hire.id !== hireId) return hire;

        // Keep only records where dayNumber < presentDay
        const filteredHistory = hire.daysHistory.filter((d) => d.dayNumber < presentDay);
        const lastRec = filteredHistory[filteredHistory.length - 1];

        return {
          ...hire,
          currentDay: presentDay,
          status: lastRec?.statusAtEnd || hire.status,
          statusReason: lastRec?.statusReason || hire.statusReason,
          daysHistory: filteredHistory,
        };
      })
    );
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
          isFramed
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
        {isFramed && (
          <div className={`hidden md:flex items-center justify-center pt-2 pb-1 border-b ${
            activeTab === "new_hire" && learnerSection === "journey"
              ? "bg-[#eaedf2] border-slate-300"
              : activeTab === "new_hire" && learnerSection === "modules"
              ? "bg-[#0a0b0e] border-white/5"
              : activeTab === "new_hire" && (learnerSection === "dashboard" || learnerSection === "learner_dashboard") ? "bg-[#081b4e] border-transparent"
              : "bg-slate-950 border-white/5"
          }`}>
            <div className={`w-16 h-1 rounded-full ${
              activeTab === "new_hire" && learnerSection === "journey"
                ? "bg-slate-400"
                : "bg-white/20"
            }`}></div>
          </div>
        )}

            {/* Global Mobile Header (Only during active shift views) */}
            {!(activeTab === "new_hire" && (learnerSection === "modules" || learnerSection === "home" || learnerSection === "journey" || learnerSection === "dashboard" || learnerSection === "dial" || learnerSection === "learner_dashboard")) && (
              <Header
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                currentDay={effectiveDay}
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
                onOpenSimulatorLab={() => setActiveTab("simulator")}
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
                availableDays={activeHire.daysHistory?.map(d => d.dayNumber) || [effectiveDay]}
              />
            )}

            {/* Purple Hidden Side Bar: 10-Day Journey & AI Floor Companion */}
            <ChatBotPullout
              currentDay={effectiveDay}
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
                <LearnerSideNav
                  activeSection={learnerSection}
                  onSelectSection={setLearnerSection}
                  isHindi={isHindi}
                />
              )}
              {activeTab === "new_hire" && (
                <NewHireView
                  newHire={activeHire}
                  currentDay={effectiveDay}
                  onDailySignalSubmitted={handleDailySignalSubmitted}
                  onAskHelp={handleAskHelp}
                  onSelectDay={handleSelectDay}
                  onUpdateHire={handleUpdateHire}
                  isHindi={isHindi}
                  onToggleLanguage={() => setIsHindi((prev) => !prev)}
                  setIsHindi={setIsHindi}
                  activeSection={learnerSection}
                  onSelectSection={setLearnerSection}
                  onOpenManagerConsole={() => setActiveTab("manager")}
                  onOpenSimulator={() => setActiveTab("simulator")}
                  newHires={newHires}
                  onSelectHire={setActiveHireId}
                  onOpenSyncModal={() => setIsSyncModalOpen(true)}
                  isSyncing={isSyncingCohort}
                />
              )}

              {activeTab === "manager" && (
                <ManagerView
                  newHires={newHires}
                  activeHireId={activeHireId}
                  onSelectHire={(id) => setActiveHireId(id)}
                  currentDay={effectiveDay}
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

              {activeTab === "simulator" && (
                <SimulatorLabView
                  newHires={newHires}
                  activeHireId={activeHireId}
                  currentDay={effectiveDay}
                  onSelectHire={setActiveHireId}
                  onSelectDay={handleSelectDay}
                  onApplyTelemetry={handleApplySimulatorTelemetry}
                  onBatchPopulateHistory={handleBatchPopulateHistoryAndSetPresentDay}
                  onSetPresentDay={handleSetPresentDayPruned}
                  onPopulateTenDays={handlePopulateTenDaysForHire}
                  onPopulateEntireCohort={handlePopulateEntireCohort}
                  onResetCohort={handleResetDemo}
                  onNavigateToManager={() => setActiveTab("manager")}
                  onNavigateToLearner={() => setActiveTab("new_hire")}
                  onNavigateToStoreOps={() => setActiveTab("organization")}
                />
              )}
            </main>

            {/* Bottom Navigation for Management / Simulator Views */}
            {activeTab !== "new_hire" && (
              <BottomNav
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onOpenLoopModal={() => setIsLoopModalOpen(true)}
                needsAttentionCount={needsAttentionCount}
                atRiskCount={atRiskCount}
                currentDay={effectiveDay}
              />
            )}
      </div>

      {/* Core Loop Inspector Modal */}
      <LoopInspectorModal
        isOpen={isLoopModalOpen}
        onClose={() => setIsLoopModalOpen(false)}
        newHire={activeHire}
        currentDay={effectiveDay}
      />

      {/* Direct Floor Telemetry / Temperature Gauge Modal */}
      <TelemetryDialModal
        isOpen={isTelemetryModalOpen}
        onClose={() => setIsTelemetryModalOpen(false)}
        newHire={activeHire}
        currentDay={effectiveDay}
      />

      {/* Live Simulator Sync & Push Hub Modal */}
      <SyncSimulatorModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        newHires={newHires}
        currentDay={effectiveDay}
        onSyncAllCohort={handleSyncAllCohort}
        onOpenSimulatorLab={() => {
          setIsSyncModalOpen(false);
          setActiveTab("simulator");
        }}
        lastSyncedTimestamp={lastSyncedTime}
        isSyncing={isSyncingCohort}
      />
    </div>
  );
}
