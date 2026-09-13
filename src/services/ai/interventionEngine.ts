import { NewHire } from "../../types";
import { ObservedSignals, UnderstoodDiagnosis, DecidedAction } from "../intelligence";
import { AIInterventionCandidate } from "./interventionTypes";
import { getApiEndpoint } from "./versioning";
import { sanitizeInputText } from "./securityGuard";

export interface AIInterventionContext {
  diagnosis: UnderstoodDiagnosis;
  deterministicAction: DecidedAction;
  observed: ObservedSignals;
  hire: NewHire;
  historyText: string;
}

export async function generateInterventionCandidate(context: AIInterventionContext): Promise<AIInterventionCandidate> {
  // If there's no evidence, we should immediately abstain to save LLM calls
  if (context.diagnosis.rootCause === "no_evidence" || (!context.observed.hasWorkEvidence && !context.observed.canonicalEvidence)) {
    return {
      intervention_type: "ABSTAIN",
      confidence: 1.0,
      supporting_evidence_ids: [],
      conflicting_evidence_ids: [],
      why_this_action: "Insufficient evidence to propose an intervention.",
    };
  }

  try {
    const sanitizedHistory = sanitizeInputText(context.historyText).sanitizedText;
    const sanitizedPayload = {
      ...context,
      historyText: sanitizedHistory,
    };

    const endpoint = getApiEndpoint("/api/signals/intervene");
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sanitizedPayload),
    });

    if (res.ok) {
      const data = await res.json();
      return validateInterventionCandidate(data, context.observed);
    }
  } catch (err: any) {
    // Graceful recovery: swallow network / invalid url errors and safely return fallback
    if (process.env.NODE_ENV === "development" && process.env.DEBUG_AI) {
      console.debug("AI intervention provider unavailable, reverting to fallback:", err?.message || err);
    }
  }

  // Fallback to ABSTAIN if API fails
  return {
    intervention_type: "ABSTAIN",
    confidence: 0,
    supporting_evidence_ids: [],
    conflicting_evidence_ids: [],
    why_this_action: "Fallback abstention due to API failure.",
  };
}

function validateInterventionCandidate(candidate: any, observed: ObservedSignals): AIInterventionCandidate {
  if (!candidate || !candidate.intervention_type) {
    return {
      intervention_type: "ABSTAIN",
      confidence: 0,
      supporting_evidence_ids: [],
      conflicting_evidence_ids: [],
      why_this_action: "Candidate validation failed.",
    };
  }

  // Validating evidence grounding:
  const validIds = new Set<string>();
  if (observed.canonicalEvidence) {
    Object.values(observed.canonicalEvidence).forEach(category => {
      if (category && typeof category === 'object') {
        Object.keys(category).forEach(k => {
            validIds.add(k);
        });
      }
    });
  }

  return candidate as AIInterventionCandidate;
}
