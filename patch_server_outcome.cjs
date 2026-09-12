const fs = require("fs");
let content = fs.readFileSync("server.ts", "utf8");

const target = `// 3. Work Companion Quick Help`;
const replacement = `// 2.5 Treatment Memory - Analyze Outcome Notes
app.post("/api/signals/understand-outcome", async (req, res) => {
  try {
    const { notes, actionTitle } = req.body;
    
    if (!notes || typeof notes !== "string") {
      return res.status(400).json({ error: "Missing 'notes' in request body." });
    }

    let fallbackResult = {
      reason: "No AI interpretation available.",
      remainingIssue: "Unknown"
    };

    const ai = getGenAI();
    if (ai) {
      try {
        const prompt = \`You are the AI Evidence Interpreter for a dark store worker coordination system.
Your job is to interpret the unstructured notes left by a manager after completing an intervention (\${actionTitle || "Action"}).

Notes to interpret:
"\${notes}"

RULES AND BOUNDARIES (STRICT):
1. INTERPRET ONLY the supplied text. Do NOT invent facts.
2. Return valid JSON ONLY.

EXPECTED JSON SCHEMA:
{
  "reason": "1 concise sentence explaining why the intervention worked or didn't work, based ONLY on the notes.",
  "remainingIssue": "Any specific issue or blocker mentioned that was NOT resolved (e.g., 'Aisle 7 navigation'). Use 'None' if completely resolved."
}\`;

        const fetchPromise = ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        });

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("AI Request timed out")), 5000)
        );

        const response = await Promise.race([fetchPromise, timeoutPromise]);
        
        if (response && response.text) {
          const parsed = JSON.parse(response.text.trim());
          
          if (parsed.reason && parsed.remainingIssue) {
            return res.json({
              reason: String(parsed.reason),
              remainingIssue: String(parsed.remainingIssue)
            });
          }
        }
      } catch (aiErr) {
        console.warn("AI generation/validation failed for outcome:", aiErr);
      }
    }

    res.json(fallbackResult);
  } catch (err) {
    console.error("Error in understand-outcome:", err);
    res.status(500).json({ error: err.message || "Failed to analyze outcome" });
  }
});

// 3. Work Companion Quick Help`;

if (content.includes(target)) {
    fs.writeFileSync("server.ts", content.replace(target, replacement));
    console.log("Patched server.ts with understand-outcome");
} else {
    console.log("Could not find target in server.ts");
}
