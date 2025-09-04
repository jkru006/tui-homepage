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

### Using the Commit Script (Recommended)

The easiest way to update the version is to use the provided commit script:

```bash
./commit.sh "Your commit message"
```

This script automatically:
1. Updates the version in package.json (patch by default)
2. Creates a git commit with your message
3. Creates a git tag for the new version

You can control the version bump type by including special tags in your commit message:

```bash
# For patch update (1.0.0 → 1.0.1)
./commit.sh "Fixed a bug in the schedule display"

# For minor update (1.0.1 → 1.1.0)
./commit.sh "[minor] Added dark mode support"

# For major update (1.1.0 → 2.0.0)
./commit.sh "[major] Complete UI redesign with new features"
```

After committing with the script, you can push your changes and tags with:
```bash
git push origin main && git push origin --tags
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
- v1.0.1 - v1.0.9 - Bug fixes and minor improvements

## When to Update the Version

- **PATCH** (1.0.X): Bug fixes, small changes that don't affect functionality
- **MINOR** (1.X.0): New features, substantial changes that maintain compatibility
- **MAJOR** (X.0.0): Breaking changes, major redesigns, incompatible API changes
