const fs = require('fs');
const path = require('path');

const envProdPath = path.join(__dirname, '.env.production.local');
const prodContent = fs.readFileSync(envProdPath, 'utf8');

const lines = prodContent.split('\n');
for (const line of lines) {
  if (line.includes('=')) {
    const [key, val] = line.split('=');
    const cleanVal = val.replace(/"/g, '').trim();
    console.log(`${key}: starts with "${cleanVal.substring(0, 15)}", length: ${cleanVal.length}`);
  }
}
