const fs = require('fs');
let content = fs.readFileSync('src/components/FloatingGlassMenu.tsx', 'utf8');

if (!content.includes('learner_dashboard')) {
  content = content.replace(
    /export type LearnerSection = "home" \| "modules" \| "journey" \| "dial" \| "dashboard" \| "buddy" \| "control_tower" \| "progress";/,
    'export type LearnerSection = "home" | "modules" | "journey" | "dial" | "dashboard" | "buddy" | "control_tower" | "progress" | "learner_dashboard";'
  );
  
  content = content.replace(
    /import \{\s*Home,\s*Columns,\s*Clock,\s*User,\s*Activity,\s*Target,\s*\}\ from "lucide-react";/,
    'import {\n  Home,\n  Columns,\n  Clock,\n  User,\n  Activity,\n  Target,\n  Compass\n} from "lucide-react";'
  );
  
  const newItem = `    {
      id: "learner_dashboard",
      labelEn: "My Status",
      labelHi: "मेरी स्थिति",
      icon: <Compass className="w-5 h-5 stroke-[1.8]" />,
    },
    {
      id: "dashboard",`;
      
  content = content.replace(
    /\{\s*id: "dashboard",/,
    newItem
  );
  
  fs.writeFileSync('src/components/FloatingGlassMenu.tsx', content);
}
