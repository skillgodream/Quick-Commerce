const fs = require('fs');
let content = fs.readFileSync('src/components/Header.tsx', 'utf8');

content = content.replace(
  /Eye,/g,
  'Eye,\n  ShieldCheck,'
);

fs.writeFileSync('src/components/Header.tsx', content);
