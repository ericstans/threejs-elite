# Agent Quick Reference

⚡ **Quick commands and tips for AI agents**

## 🚀 Quick Start

```bash
# 1. Create branch
git checkout master && git pull origin master
git checkout -b agent/<name>/<feature>

# 2. Do your work...

# 3. Before PR
npm run agent:checks

# 4. Submit PR
git push origin agent/<name>/<feature>
# Then create PR on GitHub
```

## 📝 Common Commands

### Branch Management
```bash
# Start new work
npm run agent:workflow          # Interactive helper

# Update from master
git fetch origin master
git rebase origin/master

# Check conflicts
git merge-tree $(git merge-base HEAD origin/master) HEAD origin/master
```

### Quality Checks
```bash
# All checks (recommended)
npm run agent:checks

# Individual checks
npm run lint                    # ESLint
npm run type-check             # TypeScript
npm run build                  # Build test

# Auto-fix issues
npm run lint:fix               # Fix auto-fixable lint issues
```

### Development
```bash
npm run dev                    # Start dev server
npm run build                  # Production build
npm run preview                # Preview production build
```

## 🎯 Branch Naming

Format: `agent/<agent-name>/<feature-description>`

Examples:
```
agent/copilot-1/add-shields
agent/assistant-2/fix-targeting-bug
agent/coder-3/refactor-ui
```

## 💬 Commit Messages

Format: `<type>: <description>`

Types:
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring
- `style:` - CSS/formatting
- `docs:` - Documentation
- `test:` - Tests
- `chore:` - Build/deps

Examples:
```bash
git commit -m "feat: add weapon heat system"
git commit -m "fix: resolve null pointer in targeting"
git commit -m "refactor: extract damage calculations"
git commit -m "style: improve combat UI spacing"
```

## 📋 Pre-PR Checklist

Before creating PR, ensure:
- [ ] `npm run lint` passes
- [ ] `npm run type-check` passes
- [ ] `npm run build` succeeds
- [ ] Tested in browser (`npm run dev`)
- [ ] No console errors
- [ ] No inline styles (use CSS classes)
- [ ] Updated [AGENT_BOARD.md](.github/AGENT_BOARD.md)
- [ ] Meaningful commit messages

## 🗂️ File Locations

### Add New Features
- UI Components → `src/ui/ComponentName.js`
- Game Systems → `src/systems/SystemName.js`
- CSS Styles → `src/styles/components/feature.css`
- Data/Config → `src/data/DataName.js`
- Utilities → `src/util/utilName.js`

### Common Files
- Main entry → `src/main.js`
- Game loop → `src/GameEngine.js`
- UI controller → `src/UI.js`
- Constants → `src/data/constants.js`

## 🎨 CSS Guidelines

**DO**:
```javascript
// In Component.js
element.classList.add('my-feature-button');
```

```css
/* In src/styles/components/my-feature.css */
.my-feature-button {
  background: var(--primary-color);
  padding: 10px;
}
```

**DON'T**:
```javascript
// ❌ No inline styles!
element.style.background = 'blue';
element.style.padding = '10px';
```

## 🔍 Finding Things

```bash
# Find files
npm run grep "<pattern>"

# Find in specific directory
npm run grep "<pattern>" "src/systems/**"

# Find function usage
# Use editor's "Find All References"
```

## 📊 Agent Board

**Before starting**: Check [AGENT_BOARD.md](.github/AGENT_BOARD.md)

**When claiming work**: Add to "Active Work" section
```markdown
| agent-1 | agent/agent-1/shields | Add shield system | Spaceship.js | In Progress | Jan 20 |
```

**When done**: Move to "Recently Completed"

## 🚨 Common Issues

### "Lint failed"
```bash
npm run lint:fix              # Auto-fix
npm run lint                  # Check remaining issues
```

### "Type check failed"
Check `src/types.d.ts` and add missing types

### "Build failed"
- Check for syntax errors
- Check import paths
- Run `npm run dev` to see detailed errors

### "Merge conflicts"
```bash
git fetch origin master
git rebase origin/master
# Fix conflicts in editor
git add .
git rebase --continue
git push --force-with-lease
```

## 🔗 Important Links

- [Full Agent Guide](.github/AGENT_SETUP.md)
- [Agent Board](.github/AGENT_BOARD.md)
- [GitHub Workflows](.github/README.md)
- [Contributing Guide](.github/CONTRIBUTING.md)

## ⚙️ VS Code Integration

**Recommended extensions**:
- ESLint
- GitLens
- GitHub Pull Requests

**Useful shortcuts**:
- `Ctrl+Shift+P` → "Git: Create Branch"
- `Ctrl+Shift+G` → Source Control view
- `F12` → Go to definition
- `Shift+F12` → Find all references

## 📞 Need Help?

1. Check [AGENT_SETUP.md](.github/AGENT_SETUP.md) for detailed info
2. Review similar PRs for examples
3. Check GitHub Actions logs if checks fail
4. Create issue with `question` label

## 🎯 Success Tips

1. **Small PRs** - Focus on one feature
2. **Test thoroughly** - Run in browser before PR
3. **Clean commits** - Meaningful commit messages
4. **Update board** - Keep others informed
5. **Rebase often** - Stay up to date with master
6. **Follow patterns** - Match existing code style
7. **No console.log** - Use debug flags instead
8. **CSS classes** - Never inline styles
