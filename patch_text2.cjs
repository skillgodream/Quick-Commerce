const fs = require('fs');
let file = fs.readFileSync('src/components/NewHireView.tsx', 'utf8');

file = file.replace(
  '{isHindi ? "कोर्स पूर्णता" : "Course Completion"}',
  '{isHindi ? "आज के कार्य पूर्णता" : "Today\'s Task Completion"}'
);

fs.writeFileSync('src/components/NewHireView.tsx', file);
