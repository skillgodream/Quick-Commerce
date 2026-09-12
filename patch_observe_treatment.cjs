const fs = require("fs");
let content = fs.readFileSync("src/services/intelligence.ts", "utf8");

const target1 = `  previousInterventionFailed: boolean;`;
const rep1 = `  previousInterventionFailed: boolean;
  previousInterventionPartial: boolean;
  previousTreatmentContext?: string;`;

const target2 = `  const previousInterventionFailed =`;
const rep2 = `  const prevOutcome = actionOutcome || previousRecord?.actionOutcome;
  const previousInterventionPartial = Boolean(prevOutcome?.improved === "partial");
  let previousTreatmentContext = undefined;
  if (prevOutcome?.treatmentContext?.reason) {
     previousTreatmentContext = \`Previous treatment (\${prevOutcome.improved}): \${prevOutcome.treatmentContext.reason}\`;
  }
  
  const previousInterventionFailed =`;

if (content.includes(target1)) content = content.replace(target1, rep1);
if (content.includes(target2)) content = content.replace(target2, rep2);

fs.writeFileSync("src/services/intelligence.ts", content);
console.log("Patched observe() with treatment context");
