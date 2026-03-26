const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function reset() {
  console.log('🚮 RESETTING Development Environment...');
  
  const folders = [
    path.resolve(__dirname, '..'),
    path.resolve(__dirname, '../server'),
    path.resolve(__dirname, '../mobile')
  ];

  folders.forEach(folder => {
    const nodeModules = path.join(folder, 'node_modules');
    if (fs.existsSync(nodeModules)) {
      console.log(`🗑️ Removing ${nodeModules}...`);
      fs.rmSync(nodeModules, { recursive: true, force: true });
    }
    const lockFile = path.join(folder, 'package-lock.json');
    if (fs.existsSync(lockFile)) {
      console.log(`🗑️ Removing ${lockFile}...`);
      fs.unlinkSync(lockFile);
    }
  });

  console.log('📦 Reinstalling Dependencies (Monorepo)...');
  execSync('npm install', { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });

  console.log('📦 Reinstalling Server Dependencies...');
  execSync('npm install', { stdio: 'inherit', cwd: path.resolve(__dirname, '../server') });

  console.log('📦 Reinstalling Mobile Dependencies...');
  execSync('npm install', { stdio: 'inherit', cwd: path.resolve(__dirname, '../mobile') });

  console.log('💎 Regenerating Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit', cwd: path.resolve(__dirname, '../server') });

  console.log('\n✅ RESET COMPLETE! Restarting now...');
  execSync('npm run dev', { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
}

reset();
