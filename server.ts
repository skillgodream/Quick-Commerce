import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client lazily/safely
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }
  return genAIClient;
}

// 1. Health Check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    appName: "New Hire Intelligence",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// 2. Understand Daily Signal (Speech or Text from New Hire)
app.post("/api/signals/understand-daily", async (req, res) => {
  try {
    const { text, newHireName = "Rahul", dayNumber = 3 } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Missing 'text' in request body." });
    }

    const ai = getGenAI();

    // Deterministic fallback analyzer
    const lower = text.toLowerCase();
    let issue = "General Feedback";
    let confidence = "Medium";
    let impact = "Normal ramp-up";
    let category = "General";

    if (lower.includes("confused") || lower.includes("where") || lower.includes("find") || lower.includes("location") || lower.includes("aisle") || lower.includes("shelf") || lower.includes("product")) {
      issue = "Location navigation";
      confidence = "Low";
      impact = "Slow picking";
      category = "Environment";
    } else if (lower.includes("scan") || lower.includes("device") || lower.includes("battery") || lower.includes("app") || lower.includes("barcode") || lower.includes("machine")) {
      issue = "Tool / Scanner operation";
      confidence = "Medium";
      impact = "Scan delays or retries";
      category = "Tool";
    } else if (lower.includes("speed") || lower.includes("fast") || lower.includes("slow") || lower.includes("target") || lower.includes("rate")) {
      issue = "Pacing & speed pressure";
      confidence = "Medium";
      impact = "Picking rate below target";
      category = "Process";
    } else if (lower.includes("tired") || lower.includes("heavy") || lower.includes("feet") || lower.includes("pain") || lower.includes("break")) {
      issue = "Physical stamina / Shift adjustment";
      confidence = "Medium";
      impact = "Fatigue during later hours";
      category = "Physical";
    } else if (lower.includes("great") || lower.includes("good") || lower.includes("easy") || lower.includes("smooth") || lower.includes("confident")) {
      issue = "None / Positive progress";
      confidence = "High";
      impact = "Steady ramp-up";
      category = "General";
    }

    let result = {
      rawText: text,
      issue,
      confidence,
      possibleImpact: impact,
      category,
      summary: `Day ${dayNumber}: Employee reported: "${text.slice(0, 100)}${text.length > 100 ? "..." : ""}"`,
      companionResponse: "Thanks for sharing honestly. It takes a few shifts to memorize dark store rack codes. Your manager and buddy are here to back you up!",
    };

    if (ai) {
      try {
        const prompt = `You are the intelligence engine for "New Hire Intelligence", an intelligent coordination system for blue-collar dark store pickers during their 14-day ramp-up.
Analyze what this new hire (${newHireName}, Day ${dayNumber}) just said:
"${text}"

Convert this into structured signals for the coordination system.
Respond ONLY with valid JSON in this exact structure:
{
  "issue": "A concise issue title (e.g., 'Location navigation', 'Scanner barcode read', 'Batch picking rule confusion', 'Steady settling in')",
  "confidence": "Low" | "Medium" | "High",
  "possibleImpact": "Short practical consequence (e.g. 'Slow picking', 'Mis-picks', 'Increased manager callouts', 'Normal ramp')",
  "category": "Environment" | "Process" | "Tool" | "Confidence" | "Physical" | "General",
  "summary": "1 concise sentence summarizing what is happening",
  "companionResponse": "A very friendly, encouraging, 1-2 sentence direct response to the worker in simple spoken language. Reassure them that learning the store takes time, don't use corporate jargon."
}`;

        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text.trim());
          result = {
            rawText: text,
            issue: parsed.issue || issue,
            confidence: parsed.confidence || confidence,
            possibleImpact: parsed.possibleImpact || impact,
            category: parsed.category || category,
            summary: parsed.summary || result.summary,
            companionResponse: parsed.companionResponse || result.companionResponse,
          };
        }
      } catch (aiErr) {
        console.warn("AI generation failed, using deterministic structured signal:", aiErr);
      }
    }

    res.json(result);
  } catch (err: any) {
    console.error("Error in understand-daily:", err);
    res.status(500).json({ error: err.message || "Failed to analyze signal" });
  }
});

// 3. Work Companion Quick Help (Ask the system)
app.post("/api/companion/ask", async (req, res) => {
  try {
    const { question, dayNumber = 3, role = "Dark Store Picker" } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Missing 'question' parameter." });
    }

    const ai = getGenAI();

    // Default pragmatic store guidance
    let answer = "Check the aisle marker first. Aisles 1-3 are Dry Groceries & Snacks, Aisles 4-5 are Beverages, Aisles 6-7 are Home Care, and Aisle 8 is Cold Storage. If an item isn't on the shelf, tap 'Item Missing' on your scanner so replenishment is notified.";

    const qLower = question.toLowerCase();
    if (qLower.includes("dairy") || qLower.includes("milk") || qLower.includes("cold") || qLower.includes("ice cream")) {
      answer = "Cold Storage & Dairy are in Chiller Zone A (Aisle 8). Pick chilled and frozen items LAST so they don't melt or warm up while you complete the rest of the cart.";
    } else if (qLower.includes("barcode") || qLower.includes("scan") || qLower.includes("won't scan") || qLower.includes("damaged")) {
      answer = "If a barcode won't scan after 2 tries: 1. Wipe the camera/scanner glass. 2. If wrinkled, smooth it with your thumb. 3. If torn, enter the last 4 digits of the SKU manually on screen.";
    } else if (qLower.includes("break") || qLower.includes("lunch") || qLower.includes("rest")) {
      answer = "Shift breaks are 30 mins for lunch and two 15-min tea breaks. Inform your shift supervisor (Suresh K.) before clocking out so orders are reassigned.";
    } else if (qLower.includes("missing") || qLower.includes("out of stock") || qLower.includes("not on rack")) {
      answer = "Don't spend more than 30 seconds searching one bin. Tap 'Item Not Found' -> 'Check Backstock'. If empty, skip to next item to protect your 10-minute order dispatch timer.";
    }

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: `You are a helpful, respectful, friendly peer work companion for a blue-collar ${role} in a high-speed quick-commerce dark store (Day ${dayNumber} on the job).
The worker asked: "${question}"
Answer in 2-3 simple, very practical sentences.
Rules:
- NO corporate buzzwords, NO course or LMS references.
- Concrete store instructions (e.g. rack numbers, scanner taps, buddy help).
- Warm, plain English or clear language.`,
        });

        if (response.text) {
          answer = response.text.trim();
        }
      } catch (e) {
        console.warn("Companion ask fallback used:", e);
      }
    }

    res.json({ answer });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to process question" });
  }
});

// 4. Pattern Detection (Legacy bridge - single authoritative loop is in executeCoordinationLoop)
app.post("/api/signals/detect-pattern", async (req, res) => {
  try {
    const {
      newHire = { name: "Rahul", dayNumber: 3 },
      currentPickRate = 35,
      targetPickRate = 50,
      accuracy = 98,
    } = req.body;

    // Single source of truth notice: all state and gear shifts are calculated in executeCoordinationLoop
    res.json({
      pattern: "Dark Store Spatial & Rack Coordinate Friction",
      patternConfidence: "High",
      diagnosis: `Pattern coordinated by single execution engine executeCoordinationLoop(). Pick pace (${currentPickRate}/${targetPickRate}) delayed by aisle navigation in Aisles 4-8 while accuracy (${accuracy}%) is maintained.`,
      action: {
        type: "buddy_walkthrough",
        title: "Buddy Walkthrough of Aisles 4-8 Rack Navigation",
        description: "Pair with Senior Picker for a 15-minute guided run through high-frequency snack/beverage aisles.",
        targetActor: "Buddy (Senior Picker)",
        urgency: "Next Shift",
        smallestPracticalStep: "Spend 15 mins walking Aisles 4-8 together before peak order rush.",
      },
      sourceOfTruth: "executeCoordinationLoop",
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to process signal" });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`New Hire Intelligence server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
