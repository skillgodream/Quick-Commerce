const fs = require("fs");
let content = fs.readFileSync("src/App.tsx", "utf8");

const target1 = `  const updateHireAndRecalculate = (
    hireId: string,
    dayNum: number,
    updater: (currentRecord: DayRecord, hire: NewHire) => Partial<DayRecord>
  ) => {`;
  
const rep1 = `  const updateHireAndRecalculate = (
    hireId: string,
    dayNum: number,
    updater: (currentRecord: DayRecord, hire: NewHire) => Partial<DayRecord>,
    candidatePattern?: CandidatePattern
  ) => {`;
  
const target2 = `        const execution = executeCoordinationLoop({
          hire,
          dayNumber: dayNum,
          dailySignal: mergedRecord.dailySignal,
          managerSignal: mergedRecord.managerSignal,
          workSignal: mergedRecord.workSignal,
          actionOutcome: mergedRecord.actionOutcome,
          previousRecord,
          existingAction: previousRecord?.recommendedAction || hire.currentAction,
        });`;

const rep2 = `        const execution = executeCoordinationLoop({
          hire,
          dayNumber: dayNum,
          dailySignal: mergedRecord.dailySignal,
          managerSignal: mergedRecord.managerSignal,
          workSignal: mergedRecord.workSignal,
          actionOutcome: mergedRecord.actionOutcome,
          previousRecord,
          existingAction: previousRecord?.recommendedAction || hire.currentAction,
          candidatePattern,
        });`;

if (content.includes(target1) && content.includes(target2)) {
    content = content.replace(target1, rep1);
    content = content.replace(target2, rep2);
    fs.writeFileSync("src/App.tsx", content);
    console.log("Patched updateHireAndRecalculate in App.tsx");
} else {
    console.log("Could not find targets in App.tsx");
}
