const fs = require('fs');
let file = fs.readFileSync('src/components/NewHireView.tsx', 'utf8');

file = file.replace(
  '  const readinessEval = (\n    newHire,\n    yesterdayRecord?.workSignal,\n    yesterdayRecord?.dailySignal,\n    yesterdayRecord?.managerSignal\n  .day10Evaluation || { isCommercialReady: false, isReady: false, reasons: [], unresolvedBlockers: [], criteria: {} });',
  '  const readinessEval = (newHire.day10Evaluation || { isCommercialReady: false, isReady: false, reasons: [], unresolvedBlockers: [], criteria: {} });'
);

fs.writeFileSync('src/components/NewHireView.tsx', file);
