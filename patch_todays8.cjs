const fs = require('fs');

let file = fs.readFileSync('src/components/TodaysGoalLandingView.tsx', 'utf8');

// The replacement done in patch_todays7 might not have worked depending on how the metrics are rendered. Let's make sure there are no .toFixed(1) anywhere in that component.

file = file.replace(/\.toFixed\(1\)/g, '.toFixed(0)');
file = file.replace(/\.toFixed\(2\)/g, '.toFixed(0)');

fs.writeFileSync('src/components/TodaysGoalLandingView.tsx', file);
