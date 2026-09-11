const fs = require('fs');

const files = [
  'src/components/TelemetryDialModal.tsx',
  'src/components/NewHireView.tsx',
  'src/components/DailyCoachReportView.tsx',
  'src/components/TenDaySkillJourneyView.tsx',
  'src/components/ModulesView.tsx',
  'src/components/JobReadyHumanFigure.tsx',
  'src/components/TodaysGoalLandingView.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace import { assessReadiness } from "../services/intelligence";
  content = content.replace(/import\s*\{\s*[^}]*assessReadiness[^}]*\}\s*from\s*"[^"]+intelligence";?/g, (match) => {
    // If it's importing other things, keep them, remove assessReadiness
    let inner = match.match(/\{([^}]+)\}/)[1];
    let newInner = inner.split(',').map(s => s.trim()).filter(s => s !== 'assessReadiness').join(', ');
    if (newInner.length === 0) {
      return '';
    }
    return match.replace(inner, newInner);
  });
  
  // Replace the ternary or specific calls
  content = content.replace(/typeof\s+(newHire|activeHire)\.overallReadinessScore\s*===\s*"number"\s*\?\s*\(\1\.overallReadinessScore\s*<=\s*1\s*\?\s*Math\.round\(\1\.overallReadinessScore\s*\*\s*100\)\s*:\s*Math\.round\(\1\.overallReadinessScore\)\)\s*:\s*(?:\(\1\.capabilities\s*\?\s*assessReadiness\([^)]+\)\s*:\s*(undefined|0)\)|assessReadiness\([^)]+\))/g, 
    '(typeof $1.overallReadinessScore === "number" ? ($1.overallReadinessScore <= 1 ? Math.round($1.overallReadinessScore * 100) : Math.round($1.overallReadinessScore)) : 0)');

  // There might be some line breaks or variations. 
  fs.writeFileSync(file, content);
}
