const fs = require('fs');

let content = fs.readFileSync('src/components/NewHireView.tsx', 'utf8');

const target = `            })()}
              </div>
            )}`;

const replacement = `            })()}
              </div>
            </div>`;

if(content.includes(target)) {
    content = content.replace(target, replacement);
}

fs.writeFileSync('src/components/NewHireView.tsx', content);
