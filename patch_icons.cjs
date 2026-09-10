const fs = require('fs');
let code = fs.readFileSync('src/components/LearnerDailyReportCard.tsx', 'utf8');

code = code.replace(/hidden sm:flex bg-white\/10 border border-white\/10 text-purple-300 flex items-center justify-center/g, 
  'hidden sm:flex bg-white/10 border border-white/10 text-purple-300 items-center justify-center');
code = code.replace(/hidden sm:flex bg-white\/10 border border-white\/10 text-cyan-300 flex items-center justify-center/g, 
  'hidden sm:flex bg-white/10 border border-white/10 text-cyan-300 items-center justify-center');
code = code.replace(/hidden sm:flex bg-white\/10 border border-white\/10 text-emerald-300 flex items-center justify-center/g, 
  'hidden sm:flex bg-white/10 border border-white/10 text-emerald-300 items-center justify-center');
code = code.replace(/hidden sm:flex bg-white\/10 border border-white\/10 text-blue-300 flex items-center justify-center/g, 
  'hidden sm:flex bg-white/10 border border-white/10 text-blue-300 items-center justify-center');

fs.writeFileSync('src/components/LearnerDailyReportCard.tsx', code);
