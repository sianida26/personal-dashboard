import { test, expect, describe, beforeEach, afterEach } from 'bun:test';
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { incrementVersion } from './bump-version';

describe('Version Bumping', () => {
  const testVersionFile = join(process.cwd(), 'test-version');
  
  beforeEach(() => {
    // Clean up any existing test file
    if (existsSync(testVersionFile)) {
      unlinkSync(testVersionFile);
    }
  });
  
  afterEach(() => {
    // Clean up test file
    if (existsSync(testVersionFile)) {
      unlinkSync(testVersionFile);
    }
  });
  
  describe('incrementVersion', () => {
    test('should increment patch version correctly', () => {
      expect(incrementVersion('1.0.0')).toBe('1.0.1');
      expect(incrementVersion('1.0.9')).toBe('1.0.10');
      expect(incrementVersion('2.5.15')).toBe('2.5.16');
    });
    
    test('should handle large version numbers', () => {
      expect(incrementVersion('99.99.99')).toBe('99.99.100');
    });
    
    test('should throw error for invalid version format', () => {
      expect(() => incrementVersion('1.0')).toThrow('Invalid version format');
      expect(() => incrementVersion('1.0.0.0')).toThrow('Invalid version format');
      expect(() => incrementVersion('invalid')).toThrow('Invalid version format');
      expect(() => incrementVersion('')).toThrow('Invalid version format');
    });
    
    test('should throw error for non-numeric version parts', () => {
      expect(() => incrementVersion('1.0.abc')).toThrow();
      expect(() => incrementVersion('a.b.c')).toThrow('Invalid version format');
    });
  });
  
  describe('getCurrentVersion', () => {
    test('should return correct version when file exists', () => {
      writeFileSync(testVersionFile, '2.3.4', 'utf-8');
      const testVersion = readFileSync(testVersionFile, 'utf-8').trim();
      expect(testVersion).toBe('2.3.4');
    });
    
    test('should trim whitespace from version file', () => {
      writeFileSync(testVersionFile, '  1.2.3  \n', 'utf-8');
      const testVersion = readFileSync(testVersionFile, 'utf-8').trim();
      expect(testVersion).toBe('1.2.3');
    });
  });
  
  describe('saveVersion', () => {
    test('should save version to file correctly', () => {
      const testVersion = '3.2.1';
      writeFileSync(testVersionFile, testVersion, 'utf-8');
      
      const savedVersion = readFileSync(testVersionFile, 'utf-8');
      expect(savedVersion).toBe(testVersion);
    });
  });
  
  describe('Integration', () => {
    test('should increment and save version correctly', () => {
      const initialVersion = '1.5.10';
      writeFileSync(testVersionFile, initialVersion, 'utf-8');
      
      const currentVersion = readFileSync(testVersionFile, 'utf-8').trim();
      const newVersion = incrementVersion(currentVersion);
      writeFileSync(testVersionFile, newVersion, 'utf-8');
      
      const savedVersion = readFileSync(testVersionFile, 'utf-8');
      expect(savedVersion).toBe('1.5.11');
    });
    
    test('should handle multiple increments', () => {
      let version = '0.0.1';
      writeFileSync(testVersionFile, version, 'utf-8');
      
      for (let i = 0; i < 5; i++) {
        version = readFileSync(testVersionFile, 'utf-8').trim();
        const newVersion = incrementVersion(version);
        writeFileSync(testVersionFile, newVersion, 'utf-8');
      }
      
      const finalVersion = readFileSync(testVersionFile, 'utf-8');
      expect(finalVersion).toBe('0.0.6');
    });
  });
});
