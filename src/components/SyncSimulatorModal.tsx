import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  Link2,
  ExternalLink,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  ShieldCheck,
  HelpCircle,
  Database,
  Activity,
  Check,
  Globe,
  Settings2,
} from "lucide-react";
import {
  fetchSimulatorEvidence,
  getSimulatorEndpoint,
  setCustomSimulatorEndpoint,
  getCustomSimulatorEndpoint,
  DEFAULT_SIMULATOR_API_URL,
  SimulatorEvidenceItem,
} from "../services/simulatorEvidenceService";
import { NewHire } from "../types";

interface SyncSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  newHires: NewHire[];
  currentDay: number;
  onSyncAllCohort: () => Promise<void>;
  lastSyncedTimestamp?: string | null;
  isSyncing?: boolean;
}

export const SyncSimulatorModal: React.FC<SyncSimulatorModalProps> = ({
  isOpen,
  onClose,
  newHires,
  currentDay,
  onSyncAllCohort,
  lastSyncedTimestamp,
  isSyncing = false,
}) => {
  const [localSyncing, setLocalSyncing] = useState(false);
  const [endpointUrl, setEndpointUrl] = useState(getSimulatorEndpoint());
  const [customUrlInput, setCustomUrlInput] = useState(getCustomSimulatorEndpoint() || "");
  const [isEditingEndpoint, setIsEditingEndpoint] = useState(false);
  const [endpointSaveMsg, setEndpointSaveMsg] = useState<string | null>(null);

  const [rawRecords, setRawRecords] = useState<any[]>([]);
  const [syncStatus, setSyncStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeViewTab, setActiveViewTab] = useState<"overview" | "breakdown" | "endpoint">("overview");

  useEffect(() => {
    if (isOpen) {
      setEndpointUrl(getSimulatorEndpoint());
      setCustomUrlInput(getCustomSimulatorEndpoint() || "");
      loadPreviewData();
    }
  }, [isOpen]);

  const loadPreviewData = async () => {
    try {
      const ep = getSimulatorEndpoint();
      const res = await fetch(ep, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json) ? json : json.data || json.evidence || [];
        setRawRecords(list);
        setSyncStatus("success");
      } else {
        setSyncStatus("error");
        setStatusMessage(`HTTP ${res.status} from ${ep}`);
      }
    } catch (e: any) {
      setSyncStatus("error");
      setStatusMessage(e.message || "Failed to reach simulator endpoint");
    }
  };

  const handleTriggerSync = async () => {
    setLocalSyncing(true);
    setStatusMessage(null);
    try {
      await onSyncAllCohort();
      await loadPreviewData();
      setSyncStatus("success");
      setStatusMessage(`Successfully synced latest simulator records at ${new Date().toLocaleTimeString()}`);
    } catch (err: any) {
      setSyncStatus("error");
      setStatusMessage(err.message || "Sync encountered an issue");
    } finally {
      setLocalSyncing(false);
    }
  };

  const handleSaveEndpoint = () => {
    const trimmed = customUrlInput.trim();
    if (trimmed.length === 0) {
      setCustomSimulatorEndpoint(null);
      setEndpointUrl(DEFAULT_SIMULATOR_API_URL);
      setEndpointSaveMsg("Reset to default simulator endpoint.");
    } else {
      setCustomSimulatorEndpoint(trimmed);
      setEndpointUrl(trimmed);
      setEndpointSaveMsg("Custom simulator endpoint saved.");
    }
    setTimeout(() => {
      setEndpointSaveMsg(null);
      setIsEditingEndpoint(false);
      loadPreviewData();
    }, 1200);
  };

  if (!isOpen) return null;

  const syncingNow = isSyncing || localSyncing;

  // Group raw records by employee
  const employeesSummary = [
    { id: "EMP-001", name: "Rahul Sharma", alias: "Rahul" },
    { id: "EMP-002", name: "Priya Sundaram", alias: "Priya" },
    { id: "EMP-003", name: "Amit Verma", alias: "Amit" },
    { id: "EMP-004", name: "Diana / Sneha", alias: "Diana" },
  ].map((emp) => {
    const empRecords = rawRecords.filter((r) => {
      const sid = r.subject_id || r.employee_id || r.employeeId || "";
      return (
        sid === emp.id ||
        sid.toLowerCase().includes(emp.alias.toLowerCase()) ||
        sid.toLowerCase().includes(emp.id.toLowerCase())
      );
    });

    const dayRecords = empRecords.filter((r) => {
      const day = r.context?.journey_day ?? r.journey_day ?? r.journeyDay;
      return Number(day) === currentDay;
    });

    const pickVol = dayRecords.find((r) => r.type === "pick_volume")?.value;
    const pickVel = dayRecords.find((r) => r.type === "pick_velocity")?.value;
    const acc = dayRecords.find((r) => r.type === "accuracy_score")?.value;
    const errors = dayRecords.find((r) => r.type === "error_count")?.value;
    const assess = dayRecords.find((r) => r.type === "assessment_score")?.value;
    const timeTaken = dayRecords.find((r) => r.type === "time_taken")?.value;
    const note = dayRecords.find((r) => r.type === "supervisor_note")?.value;

    return {
      ...emp,
      totalCount: empRecords.length,
      dayCount: dayRecords.length,
      pickVol,
      pickVel,
      acc,
      errors,
      assess,
      timeTaken,
      note,
    };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#14161d] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#191c26]/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-inner">
              <RefreshCw className={`w-5 h-5 ${syncingNow ? "animate-spin text-cyan-300" : ""}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Simulator Sync & Push Hub
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Live Bridge
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Fetch updated metrics pushed from your SkillGo Club simulator app
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Action Banner */}
        <div className="px-5 py-4 bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-purple-950/20 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Target: Day {currentDay} Shift Telemetry</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300 font-normal">
                {rawRecords.length} records available in cloud
              </span>
            </div>
            {lastSyncedTimestamp && (
              <p className="text-[11px] text-slate-400 mt-0.5">
                Last synced: {lastSyncedTimestamp}
              </p>
            )}
          </div>

          <button
            id="sync-modal-primary-btn"
            onClick={handleTriggerSync}
            disabled={syncingNow}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncingNow ? "animate-spin" : ""}`} />
            <span>{syncingNow ? "Syncing Simulator Data..." : "Sync Simulator Now"}</span>
          </button>
        </div>

        {/* Status Alert (if any) */}
        {statusMessage && (
          <div
            className={`mx-5 mt-3 px-3.5 py-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 ${
              syncStatus === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                : "bg-rose-500/10 border-rose-500/20 text-rose-300"
            }`}
          >
            {syncStatus === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{statusMessage}</span>
          </div>
        )}

        {/* View Tabs */}
        <div className="px-5 pt-3 border-b border-white/5 flex gap-2">
          <button
            onClick={() => setActiveViewTab("overview")}
            className={`pb-2.5 text-xs font-bold border-b-2 px-1 transition-all cursor-pointer ${
              activeViewTab === "overview"
                ? "border-cyan-400 text-cyan-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Cohort Day {currentDay} Numbers
          </button>
          <button
            onClick={() => setActiveViewTab("breakdown")}
            className={`pb-2.5 text-xs font-bold border-b-2 px-1 transition-all cursor-pointer ${
              activeViewTab === "breakdown"
                ? "border-cyan-400 text-cyan-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Workflow Guide
          </button>
          <button
            onClick={() => setActiveViewTab("endpoint")}
            className={`pb-2.5 text-xs font-bold border-b-2 px-1 transition-all cursor-pointer ${
              activeViewTab === "endpoint"
                ? "border-cyan-400 text-cyan-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            API Endpoint Config
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: COHORT OVERVIEW */}
          {activeViewTab === "overview" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {employeesSummary.map((emp) => (
                  <div
                    key={emp.id}
                    className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-xs font-black text-white">{emp.name}</div>
                        <div className="text-[10px] text-cyan-400 font-mono">{emp.id}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-slate-300 border border-white/10">
                        {emp.dayCount} Day {currentDay} events
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5 text-[11px]">
                      <div className="bg-black/20 p-2 rounded-xl">
                        <span className="text-slate-400 block text-[10px]">Pick Volume</span>
                        <span className="font-bold text-slate-100">
                          {emp.pickVol !== undefined ? `${emp.pickVol} items/hr` : "No data"}
                        </span>
                      </div>
                      <div className="bg-black/20 p-2 rounded-xl">
                        <span className="text-slate-400 block text-[10px]">Pick Velocity</span>
                        <span className="font-bold text-slate-100">
                          {emp.pickVel !== undefined
                            ? `${Number(emp.pickVel).toFixed(1)} UPH`
                            : "No data"}
                        </span>
                      </div>
                      <div className="bg-black/20 p-2 rounded-xl">
                        <span className="text-slate-400 block text-[10px]">Accuracy Score</span>
                        <span className="font-bold text-emerald-400">
                          {emp.acc !== undefined ? `${emp.acc}%` : "No data"}
                        </span>
                      </div>
                      <div className="bg-black/20 p-2 rounded-xl">
                        <span className="text-slate-400 block text-[10px]">Assessment Score</span>
                        <span className="font-bold text-blue-400">
                          {emp.assess !== undefined ? `${emp.assess}%` : "No data"}
                        </span>
                      </div>
                    </div>

                    {emp.note && (
                      <div className="mt-2 text-[10px] text-slate-400 italic truncate">
                        Note: "{emp.note}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: WORKFLOW GUIDE */}
          {activeViewTab === "breakdown" && (
            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/15 space-y-2">
                <h4 className="font-bold text-cyan-300 flex items-center gap-1.5 text-sm">
                  <span>🔄</span> How the 2-Way Simulator Push Works
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed">
                  <li>
                    <strong className="text-white">Enter New Shift Numbers:</strong> In your SkillGo Club simulator app, update employee performance or journey status.
                  </li>
                  <li>
                    <strong className="text-white">Push/Submit Shift in Simulator:</strong> Click the publish or submit button in the simulator so records reach the cloud endpoint (<code className="text-cyan-300 bg-black/40 px-1 py-0.5 rounded text-[10px]">{endpointUrl}</code>).
                  </li>
                  <li>
                    <strong className="text-white">Click "Sync Simulator Now":</strong> Tap the sync button in this modal or in the top navigation bar.
                  </li>
                  <li>
                    <strong className="text-white">Instant Recalculation:</strong> The DEANCORE Six-Doctor intelligence engine instantly evaluates the new telemetry, updates cohort readiness, and generates recommended actions.
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 3: ENDPOINT CONFIG */}
          {activeViewTab === "endpoint" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-cyan-400" />
                      Active Simulator Endpoint
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Where Check-in fetches live simulator telemetry
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    GET Request
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 font-mono text-[11px] text-cyan-300 break-all">
                  {endpointUrl}
                </div>

                {!isEditingEndpoint ? (
                  <button
                    onClick={() => setIsEditingEndpoint(true)}
                    className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    <span>Change or Point to Custom Simulator URL</span>
                  </button>
                ) : (
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <label className="text-[11px] font-bold text-slate-300 block">
                      Custom Simulator API URL:
                    </label>
                    <input
                      type="url"
                      value={customUrlInput}
                      onChange={(e) => setCustomUrlInput(e.target.value)}
                      placeholder="https://your-custom-simulator.vercel.app/api/v1/evidence"
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/20 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSaveEndpoint}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer"
                      >
                        Save & Apply
                      </button>
                      <button
                        onClick={() => {
                          setCustomUrlInput("");
                          setCustomSimulatorEndpoint(null);
                          setEndpointUrl(DEFAULT_SIMULATOR_API_URL);
                          setIsEditingEndpoint(false);
                          loadPreviewData();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs cursor-pointer"
                      >
                        Reset to Default
                      </button>
                      <button
                        onClick={() => setIsEditingEndpoint(false)}
                        className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                    {endpointSaveMsg && (
                      <p className="text-[11px] text-emerald-400">{endpointSaveMsg}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#161822] flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Ready for live synchronizations</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
