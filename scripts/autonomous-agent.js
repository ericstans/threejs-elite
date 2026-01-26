#!/usr/bin/env node

/**
 * Autonomous Agent Script
 * 
 * Fully automated agent that can:
 * 1. Read project documentation
 * 2. Choose tasks from AGENT_BOARD.md
 * 3. Create branches
 * 4. Implement features (with AI API)
 * 5. Run validation checks
 * 6. Submit PRs
 * 
 * Usage:
 *   node scripts/autonomous-agent.js --agent-name=auto-1 --ai-provider=openai
 * 
 * Environment variables required:
 *   - AI_API_KEY: OpenAI, Anthropic, or other AI provider API key
 *   - GITHUB_TOKEN: GitHub personal access token for creating PRs
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class AutonomousAgent {
  constructor(options = {}) {
    this.agentName = options.agentName || 'autonomous-agent-1';
    this.aiProvider = options.aiProvider || 'mock'; // 'openai', 'anthropic', 'mock'
    this.aiApiKey = process.env.AI_API_KEY;
    this.githubToken = process.env.GITHUB_TOKEN;
    this.dryRun = options.dryRun || false;
    this.maxCheckAttempts = 3;
  }

  log(message, type = 'info') {
    const prefix = {
      info: '📝',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      working: '🔨'
    }[type] || '📝';
    
    console.log(`${prefix} [${this.agentName}] ${message}`);
  }

  exec(command, options = {}) {
    try {
      return execSync(command, {
        encoding: 'utf8',
        stdio: options.silent ? 'pipe' : 'inherit',
        ...options
      });
    } catch (error) {
      if (!options.ignoreError) {
        throw new Error(`Command failed: ${command}\n${error.message}`);
      }
      return null;
    }
  }

  // 1. Read all project documentation
  readDocumentation() {
    this.log('Reading project documentation...');
    
    const docFiles = [
      '.github/AGENT_SETUP.md',
      '.github/copilot-instructions.md',
      '.github/AGENT_QUICK_REFERENCE.md',
      'README.md'
    ];

    const docs = {};
    for (const file of docFiles) {
      const fullPath = path.join(process.cwd(), file);
      if (fs.existsSync(fullPath)) {
        docs[file] = fs.readFileSync(fullPath, 'utf8');
        this.log(`  Read: ${file}`);
      }
    }

    return docs;
  }

  // 2. Parse and select task from AGENT_BOARD.md (with latest master)
  async chooseTask() {
    this.log('Fetching latest task board...');
    
    // PHASE 1: Pre-claim check - get latest state from master
    if (!this.dryRun) {
      this.exec('git fetch origin master', { ignoreError: true });
      this.exec('git checkout master', { ignoreError: true });
      this.exec('git pull origin master', { ignoreError: true });
    }
    
    const boardPath = path.join(process.cwd(), '.github/AGENT_BOARD.md');
    const board = fs.readFileSync(boardPath, 'utf8');

    // Parse unclaimed tasks only
    const unclaimedTasks = this.parseUnclaimedTasks(board);
    const claimedTasks = this.parseClaimedTasks(board);

    if (unclaimedTasks.length === 0) {
      throw new Error('No unclaimed tasks found in AGENT_BOARD.md');
    }

    this.log(`Found ${unclaimedTasks.length} unclaimed tasks (${claimedTasks.length} already claimed)`);
    if (claimedTasks.length > 0) {
      this.log(`Claimed by: ${claimedTasks.map(c => c.agent).join(', ')}`, 'info');
    }

    // For now, use simple selection. In production, use AI to choose best task
    const selectedTask = await this.selectTaskWithAI(unclaimedTasks, board);
    
    this.log(`Selected task: ${selectedTask.description}`, 'success');
    return selectedTask;
  }

  async selectTaskWithAI(tasks, boardContext) {
    // Mock implementation - in production, call AI API
    if (this.aiProvider === 'mock') {
      return {
        description: tasks[0],
        slug: tasks[0].toLowerCase().replace(/\s+/g, '-').substring(0, 30),
        estimatedFiles: this.estimateFilesForTask(tasks[0])
      };
    }

    // Real AI implementation would go here
    throw new Error('AI provider not implemented. Use --ai-provider=mock for testing');
  }

  estimateFilesForTask(taskDescription) {
    // Simple heuristic to estimate which files to modify
    const keywords = taskDescription.toLowerCase();
    const files = [];

    if (keywords.includes('combat') || keywords.includes('weapon')) {
      files.push('src/systems/CombatSystem.js', 'src/Spaceship.js');
    }
    if (keywords.includes('ui') || keywords.includes('display')) {
      files.push('src/UI.js', 'src/styles/ui/');
    }
    if (keywords.includes('save') || keywords.includes('load')) {
      files.push('src/systems/GameStateManager.js', 'src/systems/serialization/');
    }
    if (keywords.includes('trading') || keywords.includes('economy')) {
      files.push('src/systems/CargoSystem.js', 'src/data/CommoditiesData.js');
    }

    return files.length > 0 ? files : ['src/'];
  }

  // Parse claimed and unclaimed tasks from AGENT_BOARD.md
  parseUnclaimedTasks(boardContent) {
    const tasks = [];
    
    // Extract tasks from "Available Tasks" section
    const taskRegex = /^- \[ \] (.+)$/gm;
    let match;
    
    while ((match = taskRegex.exec(boardContent)) !== null) {
      tasks.push(match[1]);
    }
    
    return tasks;
  }
  
  parseClaimedTasks(boardContent) {
    const claimed = [];
    
    // Extract active work entries
    const activeWorkRegex = /^\| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \|$/gm;
    let match;
    
    while ((match = activeWorkRegex.exec(boardContent)) !== null) {
      const agent = match[1].trim();
      const task = match[3].trim();
      
      // Skip header row
      if (agent !== 'Agent' && agent !== '-' && agent !== '') {
        claimed.push({ agent, task });
      }
    }
    
    return claimed;
  }

  // 3. Claim task on master, then create feature branch
  claimTaskAndBranch(task) {
    const branchName = `agent/${this.agentName}/${task.slug}`;
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.log(`Claiming task on master (attempt ${attempt}/${maxRetries})...`);
        
        if (this.dryRun) {
          this.log(`[DRY RUN] Would claim task and create branch: ${branchName}`, 'warning');
          return branchName;
        }

        // Ensure on master and up to date
        this.log('Updating master branch...');
        this.exec('git checkout master');
        this.exec('git pull origin master');
        
        // Read current board to verify task is still available
        const boardPath = path.join(process.cwd(), '.github/AGENT_BOARD.md');
        const currentBoard = fs.readFileSync(boardPath, 'utf8');
        const claimedTasks = this.parseClaimedTasks(currentBoard);
        
        // Check if task is already claimed by another agent
        const alreadyClaimed = claimedTasks.some(claimed => 
          claimed.task.toLowerCase().includes(task.description.toLowerCase().substring(0, 20))
        );
        
        if (alreadyClaimed) {
          this.log('Task was claimed by another agent. Will retry with new task.', 'warning');
          throw new Error('TASK_CLAIMED');
        }

        // Update board to claim task
        this.log('Updating AGENT_BOARD to claim task...');
        const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const entry = `| ${this.agentName} | ${branchName} | ${task.description} | ${task.estimatedFiles.join(', ')} | Claiming | ${date} |`;
        
        const updatedBoard = currentBoard.replace(
          /(\| Agent \| Branch \| Feature \| Files Affected \| Status \| ETA \|\n\|.*?\n)(\|.*\n)?/,
          `$1${entry}\n`
        );
        
        fs.writeFileSync(boardPath, updatedBoard);
        
        // Commit board update
        this.exec('git add .github/AGENT_BOARD.md');
        this.exec(`git commit -m "[${this.agentName}] Claim task: ${task.description}"`);
        
        // Try to push - this will fail if another agent pushed first
        this.log('Pushing claim to master...');
        this.exec('git push origin master');
        
        this.log('Task claimed successfully!', 'success');
        
        // Now create feature branch from master
        this.log(`Creating feature branch: ${branchName}`);
        this.exec(`git checkout -b ${branchName}`);
        
        this.log(`Branch created: ${branchName}`, 'success');
        return branchName;
        
      } catch (error) {
        if (error.message === 'TASK_CLAIMED') {
          // Task was claimed, need to select a different task
          throw error; // Propagate to main workflow
        }
        
        // Push failed due to conflict - another agent pushed first
        if (attempt < maxRetries) {
          this.log(`Push conflict detected. Retrying...`, 'warning');
          // Reset any uncommitted changes and retry
          this.exec('git reset --hard origin/master', { ignoreError: true });
          this.exec('git checkout master', { ignoreError: true });
          continue;
        } else {
          this.log('Failed to claim task after max retries', 'error');
          throw error;
        }
      }
    }
    
    throw new Error('Failed to claim task and create branch');
  }

  // 4. Implement feature (with AI assistance)
  async implementFeature(task) {
    this.log('Implementing feature...', 'working');
    
    if (this.aiProvider === 'mock') {
      this.log('[MOCK MODE] Would implement feature with AI', 'warning');
      this.log('In production, this would:', 'warning');
      this.log('  1. Read relevant source files', 'warning');
      this.log('  2. Call AI API to generate code changes', 'warning');
      this.log('  3. Apply changes following project guidelines', 'warning');
      this.log('  4. Ensure CSS classes (not inline styles)', 'warning');
      this.log('  5. Add proper TypeScript types', 'warning');
      
      // Create a placeholder commit for testing
      if (!this.dryRun) {
        const readmePath = path.join(process.cwd(), 'README.md');
        const readme = fs.readFileSync(readmePath, 'utf8');
        fs.writeFileSync(readmePath, readme + `\n<!-- Task: ${task.description} -->\n`);
        this.log('Created placeholder change for testing', 'warning');
      }
      return;
    }

    // Real implementation with AI API
    throw new Error('AI implementation not available. Use mock mode for testing.');
  }

  // 5. Run validation checks
  runChecks() {
    this.log('Running validation checks...', 'working');
    
    if (this.dryRun) {
      this.log('[DRY RUN] Would run: npm run agent:checks', 'warning');
      return true;
    }

    try {
      this.exec('npm run agent:checks');
      this.log('All checks passed!', 'success');
      return true;
    } catch (error) {
      this.log('Checks failed', 'error');
      return false;
    }
  }

  // Get detailed error information
  getErrorDetails() {
    const errors = {
      lint: null,
      typeCheck: null,
      build: null
    };

    try {
      this.exec('npm run lint', { silent: true });
    } catch (error) {
      errors.lint = error.stdout || error.message;
    }

    try {
      this.exec('npm run type-check', { silent: true });
    } catch (error) {
      errors.typeCheck = error.stdout || error.message;
    }

    try {
      this.exec('npm run build', { silent: true });
    } catch (error) {
      errors.build = error.stdout || error.message;
    }

    return errors;
  }

  // Interactive assistance mode
  async enterAssistedMode(task, errors) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (query) => new Promise(resolve => rl.question(query, resolve));

    console.log('\n' + '='.repeat(60));
    console.log('🤝 ENTERING ASSISTED MODE');
    console.log('='.repeat(60));
    console.log('\nThe autonomous agent needs help with validation errors.\n');

    // Show task context
    console.log('📋 Task Context:');
    console.log(`  Task: ${task.description}`);
    console.log(`  Files: ${task.estimatedFiles.join(', ')}`);
    console.log('');

    // Show errors
    console.log('❌ Errors Found:');
    if (errors.lint) {
      console.log('\n  Lint Errors:');
      console.log('  ' + errors.lint.split('\n').slice(0, 10).join('\n  '));
    }
    if (errors.typeCheck) {
      console.log('\n  TypeScript Errors:');
      console.log('  ' + errors.typeCheck.split('\n').slice(0, 10).join('\n  '));
    }
    if (errors.build) {
      console.log('\n  Build Errors:');
      console.log('  ' + errors.build.split('\n').slice(0, 10).join('\n  '));
    }

    console.log('\n' + '='.repeat(60));

    // Generate context file for Copilot
    const contextFile = this.generateCopilotContext(task, errors);
    console.log(`\n✅ Generated context file: ${contextFile}`);

    // Generate Copilot prompt
    const copilotPrompt = this.generateCopilotPrompt(task, errors);
    console.log('\n📝 Suggested Copilot Prompt:');
    console.log('─'.repeat(60));
    console.log(copilotPrompt);
    console.log('─'.repeat(60));

    // Offer options
    console.log('\n\nWhat would you like to do?\n');
    console.log('  1. Open error files in VS Code');
    console.log('  2. Copy Copilot prompt to clipboard');
    console.log('  3. Save detailed error report');
    console.log('  4. Wait for manual fixes, then retry checks');
    console.log('  5. Abort and exit');

    const choice = await question('\nSelect option (1-5): ');

    switch (choice) {
      case '1':
        await this.openErrorFilesInVSCode(errors);
        console.log('\n✅ Files opened. Fix the errors, then return here.');
        await question('\nPress Enter when ready to retry checks...');
        rl.close();
        return 'retry';

      case '2':
        await this.copyToClipboard(copilotPrompt);
        console.log('\n✅ Prompt copied! Open Copilot Chat and paste.');
        await question('\nPress Enter when fixes are complete to retry checks...');
        rl.close();
        return 'retry';

      case '3':
        const reportPath = this.saveErrorReport(task, errors);
        console.log(`\n✅ Report saved to: ${reportPath}`);
        console.log('Review the report and fix errors manually.');
        await question('\nPress Enter when ready to retry checks...');
        rl.close();
        return 'retry';

      case '4':
        console.log('\n⏸️  Pausing for manual fixes...');
        await question('\nPress Enter when ready to retry checks...');
        rl.close();
        return 'retry';

      case '5':
      default:
        console.log('\n👋 Aborting...');
        rl.close();
        return 'abort';
    }
  }

  generateCopilotContext(task, errors) {
    const contextPath = path.join(process.cwd(), '.agent-context.md');
    const content = `# Autonomous Agent - Assistance Needed

## Task
${task.description}

## Files Being Modified
${task.estimatedFiles.map(f => `- ${f}`).join('\n')}

## Current Status
The autonomous agent attempted to implement this feature but encountered validation errors.

## Errors

### Linting Errors
\`\`\`
${errors.lint || 'No lint errors'}
\`\`\`

### TypeScript Errors
\`\`\`
${errors.typeCheck || 'No type errors'}
\`\`\`

### Build Errors
\`\`\`
${errors.build || 'No build errors'}
\`\`\`

## Guidelines
- Use CSS classes, NOT inline styles
- Follow patterns in existing code
- Add proper TypeScript types
- See .github/copilot-instructions.md for full guidelines

## Next Steps
1. Fix the errors above
2. Run: npm run agent:checks
3. Ensure all checks pass
`;

    fs.writeFileSync(contextPath, content);
    return contextPath;
  }

  generateCopilotPrompt(task, errors) {
    return `I'm working with an autonomous agent on this task:
"${task.description}"

The agent made changes but hit validation errors. Please help fix them:

Files: ${task.estimatedFiles.join(', ')}

Errors:
${errors.lint ? '- Lint errors (see below)' : ''}
${errors.typeCheck ? '- TypeScript errors (see below)' : ''}
${errors.build ? '- Build errors (see below)' : ''}

Please:
1. Read .agent-context.md for full error details
2. Fix all validation errors
3. Follow project guidelines (CSS classes, not inline styles)
4. Ensure npm run agent:checks passes

Show me the fixes needed.`;
  }

  async openErrorFilesInVSCode(errors) {
    // Extract file paths from error messages
    const filePattern = /(?:^|\s)([a-zA-Z]:[/\\].+?\.(?:js|ts|jsx|tsx|css))(?::|;|\s|$)/gm;
    const files = new Set();

    for (const errorType of Object.values(errors)) {
      if (errorType) {
        let match;
        while ((match = filePattern.exec(errorType)) !== null) {
          files.add(match[1]);
        }
      }
    }

    if (files.size === 0) {
      console.log('  No specific files identified in errors.');
      return;
    }

    // Open files with VS Code
    for (const file of files) {
      try {
        this.exec(`code "${file}"`, { silent: true, ignoreError: true });
        console.log(`  Opened: ${file}`);
      } catch {
        // Ignore if file doesn't exist or code command fails
      }
    }
  }

  async copyToClipboard(text) {
    try {
      // Windows: use clip.exe
      const proc = spawn('clip');
      proc.stdin.write(text);
      proc.stdin.end();
      await new Promise((resolve, reject) => {
        proc.on('exit', resolve);
        proc.on('error', reject);
      });
    } catch {
      console.log('  Could not copy to clipboard. Here\'s the prompt:');
      console.log(text);
    }
  }

  saveErrorReport(task, errors) {
    const reportPath = path.join(process.cwd(), 'agent-error-report.md');
    const content = `# Agent Error Report
Generated: ${new Date().toISOString()}

## Task
${task.description}

## Files
${task.estimatedFiles.join('\n')}

## Lint Errors
\`\`\`
${errors.lint || 'None'}
\`\`\`

## TypeScript Errors
\`\`\`
${errors.typeCheck || 'None'}
\`\`\`

## Build Errors
\`\`\`
${errors.build || 'None'}
\`\`\`
`;

    fs.writeFileSync(reportPath, content);
    return reportPath;
  }

  // 6. Update agent board
  updateAgentBoard(task, branch, status = 'In Progress') {
    this.log('Updating agent board...');
    
    const boardPath = path.join(process.cwd(), '.github/AGENT_BOARD.md');
    let board = fs.readFileSync(boardPath, 'utf8');

    if (this.dryRun) {
      this.log('[DRY RUN] Would update AGENT_BOARD.md', 'warning');
      return;
    }

    // Add to active work table
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const entry = `| ${this.agentName} | ${branch} | ${task.description} | ${task.estimatedFiles.join(', ')} | ${status} | ${date} |`;
    
    board = board.replace(
      /(\| Agent \| Branch \| Feature \| Files Affected \| Status \| ETA \|\n\|.*?\n)(\|.*\n)?/,
      `$1${entry}\n`
    );

    fs.writeFileSync(boardPath, board);
    this.log('Agent board updated', 'success');
  }

  // 7. Commit and push
  commitAndPush(task, branch) {
    this.log('Committing changes...');
    
    if (this.dryRun) {
      this.log('[DRY RUN] Would commit and push', 'warning');
      return;
    }

    this.exec('git add .');
    this.exec(`git commit -m "feat: ${task.description}"`);
    this.log('Changes committed', 'success');

    this.log('Pushing to remote...');
    this.exec(`git push origin ${branch}`);
    this.log('Pushed to remote', 'success');
  }

  // 8. Create PR (requires GitHub token)
  async createPullRequest(task, branch) {
    this.log('Creating pull request...');
    
    if (!this.githubToken) {
      this.log('GITHUB_TOKEN not set. Please create PR manually:', 'warning');
      this.log(`  Branch: ${branch}`, 'warning');
      this.log(`  Title: feat: ${task.description}`, 'warning');
      return;
    }

    if (this.dryRun) {
      this.log('[DRY RUN] Would create PR on GitHub', 'warning');
      return;
    }

    // Use GitHub CLI if available
    try {
      this.exec('gh --version', { silent: true });
      const prUrl = this.exec(
        `gh pr create --title "feat: ${task.description}" --body "Implemented by autonomous agent: ${this.agentName}\n\nTask: ${task.description}" --base master --head ${branch}`,
        { silent: true }
      );
      this.log(`PR created: ${prUrl.trim()}`, 'success');
    } catch {
      this.log('GitHub CLI not available. Install with: winget install GitHub.cli', 'warning');
      this.log('Or create PR manually on GitHub', 'warning');
    }
  }

  // Main workflow
  async run() {
    console.log('\n🤖 Autonomous Agent Starting...\n');
    console.log(`Agent: ${this.agentName}`);
    console.log(`AI Provider: ${this.aiProvider}`);
    console.log(`Dry Run: ${this.dryRun}\n`);

    try {
      // Step 1: Read documentation
      const docs = this.readDocumentation();
      this.log(`Read ${Object.keys(docs).length} documentation files`, 'success');

      // Step 2: Choose task (from latest master)
      const task = await this.chooseTask();

      // Step 3: Claim task on master, then create branch (atomic operation)
      const branch = this.claimTaskAndBranch(task);

      // Step 4: Update board status to In Progress (already claimed)
      this.updateAgentBoard(task, branch, 'In Progress');

      // Step 5: Implement feature
      await this.implementFeature(task);

      // Step 6: Run checks with auto-fix attempts
      let checksPassed = false;
      for (let attempt = 1; attempt <= this.maxCheckAttempts; attempt++) {
        this.log(`Running checks (attempt ${attempt}/${this.maxCheckAttempts})...`);
        checksPassed = this.runChecks();
        
        if (checksPassed) {
          break;
        }

        if (attempt < this.maxCheckAttempts) {
          this.log('Attempting auto-fix...', 'warning');
          // In production: await this.fixIssuesWithAI();
        }
      }

      if (!checksPassed) {
        this.log('Failed to pass checks after max attempts', 'error');
        
        if (this.dryRun) {
          this.log('[DRY RUN] Would enter assisted mode', 'warning');
        } else {
          // Enter interactive assisted mode
          const errors = this.getErrorDetails();
          const action = await this.enterAssistedMode(task, errors);
          
          if (action === 'retry') {
            // User fixed issues, retry checks one more time
            this.log('Retrying validation checks after manual fixes...', 'working');
            checksPassed = this.runChecks();
            
            if (!checksPassed) {
              this.log('Checks still failing. Aborting.', 'error');
              process.exit(1);
            }
            this.log('Checks passed after manual intervention!', 'success');
          } else {
            // User chose to abort
            this.log('Workflow aborted by user', 'warning');
            process.exit(1);
          }
        }
      }

      // Step 7: Commit and push
      this.commitAndPush(task, branch);

      // Step 8: Create PR
      await this.createPullRequest(task, branch);

      // Step 9: Update board (completed)
      this.updateAgentBoard(task, branch, 'PR Created');

      console.log('\n✅ Autonomous agent workflow completed successfully!\n');

    } catch (error) {
      this.log(`Error: ${error.message}`, 'error');
      console.error(error);
      process.exit(1);
    }
  }
}

// CLI handling
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    agentName: 'autonomous-agent-1',
    aiProvider: 'mock',
    dryRun: false
  };

  for (const arg of args) {
    if (arg.startsWith('--agent-name=')) {
      options.agentName = arg.split('=')[1];
    } else if (arg.startsWith('--ai-provider=')) {
      options.aiProvider = arg.split('=')[1];
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Autonomous Agent Script

Usage:
  node scripts/autonomous-agent.js [options]

Options:
  --agent-name=<name>      Agent identifier (default: autonomous-agent-1)
  --ai-provider=<provider> AI provider: openai, anthropic, mock (default: mock)
  --dry-run                Run without making changes (testing mode)
  --help, -h               Show this help

Environment Variables:
  AI_API_KEY               API key for AI provider (OpenAI, Anthropic, etc.)
  GITHUB_TOKEN             GitHub personal access token for creating PRs

Examples:
  # Test run (no changes made)
  node scripts/autonomous-agent.js --dry-run

  # Mock mode (makes changes but doesn't call AI API)
  node scripts/autonomous-agent.js --agent-name=test-agent-1

  # Production mode (requires API keys)
  AI_API_KEY=sk-... GITHUB_TOKEN=ghp_... node scripts/autonomous-agent.js --ai-provider=openai

Note: Mock mode is recommended for testing. It will create placeholder changes
      without calling external AI APIs.
`);
      process.exit(0);
    }
  }

  return options;
}

// Run if called directly
const isMainModule = import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`;
if (isMainModule || process.argv[1].includes('autonomous-agent.js')) {
  const options = parseArgs();
  const agent = new AutonomousAgent(options);
  agent.run().catch(console.error);
}
