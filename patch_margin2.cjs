const fs = require('fs');

let file = fs.readFileSync('src/components/TodaysGoalLandingView.tsx', 'utf8');

// 1. Change the main page background to white so the margin looks like "white space"
file = file.replace(
  '<div className="min-h-screen bg-[#eef0f4] text-slate-900 pb-28 select-none relative font-sans">',
  '<div className="min-h-screen bg-white text-slate-900 pb-28 select-none relative font-sans">'
);

// 2. Adjust the padding of the main content container to be very small, and the spacing
file = file.replace(
  '<div className="max-w-md mx-auto px-1.5 sm:px-2 space-y-3.5 pt-1.5 sm:pt-2">',
  '<div className="max-w-md mx-auto p-1.5 sm:p-2 space-y-3">'
);

// 3. Make the hero banner look more like the screenshot (huge rounded corners at the top, if it's the hero banner)
// Actually the screenshot has large border-radius all around. Let's make it rounded-[40px]
file = file.replace(
  'className="bg-[#e5e5e5] rounded-[36px] px-5 py-4 shadow-sm space-y-2 select-none relative overflow-hidden text-black border border-slate-300/80"',
  'className="bg-[#e5e5e5] rounded-[40px] px-5 py-5 shadow-sm space-y-2 select-none relative overflow-hidden text-black border border-slate-200/80"'
);

// 4. Update the Course Completion card to sit neatly underneath with the same width
// The Course Completion card has `mx-2` which might make it narrower than the hero banner. Let's remove `mx-2`.
file = file.replace(
  '<div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col gap-2.5 mx-2">',
  '<div className="bg-white rounded-[32px] p-5 shadow-sm border border-slate-200 flex flex-col gap-3">'
);

fs.writeFileSync('src/components/TodaysGoalLandingView.tsx', file);
