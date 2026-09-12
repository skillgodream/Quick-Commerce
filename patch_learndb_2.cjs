const fs = require('fs');
let content = fs.readFileSync('src/components/LearnerDashboardView.tsx', 'utf8');

content = content.replace(
  /const renderCapStateIcon = \(state\?: CapabilityState\) => \{[\s\S]*?return <Circle className="w-4 h-4 text-slate-300" \/>;\n  \};/g,
  `const renderCapStateIcon = (state?: CapabilityState) => {
    if (!state || state.evidence === "none") return <Circle className="w-4 h-4 text-slate-300" />;
    if (state.performance === "below_target") return <AlertCircle className="w-4 h-4 text-amber-500" />;
    if (state.mastery === "mastered" || state.mastery === "proficient" || state.evidence === "demonstrated") return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    return <Circle className="w-4 h-4 text-slate-300" />;
  };`
);

content = content.replace(
  /const renderCapStateLabel = \(state\?: CapabilityState\) => \{[\s\S]*?return "Not yet assessed";\n  \};/g,
  `const renderCapStateLabel = (state?: CapabilityState) => {
    if (!state || state.evidence === "none") return "Not yet assessed";
    if (state.performance === "below_target") return "Needs practice";
    if (state.mastery === "mastered" || state.mastery === "proficient" || state.evidence === "demonstrated") return "Demonstrated";
    return "Not yet assessed";
  };`
);

content = content.replace(/cap\.titleEn/g, 'cap.name');

fs.writeFileSync('src/components/LearnerDashboardView.tsx', content);
