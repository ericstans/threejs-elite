# 🚀 START HERE - Multi-Agent Development

**You want to run multiple AI agents on this project? You're in the right place!**

---

## ⚡ Super Quick Start (30 seconds)

1. **Open VS Code terminal** (`Ctrl + \``)
2. **Run this**:
   ```bash
   npm run agent:workflow
   ```
3. **Follow the prompts!**

**That's it!** The interactive helper will guide you through everything.

---

## 📖 What Does "Running Agents" Mean?

You have several options:

### 🎯 Option 1: You + GitHub Copilot (Most Common)
**You work with AI assistance to make changes and submit PRs**

- Open VS Code
- Use GitHub Copilot to help you code
- Follow the workflow to submit PRs
- ✅ **This is what most people want!**

### 🎯 Option 2: Multiple People/Agents in Parallel
**Multiple developers/AIs work on different features simultaneously**

- Each person/agent works in their own branch
- Coordination via `.github/AGENT_BOARD.md`
- No conflicts because everyone works on different files
- ✅ **Great for team collaboration!**

### 🎯 Option 3: Fully Automated AI Agents
**Autonomous AI agents (like Cursor Agent Mode or custom scripts)**

- Agent reads documentation
- Chooses task
- Implements feature
- Submits PR automatically
- ✅ **Advanced use case!**

---

## 🎮 Your First Agent Session

### **Right Now - Do This:**

```bash
# In VS Code terminal
npm run agent:workflow
```

**You'll see:**
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

**Type `1` and press Enter**

**Then follow the prompts:**
- Agent name: `your-name` (e.g., `agent-1`, `copilot`, `dev-1`)
- Feature name: `my-feature` (e.g., `add-shields`, `fix-targeting`)

**Done!** You now have a new branch and can start coding.

---

## 📚 Full Documentation

| If you want to... | Read this |
|------------------|-----------|
| **Understand how to use VS Code** | [RUNNING_AGENTS_IN_VSCODE.md](.github/RUNNING_AGENTS_IN_VSCODE.md) ⭐ |
| **See visual workflow** | [QUICK_START_VISUAL.md](.github/QUICK_START_VISUAL.md) 📊 |
| **Complete workflow guide** | [AGENT_SETUP.md](.github/AGENT_SETUP.md) 📖 |
| **Quick command reference** | [AGENT_QUICK_REFERENCE.md](.github/AGENT_QUICK_REFERENCE.md) ⚡ |
| **See what others are doing** | [AGENT_BOARD.md](.github/AGENT_BOARD.md) 📋 |
| **Find anything** | [INDEX.md](.github/INDEX.md) 🗂️ |

---

## 🎨 The ONE Rule You Must Follow

### ❌ NEVER use inline styles:
```javascript
// ❌ DON'T DO THIS!
element.style.background = 'blue';
element.style.padding = '10px';
```

### ✅ ALWAYS use CSS classes:
```javascript
// ✅ DO THIS!
element.classList.add('my-button');
```

```css
/* In your CSS file */
.my-button {
  background: blue;
  padding: 10px;
}
```

**Why?** It keeps the codebase clean and maintainable. See [copilot-instructions.md](.github/copilot-instructions.md) for details.

---

## 📋 Workflow Summary

```
1. npm run agent:workflow              ← Create branch
2. Make changes (use CSS classes!)     ← Code
3. npm run dev                         ← Test
4. npm run agent:checks                ← Validate
5. git push                            ← Push
6. Create PR on GitHub                 ← Submit
```

---

## 🤝 Multiple Agents Working Together

**The secret? Coordination!**

### Before You Start:
1. **Open** `.github/AGENT_BOARD.md`
2. **See** what others are working on
3. **Choose** a different subsystem/feature
4. **Update** the board with your task

### Example:

**Agent 1** works on:
- `src/systems/CombatSystem.js`
- Feature: Add weapon heat

**Agent 2** works on:
- `src/ui/CombatUI.js`  
- Feature: Display weapon heat

**Result:** No conflicts! ✅ Both PRs can be merged independently.

---

## 🧪 Testing Before PR

**Always run:**
```bash
npm run agent:checks
```

This runs:
- ✅ ESLint (code style)
- ✅ TypeScript (type checking)
- ✅ Build (compilation)

**All must pass** before you create a PR.

**If something fails:**
```bash
npm run lint:fix    # Auto-fix lint issues
```

Then manually fix remaining issues and run `npm run agent:checks` again.

---

## 🎯 Using GitHub Copilot

### In Copilot Chat:
```
@workspace Read .github/RUNNING_AGENTS_IN_VSCODE.md and help me get started
```

```
@workspace What are the CSS guidelines? Check .github/copilot-instructions.md
```

```
Help me implement a shield system for the spaceship. 
Follow the patterns in src/systems/ and remember: use CSS classes, not inline styles.
```

### Copilot will:
- Read the project documentation
- Follow the coding guidelines
- Suggest code that matches the project style
- Help you pass the quality checks

---

## 🆘 Common Questions

### Q: Do I need to install anything?
**A:** Just make sure you have:
- Node.js installed
- `npm install` has been run
- (Optional) GitHub Copilot extension

### Q: Can I work on the same files as another agent?
**A:** Not recommended! Check `.github/AGENT_BOARD.md` first to avoid conflicts. If you must, coordinate with the other agent.

### Q: What if the checks fail?
**A:** 
1. Read the error messages
2. Fix the issues
3. Run `npm run agent:checks` again
4. Repeat until all pass ✅

### Q: How do I know what to work on?
**A:** Check `.github/AGENT_BOARD.md` for available tasks, or propose your own!

### Q: What's the difference between `agent:workflow` and `agent:checks`?
**A:**
- `agent:workflow` - Interactive helper for creating branches, etc.
- `agent:checks` - Runs quality checks before PR

---

## 🎓 Learning Path

### Day 1: Setup & First PR
1. ✅ Run `npm run agent:validate`
2. ✅ Read [RUNNING_AGENTS_IN_VSCODE.md](.github/RUNNING_AGENTS_IN_VSCODE.md)
3. ✅ Make a small test PR

### Day 2: Real Work
1. ✅ Check [AGENT_BOARD.md](.github/AGENT_BOARD.md)
2. ✅ Claim a task
3. ✅ Submit a feature PR

### Day 3+: Mastery
1. ✅ Work efficiently with quick reference
2. ✅ Help improve documentation
3. ✅ Coordinate with other agents

---

## ✅ Pre-Flight Checklist

Before your first PR:

- [ ] `npm install` completed
- [ ] `npm run agent:validate` passes
- [ ] Read [RUNNING_AGENTS_IN_VSCODE.md](.github/RUNNING_AGENTS_IN_VSCODE.md)
- [ ] Understand CSS rule (no inline styles!)
- [ ] Know how to run `npm run agent:checks`

---

## 🎉 Ready to Start!

**Everything is set up and ready to go!**

### Right now, open terminal and type:
```bash
npm run agent:workflow
```

### Or jump straight to reading:
**[How to Run Agents in VS Code](.github/RUNNING_AGENTS_IN_VSCODE.md)**

**Happy coding! 🚀**

---

## 📞 Need Help?

1. **Check docs**: [INDEX.md](.github/INDEX.md)
2. **Validate setup**: `npm run agent:validate`
3. **Ask Copilot**: `@workspace help me understand the agent workflow`
4. **Create issue**: Use `question` label on GitHub

---

_This project uses an advanced multi-agent development workflow. You're now part of it!_ ✨
