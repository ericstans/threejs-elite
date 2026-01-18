# Running Multiple Agents in VS Code

**Practical guide for setting up and running multiple AI agents in VS Code**

## 🤖 What "Running Agents" Means

There are several ways to use multiple agents with this setup:

### Option 1: Multiple AI Assistants (Recommended)
Use different AI coding assistants in separate VS Code instances, each working on different branches.

### Option 2: Multiple Developers/Agents
Have multiple people (or automated agents) working in their own VS Code instances.

### Option 3: GitHub Copilot Workspace (Future)
When GitHub Copilot Workspace becomes available, use it to coordinate multiple agents.

---

## 🚀 Quick Start: Using AI Agents in VS Code

### Method 1: Single Agent (You + AI Assistant)

**What you have now**: GitHub Copilot or similar AI assistant helping you code.

1. **Open VS Code** in your project
2. **Start the workflow**:
   ```powershell
   npm run agent:workflow
   ```
3. **Select "1. Create new branch"**
4. **Enter agent name**: `copilot-1` (or your name)
5. **Enter feature**: `add-weapon-heat`
6. **Start coding** with AI assistance
7. **Before PR**: Run `npm run agent:checks`
8. **Submit PR** via GitHub

**This is the standard workflow for one agent at a time.**

---

### Method 2: Multiple VS Code Instances (Parallel Work)

To simulate or run multiple agents in parallel:

#### Setup for Agent 1
1. **Open VS Code** (Instance 1)
2. **Open your project folder**
3. **Create branch**:
   ```powershell
   npm run agent:workflow
   # Agent name: agent-1
   # Feature: add-shields
   ```
4. **Work on shields feature**

#### Setup for Agent 2 (Separate instance)
1. **Open NEW VS Code window** (`File` → `New Window`)
2. **Open SAME project folder** (or clone to different folder)
3. **Create different branch**:
   ```powershell
   npm run agent:workflow
   # Agent name: agent-2
   # Feature: improve-combat-ai
   ```
4. **Work on combat AI**

#### Key Points:
- ✅ Each instance works on different branch
- ✅ Each agent updates `.github/AGENT_BOARD.md` before starting
- ✅ Agents work on different subsystems to avoid conflicts
- ✅ Each submits their own PR when done

---

### Method 3: Using GitHub Copilot Chat

If you have **GitHub Copilot Chat**:

1. **Open Chat Panel** (`Ctrl+Shift+I` or click Copilot icon)
2. **Give instructions**:
   ```
   I'm agent-1 working on the shields feature.
   Check .github/AGENT_SETUP.md and .github/AGENT_BOARD.md
   Then help me implement shields for the spaceship.
   ```
3. **Copilot will**:
   - Read the documentation
   - Follow the guidelines (CSS classes, not inline styles)
   - Help you write code that passes checks

4. **Before PR**:
   ```
   Run npm run agent:checks and fix any issues
   ```

---

### Method 4: Automated Agents (Advanced)

For fully automated AI agents (like Devin, Cursor Agent Mode, or custom scripts):

#### Using Cursor Agent Mode
1. **Open project in Cursor**
2. **Enter Agent Mode** (`Ctrl+Shift+P` → "Agent Mode")
3. **Give instructions**:
   ```
   You are agent-1. Read .github/AGENT_SETUP.md first.
   
   Then:
   1. Check .github/AGENT_BOARD.md for available tasks
   2. Claim the "add weapon heat system" task
   3. Create branch: agent/agent-1/weapon-heat
   4. Implement the feature following project guidelines
   5. Run npm run agent:checks
   6. Submit PR
   ```

#### Using Custom Automation
```javascript
// Example: automated-agent.js
const { execSync } = require('child_process');

// 1. Read agent board
const agentBoard = fs.readFileSync('.github/AGENT_BOARD.md', 'utf8');

// 2. Choose task
const task = chooseAvailableTask(agentBoard);

// 3. Create branch
execSync(`git checkout -b agent/auto-${Date.now()}/${task.slug}`);

// 4. Make changes with AI API
await makeChangesWithAI(task);

// 5. Run checks
execSync('npm run agent:checks');

// 6. Submit PR
createPullRequest(task);
```

---

## 🎯 Practical Example: Two Agents Working Together

### Scenario: You want two AI assistants working on different features

#### Terminal 1 (Agent 1 - Combat Features)
```powershell
# In first VS Code window
cd C:\Users\Eric\vsc-workspace\threejs-elite
git checkout master
git pull
git checkout -b agent/combat-expert/weapon-heat

# Edit .github/AGENT_BOARD.md
# Add: | combat-expert | agent/combat-expert/weapon-heat | Add weapon heat | Spaceship.js | In Progress | Jan 18 |

# Work on code...
# Use GitHub Copilot to help implement weapon heat system

npm run agent:checks
git push origin agent/combat-expert/weapon-heat
# Create PR on GitHub
```

#### Terminal 2 (Agent 2 - UI Features)
```powershell
# In second VS Code window (separate folder or window)
cd C:\Users\Eric\vsc-workspace\threejs-elite-agent2  # Clone to different folder
# OR just use same folder but different branch

git checkout master
git pull
git checkout -b agent/ui-expert/shield-display

# Edit .github/AGENT_BOARD.md
# Add: | ui-expert | agent/ui-expert/shield-display | Add shield UI | ShipHealthUI.js | In Progress | Jan 18 |

# Work on code...
# Use GitHub Copilot to help implement shield display

npm run agent:checks
git push origin agent/ui-expert/shield-display
# Create PR on GitHub
```

#### Key Coordination:
- Agent 1 works on `Spaceship.js` and `CombatSystem.js`
- Agent 2 works on `ShipHealthUI.js` and CSS
- **No file conflicts!** ✅
- Both can work simultaneously
- Both submit PRs independently
- PRs can be merged in any order

---

## 🛠️ Recommended VS Code Setup

### Extensions for AI Agents

Install these extensions:

1. **GitHub Copilot** (`GitHub.copilot`)
   - AI pair programming
   - Code suggestions
   
2. **GitHub Copilot Chat** (`GitHub.copilot-chat`)
   - Chat with AI about code
   - Ask for help with project guidelines

3. **GitLens** (`eamodio.gitlens`)
   - See git history
   - Track changes across branches

4. **ESLint** (`dbaeumer.vscode-eslint`)
   - Real-time lint errors
   - Auto-fix on save

5. **Error Lens** (`usernamehw.errorlens`)
   - See errors inline
   - Catch issues early

### VS Code Settings

Add to `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "eslint.autoFixOnSave": true,
  "git.autofetch": true,
  "git.confirmSync": false,
  "files.autoSave": "afterDelay",
  "github.copilot.enable": {
    "*": true,
    "markdown": true,
    "javascript": true
  }
}
```

---

## 📋 Workflow in VS Code

### Step-by-Step: Your First Agent Task

1. **Open Integrated Terminal** (`Ctrl+\``)

2. **Check Agent Board**:
   ```powershell
   code .github\AGENT_BOARD.md
   ```

3. **Start workflow**:
   ```powershell
   npm run agent:workflow
   ```

4. **Choose option 1** (Create new branch)
   - Enter agent name: `agent-1`
   - Enter feature: `add-afterburner`

5. **Update Agent Board**:
   - Open `.github/AGENT_BOARD.md`
   - Add your task to "Active Work" section

6. **Start coding**:
   - Use Copilot suggestions
   - Follow CSS guidelines (no inline styles!)
   - Test frequently with `npm run dev`

7. **Before PR** - run in terminal:
   ```powershell
   npm run agent:checks
   ```

8. **Fix any errors** shown by the checks

9. **Push and create PR**:
   ```powershell
   git push origin agent/agent-1/add-afterburner
   ```

10. **Go to GitHub** and create PR
    - Template will auto-fill
    - Complete all sections
    - Submit!

---

## 🔄 Using GitHub Copilot Effectively

### Chat Commands for Agents

In Copilot Chat, use these prompts:

```
@workspace Read .github/AGENT_SETUP.md and explain the workflow
```

```
@workspace What CSS guidelines should I follow? Check .github/copilot-instructions.md
```

```
@workspace Show me how to add a new UI component following project patterns
```

```
@workspace Run the pre-PR checks and tell me what needs fixing
```

```
Help me implement [feature] following the patterns in src/systems/
```

### Copilot Inline Suggestions

When coding, Copilot will suggest code. Make sure it follows guidelines:

```javascript
// ❌ Copilot might suggest this - REJECT IT
element.style.background = 'blue';

// ✅ Accept this pattern instead
element.classList.add('combat-panel');
```

---

## 🎮 Interactive Terminal Workflow

The `agent:workflow` script is interactive:

```powershell
npm run agent:workflow
```

**You'll see**:
```
🤖 Agent Workflow Helper

Commands:
  1. Create new branch
  2. Run pre-PR checks
  3. Check for conflicts
  4. Show branch stats
  5. Exit

Select option: _
```

**Select 1** to create branch:
```
Agent name (e.g., copilot-1): agent-1
Feature name (e.g., add-weapon-system): shields
```

**Select 2** before PR:
```
Running ESLint... ✅
Running TypeScript... ✅
Running build... ✅

All checks passed! Ready to create PR.
```

---

## 🚦 Common Patterns

### Pattern 1: Quick Feature Addition

```powershell
# 1. Create branch
npm run agent:workflow
# Select 1, enter details

# 2. Make changes
code src/Spaceship.js

# 3. Test
npm run dev
# Open http://localhost:5173

# 4. Check quality
npm run agent:checks

# 5. Submit
git add .
git commit -m "feat: add shields"
git push origin agent/me/shields
```

### Pattern 2: Bug Fix

```powershell
# 1. Create branch with 'fix' in name
git checkout -b agent/me/fix-targeting-bug

# 2. Fix the bug
code src/systems/TargetingSystem.js

# 3. Test thoroughly
npm run dev

# 4. Run checks
npm run agent:checks

# 5. Submit
git add .
git commit -m "fix: resolve null pointer in targeting"
git push origin agent/me/fix-targeting-bug
```

### Pattern 3: Coordinated Work

**Agent 1** (VS Code Window 1):
```powershell
# Working on backend
git checkout -b agent/agent-1/combat-system
# Edit src/systems/CombatSystem.js
```

**Agent 2** (VS Code Window 2):
```powershell
# Working on UI for same feature
git checkout -b agent/agent-2/combat-ui
# Edit src/ui/CombatUI.js
# Agent 2 doesn't touch CombatSystem.js
```

**Coordination**:
- Check `.github/AGENT_BOARD.md` first
- Agent 1 claims "Combat System"
- Agent 2 claims "Combat UI"
- No file overlap = no conflicts! ✅

---

## 🎯 Best Practices in VS Code

### 1. Use Workspace
Create a VS Code workspace:
```json
// threejs-elite.code-workspace
{
  "folders": [
    {
      "path": "."
    }
  ],
  "settings": {
    "files.exclude": {
      "**/node_modules": true,
      "**/dist": true
    }
  }
}
```

### 2. Split Terminal
- `Ctrl+Shift+5` to split terminal
- Run `npm run dev` in one
- Run commands in another

### 3. Use Tasks
VS Code can run the npm scripts:
- `Ctrl+Shift+P` → "Tasks: Run Task"
- Select "agent:checks"
- See results in terminal

### 4. Git Integration
- Source Control panel (`Ctrl+Shift+G`)
- See all changes
- Commit from UI
- Push from UI

---

## ❓ FAQ

### Q: Can I have multiple branches checked out at once?
**A:** Yes! Clone the repo to multiple folders:
```powershell
# Main folder
C:\Users\Eric\vsc-workspace\threejs-elite  (branch: agent-1/feature-a)

# Second folder
C:\Users\Eric\vsc-workspace\threejs-elite-2  (branch: agent-2/feature-b)
```

### Q: How do I switch between agent tasks?
**A:** Just switch branches:
```powershell
git checkout agent/me/feature-a    # Work on feature A
git checkout agent/me/feature-b    # Switch to feature B
```

### Q: Can Copilot read the agent documentation?
**A:** Yes! Use `@workspace` in Copilot Chat:
```
@workspace Read .github/AGENT_SETUP.md
```

### Q: How do I know what's safe to work on?
**A:** Check `.github/AGENT_BOARD.md` - if a subsystem is claimed, coordinate with that agent before touching those files.

---

## 🎓 Next Steps

1. **Try it yourself**:
   ```powershell
   npm run agent:workflow
   ```

2. **Make a test branch**

3. **Add a small feature**

4. **Run checks**:
   ```powershell
   npm run agent:checks
   ```

5. **Submit a test PR**

6. **See the automated checks run on GitHub**

---

## 📞 Need Help?

- Read: `.github/AGENT_SETUP.md`
- Quick ref: `.github/AGENT_QUICK_REFERENCE.md`
- Visual guides: `.github/AGENT_WORKFLOWS.md`

**You're ready to go! Start with `npm run agent:workflow` 🚀**
