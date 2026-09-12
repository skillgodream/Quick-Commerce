const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /learnerSection === "dashboard" \|\| learnerSection === "dial"/,
  'learnerSection === "dashboard" || learnerSection === "dial" || learnerSection === "learner_dashboard"'
);

content = content.replace(
  /learnerSection === "dashboard"\s*\?/,
  'learnerSection === "dashboard" || learnerSection === "learner_dashboard" ?'
);

fs.writeFileSync('src/App.tsx', content);
