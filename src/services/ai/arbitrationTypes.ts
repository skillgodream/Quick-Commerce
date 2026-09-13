import { RecommendedAction } from "../../types";
import { CanonicalEvidence, ObservedSignals, UnderstoodDiagnosis, LoopExecutionInput, DecidedAction } from "../intelligence";
import { AIInterventionCandidate } from "./interventionTypes";

export type ArbitrationDecision = "DETERMINISTIC_CONFIRMED" | "AI_SUPPORTED" | "AI_NOVEL_ACCEPTED" | "AI_REJECTED" | "CONFLICT" | "INSUFFICIENT" | "ABSTAIN";

export interface AIArbitrationResult {
  arbitration_status: ArbitrationDecision;
  selected_source: "DETERMINISTIC" | "AI" | "ABSTAIN";
  arbitration_reason: string;
  supporting_evidence_ids: string[];
  conflicting_evidence_ids: string[];
  confidence: number;
  requires_human_approval?: boolean;
}
