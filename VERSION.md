# Version Management for TUI Homepage

This document explains how to manage version numbers for the TUI Homepage project.

## Versioning System

TUI Homepage follows [Semantic Versioning](https://semver.org/) (SemVer):

- **MAJOR**: Incompatible API changes (X.0.0)
- **MINOR**: New features in a backward compatible manner (0.X.0)
- **PATCH**: Backward compatible bug fixes (0.0.X)

## Current Version

The current version is stored in `package.json` and is reflected in Git tags. A version badge is displayed in the README.md file that automatically shows the latest release version from GitHub.

## How to Update the Version

### Automatic Updates with Git Hooks (Recommended)

The version is automatically updated with each commit using Git hooks:

1. **Normal commits** increment the PATCH version (e.g., 1.0.0 → 1.0.1)
2. **Minor version bumps** are triggered by including "[minor]" in your commit message (e.g., 1.0.1 → 1.1.0)
3. **Major version bumps** are triggered by including "[major]" in your commit message (e.g., 1.1.0 → 2.0.0)

Example commit commands:
```bash
# For patch update (1.0.0 → 1.0.1)
git commit -m "Fixed a bug in the schedule display"

# For minor update (1.0.1 → 1.1.0)
git commit -m "[minor] Added dark mode support"

# For major update (1.1.0 → 2.0.0)
git commit -m "[major] Complete UI redesign with new features"
```

Git tags are automatically created for each version update by the post-commit hook.

To push these tags to GitHub:
```bash
git push origin --tags
```

### Using the Version Script Manually

You can also manually update the version using the included version script:

```bash
# For a patch update (1.0.0 -> 1.0.1)
node version.js patch

# For a minor update (1.0.0 -> 1.1.0)
node version.js minor

# For a major update (1.0.0 -> 2.0.0)
node version.js major
```

The script will:
1. Update the version in package.json
2. Show you the next steps to commit and tag the new version

### Manual Process

If you prefer to update the version manually:

1. Update the version in `package.json`
2. Commit the change: `git add package.json && git commit -m "Bump version to X.Y.Z"`
3. Create a tag: `git tag -a vX.Y.Z -m "Version X.Y.Z"`
4. Push to GitHub: `git push origin main vX.Y.Z`

## Version History

- v1.0.0 - Initial stable release

## When to Update the Version

- **PATCH** (1.0.X): Bug fixes, small changes that don't affect functionality
- **MINOR** (1.X.0): New features, substantial changes that maintain compatibility
- **MAJOR** (X.0.0): Breaking changes, major redesigns, incompatible API changes
