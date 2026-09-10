const fs = require('fs');
let code = fs.readFileSync('src/components/LearnerDailyReportCard.tsx', 'utf8');

const target = `<button
            type="button"
            onClick={handlePlayAudio}
            className="p-1.5 rounded-full text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Listen aloud"
          >
            <Volume2 className={\`w-4 h-4 \${playingAudio ? "animate-bounce text-cyan-400" : ""}\`} />
          </button>`;

code = code.replace(target, '');
fs.writeFileSync('src/components/LearnerDailyReportCard.tsx', code);
