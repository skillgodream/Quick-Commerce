const fs = require("fs");
let content = fs.readFileSync("src/services/intelligence.ts", "utf8");

const target = `export async function analyzeDailyReport(`;
const replacement = `export async function analyzeOutcomeNotes(
  notes: string,
  actionTitle?: string
): Promise<{ reason?: string; remainingIssue?: string }> {
  try {
    const res = await fetch("/api/signals/understand-outcome", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes, actionTitle }),
    });
    if (res.ok) {
      const data = await res.json();
      return {
        reason: data.reason,
        remainingIssue: data.remainingIssue,
      };
    }
  } catch (err) {
    console.warn("Client fallback for outcome analysis:", err);
  }
  return {
    reason: "No AI interpretation available.",
    remainingIssue: "Unknown"
  };
}

export async function analyzeDailyReport(`;

if (content.includes(target)) {
    fs.writeFileSync("src/services/intelligence.ts", content.replace(target, replacement));
    console.log("Patched intelligence.ts with analyzeOutcomeNotes");
} else {
    console.log("Could not find target in intelligence.ts");
}
