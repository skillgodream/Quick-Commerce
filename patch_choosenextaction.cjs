const fs = require("fs");
let content = fs.readFileSync("src/services/intelligence.ts", "utf8");

const target = `  if (understood.rootCause === "no_evidence") {`;
const rep = `  // Append treatment memory to rationale if relevant
  const memorySuffix = observed.previousTreatmentContext ? \` | Context from memory: \${observed.previousTreatmentContext}\` : "";

  if (understood.rootCause === "no_evidence") {`;

// Replace all instances of decisionRationale assignments to append memorySuffix, but let's do it dynamically at the end of chooseNextAction?
const targetEnd = `  return {
    decisionType: "advance_default",
    targetCapId: hire.currentCapabilityId || targetCapDef.id,
    targetActor: \`Manager (\${supervisorName})\`,
    urgency: "Monitor",
    actionTitle: "Maintain Autonomy & Ramp Pace",
    actionDesc:
      "Learner is currently outpacing thresholds for their cohort day. Continue standard route dispatch.",
    practicalStep: "Maintain standard batch dispatch.",
    decisionRationale: "Exceeding accuracy and speed targets on core capabilities.",
    interimStatus: "Doing well",
    interimStatusReason: "Outpacing ramp standard; maintain normal floor dispatch.",
  };
}`;
const repEnd = `  const result: DecidedAction = {
    decisionType: "advance_default",
    targetCapId: hire.currentCapabilityId || targetCapDef.id,
    targetActor: \`Manager (\${supervisorName})\`,
    urgency: "Monitor",
    actionTitle: "Maintain Autonomy & Ramp Pace",
    actionDesc:
      "Learner is currently outpacing thresholds for their cohort day. Continue standard route dispatch.",
    practicalStep: "Maintain standard batch dispatch.",
    decisionRationale: "Exceeding accuracy and speed targets on core capabilities.",
    interimStatus: "Doing well",
    interimStatusReason: "Outpacing ramp standard; maintain normal floor dispatch.",
  };
  
  if (memorySuffix) {
    result.decisionRationale += memorySuffix;
  }
  return result;
}`;

// I actually want to apply memorySuffix to ALL early returns inside chooseNextAction!
// Let's create a proxy function or replace all `return {` inside `chooseNextAction` with `let result = {`, then at the end `if (memorySuffix) result.decisionRationale += memorySuffix; return result;`

