const fs = require("fs");

// Fix server.ts
let serverContent = fs.readFileSync("server.ts", "utf8");
serverContent = serverContent.replace(
  `const response = await Promise.race([fetchPromise, timeoutPromise]);`,
  `const response: any = await Promise.race([fetchPromise, timeoutPromise]);`
);
fs.writeFileSync("server.ts", serverContent);

// Fix intelligence.ts
let intelContent = fs.readFileSync("src/services/intelligence.ts", "utf8");
intelContent = intelContent.replace(
  `  return {
    currentPickRate,
    targetPickRate,
    accuracy,
    speedGap,
    previousPickRate,
    currentCapabilities,
    workerReportsConfusion,
    workerReportsTool,
    workerReportsVariant,
    workerReportsCommunication,
    workerReportsExternalBottleneck,
    externalBottleneckDescription,
    hasWorkEvidence,
    helpRequestsCount,
    workerChronicHelpDependency,
    managerObservesSupport,
    managerObservesStruggle,
    managerObservesAccuracy,
    managerObservesSpeed,
    previousInterventionFailed,
    dailySignal,
    managerSignal,
    structuredEvidence,
  };`,
  `  return {
    currentPickRate,
    targetPickRate,
    accuracy,
    speedGap,
    previousPickRate,
    currentCapabilities,
    workerReportsConfusion,
    workerReportsTool,
    workerReportsVariant,
    workerReportsCommunication,
    workerReportsExternalBottleneck,
    externalBottleneckDescription,
    hasWorkEvidence,
    helpRequestsCount,
    workerChronicHelpDependency,
    managerObservesSupport,
    managerObservesStruggle,
    managerObservesAccuracy,
    managerObservesSpeed,
    previousInterventionFailed,
    previousInterventionPartial,
    previousTreatmentContext,
    dailySignal,
    managerSignal,
    structuredEvidence,
  };`
);
fs.writeFileSync("src/services/intelligence.ts", intelContent);
console.log("Fixed lint errors");
