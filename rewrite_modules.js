const fs = require('fs');
let code = fs.readFileSync('src/components/ModulesView.tsx', 'utf8');

// 1. Add currentDay to ModulesViewProps
code = code.replace(
  `interface ModulesViewProps {\n  newHire: NewHire;\n  onUpdateHire?: (updatedHire: NewHire) => void;\n  isHindi?: boolean;\n  initialModuleId?: string | null;\n}`,
  `interface ModulesViewProps {\n  newHire: NewHire;\n  onUpdateHire?: (updatedHire: NewHire) => void;\n  isHindi?: boolean;\n  initialModuleId?: string | null;\n  currentDay?: number;\n}`
);
code = code.replace(
  `export const ModulesView: React.FC<ModulesViewProps> = ({\n  newHire,\n  onUpdateHire,\n  isHindi = false,\n  initialModuleId = null,\n}) => {`,
  `export const ModulesView: React.FC<ModulesViewProps> = ({\n  newHire,\n  onUpdateHire,\n  isHindi = false,\n  initialModuleId = null,\n  currentDay = 3,\n}) => {`
);

// 2. Add activeCapabilityModal state
code = code.replace(
  `const [activeTab, setActiveTab] = useState<"all" | "foundation" | "floor" | "cert">("all");`,
  `const [activeTab, setActiveTab] = useState<"all" | "foundation" | "floor" | "cert">("all");\n  const [activeCapabilityModal, setActiveCapabilityModal] = useState<number | null>(null);`
);

fs.writeFileSync('src/components/ModulesView.tsx', code);
