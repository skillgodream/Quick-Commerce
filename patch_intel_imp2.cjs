const fs = require("fs");
let content = fs.readFileSync("src/services/intelligence.ts", "utf8");

content = content.replace("  SnapshotEvidenceCategory,\n} from \"../types\";", "  SnapshotEvidenceCategory,\n  CandidatePattern,\n} from \"../types\";");
fs.writeFileSync("src/services/intelligence.ts", content);
console.log("Patched intel imports again");
