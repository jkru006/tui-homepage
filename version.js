#!/usr/bin/env node
/**
 * Version management script for TUI Homepage
 * 
 * Usage:
 *   node version.js [patch|minor|major]
 * 
 * Examples:
 *   node version.js patch  (1.0.0 -> 1.0.1)
 *   node version.js minor  (1.0.0 -> 1.1.0)
 *   node version.js major  (1.0.0 -> 2.0.0)
 * 
 * When used with Git hooks:
 *   - Add [minor] to commit message to bump minor version
 *   - Add [major] to commit message to bump major version
 *   - Otherwise, patch version is bumped automatically
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

try {
  // Read package.json
  const packageJsonPath = path.join(__dirname, 'package.json');
  let packageJsonContent;
  try {
    packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
  } catch (err) {
    console.error(`\x1b[31m✗\x1b[0m Error: Could not read package.json: ${err.message}`);
    process.exit(1);
  }

  let packageJson;
  try {
    packageJson = JSON.parse(packageJsonContent);
  } catch (err) {
    console.error(`\x1b[31m✗\x1b[0m Error: Invalid JSON in package.json: ${err.message}`);
    process.exit(1);
  }

  const currentVersion = packageJson.version;
  if (!currentVersion) {
    console.error('\x1b[31m✗\x1b[0m Error: No version field found in package.json');
    process.exit(1);
  }

  // Parse version parts
  const versionParts = currentVersion.split('.');
  if (versionParts.length !== 3) {
    console.error(`\x1b[31m✗\x1b[0m Error: Invalid version format: ${currentVersion}`);
    process.exit(1);
  }

  const [major, minor, patch] = versionParts.map(Number);

  // Determine the new version based on the argument
  const versionType = (process.argv[2] || 'patch').toLowerCase();
  let newVersion;

  switch (versionType) {
    case 'major':
      newVersion = `${major + 1}.0.0`;
      break;
    case 'minor':
      newVersion = `${major}.${minor + 1}.0`;
      break;
    case 'patch':
      newVersion = `${major}.${minor}.${patch + 1}`;
      break;
    default:
      console.error(`\x1b[31m✗\x1b[0m Error: Invalid version type: ${versionType}. Use 'patch', 'minor', or 'major'`);
      process.exit(1);
  }

  // Update package.json
  packageJson.version = newVersion;
  try {
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  } catch (err) {
    console.error(`\x1b[31m✗\x1b[0m Error: Could not write to package.json: ${err.message}`);
    process.exit(1);
  }

  console.log(`\x1b[32m✓\x1b[0m Updated version from \x1b[33m${currentVersion}\x1b[0m to \x1b[33m${newVersion}\x1b[0m`);
  
  // If called directly (not from hook)
  if (!process.env.GIT_HOOK) {
    console.log('\nNext steps:');
    console.log('  1. Commit your changes:');
    console.log(`     \x1b[36mgit add package.json\x1b[0m`);
    console.log(`     \x1b[36mgit commit -m "Bump version to ${newVersion}"\x1b[0m`);
    console.log('  2. Create a git tag:');
    console.log(`     \x1b[36mgit tag -a v${newVersion} -m "Version ${newVersion}"\x1b[0m`);
    console.log('  3. Push to GitHub:');
    console.log(`     \x1b[36mgit push origin main v${newVersion}\x1b[0m`);
  }

  // Output just the version number (used by other scripts)
  if (process.argv.includes('--quiet')) {
    console.log(newVersion);
  }
} catch (err) {
  console.error(`\x1b[31m✗\x1b[0m Unexpected error: ${err.message}`);
  process.exit(1);
}
