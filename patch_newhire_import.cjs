const fs = require('fs');
let content = fs.readFileSync('src/components/NewHireView.tsx', 'utf8');

if (!content.includes('LearnerDashboardView')) {
  content = content.replace(
    /import \{ ControlTowerView \} from "\.\/ControlTowerView";/,
    'import { ControlTowerView } from "./ControlTowerView";\nimport { LearnerDashboardView } from "./LearnerDashboardView";'
  );
  
  content = content.replace(
    /\{activeSection === "dashboard" && \(/,
    '{activeSection === "learner_dashboard" && (\n        <div className="relative z-10 animate-in fade-in duration-200">\n          <LearnerDashboardView newHire={newHire} currentDay={currentDay} />\n        </div>\n      )}\n      {activeSection === "dashboard" && ('
  );
  
  fs.writeFileSync('src/components/NewHireView.tsx', content);
}
