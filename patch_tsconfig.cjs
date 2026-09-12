const fs = require('fs');
let content = fs.readFileSync('tsconfig.json', 'utf8');
const obj = JSON.parse(content);
obj.exclude = ["dist", "node_modules"];
fs.writeFileSync('tsconfig.json', JSON.stringify(obj, null, 2));
