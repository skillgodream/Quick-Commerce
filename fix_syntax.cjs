const fs = require('fs');

let content = fs.readFileSync('src/components/NewHireView.tsx', 'utf8');

// Find where insights block ends
const insightsEnd = `                  </div>
                </div>
              );
            })()}`;

if (content.includes(insightsEnd)) {
    content = content.replace(insightsEnd, insightsEnd + `\n              </div>\n            </div>`);
    // Wait, the original had `</div>\n            )}` after the insights block.
    // Let's just find `</div>\n            )}` and replace it with `</div>\n            </div>`
}
fs.writeFileSync('src/components/NewHireView.tsx', content);
