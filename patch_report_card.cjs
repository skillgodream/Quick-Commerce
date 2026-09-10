const fs = require('fs');

let content = fs.readFileSync('src/components/LearnerDailyReportCard.tsx', 'utf8');

// Replace padding and icon sizes to fit 4 columns on mobile
content = content.replace(/p-3 rounded-2xl/g, 'p-2 rounded-xl');
content = content.replace(/w-6 h-6 rounded-lg/g, 'w-5 h-5 rounded-md hidden sm:flex'); // Hide icon on very small mobile, or keep it if there's room. Let's make it stack instead.
content = content.replace(/text-xl font-black/g, 'text-base sm:text-lg font-black');
content = content.replace(/text-\[10px\] font-bold uppercase/g, 'text-[8px] sm:text-[9px] font-black uppercase tracking-tighter sm:tracking-wider truncate max-w-[50px] sm:max-w-full');

fs.writeFileSync('src/components/LearnerDailyReportCard.tsx', content);
