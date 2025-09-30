# Git Branching Strategy

## Overview

This repository follows a **Git Flow-inspired** branching strategy optimized for continuous deployment to Cloudflare's edge infrastructure.

## Branch Types

### Protected Branches

#### `main` (Production)
- **Purpose**: Production-ready code only
- **Protection**:
  - Requires pull request reviews (minimum 1 approval)
  - Requires status checks to pass
  - No direct commits allowed
  - No force pushes
- **Deployment**: Auto-deploys to production Cloudflare Workers
- **Merge from**: `release/*` or `hotfix/*` branches only

#### `develop` (Integration)
- **Purpose**: Integration branch for all features
- **Protection**:
  - Requires pull request reviews
  - Requires status checks to pass
  - No direct commits (except initial setup)
  - No force pushes
- **Deployment**: Auto-deploys to staging environment
- **Merge from**: `feature/*`, `bugfix/*` branches

### Working Branches

#### `feature/*` (New Features)
- **Purpose**: Develop new features
- **Naming**: `feature/<issue-number>-<short-description>`
  - Examples:
    - `feature/123-oauth-authentication`
    - `feature/456-allocation-engine`
    - `feature/789-cost-dashboard`
- **Branch from**: `develop`
- **Merge to**: `develop` via pull request
- **Lifecycle**: Delete after merge
- **Commit convention**: Use conventional commits

#### `bugfix/*` (Bug Fixes)
- **Purpose**: Fix bugs discovered in develop or staging
- **Naming**: `bugfix/<issue-number>-<short-description>`
  - Examples:
    - `bugfix/234-esr-calculation-error`
    - `bugfix/567-allocation-percentage`
- **Branch from**: `develop`
- **Merge to**: `develop` via pull request
- **Lifecycle**: Delete after merge

#### `hotfix/*` (Production Fixes)
- **Purpose**: Urgent fixes for production issues
- **Naming**: `hotfix/<version>-<short-description>`
  - Examples:
    - `hotfix/1.2.1-security-patch`
    - `hotfix/1.2.2-auth-bypass-fix`
- **Branch from**: `main`
- **Merge to**: Both `main` AND `develop`
- **Deployment**: Immediate to production
- **Lifecycle**: Delete after merge
- **Note**: Always bump patch version

#### `release/*` (Release Preparation)
- **Purpose**: Prepare for production release
- **Naming**: `release/<version>`
  - Examples:
    - `release/1.0.0`
    - `release/1.1.0`
    - `release/2.0.0`
- **Branch from**: `develop`
- **Merge to**: Both `main` AND `develop`
- **Activities**:
  - Version bump
  - Changelog generation
  - Final testing
  - Documentation updates
  - Bug fixes only (no new features)
- **Lifecycle**: Delete after merge

## Workflow Examples

### Feature Development

```bash
# 1. Start from latest develop
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/123-oauth-authentication

# 3. Make changes and commit (use conventional commits)
git add .
git commit -m "feat(auth): implement OAuth 2.0 with Google provider"

# 4. Keep feature branch updated
git fetch origin
git rebase origin/develop

# 5. Push to remote
git push origin feature/123-oauth-authentication

# 6. Create pull request to develop
# - Add description
# - Link related issues
# - Request reviewers
# - Wait for CI to pass

# 7. After merge, delete branch
git checkout develop
git pull origin develop
git branch -d feature/123-oauth-authentication
git push origin --delete feature/123-oauth-authentication
```

### Bug Fix

```bash
# 1. Start from latest develop
git checkout develop
git pull origin develop

# 2. Create bugfix branch
git checkout -b bugfix/234-esr-calculation-error

# 3. Fix the bug and commit
git add .
git commit -m "fix(optimization): correct ESR calculation formula"

# 4. Push and create PR to develop
git push origin bugfix/234-esr-calculation-error

# 5. After merge, delete branch
git checkout develop
git pull origin develop
git branch -d bugfix/234-esr-calculation-error
```

### Release Process

```bash
# 1. Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/1.1.0

# 2. Bump version in package.json
# Edit package.json: "version": "1.1.0"
git add package.json
git commit -m "chore(release): bump version to 1.1.0"

# 3. Update CHANGELOG.md
# Document all changes since last release
git add CHANGELOG.md
git commit -m "docs(changelog): update for v1.1.0"

# 4. Run final tests
pnpm run test
pnpm run build

# 5. Fix any release-specific bugs
git commit -m "fix(release): <description>"

# 6. Merge to main
git checkout main
git pull origin main
git merge --no-ff release/1.1.0
git tag -a v1.1.0 -m "Release version 1.1.0"
git push origin main
git push origin v1.1.0

# 7. Merge back to develop
git checkout develop
git pull origin develop
git merge --no-ff release/1.1.0
git push origin develop

# 8. Delete release branch
git branch -d release/1.1.0
git push origin --delete release/1.1.0
```

### Hotfix Process

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/1.0.1-security-patch

# 2. Make the fix
git add .
git commit -m "fix(security): patch authentication vulnerability"

# 3. Bump patch version
# Edit package.json: "version": "1.0.1"
git add package.json
git commit -m "chore(release): bump version to 1.0.1"

# 4. Test thoroughly
pnpm run test
pnpm run build

# 5. Merge to main
git checkout main
git merge --no-ff hotfix/1.0.1-security-patch
git tag -a v1.0.1 -m "Hotfix version 1.0.1"
git push origin main
git push origin v1.0.1

# 6. Merge to develop
git checkout develop
git merge --no-ff hotfix/1.0.1-security-patch
git push origin develop

# 7. Delete hotfix branch
git branch -d hotfix/1.0.1-security-patch
git push origin --delete hotfix/1.0.1-security-patch
```

## Commit Message Convention

We use [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

- **feat**: New feature for the user
- **fix**: Bug fix for the user
- **docs**: Documentation changes
- **style**: Formatting, missing semicolons, etc. (no code change)
- **refactor**: Refactoring code (no functional changes)
- **perf**: Performance improvements
- **test**: Adding or refactoring tests
- **chore**: Updating build tasks, package manager configs, etc.
- **ci**: CI/CD pipeline changes
- **build**: Changes to build system or dependencies

### Scopes

Common scopes in this project:

- **auth**: Authentication & authorization
- **allocation**: Cost allocation engine
- **optimization**: Optimization recommendations
- **dashboard**: Dashboard components
- **api**: API endpoints
- **db**: Database schema/queries
- **workers**: Cloudflare Workers
- **frontend**: Frontend application
- **ui**: UI components
- **finops**: FinOps metrics/calculations
- **integration**: Cloud provider integrations

### Examples

```bash
# Features
feat(auth): add OAuth 2.0 support with PKCE
feat(allocation): implement tag-based allocation rules
feat(dashboard): add real-time cost trend chart

# Fixes
fix(optimization): correct ESR calculation formula
fix(api): handle null values in cost data endpoint
fix(db): add missing index on tenant_id column

# Documentation
docs(api): update authentication endpoint examples
docs(readme): add troubleshooting section

# Refactoring
refactor(allocation): extract allocation logic into service
refactor(workers): optimize API response caching

# Performance
perf(dashboard): add virtualization for long data tables
perf(api): implement query result caching

# Tests
test(allocation): add unit tests for ESR calculator
test(api): add integration tests for cost endpoints

# Chores
chore(deps): update dependencies to latest versions
chore(release): bump version to 1.2.0
```

### Breaking Changes

For breaking changes, add `BREAKING CHANGE:` in the footer or `!` after type:

```bash
feat(api)!: change cost data response format

BREAKING CHANGE: Cost data API now returns FOCUS-compliant format.
Migration guide available at docs/migration/focus-v1.2.md
```

## Pull Request Guidelines

### Creating a Pull Request

1. **Title**: Use conventional commit format
   - Example: `feat(auth): implement OAuth 2.0 with Google`

2. **Description**: Include
   - What changes were made
   - Why the changes were needed
   - How to test the changes
   - Screenshots (if UI changes)
   - Related issues/tickets

3. **Labels**: Add appropriate labels
   - `feature`, `bug`, `documentation`, `enhancement`
   - `priority: high/medium/low`
   - `needs review`, `work in progress`

4. **Reviewers**: Request at least 1 reviewer

5. **Checks**: Ensure all CI checks pass
   - Linting
   - Type checking
   - Unit tests
   - E2E tests
   - Build

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How Has This Been Tested?
Describe the tests you ran

## Checklist
- [ ] My code follows the code style of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

## Related Issues
Closes #123
```

## Branch Protection Rules

### For `main` branch:

```yaml
Protection Rules:
  - Require pull request reviews: 1 approval
  - Dismiss stale reviews: true
  - Require status checks: true
    - CI: lint, test, build
    - Security scan
  - Require branches to be up to date: true
  - Include administrators: true
  - Restrict who can push: Release managers only
  - Allow force pushes: false
  - Allow deletions: false
```

### For `develop` branch:

```yaml
Protection Rules:
  - Require pull request reviews: 1 approval
  - Require status checks: true
    - CI: lint, test, build
  - Require branches to be up to date: true
  - Include administrators: false
  - Allow force pushes: false
  - Allow deletions: false
```

## GitHub Actions Integration

CI/CD triggers by branch:

```yaml
# .github/workflows/ci.yml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

# .github/workflows/deploy-staging.yml
on:
  push:
    branches: [develop]

# .github/workflows/deploy-production.yml
on:
  push:
    branches: [main]
    tags: ['v*']
```

## Best Practices

### Do's ✅

- Keep feature branches short-lived (< 3 days)
- Rebase feature branches regularly with develop
- Write descriptive commit messages
- Squash commits before merging (if many small commits)
- Delete branches after merge
- Tag releases with semantic versioning
- Update CHANGELOG.md for releases
- Run tests before pushing
- Keep commits atomic (one logical change)

### Don'ts ❌

- Don't commit directly to `main` or `develop`
- Don't merge `main` into `develop` (except after hotfixes)
- Don't create long-running feature branches
- Don't force push to protected branches
- Don't commit secrets or credentials
- Don't commit generated files (build artifacts)
- Don't merge without PR review
- Don't merge with failing tests

## Troubleshooting

### Merge Conflicts

```bash
# Update your branch with latest develop
git checkout feature/my-feature
git fetch origin
git rebase origin/develop

# If conflicts occur, resolve them
# Edit conflicted files
git add <resolved-files>
git rebase --continue

# Force push (only for feature branches)
git push origin feature/my-feature --force-with-lease
```

### Accidentally Committed to Wrong Branch

```bash
# Create new branch from current commit
git branch feature/correct-branch

# Reset wrong branch to previous state
git checkout wrong-branch
git reset --hard origin/wrong-branch

# Switch to correct branch
git checkout feature/correct-branch
```

### Need to Update Commit Message

```bash
# For last commit
git commit --amend -m "new message"

# For older commits (use with caution)
git rebase -i HEAD~3  # Interactive rebase for last 3 commits
```

## Version Numbering

We follow [Semantic Versioning](https://semver.org/) (SemVer):

```
MAJOR.MINOR.PATCH

1.0.0 -> 1.0.1 (patch - bug fix)
1.0.1 -> 1.1.0 (minor - new feature, backward compatible)
1.1.0 -> 2.0.0 (major - breaking changes)
```

### Version Increment Rules

- **MAJOR**: Breaking changes, incompatible API changes
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible

### Pre-release Versions

```
1.0.0-alpha.1  (early development)
1.0.0-beta.1   (feature complete, testing)
1.0.0-rc.1     (release candidate)
1.0.0          (stable release)
```

## Resources

- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)

---

**Last Updated**: September 30, 2025
**Version**: 1.0