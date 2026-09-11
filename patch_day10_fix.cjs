const fs = require('fs');

const files = [
  'src/components/ClientDemoModal.tsx',
  'src/components/NewHireView.tsx',
  'src/components/CommercialCertificationCard.tsx',
  'src/components/JobReadyHumanFigure.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Look for our previous patch replacing with fallback { isCommercialReady: false, reasons: [], criteria: {} }
  // We should actually provide the full Day10EvaluationResult fallback:
  // { isCommercialReady: false, isReady: false, reasons: [], unresolvedBlockers: [], criteria: {} }
  
  content = content.replace(
    /\{ isCommercialReady: false, reasons: \[\], criteria: \{\} \}/g, 
    '{ isCommercialReady: false, isReady: false, reasons: [], unresolvedBlockers: [], criteria: {} }'
  );

  fs.writeFileSync(file, content);
}
