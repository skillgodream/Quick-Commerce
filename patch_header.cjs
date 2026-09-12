const fs = require('fs');
let content = fs.readFileSync('src/components/Header.tsx', 'utf8');

content = content.replace(
  /<Eye className="w-4 h-4 stroke-\[2\.2\]" \/>/g,
  '<ShieldCheck className="w-4 h-4 stroke-[2.2]" />'
);

fs.writeFileSync('src/components/Header.tsx', content);
