import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.resolve(__dirname, '../server/.env');

function validate() {
  console.log('🔍 Validating environment variables...');

  if (!fs.existsSync(envPath)) {
    console.error('❌ server/.env file NOT FOUND. Copy .env.example to .env to start.');
    process.exit(1);
  }

  dotenv.config({ path: envPath });

  const required = ['DATABASE_URL', 'JWT_SECRET', 'PORT'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error(`❌ MISSING ENV VARS: ${missing.join(', ')}`);
    process.exit(1);
  }

  console.log('✅ ENV validation passed!\n');
}

validate();
