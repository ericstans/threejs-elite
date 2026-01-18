# Multi-Agent Development - Documentation Index

**Complete guide to all agent-related documentation**

## 🎯 Start Here

New to this project? Start with these in order:

1. **[RUNNING_AGENTS_IN_VSCODE.md](RUNNING_AGENTS_IN_VSCODE.md)** - How to actually run agents 🚀
2. **[AGENT_SETUP.md](AGENT_SETUP.md)** - Complete workflow guide ⭐
3. **[AGENT_QUICK_REFERENCE.md](AGENT_QUICK_REFERENCE.md)** - Quick commands ⚡
4. **[AGENT_BOARD.md](AGENT_BOARD.md)** - Task coordination board 📋

## 📚 Complete Documentation

### For AI Agents

| Document | Purpose | When to Read |
|----------|---------|--------------|
| [RUNNING_AGENTS_IN_VSCODE.md](RUNNING_AGENTS_IN_VSCODE.md) | How to run agents in VS Code | **START HERE!** 🚀 |
| [AGENT_SETUP.md](AGENT_SETUP.md) | Complete workflow guide | First time, and as reference |
| [AGENT_QUICK_REFERENCE.md](AGENT_QUICK_REFERENCE.md) | Quick commands and tips | Daily use |
| [AGENT_BOARD.md](AGENT_BOARD.md) | Task coordination | Before starting work, after completing |
| [AGENT_WORKFLOWS.md](AGENT_WORKFLOWS.md) | Visual workflow diagrams | When learning the process |
| [SETUP_COMPLETE.md](SETUP_COMPLETE.md) | Setup verification | To verify configuration |

### GitHub Configuration

| Document | Purpose | When to Read |
|----------|---------|--------------|
| [README.md](README.md) | GitHub setup overview | Understanding CI/CD |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution guidelines | Before first PR |
| [CODEOWNERS](CODEOWNERS) | Code ownership rules | Reference |
| [PULL_REQUEST_TEMPLATE.md](PULL_REQUEST_TEMPLATE.md) | PR template | Auto-filled when creating PR |

### Issue Templates

| Template | Purpose | When to Use |
|----------|---------|-------------|
| [bug_report.md](ISSUE_TEMPLATE/bug_report.md) | Report bugs | Found a bug |
| [feature_request.md](ISSUE_TEMPLATE/feature_request.md) | Suggest features | Have an idea |

### GitHub Actions

| Workflow | Purpose | When it Runs |
|----------|---------|--------------|
| [pr-checks.yml](workflows/pr-checks.yml) | Automated testing | Every PR |
| [pr-auto-label.yml](workflows/pr-auto-label.yml) | Auto-label PRs | Every PR |
| [github-pages.yml](workflows/github-pages.yml) | Deploy to Pages | Merge to master |

## 🛠️ Scripts

### NPM Scripts

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `npm run agent:workflow` | Interactive workflow helper | Starting new work |
| `npm run agent:checks` | Run all quality checks | Before creating PR |
| `npm run agent:validate` | Validate agent setup | First time, troubleshooting |
| `npm run lint` | ESLint check | Check code style |
| `npm run lint:fix` | Auto-fix lint issues | Fix formatting |
| `npm run type-check` | TypeScript check | Verify types |
| `npm run build` | Build project | Test compilation |
| `npm run dev` | Start dev server | Development |
| `npm run pre-commit` | Pre-commit checks | Before committing |

### Helper Scripts (in scripts/)

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `agent-workflow.js` | Interactive workflow | Starting work, checking status |
| `validate-agent-setup.js` | Validate setup | Verify configuration |
| `pre-commit.js` | Pre-commit checks | Before commits |
| `fetch-soundfonts.js` | Download soundfonts | Build process |

## 🗺️ Quick Navigation

### I want to...

**Start new work** →
1. Check [AGENT_BOARD.md](AGENT_BOARD.md)
2. Run `npm run agent:workflow`
3. Follow [AGENT_SETUP.md](AGENT_SETUP.md) section 2

**Submit a PR** →
1. Run `npm run agent:checks`
2. Push branch
3. Use [PR template](PULL_REQUEST_TEMPLATE.md)

**Fix a bug** →
1. Create issue using [bug_report.md](ISSUE_TEMPLATE/bug_report.md)
2. Create branch: `agent/<name>/fix-<bug>`
3. Follow normal workflow

**Add a feature** →
1. Check [AGENT_BOARD.md](AGENT_BOARD.md) for similar work
2. Optionally create issue using [feature_request.md](ISSUE_TEMPLATE/feature_request.md)
3. Follow normal workflow

**Understand workflows** →
Read [AGENT_WORKFLOWS.md](AGENT_WORKFLOWS.md) for visual guides

**Resolve conflicts** →
See [AGENT_SETUP.md](AGENT_SETUP.md) section "Handling Conflicts"

**Check setup** →
Run `npm run agent:validate`

## 📖 By Experience Level

### First Time Agent
Read in this order:
1. [SETUP_COMPLETE.md](SETUP_COMPLETE.md) - Quick overview
2. [AGENT_SETUP.md](AGENT_SETUP.md) - Full guide
3. [AGENT_WORKFLOWS.md](AGENT_WORKFLOWS.md) - Visual workflows
4. [CONTRIBUTING.md](CONTRIBUTING.md) - Guidelines
5. Try `npm run agent:workflow`

### Experienced Agent (New to This Project)
1. [AGENT_QUICK_REFERENCE.md](AGENT_QUICK_REFERENCE.md) - Commands
2. [AGENT_BOARD.md](AGENT_BOARD.md) - Available tasks
3. [README.md](../README.md) - Project overview
4. Review [CODEOWNERS](CODEOWNERS) - Code ownership

### Returning Agent
1. [AGENT_BOARD.md](AGENT_BOARD.md) - Check tasks
2. [AGENT_QUICK_REFERENCE.md](AGENT_QUICK_REFERENCE.md) - Refresh commands
3. Update local master: `git checkout master && git pull`

## 🎨 Code Style References

### CSS Guidelines
**Location**: [copilot-instructions.md](copilot-instructions.md)

**Key Rule**: Use CSS classes, not inline styles

**Examples**: See [AGENT_WORKFLOWS.md](AGENT_WORKFLOWS.md) "CSS Workflow" section

### Commit Message Format
**Reference**: [AGENT_QUICK_REFERENCE.md](AGENT_QUICK_REFERENCE.md) "Commit Messages"

**Format**: `<type>: <description>`

**Examples**: 
- `feat: add weapon system`
- `fix: resolve targeting bug`
- `refactor: extract UI logic`

### Branch Naming
**Format**: `agent/<agent-name>/<feature-description>`

**Examples**:
- `agent/copilot-1/add-shields`
- `agent/assistant-2/fix-combat-bug`

## 🔍 Finding Specific Information

| Topic | Document | Section |
|-------|----------|---------|
| Branch naming | [AGENT_QUICK_REFERENCE.md](AGENT_QUICK_REFERENCE.md) | "Branch Naming" |
| Commit format | [AGENT_QUICK_REFERENCE.md](AGENT_QUICK_REFERENCE.md) | "Commit Messages" |
| Pre-PR checks | [AGENT_SETUP.md](AGENT_SETUP.md) | "Before Submitting PR" |
| Handling conflicts | [AGENT_SETUP.md](AGENT_SETUP.md) | "Handling Conflicts" |
| CSS guidelines | [copilot-instructions.md](copilot-instructions.md) | All |
| File organization | [AGENT_QUICK_REFERENCE.md](AGENT_QUICK_REFERENCE.md) | "File Locations" |
| Common commands | [AGENT_QUICK_REFERENCE.md](AGENT_QUICK_REFERENCE.md) | "Common Commands" |
| Workflow diagrams | [AGENT_WORKFLOWS.md](AGENT_WORKFLOWS.md) | All |
| Quality standards | [AGENT_SETUP.md](AGENT_SETUP.md) | "Code Quality Standards" |
| Emergency procedures | [AGENT_SETUP.md](AGENT_SETUP.md) | "Emergency Procedures" |

## 📊 Documentation Structure

```
.github/
├── 📖 Documentation (READ THESE)
│   ├── AGENT_SETUP.md              ← Complete guide ⭐
│   ├── AGENT_QUICK_REFERENCE.md    ← Quick commands ⚡
│   ├── AGENT_BOARD.md              ← Task coordination 📋
│   ├── AGENT_WORKFLOWS.md          ← Visual guides 📊
│   ├── SETUP_COMPLETE.md           ← Setup overview ✅
│   ├── README.md                   ← GitHub info ℹ️
│   ├── CONTRIBUTING.md             ← Guidelines 👥
│   └── INDEX.md                    ← This file! 📇
│
├── 📝 Templates (AUTO-FILLED)
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── ISSUE_TEMPLATE/
│       ├── bug_report.md
│       └── feature_request.md
│
├── ⚙️ Configuration
│   ├── CODEOWNERS
│   ├── copilot-instructions.md
│   └── workflows/
│       ├── pr-checks.yml
│       ├── pr-auto-label.yml
│       └── github-pages.yml
│
└── 🔧 Project Root
    ├── scripts/
    │   ├── agent-workflow.js
    │   ├── validate-agent-setup.js
    │   └── pre-commit.js
    └── package.json (with agent scripts)
```

## 🎯 By Task Type

### Starting New Feature
1. [AGENT_BOARD.md](AGENT_BOARD.md) - Check available tasks
2. [AGENT_SETUP.md](AGENT_SETUP.md) - Section 2 "During Development"
3. [AGENT_QUICK_REFERENCE.md](AGENT_QUICK_REFERENCE.md) - Commands
4. `npm run agent:workflow`

### Fixing a Bug
1. [bug_report.md](ISSUE_TEMPLATE/bug_report.md) - Create issue
2. [AGENT_SETUP.md](AGENT_SETUP.md) - Standard workflow
3. Branch: `agent/<name>/fix-<description>`

### Refactoring Code
1. [AGENT_BOARD.md](AGENT_BOARD.md) - Check if anyone's working on it
2. [AGENT_SETUP.md](AGENT_SETUP.md) - Coordination tips
3. Branch: `agent/<name>/refactor-<component>`

### Improving Documentation
1. Standard workflow
2. Branch: `agent/<name>/docs-<topic>`
3. Label PR with `documentation`

### Emergency Hotfix
1. Branch: `hotfix/<description>`
2. [AGENT_SETUP.md](AGENT_SETUP.md) - "Emergency Procedures"
3. Mark PR with `hotfix` label

## 🆘 Troubleshooting Guide

| Problem | Solution Document | Section |
|---------|------------------|---------|
| Setup validation fails | [SETUP_COMPLETE.md](SETUP_COMPLETE.md) | "Troubleshooting" |
| Lint errors | [AGENT_QUICK_REFERENCE.md](AGENT_QUICK_REFERENCE.md) | "Common Issues" |
| Type errors | [AGENT_SETUP.md](AGENT_SETUP.md) | "Code Quality Standards" |
| Build fails | [AGENT_QUICK_REFERENCE.md](AGENT_QUICK_REFERENCE.md) | "Common Issues" |
| Merge conflicts | [AGENT_SETUP.md](AGENT_SETUP.md) | "Handling Conflicts" |
| PR checks fail | [README.md](README.md) | "Troubleshooting" |
| Blocked by another PR | [AGENT_SETUP.md](AGENT_SETUP.md) | "Emergency Procedures" |

## 📞 Getting Help

1. **Check documentation** - Use this index to find answers
2. **Run validation** - `npm run agent:validate`
3. **Review examples** - Look at merged PRs
4. **Check Action logs** - GitHub Actions tab
5. **Create issue** - Use `question` label

## ✅ Quick Checklist

Before your first PR:
- [ ] Read [AGENT_SETUP.md](AGENT_SETUP.md)
- [ ] Run `npm run agent:validate`
- [ ] Check [AGENT_BOARD.md](AGENT_BOARD.md)
- [ ] Understand CSS guidelines
- [ ] Know how to run checks

Before every PR:
- [ ] Run `npm run agent:checks`
- [ ] Test in browser
- [ ] Update [AGENT_BOARD.md](AGENT_BOARD.md)
- [ ] Fill PR template completely

## 🎓 Learning Path

### Week 1: Basics
- Read all "Start Here" documents
- Make small test PR
- Learn the workflow

### Week 2: Proficiency
- Use quick reference regularly
- Claim tasks from board
- Submit multiple PRs

### Week 3: Mastery
- Help improve documentation
- Optimize workflow
- Mentor other agents

## 📈 Success Metrics

Track your progress:
- ✅ First PR merged
- ✅ Zero lint/type errors on first submission
- ✅ PR merged without conflicts
- ✅ Helped improve documentation
- ✅ Completed 5+ PRs
- ✅ Zero breaking changes

---

**Last Updated**: January 18, 2026

**Maintained By**: Project maintainers

**Feedback**: Create issue with `documentation` label
