import React, { useState } from "react";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sliders,
  ShieldCheck,
  Zap,
  Eye,
  Wrench,
  BookOpen,
  UserCheck,
  Award,
  X,
  FileSpreadsheet,
  ChevronRight,
  Check,
} from "lucide-react";
import { DEMO_FEED_PRESETS, GoogleFormFeedPayload } from "../services/googleFormFeedAdapter";
import { NewHire } from "../types";
import { evaluateDay10Outcome } from "../services/intelligence";

interface ClientDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunScenario: (payload: GoogleFormFeedPayload) => void;
  currentHire: NewHire;
  currentDay: number;
  onOpenLoopInspector: () => void;
  onSelectTab: (tab: "new_hire" | "manager" | "organization") => void;
  onResetDemo: () => void;
  isHindi?: boolean;
  onOpenSplash?: () => void;
}

interface DemoScenarioStep {
  id: string;
  stepNumber: string;
  title: string;
  badge: string;
  badgeColor: string;
  summary: string;
  presetId: string;
  whatWeSee: string;
  whatIntelligenceThinks: string;
  whatItDoes: string;
  didItWork: string;
  whatNext: string;
  storyStage: string;
}

export const CLIENT_DEMO_SCENARIOS: DemoScenarioStep[] = [
  {
    id: "demo-1",
    stepNumber: "Demo 1",
    title: "Healthy Start (Onboarding Baseline)",
    badge: "Day 1 Baseline",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    storyStage: "New worker joins & learns basics",
    summary: "Rahul begins ramp. Initial wave 28/30 UPH, 98% accuracy. The intelligence observes normal progression without unneeded interference.",
    presetId: "journey-day1-initial",
    whatWeSee: "Pick rate 28/30 UPH, 98% accuracy, 0 help requests. Safety module completed.",
    whatIntelligenceThinks: "Worker is following expected early onboarding curve. No friction detected.",
    whatItDoes: "Routine ramp observation. No intervention needed.",
    didItWork: "Confirmed steady progress.",
    whatNext: "Proceed to scheduled floor waves without unnecessary support.",
  },
  {
    id: "demo-2",
    stepNumber: "Demo 2",
    title: "Problem Appears: Spatial Navigation",
    badge: "Day 3 Friction (35/50 UPH)",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    storyStage: "Real work reveals actual friction",
    summary: "Pick rate lags at 35 vs 50 target, 98% accuracy, 4 help requests. Rahul notes: 'Hard to find items in aisle 6'. Intelligence does NOT assume low speed = more LMS training.",
    presetId: "scenario-1-navigation",
    whatWeSee: "35 picks/hr (target 50), 98% accuracy, 4 help requests. Supervisor: 'Needs support / Speed'.",
    whatIntelligenceThinks: "High accuracy (98%) proves diligence and product recognition are strong. Gap is physical store navigation in Aisles 4–8.",
    whatItDoes: "Smallest practical action: 15-minute floor walkthrough with Buddy Vikram targeting Aisles 4–8.",
    didItWork: "Pending floor walkthrough execution.",
    whatNext: "Evaluate whether pick speed recovers in subsequent wave.",
  },
  {
    id: "demo-3",
    stepNumber: "Demo 3",
    title: "Targeted Intervention: Buddy Walkthrough",
    badge: "Action Prescribed",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
    storyStage: "Smallest useful support delivered",
    summary: "Buddy Vikram accompanies Rahul for a 15-minute aisle walkthrough. Explains Why? Location confusion on floor, not theoretical training failure.",
    presetId: "scenario-1-navigation",
    whatWeSee: "Targeted prescription assigned to Senior Picker Vikram on floor.",
    whatIntelligenceThinks: "Connecting Capability #3 (Rack & bin navigation) with immediate peer support.",
    whatItDoes: "Walkthrough scheduled before peak evening dispatch.",
    didItWork: "Walkthrough executed on floor.",
    whatNext: "Monitor shift performance post-intervention.",
  },
  {
    id: "demo-4",
    stepNumber: "Demo 4",
    title: "Check & Recovery: Support Reduces",
    badge: "Day 4 Succeeded (48/50 UPH)",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    storyStage: "Intelligence checks result & reduces support",
    summary: "After walkthrough, Rahul hits 48/50 UPH with 99% accuracy and 0 help requests. The intelligence observes recovery and automatically reduces support.",
    presetId: "scenario-recovery-nav",
    whatWeSee: "Pick rate jumped from 35 to 48/hr (96% of target), 99% accuracy, 0 help requests.",
    whatIntelligenceThinks: "Floor intervention resolved the navigation bottleneck. Capability #3 is now demonstrated.",
    whatItDoes: "Reduced support: marks status 'Doing well'. Transition to solo independent picking.",
    didItWork: "Yes! Intervention succeeded.",
    whatNext: "Normal autonomous ramp resumes. Walkthrough is NOT repeated.",
  },
  {
    id: "demo-5",
    stepNumber: "Demo 5",
    title: "Failed Intervention: Treatment Memory",
    badge: "Escalation Path (34/50 UPH)",
    badgeColor: "bg-rose-100 text-rose-800 border-rose-200",
    storyStage: "Treatment changes if worker does not improve",
    summary: "If walkthrough failed and pick rate remains 34/50 with 5 help requests, the engine remembers the failed intervention and escalates to Supervisor Floor Layout Verification.",
    presetId: "journey-failure-memory",
    whatWeSee: "Pick rate 34/50, 5 help requests remain high. Supervisor: 'Buddy walkthrough did not resolve aisle coordinate confusion.'",
    whatIntelligenceThinks: "Treatment memory active: peer buddy walkthrough was attempted and failed. Do NOT repeat the same failed intervention.",
    whatItDoes: "Escalates to Supervisor Floor Layout Verification to check mislabeled bin codes.",
    didItWork: "First intervention stalled; engine adapts to root-cause facility audit.",
    whatNext: "Supervisor inspects shelf labeling directly.",
  },
  {
    id: "demo-6a",
    stepNumber: "Demo 6a",
    title: "Same Symptom, Different Cause: Tool Issue",
    badge: "Hardware Remedy (35/50 UPH)",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    storyStage: "System diagnoses the cause, not the symptom",
    summary: "Same low pick rate (35/50), but caused by Bluetooth scanner disconnections. Intelligence prescribes Tool Remedy (swap unit), NOT retraining.",
    presetId: "scenario-2-scanner-tool",
    whatWeSee: "35/50 picks/hr, 99% accuracy. Rahul: 'Scanner keeps disconnecting'. Supervisor: 'Tool / Bluetooth dropped'.",
    whatIntelligenceThinks: "High accuracy proves high skill. Speed drop is 100% hardware-driven.",
    whatItDoes: "Tool Remedy: Swap handheld unit or clean lens at dispatch desk. Zero retraining.",
    didItWork: "Swap resolved scan delay.",
    whatNext: "Rahul resumes solo picking with working hardware.",
  },
  {
    id: "demo-6b",
    stepNumber: "Demo 6b",
    title: "Same Symptom, Different Cause: Training Gap",
    badge: "Process Gap (32/50 UPH)",
    badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
    storyStage: "Targeted learning when gap is conceptual",
    summary: "Same low pick rate (32/50), but caused by process confusion ('Not clear about process'). Intelligence prescribes targeted coaching on staging rules.",
    presetId: "scenario-3-training-process",
    whatWeSee: "32/50 picks/hr, 98% accuracy. Rahul: 'I am not clear about the process'. Supervisor: 'Process gap'.",
    whatIntelligenceThinks: "Learner explicitly lacks standard operating procedure clarity.",
    whatItDoes: "Targeted Learning: 5-minute staging standard coaching.",
    didItWork: "Clarifies order staging criteria.",
    whatNext: "Re-check staging compliance on next shift.",
  },
  {
    id: "demo-7",
    stepNumber: "Demo 7",
    title: "Safety Override: Speed Does NOT Override Safety",
    badge: "Safety Blocker (58/50 UPH)",
    badgeColor: "bg-red-100 text-red-800 border-red-200",
    storyStage: "High productivity never overrides safety",
    summary: "Rahul picks ultra-fast at 58/50 UPH with 99.5% accuracy, but breaches cold storage PPE protocol. Intelligence immediately halts progression and flags 'At risk'.",
    presetId: "scenario-5-safety",
    whatWeSee: "58 picks/hr (exceeds target), 99.5% accuracy, but cold room entered without PPE jacket and boots.",
    whatIntelligenceThinks: "Commercial safety non-negotiable. Excellent speed cannot compensate for a safety violation.",
    whatItDoes: "Halts advancement: sets status 'At risk'. Prescribes mandatory Supervisor PPE Safety Retraining.",
    didItWork: "Prevents unsafe autonomous shift assignment.",
    whatNext: "Worker must re-certify PPE safety protocol before any advancement.",
  },
  {
    id: "demo-8a",
    stepNumber: "Demo 8a",
    title: "Day 10 Outcome: Certified JOB READY",
    badge: "Job Ready (54/50 UPH)",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    storyStage: "Day 10 -> Certified autonomous worker",
    summary: "Rahul completes Day 10 meeting all 7 commercial criteria: 10/10 modules, proficient capabilities, 54/50 UPH, 99.5% accuracy, 0 help requests, zero safety violations.",
    presetId: "scenario-day10-ready",
    whatWeSee: "54/50 picks/hr, 99.5% accuracy, 0 help requests, 10/10 LMS modules complete, safety clear.",
    whatIntelligenceThinks: "All 7 commercial readiness criteria verified across training, capabilities, speed, accuracy, independence, and safety.",
    whatItDoes: "Certifies worker as 'JOB READY' for autonomous shift assignment.",
    didItWork: "Full 10-day loop proven from onboarding to certification.",
    whatNext: "Transition to standard store operations roster.",
  },
  {
    id: "demo-8b",
    stepNumber: "Demo 8b",
    title: "Day 10 Outcome: NOT READY (Active Blocker)",
    badge: "Not Ready (40/50 UPH)",
    badgeColor: "bg-rose-100 text-rose-800 border-rose-200",
    storyStage: "Day 10 -> Refuses premature certification",
    summary: "Day 10 reached, but Rahul lags at 40/50 UPH with 96% accuracy and 4 help requests. Intelligence refuses premature certification and identifies: Main blocker -> Required next action.",
    presetId: "scenario-day10-not-ready",
    whatWeSee: "40/50 picks/hr, 96% accuracy, 4 help requests. Active independence gap.",
    whatIntelligenceThinks: "2 of 7 criteria failed (speed & accuracy). Not ready for solo certification.",
    whatItDoes: "Displays NOT READY: Main blocker -> Floor Productivity Target & Accuracy.",
    didItWork: "Protects store SLA by preventing unqualified certification.",
    whatNext: "Required action: Address navigation speed before approving autonomous certification.",
  },
];

export const ClientDemoModal: React.FC<ClientDemoModalProps> = ({
  isOpen,
  onClose,
  onRunScenario,
  currentHire,
  currentDay,
  onOpenLoopInspector,
  onSelectTab,
  onResetDemo,
  isHindi = false,
  onOpenSplash,
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("demo-2");
  const [justRanId, setJustRanId] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentScenario =
    CLIENT_DEMO_SCENARIOS.find((s) => s.id === selectedScenarioId) || CLIENT_DEMO_SCENARIOS[1];

  const handleRunCurrentScenario = (scenario: DemoScenarioStep) => {
    const preset = DEMO_FEED_PRESETS.find((p) => p.id === scenario.presetId);
    if (preset) {
      onRunScenario(preset.payload);
      setJustRanId(scenario.id);
      setTimeout(() => setJustRanId(null), 2500);
    }
  };

  // Day 10 evaluation from live intelligence
  const day10Result = evaluateDay10Outcome(currentHire);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-[#1b1e26] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Client Story summary */}
        <div className="bg-[#13151b] px-6 py-4 text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-md font-black text-sm">
              🎯
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight text-white">Client Demo Experience</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Closed-Loop Proof
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal">
                See how CheckIn CheckOut continuously sees BOTH learning + work to diagnose, intervene, check, and adapt
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white cursor-pointer transition-all active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Client Story Progression Banner */}
        <div className="bg-[#13151b]/40 border-b border-white/10 px-6 py-2.5 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 min-w-max">
            <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-black">
              Client Story:
            </span>
            <span>Worker Joins</span>
            <ChevronRight className="w-3 h-3 text-slate-500" />
            <span>Learning + Real Work</span>
            <ChevronRight className="w-3 h-3 text-slate-500" />
            <span>Continuous Intelligence</span>
            <ChevronRight className="w-3 h-3 text-slate-500" />
            <span>Smallest Useful Support</span>
            <ChevronRight className="w-3 h-3 text-slate-500" />
            <span>Check Result</span>
            <ChevronRight className="w-3 h-3 text-slate-500" />
            <span>Adapt or Reduce</span>
            <ChevronRight className="w-3 h-3 text-slate-500" />
            <span className="text-cyan-400 font-black">Day 10 Outcome</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* Top Quick Scenario Selector Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                Select Client Scenario (Demos 1 to 8):
              </span>
              <span className="text-[11px] text-slate-555">Tap to select & run</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CLIENT_DEMO_SCENARIOS.map((sc) => {
                const isSelected = selectedScenarioId === sc.id;
                return (
                  <button
                    key={sc.id}
                    onClick={() => setSelectedScenarioId(sc.id)}
                    className={`p-2.5 rounded-2xl text-left transition-all cursor-pointer border flex flex-col justify-between ${
                      isSelected
                        ? "bg-cyan-500/5 border-cyan-500 ring-2 ring-cyan-500/20 shadow-xs text-white"
                        : "bg-[#13151b]/40 border-white/10 hover:border-white/20 text-white hover:bg-[#13151b]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${
                          isSelected ? "bg-cyan-500 text-slate-950 font-black" : "bg-white/5 text-slate-300"
                        }`}
                      >
                        {sc.stepNumber}
                      </span>
                      {sc.id.includes("8a") || sc.id.includes("4") ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-450" />
                      ) : sc.id.includes("7") ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-455" />
                      ) : null}
                    </div>
                    <div className="text-xs font-bold text-white truncate">{sc.title.split(":")[0]}</div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">{sc.badge}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Scenario Card with 5-Point Client Story Summary */}
          <div className="p-5 rounded-3xl bg-[#13151b] text-white shadow-xl space-y-4 border border-white/5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    {currentScenario.stepNumber}
                  </span>
                  <h4 className="text-base font-black text-white">{currentScenario.title}</h4>
                </div>
                <p className="text-xs text-slate-350 mt-1">{currentScenario.summary}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id={`btn-run-${currentScenario.id}`}
                  onClick={() => handleRunCurrentScenario(currentScenario)}
                  className={`px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95 border border-white/10 ${
                    justRanId === currentScenario.id
                      ? "bg-emerald-555 text-slate-950"
                      : "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 hover:opacity-95"
                  }`}
                >
                  {justRanId === currentScenario.id ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Loop Recalculated!</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Run Scenario in App</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 5-Point Client Breakdown: What We See -> Why -> What We Did -> Did It Work -> What Next */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-[#1b1e26] border border-white/5 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 block">
                  1. WHAT WE SEE
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                  {currentScenario.whatWeSee}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-[#1b1e26] border border-white/5 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                  2. WHAT INTELLIGENCE THINKS
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                  {currentScenario.whatIntelligenceThinks}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-[#1b1e26] border border-white/5 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                  3. WHAT IT DOES
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                  {currentScenario.whatItDoes}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-[#1b1e26] border border-white/5 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-400 block">
                  4. DID IT WORK?
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                  {currentScenario.didItWork}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-[#1b1e26] border border-white/5 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 block">
                  5. WHAT NEXT?
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                  {currentScenario.whatNext}
                </p>
              </div>
            </div>

            {/* Direct Verification Controls */}
            <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onOpenLoopInspector();
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Inspect 6-Stage Loop (Six Doctors)</span>
                </button>

                <button
                  onClick={() => {
                    onSelectTab("new_hire");
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>View in Learner Companion</span>
                </button>

                <button
                  onClick={() => {
                    onSelectTab("manager");
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>View in Supervisor View</span>
                </button>
              </div>

              <span className="text-[11px] text-slate-500 font-mono">
                Worker: {currentHire.name} • Live Day {currentDay}
              </span>
            </div>
          </div>

          {/* Day 10 Commercial Certification Panel */}
          <div className="p-4 bg-[#13151b] rounded-3xl border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-cyan-400" />
                <h4 className="text-sm font-black text-white">
                  Day 10 Commercial Certification Engine (7 Criteria)
                </h4>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                  day10Result.isReady
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-355 border border-rose-500/20"
                }`}
              >
                {day10Result.isReady ? "JOB READY" : "NOT READY"}
              </span>
            </div>

            <p className="text-xs text-slate-450 leading-relaxed font-medium">
              {day10Result.summary}
            </p>

            {/* 7 Criteria Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {day10Result.verifiedCriteria.map((crit, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border flex items-start gap-2 ${
                    crit.met
                      ? "bg-emerald-500/5 border-emerald-500/20 text-white"
                      : "bg-rose-500/5 border-rose-500/20 text-rose-300"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {crit.met ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-450" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs">{crit.met ? <span className="text-emerald-400">{crit.name}</span> : <span className="text-rose-300">{crit.name}</span>}</div>
                    <div className="text-[11px] text-slate-400 font-medium">{crit.detail}</div>
                  </div>
                </div>
              ))}
            </div>

            {!day10Result.isReady && day10Result.unresolvedBlockers.length > 0 && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-300 font-medium">
                <strong>Main blocker → Required next action: </strong>
                {day10Result.unresolvedBlockers[0]} is unresolved. {day10Result.recommendedAction}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#13151b] px-6 py-3.5 border-t border-white/10 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={onResetDemo}
              className="px-3 py-2 rounded-xl text-slate-300 hover:text-white font-bold hover:bg-white/5 transition-all cursor-pointer flex items-center gap-1.5 border border-white/10"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo to Baseline</span>
            </button>

            {onOpenSplash && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSplash();
                }}
                className="px-3 py-2 rounded-xl text-cyan-400 hover:text-cyan-300 font-bold hover:bg-cyan-500/10 transition-all cursor-pointer flex items-center gap-1.5 border border-cyan-500/20"
                title="Play Checkin Checkout Splash Screen Animation"
              >
                <span>✨ Replay Splash</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95 text-slate-950 font-black cursor-pointer shadow-sm active:scale-95 transition-all border border-white/10"
          >
            Close Demo Guide
          </button>
        </div>
      </div>
    </div>
  );
};
