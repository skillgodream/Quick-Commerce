const fs = require("fs");
let content = fs.readFileSync("src/services/intelligence.ts", "utf8");

const targetCall = `const understood = understand(observed, linkedEvidence, input.hire, observed.currentCapabilities, input.existingAction);`;
const repCall = `const understood = understand(observed, linkedEvidence, input.hire, observed.currentCapabilities, input.existingAction, input.candidatePattern);`;

content = content.replace(targetCall, repCall);

const targetSig = `function understand(
  observed: ObservedSignals,
  linkedEvidence: Record<number, SnapshotEvidenceItem[]>,
  hire: NewHire,
  capabilities: Record<number, CapabilityState>,
  existingAction?: RecommendedAction
): UnderstoodDiagnosis {`;

const repSig = `function understand(
  observed: ObservedSignals,
  linkedEvidence: Record<number, SnapshotEvidenceItem[]>,
  hire: NewHire,
  capabilities: Record<number, CapabilityState>,
  existingAction?: RecommendedAction,
  candidatePattern?: CandidatePattern
): UnderstoodDiagnosis {`;

content = content.replace(targetSig, repSig);
fs.writeFileSync("src/services/intelligence.ts", content);
console.log("Patched understand signature");
