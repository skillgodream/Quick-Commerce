const fs = require('fs');
let content = fs.readFileSync('src/components/NewHireView.tsx', 'utf8');

content = content.replace(
  /<Eye className="w-5 h-5 text-white" \/>/g,
  '<ShieldCheck className="w-5 h-5 text-white" />'
);

fs.writeFileSync('src/components/NewHireView.tsx', content);
