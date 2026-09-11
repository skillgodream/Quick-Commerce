const fs = require('fs');

let file = fs.readFileSync('src/services/intelligence.ts', 'utf8');

file = file.replace(
  'const readinessScore = typeof hire.overallReadinessScore === "number"\n    ? (hire.overallReadinessScore <= 1 ? Math.round(hire.overallReadinessScore * 100) : Math.round(hire.overallReadinessScore))\n    : assessReadiness(capabilities, hire);',
  'const readinessScore = (typeof hire.overallReadinessScore === "number" ? (hire.overallReadinessScore <= 1 ? Math.round(hire.overallReadinessScore * 100) : Math.round(hire.overallReadinessScore)) : 0);'
);

fs.writeFileSync('src/services/intelligence.ts', file);
