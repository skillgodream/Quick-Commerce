const fs = require("fs");
let content = fs.readFileSync("src/services/intelligence.ts", "utf8");

const target = `function chooseNextAction(
  understood: UnderstoodDiagnosis,
  connected: ConnectedContext,
  hire: NewHire,
  observed: ObservedSignals,
  capabilities: Record<number, CapabilityState>
): DecidedAction {`;

const rep = `function chooseNextActionInternal(
  understood: UnderstoodDiagnosis,
  connected: ConnectedContext,
  hire: NewHire,
  observed: ObservedSignals,
  capabilities: Record<number, CapabilityState>
): DecidedAction {`;

const callTarget = `  const decided = chooseNextAction(`;
const callRep = `  const decided = chooseNextActionInternal(`;

if (content.includes(target)) {
    content = content.replace(target, rep);
    
    // Now create a new chooseNextAction wrapper
    const newWrapper = `function chooseNextAction(
  understood: UnderstoodDiagnosis,
  connected: ConnectedContext,
  hire: NewHire,
  observed: ObservedSignals,
  capabilities: Record<number, CapabilityState>
): DecidedAction {
  const result = chooseNextActionInternal(understood, connected, hire, observed, capabilities);
  
  // Append treatment memory to rationale if relevant
  if (observed.previousTreatmentContext && result.decisionRationale && result.decisionType !== "no_action_monitor") {
    result.decisionRationale += \` | Context from memory: \${observed.previousTreatmentContext}\`;
  }
  return result;
}

function chooseNextActionInternal`;

    content = content.replace("function chooseNextActionInternal", newWrapper);
    
    fs.writeFileSync("src/services/intelligence.ts", content);
    console.log("Wrapped chooseNextAction");
} else {
    console.log("Could not find chooseNextAction");
}
