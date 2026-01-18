# Agent Workflow Visualizations

Quick visual guides for common agent workflows.

## 🌿 Branch Workflow

```
master ─────●─────●─────●─────●─────●────→
             ╲     ╲     ╲     ╲     ╲
agent-1      ●─●─●─┘     │     │     │
                         │     │     │
agent-2                  ●─●─●─┘     │
                                     │
agent-3                              ●─●─●─┘

Legend:
● = commit
─ = branch continues
┘ = merged into master
```

**Key Points**:
- Each agent works on their own branch
- All branches come from `master`
- PRs merge back to `master`
- Branches are deleted after merge

## 📋 Agent Board States

```
┌─────────────────────────────────────────────┐
│           AVAILABLE TASKS                   │
│  - Add weapon heat system                   │
│  - Improve AI pathfinding                   │
│  - Add save/load functionality              │
└─────────────────────────────────────────────┘
                    │
                    │ Agent claims task
                    ▼
┌─────────────────────────────────────────────┐
│           ACTIVE WORK                       │
│  agent-1 | weapon-heat | In Progress       │
└─────────────────────────────────────────────┘
                    │
                    │ PR merged
                    ▼
┌─────────────────────────────────────────────┐
│         RECENTLY COMPLETED                  │
│  agent-1 | weapon-heat | PR #123 | Jan 20  │
└─────────────────────────────────────────────┘
```

## 🔄 Typical Work Session

```
START
  │
  ▼
┌─────────────────────┐
│ Check Agent Board   │ ← See what others are doing
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Claim Task          │ ← Update board with your work
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Create Branch       │ ← agent/<name>/<feature>
│ agent/me/shields    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Write Code          │ ← Follow CSS guidelines!
│ - Add features      │
│ - Test in browser   │
│ - Commit often      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Run Checks          │ ← npm run agent:checks
│ ✅ Lint             │
│ ✅ Type Check       │
│ ✅ Build            │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Push & Create PR    │ ← Fill PR template
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ GitHub Actions      │ ← Automated checks
│ - Lint              │
│ - Type Check        │
│ - Build             │
│ - Auto Label        │
└──────────┬──────────┘
           │
           ▼
       All Pass?
      /         \
    Yes         No
     │           │
     │           ▼
     │    ┌──────────────┐
     │    │ Fix Issues   │
     │    └──────┬───────┘
     │           │
     │           │
     │    ┌──────▼───────┐
     │    │ Push Again   │
     │    └──────┬───────┘
     │           │
     └───────────┘
           │
           ▼
┌─────────────────────┐
│ Review & Merge      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Update Board        │ ← Mark as completed
└──────────┬──────────┘
           │
           ▼
         END
```

## 🚦 PR Status Flow

```
Draft PR ──────→ Ready for Review ──────→ Approved ──────→ Merged
   │                    │                     │               │
   │                    │                     │               ▼
   │                    │                     │         Branch Deleted
   │                    │                     │
   │                    ▼                     │
   │            Changes Requested             │
   │                    │                     │
   │                    ▼                     │
   │              Fix & Push ─────────────────┘
   │                    
   └──→ Can mark as ready when checks pass
```

## 🎯 Subsystem Coordination

```
┌────────────────────────────────────────────────┐
│             PROJECT SUBSYSTEMS                 │
├────────────────────────────────────────────────┤
│                                                │
│  ┌──────────────┐  ┌──────────────┐          │
│  │ Combat       │  │ Trading      │          │
│  │ [AGENT-1]    │  │ [AVAILABLE]  │          │
│  └──────────────┘  └──────────────┘          │
│                                                │
│  ┌──────────────┐  ┌──────────────┐          │
│  │ Navigation   │  │ UI System    │          │
│  │ [AVAILABLE]  │  │ [AGENT-2]    │          │
│  └──────────────┘  └──────────────┘          │
│                                                │
│  ┌──────────────┐  ┌──────────────┐          │
│  │ Audio        │  │ Docking      │          │
│  │ [AVAILABLE]  │  │ [AVAILABLE]  │          │
│  └──────────────┘  └──────────────┘          │
└────────────────────────────────────────────────┘

Legend:
[AGENT-X] = Currently being modified by agent
[AVAILABLE] = Free to claim
```

## ⚠️ Conflict Scenarios

### Scenario 1: No Conflicts (Good!)
```
master:     A─B─C─D─E
             ╲     ╲
agent-1:      F─G─H─┘  ← Merges cleanly
                   
agent-2:          I─J─K
                      ↓
                  Can merge! ✅
```

### Scenario 2: Conflicts (Need Rebase)
```
master:     A─B─C─D─E
             ╲
agent-1:      F─G─H  ← Working on same file as D or E
                   ↓
              Need to rebase! ⚠️
              
After rebase:
master:     A─B─C─D─E
                     ╲
agent-1:              F'─G'─H'  ← Conflicts resolved
                              ↓
                         Can merge! ✅
```

### Scenario 3: Dependent PRs
```
agent-1:  Feature A (merged)
            │
            ▼
master:   A─B─C
            ╲
agent-2:     D─E  ← Depends on Feature A
                  ↓
              Wait for A to merge,
              then rebase on master ✅
```

## 📊 Quality Gates

```
Code Changes
     │
     ▼
┌─────────────┐
│ Pre-commit  │ ← Optional: scripts/pre-commit.js
│ Checks      │
└─────┬───────┘
      │
      ▼
┌─────────────┐
│ Commit      │
└─────┬───────┘
      │
      ▼
┌─────────────┐
│ Local Tests │ ← npm run agent:checks
│ - Lint      │
│ - TypeCheck │
│ - Build     │
└─────┬───────┘
      │
      ▼
┌─────────────┐
│ Push        │
└─────┬───────┘
      │
      ▼
┌─────────────┐
│ Create PR   │
└─────┬───────┘
      │
      ▼
┌─────────────┐
│ CI Checks   │ ← GitHub Actions (automatic)
│ - Lint      │
│ - TypeCheck │
│ - Build     │
│ - Label     │
└─────┬───────┘
      │
      ▼
   Pass? ────No───→ Fix Issues ───→ Push Again
      │                               │
     Yes                              │
      │ ←─────────────────────────────┘
      ▼
┌─────────────┐
│ Code Review │
└─────┬───────┘
      │
      ▼
  Approved? ──No──→ Address Feedback ─→ Push Again
      │                                    │
     Yes                                   │
      │ ←─────────────────────────────────┘
      ▼
┌─────────────┐
│ Merge!      │
└─────────────┘
```

## 🔧 Common Commands Flow

### Creating New Work
```bash
npm run agent:workflow
  │
  ├─→ 1. Create new branch
  │     ├─→ Enter agent name
  │     ├─→ Enter feature name
  │     └─→ Branch created: agent/<name>/<feature>
  │
  ├─→ 2. Run pre-PR checks
  │     ├─→ npm run lint
  │     ├─→ npm run type-check
  │     └─→ npm run build
  │
  ├─→ 3. Check for conflicts
  │     └─→ Compare with master
  │
  └─→ 4. Show branch stats
        └─→ Files changed, commits ahead, etc.
```

### Manual Workflow
```bash
# 1. Start
git checkout master
git pull origin master
git checkout -b agent/me/feature

# 2. Work
# ... make changes ...

# 3. Check
npm run agent:checks

# 4. Commit
git add .
git commit -m "feat: add feature"

# 5. Push
git push origin agent/me/feature

# 6. Create PR on GitHub
```

## 🎨 CSS Workflow (IMPORTANT!)

### ❌ Wrong Way
```javascript
// In Component.js
const button = document.createElement('button');
button.style.background = 'blue';      // ❌ NO!
button.style.padding = '10px';         // ❌ NO!
button.style.borderRadius = '5px';     // ❌ NO!
```

### ✅ Right Way
```javascript
// In Component.js
const button = document.createElement('button');
button.classList.add('feature-button');  // ✅ YES!
```

```css
/* In src/styles/components/feature.css */
.feature-button {
  background: var(--primary-color);     /* ✅ YES! */
  padding: 10px;                        /* ✅ YES! */
  border-radius: 5px;                   /* ✅ YES! */
}
```

## 📈 Agent Success Metrics

```
Week 1:  PRs: 5   Merged: 4   Conflicts: 1   ✅ 80% success
Week 2:  PRs: 7   Merged: 7   Conflicts: 0   ✅ 100% success  
Week 3:  PRs: 6   Merged: 5   Conflicts: 1   ✅ 83% success

Average time to merge: 2 hours
Lines changed per PR: ~200
Test pass rate: 95%
```

## 🎯 Best Practices Summary

```
✅ DO                          ❌ DON'T
────────────────────────────────────────────────
Small, focused PRs             Large, multi-feature PRs
Update agent board             Work silently
Use CSS classes                Use inline styles
Test in browser                Submit without testing
Meaningful commits             Generic commit messages
Rebase before PR               Merge master into branch
Follow templates               Skip PR template sections
Read documentation             Assume you know everything
```

## 🔄 Continuous Integration Flow

```
Push to Branch
     │
     ▼
┌─────────────────────┐
│ GitHub Actions      │
│ Triggered           │
└─────────┬───────────┘
          │
          ├──→ Lint Job
          │      └─→ npm run lint
          │
          ├──→ Type Check Job
          │      └─→ npm run type-check
          │
          └──→ Build Job
                 ├─→ npm run build
                 └─→ Upload artifacts
                     │
                     ▼
             All Jobs Complete
                     │
                     ├─→ ✅ All Passed
                     │      └─→ Ready to merge
                     │
                     └─→ ❌ Some Failed
                            └─→ Check logs, fix, push again
```

---

**Remember**: These workflows are designed to help multiple agents work efficiently without stepping on each other's toes. Follow them, and you'll have smooth sailing! 🚀
