const fs = require("fs");
let content = fs.readFileSync("src/types.ts", "utf8");

const interfaceActionOutcome = `export interface ActionOutcome {`;
const interfaceCandidatePattern = `export interface CandidatePattern {
  isPattern: boolean;
  category?: "Recurring Capability Issue" | "Persistent Performance Gap" | "Intervention Response" | "Intervention Failure / Partial Response" | "Environmental Pattern" | "Improvement Pattern" | "Evidence Gap";
  supportingEvidence?: string;
}

export interface ActionOutcome {`;

content = content.replace(interfaceActionOutcome, interfaceCandidatePattern);

const loopExecutionInput = `export interface LoopExecutionInput {
  hire: NewHire;
  dayNumber: number;
  dailySignal?: DailySignal;
  managerSignal?: ManagerSignal;
  workSignal: WorkSignal;
  actionOutcome?: ActionOutcome;
  previousRecord?: DayRecord;
  existingAction?: RecommendedAction;
}`;

const repLoopExecutionInput = `export interface LoopExecutionInput {
  hire: NewHire;
  dayNumber: number;
  dailySignal?: DailySignal;
  managerSignal?: ManagerSignal;
  workSignal: WorkSignal;
  actionOutcome?: ActionOutcome;
  previousRecord?: DayRecord;
  existingAction?: RecommendedAction;
  candidatePattern?: CandidatePattern;
}`;

content = content.replace(loopExecutionInput, repLoopExecutionInput);

fs.writeFileSync("src/types.ts", content);
console.log("Patched types.ts");
