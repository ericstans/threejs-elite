import { describe, it, expect } from 'vitest';
import { hashSeed, mulberry32 } from '../util/seedUtils.js';

describe('seedUtils', () => {
  describe('hashSeed', () => {
    it('should return a consistent hash for the same input', () => {
      const hash1 = hashSeed('test');
      const hash2 = hashSeed('test');
      expect(hash1).toBe(hash2);
    });

    it('should return different hashes for different inputs', () => {
      const hash1 = hashSeed('test1');
      const hash2 = hashSeed('test2');
      expect(hash1).not.toBe(hash2);
    });

    it('should handle multiple parts', () => {
      const hash1 = hashSeed('sector', 'planet', '1');
      const hash2 = hashSeed('sector', 'planet', '2');
      expect(hash1).not.toBe(hash2);
    });

    it('should return the same hash regardless of how parts are combined', () => {
      const hash1 = hashSeed('sectorplanet1');
      const hash2 = hashSeed('sector', 'planet', '1');
      expect(hash1).toBe(hash2);
    });

    it('should handle numeric inputs', () => {
      const hash1 = hashSeed(123);
      const hash2 = hashSeed(123);
      expect(hash1).toBe(hash2);
    });

    it('should return a valid 32-bit unsigned integer', () => {
      const hash = hashSeed('test');
      expect(hash).toBeGreaterThanOrEqual(0);
      expect(hash).toBeLessThanOrEqual(0xFFFFFFFF);
      expect(Number.isInteger(hash)).toBe(true);
    });

    it('should handle empty string', () => {
      const hash = hashSeed('');
      expect(typeof hash).toBe('number');
    });

    it('should handle special characters', () => {
      const hash1 = hashSeed('!@#$%^&*()');
      const hash2 = hashSeed('!@#$%^&*()');
      expect(hash1).toBe(hash2);
    });
  });

  describe('mulberry32', () => {
    it('should generate consistent random numbers for the same seed', () => {
      const rng1 = mulberry32(12345);
      const rng2 = mulberry32(12345);

      expect(rng1()).toBe(rng2());
    });

    it('should generate different sequences for different seeds', () => {
      const rng1 = mulberry32(12345);
      const rng2 = mulberry32(54321);

      expect(rng1()).not.toBe(rng2());
    });

    it('should generate numbers between 0 and 1', () => {
      const rng = mulberry32(12345);
      for (let i = 0; i < 100; i++) {
        const value = rng();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });

    it('should generate a deterministic sequence', () => {
      const rng1 = mulberry32(12345);
      const sequence1 = Array.from({ length: 10 }, () => rng1());

      const rng2 = mulberry32(12345);
      const sequence2 = Array.from({ length: 10 }, () => rng2());

      expect(sequence1).toEqual(sequence2);
    });

    it('should have good distribution (not all the same)', () => {
      const rng = mulberry32(12345);
      const values = Array.from({ length: 100 }, () => rng());
      const uniqueValues = new Set(values);

      // Should have many unique values (not a strict requirement, but expected)
      expect(uniqueValues.size).toBeGreaterThan(90);
    });

    it('should handle seed value of 0', () => {
      const rng = mulberry32(0);
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    });

    it('should handle large seed values', () => {
      const rng = mulberry32(0xFFFFFFFF);
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    });
  });

  describe('integration - hashSeed with mulberry32', () => {
    it('should work together to create deterministic random sequences from strings', () => {
      const seed1 = hashSeed('sector-1', 'planet-A');
      const seed2 = hashSeed('sector-1', 'planet-A');

      const rng1 = mulberry32(seed1);
      const rng2 = mulberry32(seed2);

      // Same string inputs should produce same random sequences
      expect(rng1()).toBe(rng2());
    });

    it('should produce different sequences for different string combinations', () => {
      const seed1 = hashSeed('sector-1', 'planet-A');
      const seed2 = hashSeed('sector-1', 'planet-B');

      const rng1 = mulberry32(seed1);
      const rng2 = mulberry32(seed2);

      expect(rng1()).not.toBe(rng2());
    });
  });
});
