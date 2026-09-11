const fs = require('fs');

const files = [
  'src/components/ClientDemoModal.tsx',
  'src/components/NewHireView.tsx',
  'src/components/CommercialCertificationCard.tsx',
  'src/components/JobReadyHumanFigure.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Replace import
  content = content.replace(/import\s*\{\s*[^}]*evaluateDay10Outcome[^}]*\}\s*from\s*"[^"]+intelligence";?/g, (match) => {
    let inner = match.match(/\{([^}]+)\}/)[1];
    let newInner = inner.split(',').map(s => s.trim()).filter(s => s !== 'evaluateDay10Outcome').join(', ');
    if (newInner.length === 0) return '';
    return match.replace(inner, newInner);
  });

  // Replace usages
  content = content.replace(/evaluateDay10Outcome\((newHire|currentHire|[^)]+)\)/g, '($1.day10Evaluation || { isCommercialReady: false, reasons: [], criteria: {} })');

  fs.writeFileSync(file, content);
}
