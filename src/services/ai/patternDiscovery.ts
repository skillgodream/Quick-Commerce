/**
 * DEANCORE-AI-10: Pattern Discovery Layer
 * 
 * Scans mined cases across learners and time to discover candidate patterns:
 * - Recurring failure / recovery
 * - Intervention decay
 * - Problem migration
 * - Symptom shift
 * - Environmental bottlenecks and tool failures
 * - Same symptom with different causes
 * - Different symptoms with same cause
 * - Context-dependent effectiveness
 * - Multi-day trajectories
 * - Previously unseen combinations
 * 
 * CRITICAL INVARIANT: Pattern discovery produces CANDIDATE PATTERN records,
 * NEVER automatic Dean rules or runtime modifications.
 */

import { MinedCase, CandidatePattern, CandidatePatternType } from "./evolutionTypes";

/**
 * Discovers candidate patterns across mined cases.
 */
export function discoverPatterns(minedCases: MinedCase[]): CandidatePattern[] {
  const patterns: CandidatePattern[] = [];

  // Group cases by employee
  const byEmployee = new Map<string, MinedCase[]>();
  for (const c of minedCases) {
    const list = byEmployee.get(c.employeeId) || [];
    list.push(c);
    byEmployee.set(c.employeeId, list);
  }

  // Sort each employee's history by journeyDay ascending
  for (const list of byEmployee.values()) {
    list.sort((a, b) => a.journeyDay - b.journeyDay);
  }

  // 1. Detect Recurring Failure (same root cause or intervention failing >= 2 times)
  const failureMap = new Map<string, MinedCase[]>();
  for (const c of minedCases) {
    if (c.outcomeClassification === "FAILURE" || c.interventionEffectiveness === "INEFFECTIVE") {
      const key = `${c.diagnosis.rootCause}_${c.finalAction.title}`;
      const list = failureMap.get(key) || [];
      list.push(c);
      failureMap.set(key, list);
    }
  }

  for (const [key, cases] of failureMap.entries()) {
    if (cases.length >= 2) {
      const [rootCause, actionTitle] = key.split("_");
      const caseIds = cases.map(c => c.caseId);
      const evidenceIds = Array.from(new Set(cases.flatMap(c => c.evidenceIds)));
      const contexts = Array.from(new Set(cases.flatMap(c => c.contextTags)));
      const dates = cases.map(c => c.timestamp).sort();

      // Look for contradictory cases where this intervention succeeded for the same root cause
      const contradictoryCases = minedCases
        .filter(c => c.diagnosis.rootCause === rootCause &&
                     c.finalAction.title === actionTitle &&
                     (c.outcomeClassification === "SUCCESS" || c.interventionEffectiveness === "EFFECTIVE"))
        .map(c => c.caseId);

      patterns.push({
        patternId: `pat-fail-${rootCause}-${cases.length}`,
        patternType: "RECURRING_FAILURE",
        title: `Recurring Failure: ${actionTitle} for ${rootCause}`,
        description: `Action "${actionTitle}" for root cause "${rootCause}" failed repeatedly across ${cases.length} observed case(s).`,
        supportingCaseIds: caseIds,
        evidenceIds,
        occurrenceCount: cases.length,
        contexts,
        outcomeStats: {
          totalCount: cases.length + contradictoryCases.length,
          successCount: contradictoryCases.length,
          partialCount: 0,
          failureCount: cases.length,
          insufficientCount: 0,
          successRate: contradictoryCases.length / (cases.length + contradictoryCases.length),
        },
        confidence: Math.min(0.95, 0.6 + cases.length * 0.1),
        contradictoryCases,
        evidenceQuality: cases.some(c => c.evidenceQuality === "HIGH") ? "HIGH" : "MODERATE",
        firstObservedDate: dates[0] || new Date().toISOString(),
        latestObservedDate: dates[dates.length - 1] || new Date().toISOString(),
      });
    }
  }

  // 2. Detect Intervention Decay (positive outcome on day N, but drop on day N+1 or N+2 for same employee)
  for (const [empId, history] of byEmployee.entries()) {
    for (let i = 0; i < history.length - 1; i++) {
      const current = history[i];
      const next = history[i + 1];

      const currentSuccess = current.outcomeClassification === "SUCCESS" || current.interventionEffectiveness === "EFFECTIVE";
      const nextDecline = next.outcomeClassification === "FAILURE" || 
        (next.canonicalEvidence?.performance?.productivity !== undefined && current.canonicalEvidence?.performance?.productivity !== undefined &&
         next.canonicalEvidence.performance.productivity < current.canonicalEvidence.performance.productivity * 0.85);

      if (currentSuccess && nextDecline) {
        patterns.push({
          patternId: `pat-decay-${empId}-d${current.journeyDay}-d${next.journeyDay}`,
          patternType: "INTERVENTION_DECAY",
          title: `Intervention Decay: Day ${current.journeyDay} -> Day ${next.journeyDay}`,
          description: `Worker ${empId} showed initial gain on Day ${current.journeyDay} with "${current.finalAction.title}", but performance decayed by Day ${next.journeyDay}.`,
          supportingCaseIds: [current.caseId, next.caseId],
          evidenceIds: Array.from(new Set([...current.evidenceIds, ...next.evidenceIds])),
          occurrenceCount: 2,
          contexts: Array.from(new Set([...current.contextTags, ...next.contextTags])),
          outcomeStats: {
            totalCount: 2,
            successCount: 1,
            partialCount: 0,
            failureCount: 1,
            insufficientCount: 0,
            successRate: 0.5,
          },
          confidence: 0.85,
          contradictoryCases: [],
          evidenceQuality: current.evidenceQuality === "HIGH" && next.evidenceQuality === "HIGH" ? "HIGH" : "MODERATE",
          firstObservedDate: current.timestamp,
          latestObservedDate: next.timestamp,
        });
      }
    }
  }

  // 3. Detect Problem Migration (e.g. speed improved but accuracy or other issue emerged)
  for (const [empId, history] of byEmployee.entries()) {
    for (let i = 0; i < history.length - 1; i++) {
      const current = history[i];
      const next = history[i + 1];

      const currentSpeedIssue = current.diagnosis.rootCause.includes("speed") || current.contextTags.includes("severe_pick_rate_deficit");
      const nextAccuracyIssue = next.diagnosis.rootCause.includes("accuracy") || (next.canonicalEvidence?.performance?.accuracy !== undefined && next.canonicalEvidence.performance.accuracy < 92);

      if (currentSpeedIssue && nextAccuracyIssue) {
        patterns.push({
          patternId: `pat-mig-${empId}-d${next.journeyDay}`,
          patternType: "PROBLEM_MIGRATION",
          title: `Problem Migration: Speed Deficit Migrated to Accuracy Deficit`,
          description: `Worker ${empId} resolved picking speed deficit, but quality/accuracy deficit emerged on Day ${next.journeyDay}.`,
          supportingCaseIds: [current.caseId, next.caseId],
          evidenceIds: Array.from(new Set([...current.evidenceIds, ...next.evidenceIds])),
          occurrenceCount: 2,
          contexts: Array.from(new Set([...current.contextTags, ...next.contextTags])),
          outcomeStats: {
            totalCount: 2,
            successCount: 1,
            partialCount: 0,
            failureCount: 1,
            insufficientCount: 0,
            successRate: 0.5,
          },
          confidence: 0.82,
          contradictoryCases: [],
          evidenceQuality: "MODERATE",
          firstObservedDate: current.timestamp,
          latestObservedDate: next.timestamp,
        });
      }
    }
  }

  // 4. Detect Different Causes Producing the Same Symptom (e.g., low pick rate caused by tool failure vs caused by lack of zone knowledge)
  const lowPickRateCases = minedCases.filter(c => c.contextTags.includes("severe_pick_rate_deficit") || c.contextTags.includes("moderate_pick_rate_deficit"));
  const causesForLowPick = new Map<string, MinedCase[]>();
  for (const c of lowPickRateCases) {
    const list = causesForLowPick.get(c.diagnosis.rootCause) || [];
    list.push(c);
    causesForLowPick.set(c.diagnosis.rootCause, list);
  }

  if (causesForLowPick.size >= 2) {
    const causes = Array.from(causesForLowPick.keys());
    patterns.push({
      patternId: `pat-diff-causes-same-symptom-lowpick`,
      patternType: "DIFFERENT_CAUSES_SAME_SYMPTOM",
      title: `Different Causes for Common Symptom: Low Pick Rate`,
      description: `Symptom "Low Pick Rate" stems from distinct root causes across cases: ${causes.join(", ")}. Requires careful causal differentiation before intervening.`,
      supportingCaseIds: lowPickRateCases.map(c => c.caseId),
      evidenceIds: Array.from(new Set(lowPickRateCases.flatMap(c => c.evidenceIds))),
      occurrenceCount: lowPickRateCases.length,
      contexts: ["picking_speed", "work_performance"],
      outcomeStats: {
        totalCount: lowPickRateCases.length,
        successCount: lowPickRateCases.filter(c => c.outcomeClassification === "SUCCESS").length,
        partialCount: lowPickRateCases.filter(c => c.outcomeClassification === "PARTIAL").length,
        failureCount: lowPickRateCases.filter(c => c.outcomeClassification === "FAILURE").length,
        insufficientCount: lowPickRateCases.filter(c => c.outcomeClassification === "INSUFFICIENT_EVIDENCE").length,
        successRate: 0.5,
      },
      confidence: 0.92,
      contradictoryCases: [],
      evidenceQuality: "HIGH",
      firstObservedDate: lowPickRateCases[0]?.timestamp || new Date().toISOString(),
      latestObservedDate: lowPickRateCases[lowPickRateCases.length - 1]?.timestamp || new Date().toISOString(),
    });
  }

  // 5. Detect Repeated Environmental Bottlenecks
  const envBottleneckCases = minedCases.filter(c => c.contextTags.includes("environmental_bottleneck") || c.confoundingFactors.length > 0);
  if (envBottleneckCases.length >= 2) {
    patterns.push({
      patternId: `pat-env-bottleneck-recur`,
      patternType: "ENVIRONMENTAL_BOTTLENECK",
      title: `Recurring Environmental Bottleneck`,
      description: `Observed ${envBottleneckCases.length} instances where performance dips coincided with external aisle congestion or warehouse blockers. Worker blame strictly protected.`,
      supportingCaseIds: envBottleneckCases.map(c => c.caseId),
      evidenceIds: Array.from(new Set(envBottleneckCases.flatMap(c => c.evidenceIds))),
      occurrenceCount: envBottleneckCases.length,
      contexts: ["environmental_physical", "warehouse_operations"],
      outcomeStats: {
        totalCount: envBottleneckCases.length,
        successCount: envBottleneckCases.filter(c => c.outcomeClassification === "SUCCESS").length,
        partialCount: 0,
        failureCount: envBottleneckCases.filter(c => c.outcomeClassification === "FAILURE").length,
        insufficientCount: 0,
        successRate: 0.5,
      },
      confidence: 0.90,
      contradictoryCases: [],
      evidenceQuality: "HIGH",
      firstObservedDate: envBottleneckCases[0]?.timestamp || new Date().toISOString(),
      latestObservedDate: envBottleneckCases[envBottleneckCases.length - 1]?.timestamp || new Date().toISOString(),
    });
  }

  // 6. Detect Tool/System Hardware Issues
  const toolCases = minedCases.filter(c => c.contextTags.includes("tool_system_issue"));
  if (toolCases.length >= 2) {
    patterns.push({
      patternId: `pat-tool-system-recur`,
      patternType: "TOOL_SYSTEM_FAILURE",
      title: `Recurring Hardware / Scanner Tool Failure`,
      description: `Multiple learners (${toolCases.length} instances) experienced RF scanner or printer downtime affecting completion rate.`,
      supportingCaseIds: toolCases.map(c => c.caseId),
      evidenceIds: Array.from(new Set(toolCases.flatMap(c => c.evidenceIds))),
      occurrenceCount: toolCases.length,
      contexts: ["tool_system", "equipment"],
      outcomeStats: {
        totalCount: toolCases.length,
        successCount: 0,
        partialCount: 0,
        failureCount: toolCases.length,
        insufficientCount: 0,
        successRate: 0,
      },
      confidence: 0.95,
      contradictoryCases: [],
      evidenceQuality: "HIGH",
      firstObservedDate: toolCases[0]?.timestamp || new Date().toISOString(),
      latestObservedDate: toolCases[toolCases.length - 1]?.timestamp || new Date().toISOString(),
    });
  }

  // 7. Detect Context-Dependent Intervention Effectiveness (works in one context, fails in another)
  const interventionContextMap = new Map<string, { success: MinedCase[]; failure: MinedCase[] }>();
  for (const c of minedCases) {
    const act = c.finalAction.title;
    const entry = interventionContextMap.get(act) || { success: [], failure: [] };
    if (c.outcomeClassification === "SUCCESS" || c.interventionEffectiveness === "EFFECTIVE") {
      entry.success.push(c);
    } else if (c.outcomeClassification === "FAILURE" || c.interventionEffectiveness === "INEFFECTIVE") {
      entry.failure.push(c);
    }
    interventionContextMap.set(act, entry);
  }

  for (const [actTitle, data] of interventionContextMap.entries()) {
    if (data.success.length >= 1 && data.failure.length >= 1) {
      const successContexts = Array.from(new Set(data.success.flatMap(c => c.contextTags)));
      const failureContexts = Array.from(new Set(data.failure.flatMap(c => c.contextTags)));

      patterns.push({
        patternId: `pat-ctx-dep-${actTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        patternType: "CONTEXT_DEPENDENT_EFFECTIVENESS",
        title: `Context-Dependent Effectiveness: ${actTitle}`,
        description: `"${actTitle}" achieved success under contexts [${successContexts.slice(0, 3).join(", ")}], but failed under contexts [${failureContexts.slice(0, 3).join(", ")}]. Causal humility required.`,
        supportingCaseIds: [...data.success.map(c => c.caseId), ...data.failure.map(c => c.caseId)],
        evidenceIds: Array.from(new Set([...data.success.flatMap(c => c.evidenceIds), ...data.failure.flatMap(c => c.evidenceIds)])),
        occurrenceCount: data.success.length + data.failure.length,
        contexts: [...successContexts, ...failureContexts],
        outcomeStats: {
          totalCount: data.success.length + data.failure.length,
          successCount: data.success.length,
          partialCount: 0,
          failureCount: data.failure.length,
          insufficientCount: 0,
          successRate: data.success.length / (data.success.length + data.failure.length),
        },
        confidence: 0.88,
        contradictoryCases: data.failure.map(c => c.caseId),
        evidenceQuality: "MODERATE",
        firstObservedDate: data.success[0]?.timestamp || new Date().toISOString(),
        latestObservedDate: data.failure[data.failure.length - 1]?.timestamp || new Date().toISOString(),
      });
    }
  }

  return patterns;
}
