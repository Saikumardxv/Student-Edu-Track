const fs = require('fs');
const path = require('path');

const envProdPath = path.join(__dirname, '.env.production.local');

if (!fs.existsSync(envProdPath)) {
  console.error('.env.production.local not found');
  process.exit(1);
}

const prodContent = fs.readFileSync(envProdPath, 'utf8');
const lines = prodContent.split('\n');

for (const line of lines) {
  if (line.includes('=')) {
    const [key, val] = line.split('=');
    const cleanVal = val.replace(/"/g, '').trim();
    if (cleanVal.includes('://')) {
      const protocol = cleanVal.split('://')[0];
      console.log(`${key} protocol: ${protocol}://`);
    }
  }
}
