import {
  WorkSignal,
  DailySignal,
  ManagerSignal,
  SignalCategory,
  ManagerIssueType,
  ActionOutcome,
} from "../types";

/**
 * 12-field Raw Payload schema mirroring the Google Form / Google Sheet columns.
 */
export interface GoogleFormFeedPayload {
  // 1. New Hire Name or ID
  newHireNameOrId: string;
  // 2. Day of Ramp (1 to 14)
  dayOfRamp: number | string;
  // 3. Shift Actual Pick Rate (items/hr)
  shiftActualPickRate: number | string;
  // 4. Shift Target Pick Rate (items/hr)
  shiftTargetPickRate: number | string;
  // 5. Scanning Accuracy % (0 to 100)
  scanningAccuracyPercent: number | string;
  // 6. Orders Completed
  ordersCompleted: number | string;
  // 7. Help Requests
  helpRequests: number | string;
  // 8. Learner Voice / Daily Shift Log
  learnerVoiceShiftLog: string;
  // 9. Learner Confidence ("High" | "Medium" | "Low")
  learnerConfidence?: "High" | "Medium" | "Low" | string;
  // 10. Supervisor Observation State ("Doing well" | "Needs support" | "Struggling")
  supervisorObservationState?: "Doing well" | "Needs support" | "Struggling" | string;
  // 11. Supervisor Observed Category ("Speed" | "Accuracy" | "Process" | "Tool" | "Confidence" | "Other" | "None")
  supervisorObservedCategory?: "Speed" | "Accuracy" | "Process" | "Tool" | "Confidence" | "Other" | string;
  // 12. Supervisor Floor Notes
  supervisorFloorNotes?: string;
  // Optional metadata / timestamp
  timestamp?: string;
  // Optional closed loop outcome evaluation
  interventionImproved?: "yes" | "no" | "partial";
  interventionNotes?: string;
  modulesCompleted?: number;
  externalBottleneck?: string;
}

export interface IngestedSignalsResult {
  newHireId: string;
  dayNumber: number;
  workSignal: WorkSignal;
  dailySignal: DailySignal;
  managerSignal: ManagerSignal;
  actionOutcome?: ActionOutcome;
  modulesCompleted?: number;
}

/**
 * Adapts raw 12-field Google Form/Sheet row into the existing application signal types.
 * Pure mapping function: does NOT generate diagnosis, readiness, or decisions.
 */
export function adaptGoogleFormFeedRow(
  raw: GoogleFormFeedPayload,
  knownHires: Array<{ id: string; name: string }>
): IngestedSignalsResult {
  // 1. Resolve New Hire ID
  const rawIdentifier = (raw.newHireNameOrId || "").trim().toLowerCase();
  const matchedHire = knownHires.find(
    (h) =>
      h.id.toLowerCase() === rawIdentifier ||
      h.name.toLowerCase().includes(rawIdentifier) ||
      rawIdentifier.includes(h.name.toLowerCase().split(" ")[0])
  );
  const targetHireId = matchedHire ? matchedHire.id : knownHires[0]?.id || "nh-rahul-01";

  // 2. Parse Day Number
  const dayNum = Math.max(1, Math.min(14, Number(raw.dayOfRamp) || 1));

  // 3. Parse Numbers
  const actualPickRate = Math.max(0, Number(raw.shiftActualPickRate) || 0);
  const targetPickRate = Math.max(1, Number(raw.shiftTargetPickRate) || 50);
  const accuracyRate = Math.max(0, Math.min(100, Number(raw.scanningAccuracyPercent) || 98));
  const ordersCompleted = Math.max(0, Number(raw.ordersCompleted) || 0);
  const targetOrders = Math.max(ordersCompleted, 50);
  const helpRequestsCount = Math.max(0, Number(raw.helpRequests) || 0);

  // 4. Map to existing WorkSignal
  const isNoEvidence = ordersCompleted === 0 && actualPickRate === 0 && (
    (raw.supervisorFloorNotes || "").toLowerCase().includes("awaiting") ||
    (raw.learnerVoiceShiftLog || "").toLowerCase().includes("awaiting") ||
    raw.ordersCompleted === "0" ||
    raw.ordersCompleted === 0
  );

  const isExternalBottleneck = Boolean(
    raw.externalBottleneck ||
    (raw.supervisorFloorNotes || "").toLowerCase().includes("conveyor") ||
    (raw.learnerVoiceShiftLog || "").toLowerCase().includes("conveyor") ||
    (raw.supervisorFloorNotes || "").toLowerCase().includes("spill") ||
    (raw.supervisorFloorNotes || "").toLowerCase().includes("outage")
  );

  const externalBottleneckDesc = raw.externalBottleneck || (isExternalBottleneck ? "facility conveyor/power disruption" : undefined);

  const workSignal: WorkSignal = {
    dayNumber: dayNum,
    targetPickRate,
    actualPickRate,
    accuracyRate,
    ordersCompleted,
    targetOrders,
    helpRequestsCount,
    hasWorkEvidence: !isNoEvidence,
    gapIdentified: isNoEvidence ? "No shift orders logged" : undefined,
    externalBottleneck: externalBottleneckDesc,
  };

  // 5. Map to existing DailySignal
  const rawConfidence = (raw.learnerConfidence || "").trim().toLowerCase();
  const confidence: "Low" | "Medium" | "High" =
    rawConfidence === "low" ? "Low" : rawConfidence === "high" ? "High" : "Medium";

  // Parse supervisor state early for context
  const rawState = (raw.supervisorObservationState || "").trim().toLowerCase();
  const state: ManagerSignal["state"] =
    rawState.includes("strug")
      ? "Struggling"
      : rawState.includes("support") || rawState.includes("need")
      ? "Needs support"
      : "Doing well";

  // Infer category tag for daily signal based on raw text / category
  const rawText = (raw.learnerVoiceShiftLog || "").trim();
  let category: SignalCategory = "General";
  const lowerText = rawText.toLowerCase();
  const isResolvedOrSmooth =
    lowerText.includes("resolved") ||
    lowerText.includes("working perfectly") ||
    lowerText.includes("much easier now") ||
    lowerText.includes("moving smoothly");

  if (actualPickRate >= targetPickRate && (state === "Doing well" || confidence === "High") && isResolvedOrSmooth) {
    category = "General";
  } else if (lowerText.includes("aisle") || lowerText.includes("location") || lowerText.includes("find") || lowerText.includes("shelf") || lowerText.includes("rack")) {
    category = "Environment";
  } else if (lowerText.includes("scanner") || lowerText.includes("battery") || lowerText.includes("bluetooth") || lowerText.includes("device")) {
    category = "Tool";
  } else if (lowerText.includes("slow") || lowerText.includes("speed") || lowerText.includes("pace") || lowerText.includes("target")) {
    category = "Process";
  } else if (lowerText.includes("wrong") || lowerText.includes("error") || lowerText.includes("scan") || lowerText.includes("mistake")) {
    category = "Process";
  } else if (lowerText.includes("tired") || lowerText.includes("fatigue") || lowerText.includes("heavy")) {
    category = "Physical";
  } else if (rawConfidence === "low") {
    category = "Confidence";
  }

  const dailySignal: DailySignal = {
    id: `ds-feed-${targetHireId}-d${dayNum}-${Date.now()}`,
    dayNumber: dayNum,
    rawText: rawText || (actualPickRate >= targetPickRate ? "Shift completed smoothly." : "Experienced some floor friction."),
    inputMethod: "text",
    issue: (actualPickRate >= targetPickRate && isResolvedOrSmooth) ? "None" : rawText || (actualPickRate < targetPickRate ? "Speed lag vs target" : "None"),
    confidence,
    possibleImpact: actualPickRate < targetPickRate ? "Pick speed pacing below ramp curve" : "Stable progress",
    category,
    summary: rawText ? rawText.slice(0, 80) : "Shift feedback",
    helpRequestsCount,
    timestamp: raw.timestamp || new Date().toISOString(),
  };

  // 6. Map to existing ManagerSignal

  const rawCat = (raw.supervisorObservedCategory || "").trim().toLowerCase();
  const issueCategory: ManagerSignal["issueCategory"] =
    rawCat.includes("acc")
      ? "Accuracy"
      : rawCat.includes("proc")
      ? "Process"
      : rawCat.includes("tool")
      ? "Tool"
      : rawCat.includes("conf")
      ? "Confidence"
      : rawCat.includes("speed")
      ? "Speed"
      : "Other";

  const managerSignal: ManagerSignal = {
    id: `ms-feed-${targetHireId}-d${dayNum}-${Date.now()}`,
    dayNumber: dayNum,
    managerName: "Shift Supervisor",
    state,
    issueCategory,
    notes: (raw.supervisorFloorNotes || "").trim(),
    timestamp: raw.timestamp || new Date().toISOString(),
  };

  const actionOutcome: ActionOutcome | undefined = raw.interventionImproved
    ? {
        id: `out-${targetHireId}-d${dayNum}`,
        actionId: `act-${targetHireId}-d${dayNum - 1}`,
        dayNumber: dayNum,
        performedBy: "Shift Supervisor & Buddy",
        performedAt: `Day ${dayNum}`,
        subsequentPickRate: actualPickRate,
        subsequentAccuracy: accuracyRate,
        improved: raw.interventionImproved,
        notes: raw.interventionNotes || (raw.interventionImproved === "yes" ? "Performance recovered on floor" : "Intervention did not close gap"),
        evaluatedAt: "Just now",
      }
    : undefined;

  return {
    newHireId: targetHireId,
    dayNumber: dayNum,
    workSignal,
    dailySignal,
    managerSignal,
    actionOutcome,
    modulesCompleted: raw.modulesCompleted,
  };
}

/**
 * Standard Demo Scenarios for instant testing without requiring external credentials.
 * Includes complete closed-loop journeys, failure recovery memory, multiple problems,
 * training vs work constraints, external blockers, no-evidence shifts, and Day-10 outcomes.
 */
export const DEMO_FEED_PRESETS: Array<{
  id: string;
  name: string;
  badge: string;
  description: string;
  payload: GoogleFormFeedPayload;
}> = [
  {
    id: "journey-day1-initial",
    name: "Day 1: Initial Evidence (Baseline Onboarding)",
    badge: "Day 1 Baseline (28/30 UPH)",
    description: "Orientation complete, first wave 28 vs 30 target, 98% accuracy, 0 help requests. System observes standard ramp without unneeded intervention.",
    payload: {
      newHireNameOrId: "Rahul Verma",
      dayOfRamp: 1,
      shiftActualPickRate: 28,
      shiftTargetPickRate: 30,
      scanningAccuracyPercent: 98,
      ordersCompleted: 24,
      helpRequests: 0,
      learnerVoiceShiftLog: "Completed safety briefing and terminal setup. Started first slow tote under buddy Vikram guidance.",
      learnerConfidence: "Medium",
      supervisorObservationState: "Doing well",
      supervisorObservedCategory: "None",
      supervisorFloorNotes: "Awaiting full shift telemetry; observing standard ramp curve.",
      modulesCompleted: 3,
    },
  },
  {
    id: "scenario-1-navigation",
    name: "Day 2/3: Navigation / Spatial Problem Appears",
    badge: "Spatial Friction (35/50 UPH)",
    description: "Pick rate 35 vs 50 target, 98% accuracy, 4 help requests, 'Hard to find items in aisle 6', supervisor 'Needs support / Speed'.",
    payload: {
      newHireNameOrId: "Rahul Verma",
      dayOfRamp: 3,
      shiftActualPickRate: 35,
      shiftTargetPickRate: 50,
      scanningAccuracyPercent: 98,
      ordersCompleted: 44,
      helpRequests: 4,
      learnerVoiceShiftLog: "Hard to find items in aisle 6",
      learnerConfidence: "Low",
      supervisorObservationState: "Needs support",
      supervisorObservedCategory: "Speed",
      supervisorFloorNotes: "Needed help locating rack bins in high-frequency aisles",
      modulesCompleted: 4,
    },
  },
  {
    id: "scenario-2-scanner-tool",
    name: "Scenario 2: Scanner / Tool Problem",
    badge: "Tool Hardware (35/50 UPH)",
    description: "Pick rate 35 vs 50 target, 99% accuracy, 2 help requests, 'Scanner keeps disconnecting', supervisor 'Needs support / Tool'.",
    payload: {
      newHireNameOrId: "Rahul Verma",
      dayOfRamp: 3,
      shiftActualPickRate: 35,
      shiftTargetPickRate: 50,
      scanningAccuracyPercent: 99,
      ordersCompleted: 44,
      helpRequests: 2,
      learnerVoiceShiftLog: "Scanner keeps disconnecting",
      learnerConfidence: "Medium",
      supervisorObservationState: "Needs support",
      supervisorObservedCategory: "Tool",
      supervisorFloorNotes: "Scanner Bluetooth dropped several times",
    },
  },
  {
    id: "scenario-3-training-process",
    name: "Scenario 3: Training / Process Gap",
    badge: "Process Gap (32/50 UPH)",
    description: "Pick rate 32 vs 50, 98% accuracy, 3 help requests, 'I am not clear about the process', supervisor 'Needs support / Process'.",
    payload: {
      newHireNameOrId: "Rahul Verma",
      dayOfRamp: 3,
      shiftActualPickRate: 32,
      shiftTargetPickRate: 50,
      scanningAccuracyPercent: 98,
      ordersCompleted: 40,
      helpRequests: 3,
      learnerVoiceShiftLog: "I am not clear about the process",
      learnerConfidence: "Low",
      supervisorObservationState: "Needs support",
      supervisorObservedCategory: "Process",
      supervisorFloorNotes: "Process standard confusion. Requires structured coaching on staging rules.",
    },
  },
  {
    id: "scenario-4-dependency",
    name: "Scenario 4: Dependency / Independence Problem",
    badge: "Chronic Dependency (46/50 UPH)",
    description: "Pick rate near target (46/50), 99% accuracy, 6 help requests, 'Please stay with me while I pick', supervisor 'Struggling / Confidence'.",
    payload: {
      newHireNameOrId: "Rahul Verma",
      dayOfRamp: 3,
      shiftActualPickRate: 46,
      shiftTargetPickRate: 50,
      scanningAccuracyPercent: 99,
      ordersCompleted: 58,
      helpRequests: 6,
      learnerVoiceShiftLog: "Please stay with me while I pick",
      learnerConfidence: "Low",
      supervisorObservationState: "Struggling",
      supervisorObservedCategory: "Confidence",
      supervisorFloorNotes: "Needs continuous buddy support",
    },
  },
  {
    id: "scenario-recovery-tool",
    name: "Recovery Test: Tool Recovery",
    badge: "Post-Hardware Fix (50/50 UPH)",
    description: "After scanner battery/terminal repair: Pick rate 50 vs 50, 100% accuracy, 0 help requests, 'Scanner working perfectly'.",
    payload: {
      newHireNameOrId: "Rahul Verma",
      dayOfRamp: 3,
      shiftActualPickRate: 50,
      shiftTargetPickRate: 50,
      scanningAccuracyPercent: 100,
      ordersCompleted: 65,
      helpRequests: 0,
      learnerVoiceShiftLog: "Scanner working perfectly without any drops today. Picked comfortably.",
      learnerConfidence: "High",
      supervisorObservationState: "Doing well",
      supervisorObservedCategory: "None",
      supervisorFloorNotes: "Terminal hardware resolved. Rahul executed full wave independently at target rate.",
    },
  },
  {
    id: "scenario-recovery-nav",
    name: "Next Shift: Navigation Recovery (Closed Loop Succeeded)",
    badge: "Post-Walkthrough (48/50 UPH)",
    description: "After aisle walkthrough: Pick rate 48 vs 50, 99% accuracy, 0 help requests. Intervention succeeded; support reduces, status Doing well.",
    payload: {
      newHireNameOrId: "Rahul Verma",
      dayOfRamp: 4,
      shiftActualPickRate: 48,
      shiftTargetPickRate: 50,
      scanningAccuracyPercent: 99,
      ordersCompleted: 62,
      helpRequests: 0,
      learnerVoiceShiftLog: "Finding locations is much easier now after the aisle walkthrough. Moving smoothly.",
      learnerConfidence: "High",
      supervisorObservationState: "Doing well",
      supervisorObservedCategory: "None",
      supervisorFloorNotes: "Working independently across aisles 4-8. Navigating quickly with zero support needed.",
      interventionImproved: "yes",
      interventionNotes: "Buddy walkthrough resolved location confusion. Pick rate jumped from 35 to 48/hr.",
      modulesCompleted: 5,
    },
  },
  {
    id: "journey-failure-memory",
    name: "Failure Path: Treatment Memory & Escalation",
    badge: "Walkthrough Failed (34/50 UPH)",
    description: "After buddy walkthrough: Pick rate remains 34 vs 50, 5 help requests. Engine does NOT repeat walkthrough; escalates to Supervisor Floor Layout Verification!",
    payload: {
      newHireNameOrId: "Rahul Verma",
      dayOfRamp: 4,
      shiftActualPickRate: 34,
      shiftTargetPickRate: 50,
      scanningAccuracyPercent: 98,
      ordersCompleted: 42,
      helpRequests: 5,
      learnerVoiceShiftLog: "Still confusing finding locations in aisles 4-8 even after walkthrough with Vikram.",
      learnerConfidence: "Low",
      supervisorObservationState: "Needs support",
      supervisorObservedCategory: "Speed",
      supervisorFloorNotes: "Buddy walkthrough did not resolve aisle coordinate confusion. Shelf signage may be mislabeled.",
      interventionImproved: "no",
      interventionNotes: "Buddy walkthrough failed to close navigation gap. Rate remained at 34/hr.",
      modulesCompleted: 4,
    },
  },
  {
    id: "scenario-multi-problem",
    name: "Multiple-Problem Shift: Quality Floor Priority",
    badge: "Multiple Signals (35/50 UPH)",
    description: "Pace lagging (35/50), accuracy low (91%), scanner bluetooth dropped, learner hesitant. Engine prioritizes quality floor (<95% acc) and chooses ONE action.",
    payload: {
      newHireNameOrId: "Rahul Verma",
      dayOfRamp: 3,
      shiftActualPickRate: 35,
      shiftTargetPickRate: 50,
      scanningAccuracyPercent: 91,
      ordersCompleted: 40,
      helpRequests: 3,
      learnerVoiceShiftLog: "Scanner keeps disconnecting and mixed up packaging weights on 200g vs 500g pouches. Nervous on floor.",
      learnerConfidence: "Low",
      supervisorObservationState: "Needs support",
      supervisorObservedCategory: "Accuracy",
      supervisorFloorNotes: "Mis-picked product variants; scanning accuracy fell to 91%. Bluetooth dropped twice.",
      modulesCompleted: 4,
    },
  },
  {
    id: "scenario-training-incomplete",
    name: "Training vs Work: High Speed vs Incomplete Training",
    badge: "Fast Pace, LMS Incomplete (56/50 UPH)",
    description: "Pick rate 56 vs 50, 99.5% accuracy, 0 help requests, but mandatory LMS training is incomplete (2/10). Strong work does NOT override mandatory training.",
    payload: {
      newHireNameOrId: "Rahul Verma",
      dayOfRamp: 2,
      shiftActualPickRate: 56,
      shiftTargetPickRate: 50,
      scanningAccuracyPercent: 99.5,
      ordersCompleted: 70,
      helpRequests: 0,
      learnerVoiceShiftLog: "Picked all assigned orders fast solo. No issues with tote handling.",
      learnerConfidence: "High",
      supervisorObservationState: "Doing well",
      supervisorObservedCategory: "None",
      supervisorFloorNotes: "Excellent fast picking pace, but worker still has 8 mandatory foundation LMS modules pending.",
      modulesCompleted: 2,
    },
  },
  {
    id: "scenario-training-complete-weak",
    name: "Training vs Work: 100% Modules Complete vs Weak Floor Work",
    badge: "10/10 LMS, Weak Floor (31/50 UPH)",
    description: "Completed 10/10 LMS modules, but real floor pick rate is 31 vs 50, 92% accuracy, 4 help requests. Training completion != readiness.",
    payload: {
      newHireNameOrId: "Rahul Verma",
      dayOfRamp: 5,
      shiftActualPickRate: 31,
      shiftTargetPickRate: 50,
      scanningAccuracyPercent: 92,
      ordersCompleted: 38,
      helpRequests: 4,
      learnerVoiceShiftLog: "Completed 100% video modules, but finding real store speed and bin locations very hard.",
      learnerConfidence: "Low",
      supervisorObservationState: "Needs support",
      supervisorObservedCategory: "Speed",
      supervisorFloorNotes: "100% LMS completion on paper, but live floor execution requires structured floor practice.",
      modulesCompleted: 10,
    },
  },
  {
    id: "scenario-external-blocker",
    name: "External Problem: Conveyor Disruption (Zero Blame)",
    badge: "Conveyor Stoppage (28/50 UPH)",
    description: "Pick rate dropped to 28 vs 50, 99% accuracy. Main conveyor belt stopped for 45 mins. Engine diagnoses external bottleneck without blaming worker.",
    payload: {
      newHireNameOrId: "Rahul Verma",
      dayOfRamp: 4,
      shiftActualPickRate: 28,
      shiftTargetPickRate: 50,
      scanningAccuracyPercent: 99,
      ordersCompleted: 32,
      helpRequests: 0,
      learnerVoiceShiftLog: "Main conveyor belt stopped for 45 mins due to power surge. Waited at pack station.",
      learnerConfidence: "High",
      supervisorObservationState: "Doing well",
      supervisorObservedCategory: "None",
      supervisorFloorNotes: "Facility conveyor breakdown caused shift rate dip. Rahul executed accurately during active windows.",
      externalBottleneck: "Main conveyor breakdown & power surge",
      modulesCompleted: 5,
    },
  },
  {
    id: "scenario-no-evidence",
    name: "No-Evidence Shift: Awaiting Floor Telemetry",
    badge: "No Shift Data (0 Orders)",
    description: "0 orders completed, 0 actual pick rate. System observes and gathers evidence without inventing a false diagnosis or fabricated score.",
    payload: {
      newHireNameOrId: "Rahul Verma",
      dayOfRamp: 1,
      shiftActualPickRate: 0,
      shiftTargetPickRate: 50,
      scanningAccuracyPercent: 0,
      ordersCompleted: 0,
      helpRequests: 0,
      learnerVoiceShiftLog: "Awaiting morning shift wave assignment and tote allocation.",
      learnerConfidence: "Medium",
      supervisorObservationState: "Doing well",
      supervisorObservedCategory: "None",
      supervisorFloorNotes: "Awaiting shift orders; observing standard floor intake.",
      modulesCompleted: 1,
    },
  },
  {
    id: "scenario-5-safety",
    name: "Safety Override Test (Safety Overrides Productivity)",
    badge: "Safety Blocker (58/50 UPH)",
    description: "High pick rate (58/50), 99.5% accuracy, but PPE safety violation reported. Safety immediately halts advancement, status At risk.",
    payload: {
      newHireNameOrId: "Rahul Verma",
      dayOfRamp: 4,
      shiftActualPickRate: 58,
      shiftTargetPickRate: 50,
      scanningAccuracyPercent: 99.5,
      ordersCompleted: 72,
      helpRequests: 0,
      learnerVoiceShiftLog: "Rushed to hit order SLA and walked into cold storage without thermal jacket and safety boots.",
      learnerConfidence: "Medium",
      supervisorObservationState: "Struggling",
      supervisorObservedCategory: "Other",
      supervisorFloorNotes: "Critical safety protocol breach: PPE violation in loading and cold zone. High speed does not excuse safety rules.",
      modulesCompleted: 6,
    },
  },
  {
    id: "scenario-day10-ready",
    name: "Day 10 Outcome: Certified Autonomous Job Ready",
    badge: "Job Ready (54/50 UPH)",
    description: "Pick rate 54 vs 50, 99.5% accuracy, 0 help requests, all 10 modules completed, core capabilities proficient, safety clear -> Certified Job Ready.",
    payload: {
      newHireNameOrId: "Rahul Verma",
      dayOfRamp: 10,
      shiftActualPickRate: 54,
      shiftTargetPickRate: 50,
      scanningAccuracyPercent: 99.5,
      ordersCompleted: 68,
      helpRequests: 0,
      learnerVoiceShiftLog: "Full shift completed independently across all zones with zero help requests.",
      learnerConfidence: "High",
      supervisorObservationState: "Doing well",
      supervisorObservedCategory: "None",
      supervisorFloorNotes: "Demonstrates consistent autonomous picking speed, 99.5% accuracy, and strict safety compliance across all store zones.",
      modulesCompleted: 10,
    },
  },
  {
    id: "scenario-day10-not-ready",
    name: "Day 10 Outcome: Not Ready (Pending Blocker)",
    badge: "Not Ready (40/50 UPH)",
    description: "Day 10 reached, but pick rate lags (40/50), 96% accuracy, 4 help requests. System evaluates all 7 criteria and refuses premature certification.",
    payload: {
      newHireNameOrId: "Rahul Verma",
      dayOfRamp: 10,
      shiftActualPickRate: 40,
      shiftTargetPickRate: 50,
      scanningAccuracyPercent: 96,
      ordersCompleted: 50,
      helpRequests: 4,
      learnerVoiceShiftLog: "Still need buddy to help check batch totes and clarify bin codes in chillers.",
      learnerConfidence: "Low",
      supervisorObservationState: "Needs support",
      supervisorObservedCategory: "Speed",
      supervisorFloorNotes: "Pacing and accuracy remain below dark store SLA. Active navigation and independence blockers remain.",
      modulesCompleted: 10,
    },
  },
];
