const fs = require('fs');
let content = fs.readFileSync('src/services/intelligence.ts', 'utf8');

content = content.replace(
  /if \(decisionType === "reinforce_current" \|\| decisionType === "return_prerequisite"\) \{/,
  'if (decisionType === "reinforce_current" || decisionType === "return_prerequisite" || decisionType === "supervisor_demo" || decisionType === "communication_support") {'
);

fs.writeFileSync('src/services/intelligence.ts', content);
