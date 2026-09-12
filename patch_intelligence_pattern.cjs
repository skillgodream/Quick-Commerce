const fs = require("fs");
let content = fs.readFileSync("src/services/intelligence.ts", "utf8");

// Add proxy function analyzeLongitudinalPattern
const proxyTarget = `export async function analyzeOutcomeNotes(`;
const proxyRep = `export async function analyzeLongitudinalHistory(
  historyText: string
): Promise<CandidatePattern | undefined> {
  try {
    const res = await fetch("/api/signals/understand-longitudinal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ historyText }),
    });
    if (res.ok) {
      const data = await res.json();
      return data as CandidatePattern;
    }
  } catch (err) {
    console.warn("Client fallback for longitudinal analysis:", err);
  }
  return undefined;
}

export async function analyzeOutcomeNotes(`;

content = content.replace(proxyTarget, proxyRep);
fs.writeFileSync("src/services/intelligence.ts", content);
console.log("Patched analyzeLongitudinalHistory");
