# Git Hooks

This directory contains custom git hooks for the project.

## Setup

Git hooks are automatically configured on `ddev start` via a `post-start` hook, which runs:

```bash
git config core.hooksPath .githooks
```

## Available Hooks

### commit-msg

Validates that commit messages follow the [Conventional Commits](https://www.conventionalcommits.org/) format.

**Format:** `type(scope)?: description`

**Valid types:** `feat` `fix` `improv` `docs` `style` `refactor` `perf` `test` `build` `ci` `chore` `revert`

**Examples:**

```bash
feat: add AppHeader component
fix(api): handle missing content file
improv: smoother scroll animations
chore: update dependencies
feat!: redesign API               # breaking change
docs(readme): update install steps
```

**Automatically allowed:**

- Merge commits (`Merge ...`)
- Fixup/squash commits (`fixup! ...`, `squash! ...`)

## Troubleshooting

If hooks aren't running:

```bash
# Check hooks path
git config --get core.hooksPath

# Should output: .githooks

# If not, manually configure
git config core.hooksPath .githooks
```
