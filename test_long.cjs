const http = require('http');

async function testPattern(name, historyText) {
  return new Promise((resolve) => {
    const data = JSON.stringify({ historyText });
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/signals/understand-longitudinal',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log(`\n--- ${name} ---`);
        console.log(body);
        resolve();
      });
    });
    req.write(data);
    req.end();
  });
}

async function runTests() {
  await testPattern("Scenario A - Recurring capability issue", 
    "Day 1: Manager notes: 'Struggled to identify variants'\nDay 2: Manager notes: 'Still mixing up similar packaging'\nDay 3: Manager notes: 'Made a variant mistake again'");
  
  await testPattern("Scenario B - One-off issue", 
    "Day 1: Manager notes: 'Everything good'\nDay 2: Manager notes: 'A bit slow today, was feeling unwell'\nDay 3: Manager notes: 'Back to normal speed'");

  await testPattern("Scenario C - Intervention improvement", 
    "Day 1: Manager notes: 'Struggled to identify variants'\nDay 2: Outcome: 'Route demonstration' (Improved: yes)\nDay 3: Manager notes: 'No variant mistakes today, accuracy 100%'");

  await testPattern("Scenario D - Intervention partial response", 
    "Day 1: Manager notes: 'Slow on Aisle 7'\nDay 2: Outcome: 'Route demonstration' (Improved: partial)\nDay 3: Manager notes: 'Still somewhat slow on Aisle 7'");

  await testPattern("Scenario E - Environmental recurrence", 
    "Day 1: Self-report: 'Scanner battery died'\nDay 2: Manager notes: 'Good pick rate'\nDay 3: Self-report: 'Scanner frozen again'\nDay 4: Manager notes: 'Pick rate dropped due to scanner'");

  await testPattern("Scenario F - Improvement / pattern disappearance", 
    "Day 1: Manager notes: 'Slow on Aisle 7'\nDay 2: Manager notes: 'Slow on Aisle 7'\nDay 3: Manager notes: 'Much better on Aisle 7'\nDay 4: Manager notes: 'No issues on Aisle 7'\nDay 5: Manager notes: 'No issues'");

  await testPattern("Scenario G - Insufficient evidence", 
    "Day 1: Manager notes: 'Hmm, not sure'\nDay 2: Manager notes: 'Seems okay mostly'\nDay 3: Manager notes: 'Just average'");
}

runTests();
