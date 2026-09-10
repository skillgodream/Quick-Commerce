const fs = require('fs');

let code = fs.readFileSync('src/components/ModulesView.tsx', 'utf8');

// Inject our logic right before `return (`
const insertLogic = `
  const currentRecord = newHire.daysHistory.find(d => d.dayNumber === currentDay) || newHire.daysHistory[newHire.daysHistory.length - 1];
  const targetCapId = currentRecord?.recommendedAction?.targetCapabilityId;
  const targetCapDef = targetCapId ? DARK_STORE_CAPABILITIES.find(c => c.id === targetCapId) : null;

  const getModulesForCapability = (capId: number) => {
    return MANDATORY_TRAINING_MODULES.filter((m) => m.mappedCapabilityIds.includes(capId));
  };

  const getCapabilityStatus = (capId: number) => {
    const state = newHire.capabilities?.[capId];
    if (!state) return null;
    if (state.mastery === "mastered") return isHindi ? "मजबूत" : "Strong";
    if (state.mastery === "proficient") return isHindi ? "अच्छा" : "Good";
    if (state.performance === "below_target") return isHindi ? "अभ्यास की आवश्यकता है" : "Needs practice";
    if (state.mastery === "in_progress") return isHindi ? "विकासशील" : "Developing";
    return isHindi ? "विकासशील" : "Developing";
  };

  const getCapabilityStatusColor = (statusStr: string | null) => {
    if (statusStr === "Strong" || statusStr === "मजबूत") return "text-emerald-400";
    if (statusStr === "Good" || statusStr === "अच्छा") return "text-emerald-300";
    if (statusStr === "Needs practice" || statusStr === "अभ्यास की आवश्यकता है") return "text-amber-400";
    return "text-pink-400"; // Developing
  };

  const getCapabilityProgressText = (capId: number) => {
    const modules = getModulesForCapability(capId);
    if (modules.length === 0) return isHindi ? "कोई अभ्यास नहीं" : "No practice assigned yet";
    
    let totalAct = 0;
    let compAct = 0;
    modules.forEach((m) => {
        const isModCompleted = completedIds.includes(m.id);
        totalAct += m.activities.length;
        if (isModCompleted) {
            compAct += m.activities.length;
        } else {
            compAct += m.activities.filter(a => a.completed).length;
        }
    });
    
    if (totalAct === 0) return isHindi ? "0 / 0 पूर्ण" : "0 / 0 activities complete";
    if (compAct === totalAct) return isHindi ? "✓ पूर्ण" : "✓ Complete";
    return isHindi ? \`\${compAct} / \${totalAct} पूर्ण\` : \`\${compAct} / \${totalAct} complete\`;
  };
  
  const getCapabilityProgressRatio = (capId: number) => {
    const modules = getModulesForCapability(capId);
    let totalAct = 0;
    let compAct = 0;
    modules.forEach((m) => {
        const isModCompleted = completedIds.includes(m.id);
        totalAct += m.activities.length;
        if (isModCompleted) {
            compAct += m.activities.length;
        } else {
            compAct += m.activities.filter(a => a.completed).length;
        }
    });
    return { compAct, totalAct };
  };

  const capabilitiesToRender = DARK_STORE_CAPABILITIES.filter((cap) => {
      const hasModules = getModulesForCapability(cap.id).length > 0;
      const hasState = !!newHire.capabilities?.[cap.id];
      return hasModules || hasState;
  });

  const unmappedModules = MANDATORY_TRAINING_MODULES.filter((m) => !m.mappedCapabilityIds || m.mappedCapabilityIds.length === 0);
`;

code = code.replace('  return (\n    <div className="animate-in', insertLogic + '\n  return (\n    <div className="animate-in');

fs.writeFileSync('src/components/ModulesView.tsx', code);
