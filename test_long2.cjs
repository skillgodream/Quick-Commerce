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
}

runTests();
