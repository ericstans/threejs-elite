#!/usr/bin/env node

/**
 * Pre-commit checks script
 * Run this before committing to ensure code quality
 */

const { execSync } = require('child_process');

function exec(command, options = {}) {
  try {
    return execSync(command, {
      encoding: 'utf8',
      stdio: 'inherit',
      ...options
    });
  } catch (error) {
    return null;
  }
}

console.log('🔍 Running pre-commit checks...\n');

let failed = false;

// Check for console.log statements
console.log('1️⃣  Checking for console.log statements...');
const consoleCheck = execSync('git diff --cached --name-only', { encoding: 'utf8' })
  .split('\n')
  .filter(f => f.endsWith('.js'));

let foundConsole = false;
for (const file of consoleCheck) {
  if (!file) continue;
  try {
    const content = require('fs').readFileSync(file, 'utf8');
    if (content.includes('console.log') && !file.includes('scripts/')) {
      console.log(`   ⚠️  Found console.log in ${file}`);
      foundConsole = true;
    }
  } catch (e) {
    // File might be deleted
  }
}

if (foundConsole) {
  console.log('   ❌ Remove console.log statements or use debug flags');
  failed = true;
} else {
  console.log('   ✅ No console.log found');
}

// Run ESLint on staged files
console.log('\n2️⃣  Running ESLint on staged files...');
const result = exec('npm run lint', { ignoreError: true });
if (result === null) {
  console.log('   ❌ ESLint failed!');
  failed = true;
} else {
  console.log('   ✅ ESLint passed!');
}

if (failed) {
  console.log('\n❌ Pre-commit checks failed. Fix issues before committing.');
  process.exit(1);
} else {
  console.log('\n✅ All pre-commit checks passed!');
}
