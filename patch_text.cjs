const fs = require('fs');
let file = fs.readFileSync('src/components/TodaysGoalLandingView.tsx', 'utf8');

file = file.replace(
  '{isHindi ? "कोर्स पूरा हुआ" : "Course Completion"}',
  '{isHindi ? "आज के कार्य पूर्णता" : "Today\'s Task Completion"}'
);

file = file.replace(
  '<div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">',
  '<div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform animate-pulse">'
);

fs.writeFileSync('src/components/TodaysGoalLandingView.tsx', file);
