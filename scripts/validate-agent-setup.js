#!/usr/bin/env node

/**
 * Validate Agent Setup
 *
 * Checks that the repository is properly configured for multi-agent development
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Validating Agent Setup\n');

let errors = 0;
let warnings = 0;

function check(name, condition, errorMsg, isWarning = false) {
  if (condition) {
    console.log(`✅ ${name}`);
  } else {
    if (isWarning) {
      console.log(`⚠️  ${name}: ${errorMsg}`);
      warnings++;
    } else {
      console.log(`❌ ${name}: ${errorMsg}`);
      errors++;
    }
  }
}

function fileExists(filepath) {
  return fs.existsSync(path.join(__dirname, '..', filepath));
}

function exec(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'pipe' });
  } catch {
    return null;
  }
}

// Check Git setup
console.log('📦 Git Configuration\n');
check(
  'Git repository',
  exec('git rev-parse --git-dir'),
  'Not a git repository'
);
check(
  'Remote origin',
  exec('git remote get-url origin'),
  'No remote origin configured',
  true
);

// Check GitHub files
console.log('\n📄 GitHub Files\n');
check(
  'Agent Setup Guide',
  fileExists('.github/AGENT_SETUP.md'),
  'Missing .github/AGENT_SETUP.md'
);
check(
  'Agent Board',
  fileExists('.github/AGENT_BOARD.md'),
  'Missing .github/AGENT_BOARD.md'
);
check(
  'PR Template',
  fileExists('.github/PULL_REQUEST_TEMPLATE.md'),
  'Missing .github/PULL_REQUEST_TEMPLATE.md'
);
check(
  'Contributing Guide',
  fileExists('.github/CONTRIBUTING.md'),
  'Missing .github/CONTRIBUTING.md'
);
check(
  'Code Owners',
  fileExists('.github/CODEOWNERS'),
  'Missing .github/CODEOWNERS',
  true
);

// Check workflows
console.log('\n⚙️  GitHub Workflows\n');
check(
  'PR Checks Workflow',
  fileExists('.github/workflows/pr-checks.yml'),
  'Missing .github/workflows/pr-checks.yml'
);
check(
  'Auto Label Workflow',
  fileExists('.github/workflows/pr-auto-label.yml'),
  'Missing .github/workflows/pr-auto-label.yml',
  true
);

// Check scripts
console.log('\n📜 Helper Scripts\n');
check(
  'Agent Workflow Script',
  fileExists('scripts/agent-workflow.js'),
  'Missing scripts/agent-workflow.js'
);
check(
  'Pre-commit Script',
  fileExists('scripts/pre-commit.js'),
  'Missing scripts/pre-commit.js',
  true
);

// Check package.json scripts
console.log('\n📦 NPM Scripts\n');
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
check(
  'lint script',
  packageJson.scripts && packageJson.scripts.lint,
  'Missing "lint" script in package.json'
);
check(
  'type-check script',
  packageJson.scripts && packageJson.scripts['type-check'],
  'Missing "type-check" script in package.json'
);
check(
  'build script',
  packageJson.scripts && packageJson.scripts.build,
  'Missing "build" script in package.json'
);
check(
  'agent:checks script',
  packageJson.scripts && packageJson.scripts['agent:checks'],
  'Missing "agent:checks" script in package.json',
  true
);
check(
  'agent:workflow script',
  packageJson.scripts && packageJson.scripts['agent:workflow'],
  'Missing "agent:workflow" script in package.json',
  true
);

// Check dependencies
console.log('\n📚 Dependencies\n');
check(
  'node_modules exists',
  fileExists('node_modules'),
  'Dependencies not installed. Run: npm install'
);
check(
  'ESLint installed',
  packageJson.devDependencies && packageJson.devDependencies.eslint,
  'ESLint not in devDependencies'
);
check(
  'TypeScript installed',
  packageJson.devDependencies && packageJson.devDependencies.typescript,
  'TypeScript not in devDependencies'
);

// Check project structure
console.log('\n🗂️  Project Structure\n');
check('src/ directory', fileExists('src'), 'Missing src/ directory');
check('src/ui/ directory', fileExists('src/ui'), 'Missing src/ui/ directory');
check('src/systems/ directory', fileExists('src/systems'), 'Missing src/systems/ directory');
check('src/styles/ directory', fileExists('src/styles'), 'Missing src/styles/ directory');

// Check configuration files
console.log('\n⚙️  Configuration Files\n');
check('eslint.config.js', fileExists('eslint.config.js'), 'Missing eslint.config.js');
check('tsconfig.json', fileExists('tsconfig.json'), 'Missing tsconfig.json');
check('.gitignore', fileExists('.gitignore'), 'Missing .gitignore');

// Test npm scripts
console.log('\n🧪 Testing NPM Scripts\n');
check(
  'npm run lint (dry run)',
  exec('npm run lint --help') !== null,
  'Cannot run "npm run lint"'
);
check(
  'npm run type-check (dry run)',
  exec('npm run type-check --help') !== null,
  'Cannot run "npm run type-check"'
);

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 Summary\n');

if (errors === 0 && warnings === 0) {
  console.log('✅ Perfect! Agent setup is complete and ready to use.');
  console.log('\nNext steps:');
  console.log('1. Read .github/AGENT_SETUP.md');
  console.log('2. Check .github/AGENT_BOARD.md for available tasks');
  console.log('3. Run: npm run agent:workflow');
} else {
  if (errors > 0) {
    console.log(`❌ ${errors} error(s) found. Fix these before proceeding.`);
  }
  if (warnings > 0) {
    console.log(`⚠️  ${warnings} warning(s). These are optional but recommended.`);
  }

  console.log('\nTo fix errors, ensure all required files are present.');
  process.exit(errors > 0 ? 1 : 0);
}

console.log('\n🤖 Happy agent coding!');
