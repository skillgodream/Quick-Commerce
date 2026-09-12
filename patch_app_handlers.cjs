const fs = require("fs");
let content = fs.readFileSync("src/App.tsx", "utf8");

const helper = `  // Helper for longitudinal pattern discovery
  const fetchLongitudinalPattern = async (hireId: string, dayNum: number, extraUpdate: any): Promise<CandidatePattern | undefined> => {
    const hire = newHires.find(h => h.id === hireId);
    if (!hire) return undefined;
    
    let historyText = "";
    const maxDay = Math.max(hire.daysHistory.length, dayNum);
    for (let i = 1; i <= maxDay; i++) {
       const rec = hire.daysHistory.find(d => d.dayNumber === i) || { dayNumber: i };
       let daily = rec.dailySignal;
       let mgr = rec.managerSignal;
       let wrk = rec.workSignal;
       let out = rec.actionOutcome;
       if (i === dayNum) {
          if (extraUpdate.dailySignal) daily = extraUpdate.dailySignal;
          if (extraUpdate.managerSignal) mgr = extraUpdate.managerSignal;
          if (extraUpdate.workSignal) wrk = extraUpdate.workSignal;
          if (extraUpdate.actionOutcome) out = extraUpdate.actionOutcome;
       }
       
       const lines = [];
       if (daily) lines.push(\`- Self-report: \${daily.rawText} (\${daily.issue || 'No issue'})\`);
       if (mgr) lines.push(\`- Manager: \${mgr.state} - \${mgr.notes}\`);
       if (wrk) lines.push(\`- Perf: Rate \${wrk.actualPickRate}/\${wrk.targetPickRate}, Acc \${wrk.accuracyRate}%\`);
       if (out) lines.push(\`- Outcome: \${out.notes || ''} (Improved: \${out.improved})\`);
       
       if (lines.length > 0) {
         historyText += \`Day \${i}:\n\` + lines.join("\\n") + "\\n";
       }
    }
    
    if (historyText.trim().length > 0) {
      return await analyzeLongitudinalHistory(historyText);
    }
    return undefined;
  };

  // 1. Daily Signal submitted by Frontline New Hire`;

content = content.replace("  // 1. Daily Signal submitted by Frontline New Hire", helper);

const dSig = `  const handleDailySignalSubmitted = (signal: DailySignal) => {
    updateHireAndRecalculate(activeHire.id, currentDay, () => ({
      dailySignal: signal,
    }));
  };`;
const dRep = `  const handleDailySignalSubmitted = async (signal: DailySignal) => {
    const pattern = await fetchLongitudinalPattern(activeHire.id, currentDay, { dailySignal: signal });
    updateHireAndRecalculate(activeHire.id, currentDay, () => ({
      dailySignal: signal,
    }), pattern);
  };`;
content = content.replace(dSig, dRep);

const mSig = `  const handleManagerSignalSubmitted = (hireId: string, signal: ManagerSignal) => {
    updateHireAndRecalculate(hireId, currentDay, () => ({
      managerSignal: signal,
    }));
  };`;
const mRep = `  const handleManagerSignalSubmitted = async (hireId: string, signal: ManagerSignal) => {
    const pattern = await fetchLongitudinalPattern(hireId, currentDay, { managerSignal: signal });
    updateHireAndRecalculate(hireId, currentDay, () => ({
      managerSignal: signal,
    }), pattern);
  };`;
content = content.replace(mSig, mRep);

const wSig = `  const handleWorkSignalUpdated = (hireId: string, workSignal: WorkSignal) => {
    updateHireAndRecalculate(hireId, currentDay, () => ({
      workSignal,
    }));
  };`;
const wRep = `  const handleWorkSignalUpdated = async (hireId: string, workSignal: WorkSignal) => {
    const pattern = await fetchLongitudinalPattern(hireId, currentDay, { workSignal });
    updateHireAndRecalculate(hireId, currentDay, () => ({
      workSignal,
    }), pattern);
  };`;
content = content.replace(wSig, wRep);

const oSig = `    const augmentedOutcome = { ...outcome, treatmentContext };

    updateHireAndRecalculate(hireId, currentDay, (currentRecord) => {`;
const oRep = `    const augmentedOutcome = { ...outcome, treatmentContext };

    const pattern = await fetchLongitudinalPattern(hireId, currentDay, { actionOutcome: augmentedOutcome });

    updateHireAndRecalculate(hireId, currentDay, (currentRecord) => {`;
content = content.replace(oSig, oRep);
// Wait, I need to pass `pattern` to `updateHireAndRecalculate` in handleActionOutcomeRecorded

const oSig2 = `        workSignal: updatedWorkSignal,
      };
    });
  };`;
const oRep2 = `        workSignal: updatedWorkSignal,
      };
    }, pattern);
  };`;
content = content.replace(oSig2, oRep2);

// For Google Form ingestion
const gSig = `    updateHireAndRecalculate(result.newHireId, result.dayNumber, () => {
      const partial: Partial<DayRecord> = {`;
const gRep = `    fetchLongitudinalPattern(result.newHireId, result.dayNumber, { 
      workSignal: result.workSignal, 
      dailySignal: result.dailySignal, 
      managerSignal: result.managerSignal 
    }).then(pattern => {
      updateHireAndRecalculate(result.newHireId, result.dayNumber, () => {
        const partial: Partial<DayRecord> = {`;
content = content.replace(gSig, gRep);

const gSig2 = `      return partial;
    });
  };`;
const gRep2 = `      return partial;
      }, pattern);
    });
  };`;
content = content.replace(gSig2, gRep2);

fs.writeFileSync("src/App.tsx", content);
console.log("Patched App.tsx handlers");
