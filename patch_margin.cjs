const fs = require('fs');

let file = fs.readFileSync('src/components/TodaysGoalLandingView.tsx', 'utf8');

// The main container
file = file.replace(
  '<div className="max-w-md mx-auto px-3 sm:px-4 space-y-3.5 pt-3 sm:pt-4">',
  '<div className="max-w-md mx-auto px-1.5 sm:px-2 space-y-3.5 pt-1.5 sm:pt-2">'
);

// The hero banner border radius
file = file.replace(
  'id="circular-telemetry-dial-widget"\n            className="bg-[#e5e5e5] rounded-[24px] px-5 py-3.5 shadow-sm space-y-2 select-none relative overflow-hidden text-black border border-slate-300/80"',
  'id="circular-telemetry-dial-widget"\n            className="bg-[#e5e5e5] rounded-[36px] px-5 py-4 shadow-sm space-y-2 select-none relative overflow-hidden text-black border border-slate-300/80"'
);

fs.writeFileSync('src/components/TodaysGoalLandingView.tsx', file);
