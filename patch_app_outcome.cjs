const fs = require("fs");
let content = fs.readFileSync("src/App.tsx", "utf8");

// First, make sure we import analyzeOutcomeNotes
const importTarget = `import { executeCoordinationLoop, askCompanion } from "./services/intelligence";`;
const importReplacement = `import { executeCoordinationLoop, askCompanion, analyzeOutcomeNotes } from "./services/intelligence";`;

content = content.replace(importTarget, importReplacement);

const target = `  const handleActionOutcomeRecorded = (hireId: string, outcome: ActionOutcome) => {
    updateHireAndRecalculate(hireId, currentDay, (currentRecord) => {`;
const replacement = `  const handleActionOutcomeRecorded = async (hireId: string, outcome: ActionOutcome) => {
    
    // Add AI Outcome Interpretation
    let treatmentContext = undefined;
    if (outcome.notes) {
       // Get the action title if available
       const hire = newHires.find(h => h.id === hireId);
       const currentRecord = hire?.daysHistory.find(d => d.dayNumber === currentDay);
       const actionTitle = currentRecord?.recommendedAction?.title;
       treatmentContext = await analyzeOutcomeNotes(outcome.notes, actionTitle);
    }
    
    const augmentedOutcome = { ...outcome, treatmentContext };

    updateHireAndRecalculate(hireId, currentDay, (currentRecord) => {`;

const finalOutcomeReplacementTarget = `        actionOutcome: outcome,`;
const finalOutcomeReplacement = `        actionOutcome: augmentedOutcome,`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    content = content.replace(finalOutcomeReplacementTarget, finalOutcomeReplacement);
    fs.writeFileSync("src/App.tsx", content);
    console.log("Patched App.tsx with async handleActionOutcomeRecorded");
} else {
    console.log("Could not find target in App.tsx");
}
