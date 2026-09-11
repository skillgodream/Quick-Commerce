const fs = require('fs');
let file = fs.readFileSync('src/components/ModulesView.tsx', 'utf8');

file = file.replace(
  'const isModLocked =\n                  !isModCompleted &&\n                  activeDetailModule.dayNumber > modulesCompletedCount + 1;',
  'const isModLocked =\n                  (!isModCompleted && activeDetailModule.dayNumber > modulesCompletedCount + 1) ||\n                  checkDeanModuleGate(activeDetailModule, newHire).isGated;'
);

fs.writeFileSync('src/components/ModulesView.tsx', file);
