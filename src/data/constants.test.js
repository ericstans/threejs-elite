import { describe, it, expect } from 'vitest';
import { LASER_SPEED, LASER_RANGE, GALAXY_NAMES } from '../data/constants.js';

describe('constants', () => {
  describe('game constants', () => {
    it('should have LASER_SPEED defined', () => {
      expect(LASER_SPEED).toBeDefined();
      expect(typeof LASER_SPEED).toBe('number');
      expect(LASER_SPEED).toBeGreaterThan(0);
    });

    it('should have LASER_RANGE defined', () => {
      expect(LASER_RANGE).toBeDefined();
      expect(typeof LASER_RANGE).toBe('number');
      expect(LASER_RANGE).toBeGreaterThan(0);
    });

    it('should have reasonable laser speed', () => {
      // Laser should move reasonably fast in game units
      expect(LASER_SPEED).toBeGreaterThan(50);
      expect(LASER_SPEED).toBeLessThan(1000);
    });

    it('should have reasonable laser range', () => {
      // Laser range should be a reasonable distance
      expect(LASER_RANGE).toBeGreaterThan(100);
      expect(LASER_RANGE).toBeLessThan(10000);
    });
  });

  describe('GALAXY_NAMES', () => {
    it('should be an array', () => {
      expect(Array.isArray(GALAXY_NAMES)).toBe(true);
    });

    it('should have many galaxy names', () => {
      expect(GALAXY_NAMES.length).toBeGreaterThan(50);
    });

    it('should contain only strings', () => {
      GALAXY_NAMES.forEach(name => {
        expect(typeof name).toBe('string');
        expect(name.length).toBeGreaterThan(0);
      });
    });

    it('should have mostly unique names', () => {
      const uniqueNames = new Set(GALAXY_NAMES);
      // Allow for a few duplicates but most should be unique
      const uniqueRatio = uniqueNames.size / GALAXY_NAMES.length;
      expect(uniqueRatio).toBeGreaterThan(0.9); // At least 90% unique
    });

    it('should include famous galaxies', () => {
      expect(GALAXY_NAMES).toContain('Andromeda');
      expect(GALAXY_NAMES).toContain('Triangulum');
    });

    it('should not have empty strings', () => {
      GALAXY_NAMES.forEach(name => {
        expect(name.trim().length).toBeGreaterThan(0);
      });
    });

    it('should have properly formatted names (no leading/trailing spaces)', () => {
      GALAXY_NAMES.forEach(name => {
        expect(name).toBe(name.trim());
      });
    });
  });
});
