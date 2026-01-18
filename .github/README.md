# GitHub Configuration for Multi-Agent Development

This directory contains all GitHub-related configuration for managing multiple AI agents working on this project.

## 📁 Directory Structure

```
.github/
├── AGENT_SETUP.md           # Complete guide for agents
├── AGENT_BOARD.md           # Coordination board
├── PULL_REQUEST_TEMPLATE.md # PR template
├── copilot-instructions.md  # Copilot coding guidelines
├── README.md                # This file
├── ISSUE_TEMPLATE/
│   ├── bug_report.md
│   └── feature_request.md
└── workflows/
    ├── pr-checks.yml        # Automated PR testing
    ├── pr-auto-label.yml    # Automatic PR labeling
    └── github-pages.yml     # Deployment workflow
```

## 🚀 Quick Start for Agents

### First Time Setup

1. **Read the documentation**:
   - [AGENT_SETUP.md](AGENT_SETUP.md) - Complete workflow guide
   - [AGENT_BOARD.md](AGENT_BOARD.md) - See what others are working on

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Verify setup**:
   ```bash
   npm run lint
   npm run type-check
   npm run build
   ```

### Starting New Work

1. **Check the board**:
   - Review [AGENT_BOARD.md](AGENT_BOARD.md)
   - Choose a task or propose new one

2. **Create your branch**:
   ```bash
   # Option 1: Use helper script
   node scripts/agent-workflow.js
   # Select "1. Create new branch"
   
   # Option 2: Manual
   git checkout master
   git pull origin master
   git checkout -b agent/<your-name>/<feature>
   ```

3. **Update the board**:
   - Edit [AGENT_BOARD.md](AGENT_BOARD.md)
   - Add your task to "Active Work"

### Before Submitting PR

```bash
# Option 1: Use helper script
node scripts/agent-workflow.js
# Select "2. Run pre-PR checks"

# Option 2: Manual
npm run lint
npm run type-check
npm run build
```

### Creating PR

1. **Push your branch**:
   ```bash
   git push origin agent/<your-name>/<feature>
   ```

2. **Open PR on GitHub**:
   - Use the PR template (auto-fills)
   - Fill in all sections
   - Add screenshots if UI changes
   - Link related issues

3. **Wait for checks**:
   - GitHub Actions will run automatically
   - Fix any failures
   - Address review comments

## 🔄 Workflows

### PR Checks (`pr-checks.yml`)

Runs on every PR:
- ✅ ESLint validation
- ✅ TypeScript type checking
- ✅ Build test
- ✅ Artifact upload

**Status**: Required for merge

### Auto Label (`pr-auto-label.yml`)

Automatically adds labels based on:
- Branch name patterns
- Files changed
- PR content

Labels added:
- `agent-pr` - Agent-created PRs
- `hotfix` - Critical fixes
- `enhancement` - New features
- `bug` - Bug fixes
- `ui` - UI changes
- `systems` - System changes
- `documentation` - Docs

### GitHub Pages (`github-pages.yml`)

Deploys the built app to GitHub Pages on merge to master.

## 📋 Templates

### Pull Request Template

Pre-filled template for all PRs including:
- Agent information
- Change description
- Pre-PR checklist
- Testing instructions
- Breaking changes notice
- Impact analysis

### Issue Templates

**Bug Report**:
- Detailed bug information
- Reproduction steps
- Environment details
- Priority levels

**Feature Request**:
- Feature description
- Implementation approach
- Effort estimate
- Priority

## 🏷️ Labels

Standard labels used in this project:

| Label | Purpose | Auto-Applied |
|-------|---------|--------------|
| `agent-pr` | PR created by AI agent | ✅ Yes |
| `hotfix` | Critical bug fix | ✅ Yes |
| `enhancement` | New feature | ✅ Yes |
| `bug` | Bug fix | ✅ Yes |
| `refactoring` | Code refactoring | ✅ Yes |
| `documentation` | Docs changes | ✅ Yes |
| `ui` | UI changes | ✅ Yes |
| `systems` | System changes | ✅ Yes |
| `workflow` | CI/CD changes | ✅ Yes |
| `priority-high` | High priority | 🔧 Manual |
| `blocked` | Blocked by dependency | 🔧 Manual |
| `needs-review` | Awaiting review | 🔧 Manual |
| `work-in-progress` | Not ready to merge | 🔧 Manual |

## 🔐 Branch Protection

Recommended settings for `master` branch:

```
✅ Require pull request before merging
  ✅ Require approvals: 1
  ✅ Dismiss stale reviews
  ✅ Require review from code owners

✅ Require status checks to pass
  ✅ Require branches to be up to date
  Required checks:
    - Lint Code
    - TypeScript Type Check
    - Build Project

✅ Require conversation resolution before merging

❌ Allow force pushes
❌ Allow deletions
```

### Setting Up Branch Protection

1. Go to repository **Settings** → **Branches**
2. Click **Add rule**
3. Branch name pattern: `master`
4. Configure settings as above
5. Click **Create** or **Save changes**

## 🤖 Agent Coordination

### Avoiding Conflicts

**File ownership**: Check [AGENT_BOARD.md](AGENT_BOARD.md) before modifying:
- Core systems (GameEngine.js, main.js, UI.js)
- Shared utilities

**Communication**: 
- Update board when starting work
- Comment on PRs if you need to touch claimed files
- Mark PRs as draft if depending on another PR

### Merge Strategy

**Recommended**: Squash and merge
- Keeps history clean
- Easier to revert if needed
- All agent work in one commit

**Alternative**: Rebase and merge
- Preserves individual commits
- Better for reviewing work progression

## 📊 Monitoring

### PR Statistics

Track agent productivity:
- Average time to merge
- Pass rate on first submission
- Most active subsystems

### Quality Metrics

Monitor in Actions tab:
- Build success rate
- Lint pass rate
- Type check pass rate

## 🛠️ Troubleshooting

### PR Checks Failing

1. **Pull latest changes**:
   ```bash
   git fetch origin master
   git rebase origin/master
   ```

2. **Run checks locally**:
   ```bash
   npm run lint
   npm run type-check
   npm run build
   ```

3. **Check Action logs** on GitHub for details

### Merge Conflicts

1. **Update your branch**:
   ```bash
   git fetch origin master
   git rebase origin/master
   ```

2. **Resolve conflicts** in editor

3. **Continue rebase**:
   ```bash
   git add .
   git rebase --continue
   ```

4. **Force push**:
   ```bash
   git push --force-with-lease origin <your-branch>
   ```

### Blocked by Another PR

1. **Option A**: Wait for other PR to merge
2. **Option B**: Rebase on other agent's branch:
   ```bash
   git fetch origin agent/other-agent/feature
   git rebase origin/agent/other-agent/feature
   ```

## 📚 Resources

- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Project README](../README.md)

## 🆘 Getting Help

If you encounter issues:
1. Check [AGENT_SETUP.md](AGENT_SETUP.md) for detailed workflows
2. Review existing PRs for examples
3. Check GitHub Actions logs for error details
4. Create issue with `question` label
