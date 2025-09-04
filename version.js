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
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Read package.json
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const currentVersion = packageJson.version;

// Parse version parts
const [major, minor, patch] = currentVersion.split('.').map(Number);

// Determine the new version based on the argument
const versionType = process.argv[2] || 'patch';
let newVersion;

switch (versionType.toLowerCase()) {
  case 'major':
    newVersion = `${major + 1}.0.0`;
    break;
  case 'minor':
    newVersion = `${major}.${minor + 1}.0`;
    break;
  case 'patch':
  default:
    newVersion = `${major}.${minor}.${patch + 1}`;
}

// Update package.json
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

console.log(`\x1b[32m✓\x1b[0m Updated version from \x1b[33m${currentVersion}\x1b[0m to \x1b[33m${newVersion}\x1b[0m`);
console.log('\nNext steps:');
console.log('  1. Commit your changes:');
console.log(`     \x1b[36mgit add package.json\x1b[0m`);
console.log(`     \x1b[36mgit commit -m "Bump version to ${newVersion}"\x1b[0m`);
console.log('  2. Create a git tag:');
console.log(`     \x1b[36mgit tag -a v${newVersion} -m "Version ${newVersion}"\x1b[0m`);
console.log('  3. Push to GitHub:');
console.log(`     \x1b[36mgit push origin main v${newVersion}\x1b[0m`);
