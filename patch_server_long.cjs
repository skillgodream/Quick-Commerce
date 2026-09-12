const fs = require("fs");
let content = fs.readFileSync("server.ts", "utf8");

const target = `// 3. Work Companion Quick Help`;
const replacement = `// 2.6 Longitudinal Pattern Discovery
app.post("/api/signals/understand-longitudinal", async (req, res) => {
  try {
    const { historyText } = req.body;
    
    if (!historyText || typeof historyText !== "string") {
      return res.status(400).json({ error: "Missing 'historyText' in request body." });
    }

    let fallbackResult = {
      isPattern: false
    };

    const ai = getGenAI();
    if (ai) {
      try {
        const prompt = \`You are the AI Pattern Discovery Engine for a dark store worker training system.
Your job is to read a chronologically ordered text summary of a learner's historical evidence (manager notes, self-reports, performance data) over multiple days/shifts, and identify if there is a CLEAR LONGITUDINAL PATTERN.

Historical evidence:
\${historyText}

RULES:
1. ONLY identify a pattern if there is repeated evidence across MULTIPLE pieces of evidence/days. A single isolated issue is NOT a pattern.
2. If it's a one-off issue, or evidence is insufficient, set "isPattern" to false.
3. If there is a pattern, choose one of these categories:
   - "Recurring Capability Issue"
   - "Persistent Performance Gap"
   - "Intervention Response"
   - "Intervention Failure / Partial Response"
   - "Environmental Pattern"
   - "Improvement Pattern"
4. If an issue existed but recent days show it has disappeared (good performance, no notes), set "isPattern" to false (it's stale).
5. If it's an Environmental issue (e.g. scanner broken repeatedly), it MUST be an "Environmental Pattern", not a Capability Issue.
6. Return valid JSON ONLY.

EXPECTED JSON SCHEMA:
{
  "isPattern": boolean, // true ONLY if a clear multi-evidence pattern exists
  "category": "String category from the list above" (omit if isPattern is false),
  "supportingEvidence": "1 concise sentence explaining the pattern and the evidence supporting it." (omit if false)
}\`;

        const fetchPromise = ai.models.generateContent({
          model: "gemini-3.1-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        });

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("AI Request timed out")), 5000)
        );

        const response: any = await Promise.race([fetchPromise, timeoutPromise]);
        
        if (response && response.text) {
          const parsed = JSON.parse(response.text.trim());
          return res.json(parsed);
        }
      } catch (aiErr) {
        console.warn("AI generation failed for longitudinal pattern:", aiErr);
      }
    }

    res.json(fallbackResult);
  } catch (err) {
    console.error("Error in understand-longitudinal:", err);
    res.status(500).json({ error: err.message || "Failed to analyze longitudinal pattern" });
  }
});

// 3. Work Companion Quick Help`;

if (content.includes(target)) {
    fs.writeFileSync("server.ts", content.replace(target, replacement));
    console.log("Patched server.ts with understand-longitudinal");
} else {
    console.log("Could not find target in server.ts");
}
