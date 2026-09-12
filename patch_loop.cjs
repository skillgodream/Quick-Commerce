const fs = require("fs");
let content = fs.readFileSync("src/services/intelligence.ts", "utf8");

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
fs.writeFileSync("src/services/intelligence.ts", content);
console.log("Patched LoopExecutionInput");
