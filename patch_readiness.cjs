const fs = require('fs');

function replaceAssessReadiness(filePath) {
  let file = fs.readFileSync(filePath, 'utf8');
  file = file.replace(
    /typeof newHire\.overallReadinessScore === "number"[^:]+:\s*\(newHire\.capabilities \? assessReadiness\(newHire\.capabilities, newHire\) : \d+\)/g,
    'newHire.overallReadinessScore || 0'
  );
  file = file.replace(
    /typeof newHire\.overallReadinessScore === "number"[^:]+:\s*assessReadiness\(capabilities, newHire\)/g,
    'newHire.overallReadinessScore || 0'
  );
  // Also remove unused assessReadiness imports
  file = file.replace(/,\s*assessReadiness\b/g, '');
  file = file.replace(/\bassessReadiness,\s*/g, '');
  file = file.replace(/import \{ assessReadiness \} from "\.\.\/services\/intelligence";\n/g, '');
  fs.writeFileSync(filePath, file);
}

replaceAssessReadiness('src/components/NewHireView.tsx');
replaceAssessReadiness('src/components/TelemetryDialModal.tsx');
replaceAssessReadiness('src/components/DailyCoachReportView.tsx');
replaceAssessReadiness('src/components/TodaysGoalLandingView.tsx');
replaceAssessReadiness('src/components/ModulesView.tsx');
replaceAssessReadiness('src/components/JobReadyHumanFigure.tsx');

