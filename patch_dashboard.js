const fs = require('fs');
let file = fs.readFileSync('src/components/DashboardHeader.tsx', 'utf8');

file = file.replace(
  '<span className="text-[10px] sm:text-[11px] font-black text-[#1c1c1c] leading-none text-center">',
  '<span className="text-[12px] font-black text-[#1c1c1c] truncate max-w-full text-center">'
);

fs.writeFileSync('src/components/DashboardHeader.tsx', file);
