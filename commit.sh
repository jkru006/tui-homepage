#!/bin/bash

# Script to create a commit with proper version bumping
# Usage: ./commit.sh "[commit message]"
# Add [minor] or [major] to your commit message to bump minor or major version

# Ensure we have a commit message
if [ -z "$1" ]; then
    echo "Error: Commit message is required"
    echo "Usage: ./commit.sh \"[commit message]\""
    exit 1
fi

COMMIT_MSG="$1"
VERSION_TYPE="patch"  # Default to patch version

# Check commit message for version type indicators
if [[ "$COMMIT_MSG" == *"[minor]"* ]]; then
    VERSION_TYPE="minor"
    echo "Detected [minor] tag in commit message. Will bump MINOR version."
    echo "This will reset the patch version to 0 and increment the minor version."
elif [[ "$COMMIT_MSG" == *"[major]"* ]]; then
    VERSION_TYPE="major"
    echo "Detected [major] tag in commit message. Will bump MAJOR version."
    echo "This will reset both minor and patch versions to 0 and increment the major version."
else
    VERSION_TYPE="patch"
    echo "No version tag detected. Will bump PATCH version by default."
    echo "This will only increment the patch version (last digit)."
fi

# Update the version using version.js
node version.js "$VERSION_TYPE"

# Get the new version from package.json
NEW_VERSION=$(node -e "console.log(require('./package.json').version)")

# Add package.json to staging
git add package.json

# Create commit with the original message and version tag
# Use --no-verify to skip hooks
git commit --no-verify -m "$COMMIT_MSG [v$NEW_VERSION]"

# Create git tag
git tag -a "v$NEW_VERSION" -m "Version $NEW_VERSION"

echo "Created git tag: v$NEW_VERSION"
echo ""
echo "To push changes and tag to GitHub, run:"
echo "git push origin main && git push origin v$NEW_VERSION"
echo ""
echo "Or push all tags with:"
echo "git push origin main && git push origin --tags"
