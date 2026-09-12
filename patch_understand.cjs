const fs = require("fs");
let content = fs.readFileSync("src/services/intelligence.ts", "utf8");

const understandSig = `function understand(
  observed: ObservedSignals,
  linkedEvidence: Record<number, SnapshotEvidenceItem[]>,
  hire: NewHire,
  capabilities: Record<number, CapabilityState>,
  existingAction?: RecommendedAction,
  candidatePattern?: CandidatePattern
): UnderstoodDiagnosis {`;

const proxySig = `function understandInternal(
  observed: ObservedSignals,
  linkedEvidence: Record<number, SnapshotEvidenceItem[]>,
  hire: NewHire,
  capabilities: Record<number, CapabilityState>,
  existingAction?: RecommendedAction
): UnderstoodDiagnosis {`;

content = content.replace(understandSig, proxySig);

const newUnderstand = `function understand(
  observed: ObservedSignals,
  linkedEvidence: Record<number, SnapshotEvidenceItem[]>,
  hire: NewHire,
  capabilities: Record<number, CapabilityState>,
  existingAction?: RecommendedAction,
  candidatePattern?: CandidatePattern
): UnderstoodDiagnosis {
  const diagnosis = understandInternal(observed, linkedEvidence, hire, capabilities, existingAction);
  
  if (candidatePattern && candidatePattern.isPattern && candidatePattern.category) {
    // Integrate the AI candidate pattern safely.
    // It enriches the diagnosisText rather than overriding the hard determinism of rootCause.
    diagnosis.diagnosisText += \` | Longitudinal Pattern (\${candidatePattern.category}): \${candidatePattern.supportingEvidence}\`;
  }
  
  return diagnosis;
}

function understandInternal`;

content = content.replace("function understandInternal", newUnderstand);
fs.writeFileSync("src/services/intelligence.ts", content);
console.log("Wrapped understand");
