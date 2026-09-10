const fs = require('fs');

let content = fs.readFileSync('src/components/NewHireView.tsx', 'utf8');
content = content.replace(
  '<div className="flex justify-center mt-2 pb-2 relative z-10">',
  '<div className="flex justify-start mt-2 pb-2 relative z-10 pl-4">'
);

fs.writeFileSync('src/components/NewHireView.tsx', content);
