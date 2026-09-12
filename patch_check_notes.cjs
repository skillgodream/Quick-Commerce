const fs = require("fs");
let content = fs.readFileSync("src/services/intelligence.ts", "utf8");

const target1 = `      capState.notes = \`Intervention closed: \${actionOutcome.notes || "Standard met on floor"}\`;`;
const rep1 = `      capState.notes = \`Intervention closed: \${actionOutcome.notes || "Standard met on floor"}\`;
      if (actionOutcome.treatmentContext?.reason) {
        capState.notes += \` | Context: \${actionOutcome.treatmentContext.reason}\`;
      }`;

const target2 = `      capState.notes = \`Partial recovery (\${outcomePickRate}/hr). Continued practice required.\`;`;
const rep2 = `      capState.notes = \`Partial recovery (\${outcomePickRate}/hr). Continued practice required.\`;
      if (actionOutcome.treatmentContext?.reason) {
        capState.notes += \` | Context: \${actionOutcome.treatmentContext.reason}\`;
      }`;

const target3 = `      capState.notes = "Intervention failed to close gap. Must reassess approach.";`;
const rep3 = `      capState.notes = "Intervention failed to close gap. Must reassess approach.";
      if (actionOutcome.treatmentContext?.reason) {
        capState.notes += \` | Context: \${actionOutcome.treatmentContext.reason}\`;
      }`;

if (content.includes(target1)) content = content.replace(target1, rep1);
if (content.includes(target2)) content = content.replace(target2, rep2);
if (content.includes(target3)) content = content.replace(target3, rep3);

fs.writeFileSync("src/services/intelligence.ts", content);
console.log("Patched capState notes in check()");
