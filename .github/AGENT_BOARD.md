# Agent Coordination Board

**Last Updated**: January 18, 2026

This board tracks what each agent is working on to avoid conflicts and duplicated effort.

## 🚀 Active Work

| Agent | Branch | Feature | Files Affected | Status | ETA |
|-------|--------|---------|----------------|--------|-----|
| - | - | - | - | - | - |

## 📋 Available Tasks

### High Priority
- [ ] See `tasks/shipyard.MD`
- [ ] Add save/load game functionality

### Refactoring Needed
- [ ] Extract UI logic from GameEngine
- [ ] Modernize event handling system
- [ ] Improve type definitions coverage
- [ ] Standardize error handling
- [ ] Add unit tests

## ✅ Recently Completed

| Agent | Feature | PR # | Merged Date |
|-------|---------|------|-------------|
| - | - | - | - |

## 🚫 Blocked Tasks

| Task | Blocked By | Waiting On | Assigned To |
|------|------------|------------|-------------|
| - | - | - | - |

## 📝 How to Update This Board

### ⚠️ Claiming a Task (Atomic Operation)

**CRITICAL**: To prevent conflicts when multiple agents work simultaneously:

1. **Always fetch latest `master` first**:
   ```bash
   git fetch origin master
   git checkout master
   git pull origin master
   ```

2. **Add your claim to "Active Work" table** (on `master` branch):
   ```markdown
   | agent-1 | agent/agent-1/weapon-heat | Add weapon heat system | Spaceship.js, CombatSystem.js | Claiming | Jan 20 |
   ```

3. **Commit and push to `master` immediately**:
   ```bash
   git add .github/AGENT_BOARD.md
   git commit -m "[agent-1] Claim task: Add weapon heat system"
   git push origin master
   ```

4. **If push fails** (another agent pushed first):
   - Run `git pull origin master`
   - Verify your task is still unclaimed
   - Try again, or pick a different task

5. **Create your feature branch** (after successful claim):
   ```bash
   git checkout -b agent/agent-1/weapon-heat
   ```

**Why**: Agents work in branches and can't see each other's board updates. Claiming on `master` first ensures all agents see the latest state before starting work.

**Automated Agents**: The autonomous agent script (`scripts/autonomous-agent.js`) automatically performs this atomic claim process with retry logic to handle race conditions.

### Updating Status

When you start implementation (after claiming):

```markdown
| agent-1 | agent/agent-1/weapon-heat | Add weapon heat system | Spaceship.js, CombatSystem.js | In Progress | Jan 20 |
```

### Completing Work

Move your entry from "Active Work" to "Recently Completed":

```markdown
| agent-1 | Add weapon heat system | #123 | Jan 20, 2026 |
```

### Adding New Tasks

Add tasks you've identified but won't tackle immediately:

```markdown
- [ ] Add shield recharge delay after hit
```

### Marking Blocked

If you're blocked:

```markdown
| Shield visuals | Waiting on shader refactor | PR #125 merge | agent-2 |
```

## 🎯 Subsystem Ownership (Current)

To minimize conflicts, agents should coordinate who's working on which subsystems:

| Subsystem | Primary Agent | Status |
|-----------|---------------|--------|
| Combat System | - | Available |
| Trading/Cargo | - | Available |
| Navigation | - | Available |
| UI System | - | Available |
| Audio System | - | Available |
| Docking/Stations | - | Available |
| Conversation System | - | Available |
| Environment | - | Available |
| Camera System | - | Available |

### Rules:
1. Only one agent should actively modify a subsystem at a time
2. "Primary Agent" = currently has open PR touching this subsystem
3. Once PR merges, subsystem becomes available again
4. Small bug fixes don't require claiming ownership
5. If you need to touch a claimed subsystem, coordinate with that agent

## 📊 Statistics

- **Total PRs Merged**: 0
- **Average PR Turnaround**: -
- **Active Agents**: 0
- **Open PRs**: 0

## 🔔 Recent Updates

- **Jan 18, 2026**: Agent board initialized

---

## Notes

- Update this file when you start/finish work
- Check this before creating a new branch
- Use comments in PRs to coordinate with other agents
- Keep "Available Tasks" up to date as you discover issues
