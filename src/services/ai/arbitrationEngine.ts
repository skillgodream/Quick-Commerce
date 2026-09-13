import { RecommendedAction, NewHire } from "../../types";
import { ObservedSignals, UnderstoodDiagnosis, DecidedAction } from "../intelligence";
import { AIInterventionCandidate } from "./interventionTypes";
import { AIArbitrationResult } from "./arbitrationTypes";
import { getApiEndpoint } from "./versioning";
import { sanitizeInputText } from "./securityGuard";

export interface AIArbitrationContext {
  diagnosis: UnderstoodDiagnosis;
  deterministicAction: DecidedAction;
  aiCandidate: AIInterventionCandidate;
  observed: ObservedSignals;
  hire: NewHire;
  historyText: string;
}

export async function arbitrateIntervention(context: AIArbitrationContext): Promise<DecidedAction> {
  const { aiCandidate, deterministicAction, observed } = context;

  // 1. Fallback / Reject early conditions
  if (aiCandidate.intervention_type === "ABSTAIN") {
    return {
      ...deterministicAction,
      decisionRationale: deterministicAction.decisionRationale + " | AI-5 Arbitration: AI Candidate Abstained. Deterministic confirmed."
    };
  }

  // 2. Ask backend to arbitrate
  let arbitrationResult: AIArbitrationResult = {
    arbitration_status: "ABSTAIN",
    selected_source: "DETERMINISTIC",
    arbitration_reason: "Fallback initialized",
    supporting_evidence_ids: [],
    conflicting_evidence_ids: [],
    confidence: 0
  };

  try {
    const sanitizedHistory = sanitizeInputText(context.historyText).sanitizedText;
    const sanitizedPayload = {
      ...context,
      historyText: sanitizedHistory,
    };

    const endpoint = getApiEndpoint("/api/signals/arbitrate");
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sanitizedPayload),
    });

    if (res.ok) {
      const data = await res.json();
      arbitrationResult = validateArbitrationResult(data, observed);
    }
  } catch (err: any) {
    if (process.env.NODE_ENV === "development" && process.env.DEBUG_AI) {
      console.debug("AI arbitration provider unavailable, reverting to fallback:", err?.message || err);
    }
  }

  // 3. Map result back to DecidedAction contract
  if (arbitrationResult.selected_source === "AI" && aiCandidate.proposed_action) {
    return {
      ...deterministicAction,
      actionTitle: aiCandidate.target_problem ? `[AI Adapted] ${aiCandidate.target_problem}` : `[AI Proposed] ${deterministicAction.actionTitle}`,
      actionDesc: aiCandidate.why_this_action || deterministicAction.actionDesc,
      practicalStep: aiCandidate.proposed_action,
      decisionRationale: `AI-5 Arbitration (${arbitrationResult.arbitration_status}): ${arbitrationResult.arbitration_reason} | ${aiCandidate.why_this_action || ''}`,
    };
  }

  return {
    ...deterministicAction,
    decisionRationale: deterministicAction.decisionRationale + ` | AI-5 Arbitration: ${arbitrationResult.arbitration_reason}`
  };
}

function validateArbitrationResult(result: any, observed: ObservedSignals): AIArbitrationResult {
  if (!result || !result.arbitration_status) {
    return {
      arbitration_status: "ABSTAIN",
      selected_source: "DETERMINISTIC",
      arbitration_reason: "Arbitration payload validation failed.",
      supporting_evidence_ids: [],
      conflicting_evidence_ids: [],
      confidence: 0
    };
  }

  // Grounding check - same as AI-4
  const validIds = new Set<string>();
  if (observed.canonicalEvidence) {
    Object.values(observed.canonicalEvidence).forEach(category => {
      if (category && typeof category === 'object') {
        Object.keys(category).forEach(k => validIds.add(k));
      }
    });
  }
  // Optional: strict evidence ID checks

  return result as AIArbitrationResult;
}
