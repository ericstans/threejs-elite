# Contributing Guide

Thank you for contributing to this project! This guide will help you get started.

## 🤖 For AI Agents

If you're an AI agent working on this project, please read:
- [Agent Setup Guide](.github/AGENT_SETUP.md) - Complete workflow
- [Agent Board](.github/AGENT_BOARD.md) - Coordination and task tracking
- [GitHub README](.github/README.md) - GitHub workflows and templates

## 👥 For Human Contributors

### Getting Started

1. **Fork the repository**
2. **Clone your fork**:
   ```bash
   git clone https://github.com/your-username/threejs-elite.git
   cd threejs-elite
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Start development server**:
   ```bash
   npm run dev
   ```

### Development Workflow

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the code style guidelines

3. **Run tests**:
   ```bash
   npm run lint
   npm run type-check
   npm run build
   ```

4. **Commit your changes**:
   ```bash
   git commit -m "feat: add new feature"
   ```
   
   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `refactor:` - Code refactoring
   - `docs:` - Documentation
   - `style:` - Formatting, CSS
   - `test:` - Tests
   - `chore:` - Build, dependencies

5. **Push and create PR**:
   ```bash
   git push origin feature/your-feature-name
   ```

## 📝 Code Style Guidelines

### JavaScript/TypeScript

- Use ES6+ features
- Prefer `const` over `let`, avoid `var`
- Use meaningful variable names
- Add JSDoc comments for functions
- Follow existing code patterns

### CSS

- **No inline styles** - Use CSS classes
- Reuse existing classes when possible
- Keep styles consistent across components
- Use CSS custom properties for theme values

### File Organization

- Keep files focused on single responsibility
- Place new UI components in `src/ui/`
- Place new systems in `src/systems/`
- Place new styles in `src/styles/components/`

## 🧪 Testing

Before submitting a PR:

1. **Lint check**: `npm run lint`
2. **Type check**: `npm run type-check`
3. **Build**: `npm run build`
4. **Manual test**: Run `npm run dev` and test your changes
5. **Check console**: No errors in browser console

## 📋 Pull Request Guidelines

### PR Checklist

- [ ] Code follows the style guidelines
- [ ] No inline styles (use CSS classes)
- [ ] All checks pass (lint, type-check, build)
- [ ] Tested manually in browser
- [ ] No console errors
- [ ] Added/updated documentation if needed
- [ ] PR description clearly explains changes

### PR Title Format

Use conventional commit format:
- `feat: add new weapon system`
- `fix: resolve targeting bug`
- `refactor: extract combat logic`

### PR Description

Include:
- **What** changed
- **Why** it changed
- **How** to test it
- **Screenshots** (if UI changes)
- **Breaking changes** (if any)

## 🐛 Reporting Bugs

Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md) and include:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots/console output
- Environment details

## 💡 Suggesting Features

Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md) and include:
- Clear description
- Problem it solves
- Proposed implementation
- Acceptance criteria

## 🔍 Code Review Process

1. **Automated checks** run on all PRs
2. **Maintainer review** - PRs reviewed within 48 hours
3. **Address feedback** - Make requested changes
4. **Approval & merge** - Once approved, PR is merged

## 🚫 What Not to Do

- ❌ Don't use inline styles
- ❌ Don't commit commented-out code
- ❌ Don't leave console.log statements
- ❌ Don't commit node_modules or dist
- ❌ Don't make unrelated changes in the same PR
- ❌ Don't force push to master

## 📚 Resources

- [Project README](../README.md)
- [Architecture Analysis](../Analysis.md)
- [Agent Setup](.github/AGENT_SETUP.md)
- [Three.js Documentation](https://threejs.org/docs/)

## 🆘 Getting Help

- Check existing issues and PRs
- Review project documentation
- Create an issue with the `question` label

## 📜 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

## 🙏 Thank You!

Your contributions make this project better for everyone!
