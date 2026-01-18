# Quick Start Guide - Visual

**Simple visual guide to get started immediately**

## 🎮 Your First Agent Task in 5 Minutes

```
┌─────────────────────────────────────────────────────────┐
│  STEP 1: Open Terminal in VS Code (Ctrl + `)           │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  STEP 2: Run the interactive helper                     │
│  > npm run agent:workflow                               │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  STEP 3: Select "1. Create new branch"                  │
│  Agent name: agent-1                                    │
│  Feature name: my-first-feature                         │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  STEP 4: Make some changes to code                      │
│  - Edit a file in src/                                  │
│  - Use GitHub Copilot for help                          │
│  - Remember: Use CSS classes, not inline styles!        │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  STEP 5: Test your changes                              │
│  > npm run dev                                          │
│  Open http://localhost:5173 in browser                  │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  STEP 6: Run quality checks                             │
│  > npm run agent:checks                                 │
│  Fix any errors shown                                   │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  STEP 7: Commit and push                                │
│  > git add .                                            │
│  > git commit -m "feat: add my feature"                 │
│  > git push origin agent/agent-1/my-first-feature       │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  STEP 8: Create PR on GitHub                            │
│  - Go to github.com/your-repo                           │
│  - Click "Create Pull Request"                          │
│  - Fill in the template                                 │
│  - Submit!                                              │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
                    ✅ DONE!
```

## 🖥️ VS Code Layout

```
┌────────────────────────────────────────────────────────────┐
│ File  Edit  Selection  View  Go  Run  Terminal  Help      │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  EXPLORER          │  EDITOR                              │
│  ─────────────     │  ──────────────────────────────────  │
│  📁 src            │  // src/Spaceship.js                 │
│    📁 ui           │  class Spaceship {                   │
│    📁 systems      │    constructor() {                   │
│    📁 styles       │      // Your code here...            │
│    📄 main.js      │    }                                 │
│  📁 .github        │  }                                   │
│    📄 AGENT_*.md   │                                      │
│  📄 package.json   │  ✅ Copilot: Use classList.add()    │
│                    │     not inline styles                │
├────────────────────┴──────────────────────────────────────┤
│  TERMINAL                                                  │
│  ──────────────────────────────────────────────────────── │
│  PS C:\...\threejs-elite> npm run agent:workflow          │
│  🤖 Agent Workflow Helper                                 │
│  Select option: _                                         │
└────────────────────────────────────────────────────────────┘
```

## 🔄 Two Agents Working Together

```
┌─────────────────────┐         ┌─────────────────────┐
│   VS Code Window 1  │         │   VS Code Window 2  │
│                     │         │                     │
│  Agent: agent-1     │         │  Agent: agent-2     │
│  Branch:            │         │  Branch:            │
│  agent-1/shields    │         │  agent-2/combat-ui  │
│                     │         │                     │
│  Working on:        │         │  Working on:        │
│  • Spaceship.js     │         │  • CombatUI.js      │
│  • Shield logic     │         │  • UI components    │
│                     │         │                     │
└──────────┬──────────┘         └──────────┬──────────┘
           │                               │
           │    Both push to GitHub        │
           │    ↓                    ↓     │
           └────────────┬──────┬───────────┘
                        │      │
                   ┌────▼──────▼────┐
                   │   GitHub Repo   │
                   │                 │
                   │  PR #1: Shields │
                   │  PR #2: Combat  │
                   └────────┬────────┘
                            │
                    Both can be merged!
                    (No conflicts)
```

## 📋 Before You Start Checklist

```
☑️  Step 1: Project is set up
    > npm install
    > npm run agent:validate
    
☑️  Step 2: Read the guide
    Open: .github/RUNNING_AGENTS_IN_VSCODE.md
    
☑️  Step 3: Check agent board
    Open: .github/AGENT_BOARD.md
    See what others are working on
    
☑️  Step 4: Ready to code!
    > npm run agent:workflow
```

## 💡 Key Commands

```bash
# Interactive helper (USE THIS!)
npm run agent:workflow

# Check quality before PR
npm run agent:checks

# Verify setup
npm run agent:validate

# Start dev server
npm run dev

# Fix lint issues automatically
npm run lint:fix
```

## 🎯 Remember

### ✅ DO:
- Use CSS classes: `element.classList.add('my-class')`
- Check agent board before starting
- Run `npm run agent:checks` before PR
- Test in browser with `npm run dev`
- Use meaningful commit messages

### ❌ DON'T:
- Use inline styles: `element.style.color = 'red'` ❌
- Work on files claimed by other agents
- Skip the quality checks
- Commit without testing
- Use generic commit messages like "changes"

## 🚀 You're Ready!

Open terminal and run:
```bash
npm run agent:workflow
```

Select option 1, and start coding! 🎉
