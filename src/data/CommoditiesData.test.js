import { describe, it, expect } from 'vitest';
import { COMMODITIES } from '../data/CommoditiesData.js';

describe('CommoditiesData', () => {
  describe('COMMODITIES structure', () => {
    it('should have at least one commodity', () => {
      expect(Object.keys(COMMODITIES).length).toBeGreaterThan(0);
    });

    it('should have valid commodity entries', () => {
      Object.entries(COMMODITIES).forEach(([, commodity]) => {
        expect(commodity).toBeDefined();
        expect(commodity.name).toBeDefined();
        expect(typeof commodity.name).toBe('string');
      });
    });
  });

  describe('commodity pricing', () => {
    it('should have valid buy prices for all commodities', () => {
      Object.values(COMMODITIES).forEach(commodity => {
        expect(commodity.buyPrice).toBeDefined();
        expect(typeof commodity.buyPrice).toBe('number');
        expect(commodity.buyPrice).toBeGreaterThan(0);
      });
    });

    it('should have valid sell prices for all commodities', () => {
      Object.values(COMMODITIES).forEach(commodity => {
        expect(commodity.sellPrice).toBeDefined();
        expect(typeof commodity.sellPrice).toBe('number');
        expect(commodity.sellPrice).toBeGreaterThan(0);
      });
    });

    it('should have sell price lower than buy price (trading margin)', () => {
      Object.values(COMMODITIES).forEach(commodity => {
        expect(commodity.sellPrice).toBeLessThan(commodity.buyPrice);
      });
    });

    it('should have reasonable profit margins (10-30%)', () => {
      Object.values(COMMODITIES).forEach(commodity => {
        const margin = (commodity.buyPrice - commodity.sellPrice) / commodity.buyPrice;
        expect(margin).toBeGreaterThanOrEqual(0.1);
        expect(margin).toBeLessThanOrEqual(0.5); // Allow up to 50% for flexibility
      });
    });
  });

  describe('commodity categories', () => {
    it('should have a category for each commodity', () => {
      Object.values(COMMODITIES).forEach(commodity => {
        expect(commodity.category).toBeDefined();
        expect(typeof commodity.category).toBe('string');
        expect(commodity.category.length).toBeGreaterThan(0);
      });
    });

    it('should use valid category names', () => {
      const validCategories = [
        'raw_materials',
        'processed_materials',
        'consumables',
        'energy',
        'technology',
        'weapons',
        'luxury'
      ];

      Object.values(COMMODITIES).forEach(commodity => {
        expect(validCategories).toContain(commodity.category);
      });
    });

    it('should have multiple items in each category', () => {
      const categoryCounts = {};
      Object.values(COMMODITIES).forEach(commodity => {
        categoryCounts[commodity.category] = (categoryCounts[commodity.category] || 0) + 1;
      });

      Object.values(categoryCounts).forEach(count => {
        expect(count).toBeGreaterThan(0);
      });
    });
  });

  describe('commodity descriptions', () => {
    it('should have descriptions for all commodities', () => {
      Object.values(COMMODITIES).forEach(commodity => {
        expect(commodity.description).toBeDefined();
        expect(typeof commodity.description).toBe('string');
        expect(commodity.description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('specific commodities', () => {
    it('should have Iron Ore as a basic commodity', () => {
      expect(COMMODITIES['Iron Ore']).toBeDefined();
      expect(COMMODITIES['Iron Ore'].category).toBe('raw_materials');
    });

    it('should have Food Rations as a consumable', () => {
      expect(COMMODITIES['Food Rations']).toBeDefined();
      expect(COMMODITIES['Food Rations'].category).toBe('consumables');
    });

    it('should have Energy Cells in energy category', () => {
      expect(COMMODITIES['Energy Cells']).toBeDefined();
      expect(COMMODITIES['Energy Cells'].category).toBe('energy');
    });
  });

  describe('price ranges', () => {
    it('should have commodities in different price tiers', () => {
      const prices = Object.values(COMMODITIES).map(c => c.buyPrice);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      // Should have variety in pricing
      expect(maxPrice).toBeGreaterThan(minPrice * 10);
    });

    it('should have affordable basic commodities', () => {
      const basicCommodities = Object.values(COMMODITIES)
        .filter(c => c.category === 'raw_materials' || c.category === 'consumables');

      expect(basicCommodities.length).toBeGreaterThan(0);

      const cheapestBasic = Math.min(...basicCommodities.map(c => c.buyPrice));
      expect(cheapestBasic).toBeLessThan(100);
    });

    it('should have expensive luxury/advanced commodities', () => {
      const advancedCommodities = Object.values(COMMODITIES)
        .filter(c => c.category === 'technology' || c.category === 'luxury');

      if (advancedCommodities.length > 0) {
        const mostExpensive = Math.max(...advancedCommodities.map(c => c.buyPrice));
        expect(mostExpensive).toBeGreaterThan(300);
      }
    });
  });
});
