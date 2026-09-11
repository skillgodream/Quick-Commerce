const fs = require('fs');

let file = fs.readFileSync('src/components/TodaysGoalLandingView.tsx', 'utf8');

// 1. Remove decimals from shift metrics (use Math.round instead of toFixed(1) or direct float)
// We need to find the specific Live Shift Metrics area. Let's do a broad replace for common metric displays

file = file.replace(
  /{actualPickRate}/g,
  '{Math.round(actualPickRate)}'
);

file = file.replace(
  /{targetPickRate}/g,
  '{Math.round(targetPickRate)}'
);

file = file.replace(
  /{accuracyRate}/g,
  '{Math.round(accuracyRate)}'
);

file = file.replace(
  /{ordersCompleted}/g,
  '{Math.round(ordersCompleted)}'
);

file = file.replace(
  /{targetOrders}/g,
  '{Math.round(targetOrders)}'
);

fs.writeFileSync('src/components/TodaysGoalLandingView.tsx', file);
