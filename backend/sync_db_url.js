const fs = require('fs');
const path = require('path');

const envProdPath = path.join(__dirname, '.env.production.local');
const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envProdPath)) {
  console.error('.env.production.local not found');
  process.exit(1);
}

const prodContent = fs.readFileSync(envProdPath, 'utf8');
const match = prodContent.match(/^DATABASE_URL=(.*)$/m);

if (!match) {
  console.error('DATABASE_URL not found in .env.production.local');
  process.exit(1);
}

const dbUrl = match[1];

let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

if (envContent.includes('DATABASE_URL=')) {
  envContent = envContent.replace(/^DATABASE_URL=.*$/m, `DATABASE_URL=${dbUrl}`);
} else {
  envContent = `DATABASE_URL=${dbUrl}\n${envContent}`;
}

fs.writeFileSync(envPath, envContent, 'utf8');
console.log('Successfully synced DATABASE_URL from Vercel to backend/.env');
