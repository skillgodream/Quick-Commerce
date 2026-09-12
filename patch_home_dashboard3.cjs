const fs = require('fs');
let content = fs.readFileSync('src/components/NewHireView.tsx', 'utf8');

content = content.replace(
  /if \(onSelectSection\) onSelectSection\("learner_dashboard"\);/,
  'setActiveSection("learner_dashboard");'
);

fs.writeFileSync('src/components/NewHireView.tsx', content);
