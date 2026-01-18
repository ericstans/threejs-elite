# Multi-Agent Development Setup

This document describes how to set up and coordinate multiple AI agents working independently on this project.

## Overview

Multiple agents can work on different features simultaneously by:
1. Each agent working on their own feature branch
2. Following standardized commit and PR conventions
3. Running automated tests before submitting PRs
4. Using the agent coordination system to avoid conflicts

## Agent Workflow

### 1. Branch Naming Convention

Each agent should create branches using this format:
```
agent/<agent-name>/<feature-description>
```

Examples:
- `agent/copilot-1/add-weapon-system`
- `agent/copilot-2/improve-ui-performance`
- `agent/copilot-3/refactor-combat-system`

### 2. Before Starting Work

1. **Check the Agent Board** - Review `AGENT_BOARD.md` to see what others are working on
2. **Claim Your Work** - Add your planned work to the agent board
3. **Pull Latest** - Ensure you have the latest `master` branch
4. **Create Branch** - Create your feature branch from `master`

```bash
git checkout master
git pull origin master
git checkout -b agent/<your-name>/<feature-name>
```

### 3. During Development

1. **Run Tests Frequently**
   ```bash
   npm run lint
   npm run type-check
   npm run build
   ```

2. **Commit Often** with clear messages:
   ```bash
   git commit -m "feat: add weapon heat system"
   git commit -m "fix: resolve targeting bug in combat"
   git commit -m "refactor: extract damage calculation logic"
   ```

3. **Follow Commit Convention**:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `refactor:` - Code refactoring
   - `docs:` - Documentation changes
   - `style:` - Code style changes (formatting, CSS)
   - `test:` - Adding tests
   - `chore:` - Build process, dependencies

### 4. Before Submitting PR

Run the pre-PR checklist:

```bash
# Run all checks
npm run lint
npm run type-check
npm run build

# If build succeeds, test the app
npm run dev
```

### 5. Creating Pull Request

1. **Push your branch**:
   ```bash
   git push origin agent/<your-name>/<feature-name>
   ```

2. **Create PR on GitHub** with:
   - **Title**: Clear, descriptive (e.g., "Add weapon heat system")
   - **Description**: 
     - What does this PR do?
     - Why is it needed?
     - How to test it?
     - Any breaking changes?
   - **Labels**: `agent-pr`, plus feature-specific labels
   - **Link to Issue**: If applicable

3. **PR Template** (copy this):
   ```markdown
   ## Description
   [Brief description of changes]

   ## Type of Change
   - [ ] New feature
   - [ ] Bug fix
   - [ ] Refactoring
   - [ ] Documentation
   - [ ] Performance improvement

   ## Testing
   - [ ] Linting passes (`npm run lint`)
   - [ ] Type checking passes (`npm run type-check`)
   - [ ] Build succeeds (`npm run build`)
   - [ ] Manual testing completed
   - [ ] No console errors

   ## Files Changed
   - List major files changed and why

   ## Screenshots (if UI changes)
   [Add screenshots]

   ## Breaking Changes
   - [ ] No breaking changes
   - [ ] Breaking changes (describe below)

   ## Notes for Reviewers
   [Any special considerations]
   ```

### 6. After PR is Merged

1. **Delete your branch** (GitHub does this automatically if configured)
2. **Update local master**:
   ```bash
   git checkout master
   git pull origin master
   ```
3. **Update Agent Board** - Mark your work as complete

## Avoiding Conflicts

### File Ownership Strategy

To minimize merge conflicts, agents should work on different subsystems:

**Core Systems** (coordinate carefully):
- `src/main.js` - Main entry point
- `src/GameEngine.js` - Core game loop
- `src/UI.js` - Main UI controller

**Modular Systems** (easier for parallel work):
- `src/systems/` - Each system is independent
- `src/ui/` - Individual UI components
- `src/conversations/` - Conversation files
- `src/data/` - Data files
- `src/styles/components/` - Component styles

### Coordination Tips

1. **Claim Subsystems** - Use the agent board to claim a subsystem
2. **Small PRs** - Keep PRs focused and small (< 500 lines changed)
3. **Frequent Merges** - Submit PRs frequently to reduce divergence
4. **Communication** - Update agent board when you change direction
5. **Rebase Before PR** - Rebase on master before creating PR to catch conflicts early

## Handling Conflicts

If your branch has conflicts with master:

```bash
# Update master
git checkout master
git pull origin master

# Rebase your branch
git checkout agent/<your-name>/<feature-name>
git rebase master

# Resolve conflicts in your editor
# After resolving, continue rebase
git add .
git rebase --continue

# Force push (your branch only!)
git push --force-with-lease origin agent/<your-name>/<feature-name>
```

## Code Quality Standards

All PRs must:
- ✅ Pass ESLint (`npm run lint`)
- ✅ Pass TypeScript checks (`npm run type-check`)
- ✅ Build successfully (`npm run build`)
- ✅ Follow the project's CSS conventions (no inline styles)
- ✅ Include JSDoc comments for new functions
- ✅ Not introduce console.log statements (use debug flags)

## Agent Board

See `AGENT_BOARD.md` for:
- Current work in progress
- Available tasks
- Completed work
- Blocked tasks

## Automated Workflows

GitHub Actions will automatically:
- Run linting on all PRs
- Run type checking
- Test build process
- Comment on PR if checks fail

## Emergency Procedures

### Blocked by Another PR
If your work depends on another PR:
1. Add comment to the other PR explaining the dependency
2. Mark your PR as "draft" until the dependency is merged
3. Consider rebasing your branch on the other agent's branch temporarily

### Critical Bug Found
If you discover a critical bug:
1. Create a branch: `hotfix/<description>`
2. Make minimal fix
3. Create PR with `hotfix` label
4. Notify other agents (comment on open PRs)

### Merge Conflict Hell
If conflicts are too complex:
1. Create a new branch from current master
2. Cherry-pick your commits one by one
3. Resolve conflicts incrementally
4. Submit new PR, close old one

## Resources

- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Project README](../README.md)
- [Architecture Overview](../Analysis.md)
