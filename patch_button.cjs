const fs = require('fs');
let content = fs.readFileSync('src/components/NewHireView.tsx', 'utf8');

const oldButton = `{onOpenManagerConsole && (
                <button
                  type="button"
                  onClick={onOpenManagerConsole}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all cursor-pointer shadow-sm"
                  title="Manager Console"
                >
                  <ShieldCheck className="w-5 h-5 text-white" />
                </button>
              )}`;

const newButton = `{onOpenManagerConsole && (
                <button
                  type="button"
                  onClick={onOpenManagerConsole}
                  className="h-10 px-3 rounded-full bg-indigo-500 hover:bg-indigo-400 backdrop-blur-md border border-indigo-400 flex items-center justify-center gap-1.5 text-white transition-all cursor-pointer shadow-md"
                  title="Manager Console"
                >
                  <ShieldCheck className="w-4 h-4 text-white" />
                  <span className="text-xs font-bold whitespace-nowrap">Manager</span>
                </button>
              )}`;

content = content.replace(oldButton, newButton);

fs.writeFileSync('src/components/NewHireView.tsx', content);
