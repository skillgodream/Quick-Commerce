const fs = require('fs');

let file = fs.readFileSync('src/components/DashboardHeader.tsx', 'utf8');

// The header is currently full-bleed
const oldHeader = `<header
        id="dashboard-header-banner"
        className="-mx-4 -mt-3 pt-6 pb-2 px-4 sm:px-5 relative select-none"
      >
        <div className="relative z-10 space-y-6">`;

const newHeader = `<header
        id="dashboard-header-banner"
        className="px-1.5 sm:px-2 pt-1.5 sm:pt-2 pb-2 relative select-none"
      >
        <div className="relative z-10 bg-[#e5e5e5] rounded-[40px] p-5 sm:p-6 shadow-sm border border-slate-200/80 space-y-6">`;

file = file.replace(oldHeader, newHeader);

// Adjust the inner grid of pillars to match the new padding inside the card.
// Wait, the grid was already inside `space-y-6` so it's fine.

fs.writeFileSync('src/components/DashboardHeader.tsx', file);
