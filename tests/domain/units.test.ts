import { describe, it, expect } from 'vitest';
import {
  scaleQuantity,
  convertMetricToImperial,
  convertImperialToMetric,
  formatIngredientAmount,
  translateUnit
} from '../../src/domain/units.ts';

describe('units domain', () => {
  describe('scaleQuantity', () => {
    it('scales linearly', () => {
      expect(scaleQuantity(2, 1.5)).toBe(3);
      expect(scaleQuantity(1.5, 2)).toBe(3);
    });
  });

  describe('conversions', () => {
    it('converts ml to metric/imperial volume correctly', () => {
      // 1 tsp = 5 ml
      // 1 tbsp = 15 ml
      // 1 cup = 236.588 ml (or commonly 240, let's use US cups 236.588 for exact, but maybe 240 in culinary math. Let's see what standard they want)
      // I'll test basic expected conversions.
      const imperial = convertMetricToImperial(15, 'ml', null);
      expect(imperial.amount).toBeCloseTo(1, 1);
      expect(imperial.unit).toBe('tbsp');
    });

    it('converts g to metric/imperial mass correctly', () => {
      // 1 oz = 28.3495 g
      const imperial = convertMetricToImperial(28.35, 'g', null);
      expect(imperial.amount).toBeCloseTo(1, 1);
      expect(imperial.unit).toBe('oz');
    });

    it('uses density to convert g to volume if needed', () => {
      // 15g of water (density 1) = 15ml = 1 tbsp
      const imperial = convertMetricToImperial(15, 'g', 1);
      expect(imperial.amount).toBeCloseTo(1, 1);
      expect(imperial.unit).toBe('tbsp');
      
      // 15g of honey (density 1.42) = 10.56 ml = ~2 tsp
      const honeyImperial = convertMetricToImperial(15, 'g', 1.42);
      expect(honeyImperial.amount).toBeCloseTo(2.11, 1);
      expect(honeyImperial.unit).toBe('tsp');
    });
  });

  describe('formatIngredientAmount', () => {
    it('snaps metric to 1 decimal point', () => {
      expect(formatIngredientAmount(14.06, 'g', 'en')).toBe('14.1 g');
    });

    it('snaps imperial to unicode fractions', () => {
      expect(formatIngredientAmount(0.5, 'cup', 'en')).toBe('½ cup');
      expect(formatIngredientAmount(1.25, 'cup', 'en')).toBe('1 ¼ cup');
      expect(formatIngredientAmount(0.333, 'cup', 'en')).toBe('⅓ cup');
    });
  });

  describe('translateUnit', () => {
    it('translates tsp and tbsp to German', () => {
      expect(translateUnit('tsp', 'de')).toBe('TL');
      expect(translateUnit('tbsp', 'de')).toBe('EL');
      expect(translateUnit('tsp', 'en')).toBe('tsp');
      expect(translateUnit('g', 'de')).toBe('g');
    });
  });
});
