const fs = require('fs');

let file = fs.readFileSync('src/components/TodaysGoalLandingView.tsx', 'utf8');

file = file.replace(
  'typeof newHire.overallReadinessScore === "number"\n      ? newHire.overallReadinessScore <= 1\n        ? Math.round(newHire.overallReadinessScore * 100)\n        : Math.round(newHire.overallReadinessScore)\n      : (newHire.capabilities ? assessReadiness(newHire.capabilities, newHire) : 0);',
  '(typeof newHire.overallReadinessScore === "number" ? (newHire.overallReadinessScore <= 1 ? Math.round(newHire.overallReadinessScore * 100) : Math.round(newHire.overallReadinessScore)) : 0);'
);

file = file.replace(/import\s*\{\s*[^}]*assessReadiness[^}]*\}\s*from\s*"[^"]+intelligence";?/g, '');

fs.writeFileSync('src/components/TodaysGoalLandingView.tsx', file);
