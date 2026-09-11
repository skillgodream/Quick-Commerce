const fs = require('fs');

let file = fs.readFileSync('src/components/NewHireView.tsx', 'utf8');

// Change the background of the home section to white
file = file.replace(
  '<div className="max-w-md mx-auto pb-36 select-none min-h-screen bg-[#EEEEEE] text-slate-900 relative font-ref antialiased">',
  '<div className="max-w-md mx-auto p-1.5 sm:p-2 pb-36 select-none min-h-screen bg-white text-slate-900 relative font-ref antialiased">'
);

// Change the blue hero banner to be a rounded card instead of full-bleed at top
file = file.replace(
  '<div className="bg-gradient-to-b from-[#0E4AA9] to-[#021F54] rounded-b-[40px] px-4 pt-5 pb-12 mb-7 shadow-xl flex flex-col text-white border-b border-blue-500/20 relative overflow-hidden">',
  '<div className="bg-gradient-to-b from-[#0E4AA9] to-[#021F54] rounded-[40px] px-5 pt-5 pb-12 mb-7 shadow-xl flex flex-col text-white border border-blue-500/20 relative overflow-hidden">'
);

fs.writeFileSync('src/components/NewHireView.tsx', file);
