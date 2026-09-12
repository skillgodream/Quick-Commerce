const fs = require("fs");
let content = fs.readFileSync("src/services/intelligence.ts", "utf8");

const importLine = `  DayRecord,
} from "../types";`;

const newImportLine = `  DayRecord,
  CandidatePattern,
} from "../types";`;

if (content.includes(importLine)) {
  content = content.replace(importLine, newImportLine);
} else {
  // Try another format
  const backup = `import {
  NewHire,`;
  const rep = `import {
  CandidatePattern,
  NewHire,`;
  content = content.replace(backup, rep);
}

fs.writeFileSync("src/services/intelligence.ts", content);
console.log("Patched intelligence imports");
