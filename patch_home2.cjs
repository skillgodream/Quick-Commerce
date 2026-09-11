const fs = require('fs');

let file = fs.readFileSync('src/components/NewHireView.tsx', 'utf8');

// The dashboard container in NewHireView.tsx has bg-[#EEEEEE] and some negative margins.
// We'll change it to bg-white.
file = file.replace(
  'className="space-y-4 animate-in fade-in duration-200 bg-[#EEEEEE] text-slate-900 min-h-screen pb-36 px-4 pt-4 -mx-4 -my-3"',
  'className="space-y-4 animate-in fade-in duration-200 bg-white text-slate-900 min-h-screen pb-36 px-0 pt-0 -mx-4 -my-3"'
);

fs.writeFileSync('src/components/NewHireView.tsx', file);
