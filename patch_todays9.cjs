const fs = require('fs');

let file = fs.readFileSync('src/components/TodaysGoalLandingView.tsx', 'utf8');

// There is one hardcoded '98.5%' value in QC Check
file = file.replace(
  '<span className="text-2xl sm:text-[26px] font-normal text-slate-950 leading-none inline-block transform scale-y-[1.38] scale-x-[1.06] origin-center tracking-tight">\n                    98.5%\n                  </span>',
  '<span className="text-2xl sm:text-[26px] font-normal text-slate-950 leading-none inline-block transform scale-y-[1.38] scale-x-[1.06] origin-center tracking-tight">\n                    99%\n                  </span>'
);

fs.writeFileSync('src/components/TodaysGoalLandingView.tsx', file);
