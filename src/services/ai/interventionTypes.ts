import { RecommendedAction } from "../../types";
import { CanonicalEvidence, ObservedSignals, UnderstoodDiagnosis, LoopExecutionInput } from "../intelligence";

export type InterventionType = "KNOWN" | "CONTEXT_ADAPTED" | "NOVEL" | "ABSTAIN";

export interface AIInterventionCandidate {
  intervention_type: InterventionType;
  target_problem?: string;
  proposed_action?: string;
  why_this_action?: string;
  expected_effect?: string;
  required_evidence?: string[];
  risk_constraints?: string[];
  success_criteria?: string[];
  confidence: number;
  supporting_evidence_ids: string[];
  conflicting_evidence_ids: string[];
  requires_human_approval?: boolean;
}
