const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /: activeTab === "new_hire" && learnerSection === "dashboard" \|\| learnerSection === "learner_dashboard" \?/,
  ': activeTab === "new_hire" && (learnerSection === "dashboard" || learnerSection === "learner_dashboard") ?'
);

fs.writeFileSync('src/App.tsx', content);
