const fs = require('fs');
let content = fs.readFileSync('src/components/LearnerSideNav.tsx', 'utf8');

content = content.replace(/Navigation/g, 'Menu');

fs.writeFileSync('src/components/LearnerSideNav.tsx', content);
