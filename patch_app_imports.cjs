const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes('LearnerSideNav')) {
  content = content.replace(
    /import \{ LearnerSection \} from "\.\/components\/FloatingGlassMenu";/,
    'import { LearnerSection } from "./components/FloatingGlassMenu";\nimport { LearnerSideNav } from "./components/LearnerSideNav";'
  );
  
  const injectTarget = `<main className="flex-1 overflow-y-auto">
              {activeTab === "new_hire" && (`;
              
  const replacement = `<main className="flex-1 overflow-y-auto">
              {activeTab === "new_hire" && (
                <LearnerSideNav
                  activeSection={learnerSection}
                  onSelectSection={setLearnerSection}
                  isHindi={isHindi}
                />
              )}
              {activeTab === "new_hire" && (`;
              
  content = content.replace(injectTarget, replacement);
  fs.writeFileSync('src/App.tsx', content);
}
