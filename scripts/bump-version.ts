#!/usr/bin/env bun

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Auto-bump version script for dashboard-template
 * Increments the patch version in the version file on every build
 */

const VERSION_FILE = join(process.cwd(), 'version');

function incrementVersion(version: string): string {
  const versionPattern = /^(\d+)\.(\d+)\.(\d+)$/;
  const match = version.match(versionPattern);
  
  if (!match) {
    throw new Error(`Invalid version format: ${version}. Expected format: X.Y.Z`);
  }
  
  const [, major, minor, patch] = match;
  
  if (!patch) {
    throw new Error(`Invalid patch version: ${patch}`);
  }
  
  const newPatch = Number.parseInt(patch, 10) + 1;
  
  return `${major}.${minor}.${newPatch}`;
}

function getCurrentVersion(): string {
  try {
    return readFileSync(VERSION_FILE, 'utf-8').trim();
  } catch {
    console.warn('Version file not found, starting with 1.0.0');
    return '1.0.0';
  }
}

function saveVersion(version: string): void {
  writeFileSync(VERSION_FILE, version, 'utf-8');
}

function main() {
  try {
    const currentVersion = getCurrentVersion();
    const newVersion = incrementVersion(currentVersion);
    
    saveVersion(newVersion);
    
    console.warn(`🚀 Version bumped: ${currentVersion} → ${newVersion}`);
    
    // Also update package.json version for consistency
    try {
      const packageJsonPath = join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      packageJson.version = newVersion;
      writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, '\t') + '\n', 'utf-8');
      console.warn(`📦 Updated package.json version to ${newVersion}`);
    } catch (error) {
      console.warn('Could not update package.json version:', error);
    }
    
  } catch (error) {
    console.error('❌ Failed to bump version:', error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
}

export { incrementVersion, getCurrentVersion, saveVersion };
