#!/usr/bin/env node

/**
 * Agent Workflow Helper Script
 *
 * Provides commands to help agents manage their work:
 * - Create new feature branch
 * - Pre-PR checks
 * - Update agent board
 */

const { execSync } = require('child_process');
const _fs = require('fs');
const _path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function exec(command, options = {}) {
  try {
    return execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
  } catch (error) {
    if (!options.ignoreError) {
      console.error(`Command failed: ${command}`);
      console.error(error.message);
      process.exit(1);
    }
    return null;
  }
}

async function createBranch() {
  console.log('\n🌿 Create Agent Branch\n');

  const agentName = await question('Agent name (e.g., copilot-1): ');
  const featureName = await question('Feature name (e.g., add-weapon-system): ');

  const branchName = `agent/${agentName}/${featureName}`;

  console.log(`\nCreating branch: ${branchName}`);

  // Ensure on master and up to date
  console.log('\n📥 Updating master...');
  exec('git checkout master');
  exec('git pull origin master');

  // Create and checkout branch
  console.log(`\n🔀 Creating branch ${branchName}...`);
  exec(`git checkout -b ${branchName}`);

  console.log('\n✅ Branch created! You can now start working.');
  console.log('\nDon\'t forget to update .github/AGENT_BOARD.md with your work!');
}

async function prChecks() {
  console.log('\n🔍 Running Pre-PR Checks\n');

  let failed = false;

  // ESLint
  console.log('1️⃣  Running ESLint...');
  const lintResult = exec('npm run lint', { ignoreError: true });
  if (lintResult === null) {
    console.error('❌ ESLint failed!');
    failed = true;
  } else {
    console.log('✅ ESLint passed!');
  }

  // TypeScript
  console.log('\n2️⃣  Running TypeScript type check...');
  const typeResult = exec('npm run type-check', { ignoreError: true });
  if (typeResult === null) {
    console.error('❌ Type check failed!');
    failed = true;
  } else {
    console.log('✅ Type check passed!');
  }

  // Build
  console.log('\n3️⃣  Running build...');
  const buildResult = exec('npm run build', { ignoreError: true });
  if (buildResult === null) {
    console.error('❌ Build failed!');
    failed = true;
  } else {
    console.log('✅ Build passed!');
  }

  console.log('\n' + '='.repeat(50));
  if (failed) {
    console.log('❌ Some checks failed. Fix issues before creating PR.');
    process.exit(1);
  } else {
    console.log('✅ All checks passed! Ready to create PR.');
    console.log('\nNext steps:');
    console.log('1. git push origin <your-branch>');
    console.log('2. Create PR on GitHub');
    console.log('3. Update .github/AGENT_BOARD.md');
  }
}

async function checkConflicts() {
  console.log('\n🔍 Checking for conflicts with master\n');

  const currentBranch = exec('git rev-parse --abbrev-ref HEAD', { silent: true }).trim();

  console.log(`Current branch: ${currentBranch}`);

  // Fetch latest
  console.log('\n📥 Fetching latest from origin...');
  exec('git fetch origin master');

  // Check if can merge cleanly
  console.log('\n🔀 Testing merge with master...');
  const mergeTest = exec('git merge-tree $(git merge-base HEAD origin/master) HEAD origin/master', {
    silent: true,
    ignoreError: true
  });

  if (mergeTest && mergeTest.includes('<<<<<<<')) {
    console.log('⚠️  Conflicts detected with master!\n');
    console.log('You should rebase before creating PR:');
    console.log('  git fetch origin master');
    console.log('  git rebase origin/master');
    console.log('  # Resolve conflicts');
    console.log('  git push --force-with-lease');
  } else {
    console.log('✅ No conflicts with master!');
  }
}

async function stats() {
  console.log('\n📊 Current Branch Statistics\n');

  const currentBranch = exec('git rev-parse --abbrev-ref HEAD', { silent: true }).trim();
  console.log(`Branch: ${currentBranch}`);

  // Files changed
  const filesChanged = exec('git diff --name-only master', { silent: true });
  const fileCount = filesChanged ? filesChanged.trim().split('\n').filter(f => f).length : 0;
  console.log(`Files changed: ${fileCount}`);

  // Lines changed
  const stats = exec('git diff --stat master', { silent: true });
  console.log('\n' + stats);

  // Commits ahead
  const commitsAhead = exec('git rev-list --count master..HEAD', { silent: true }).trim();
  console.log(`Commits ahead of master: ${commitsAhead}`);
}

async function main() {
  console.log('🤖 Agent Workflow Helper\n');
  console.log('Commands:');
  console.log('  1. Create new branch');
  console.log('  2. Run pre-PR checks');
  console.log('  3. Check for conflicts');
  console.log('  4. Show branch stats');
  console.log('  5. Exit');

  const choice = await question('\nSelect option: ');

  switch (choice) {
  case '1':
    await createBranch();
    break;
  case '2':
    await prChecks();
    break;
  case '3':
    await checkConflicts();
    break;
  case '4':
    await stats();
    break;
  case '5':
    console.log('👋 Goodbye!');
    break;
  default:
    console.log('Invalid option');
  }

  rl.close();
}

main().catch(console.error);
