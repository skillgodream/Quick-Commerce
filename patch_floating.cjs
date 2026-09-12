const fs = require('fs');
let content = fs.readFileSync('src/components/FloatingGlassMenu.tsx', 'utf8');

const progressBlock = `    {
      id: "progress",
      labelEn: "Progress",
      labelHi: "प्रगति",
      icon: <Target className="w-5 h-5 stroke-[1.8]" />,
    },`;

const learnerDashBlock = `    {
      id: "learner_dashboard",
      labelEn: "My Status",
      labelHi: "मेरी स्थिति",
      icon: <Compass className="w-5 h-5 stroke-[1.8]" />,
    },`;

content = content.replace(progressBlock, '');
content = content.replace(learnerDashBlock, '');

fs.writeFileSync('src/components/FloatingGlassMenu.tsx', content);
