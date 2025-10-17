import { describe, it, expect } from 'vitest';
import {
  calculateCostPerNut,
  calculateTimePerNut,
  calculateCostPerHour,
  calculateNutsPerHour,
  calculateEfficiencyScore,
  formatCurrency,
  formatTime,
  formatRating,
} from './calculations';

describe('calculations module', () => {
  describe('calculateCostPerNut', () => {
    it('should calculate cost per nut correctly', () => {
      expect(calculateCostPerNut(100, 10)).toBe(10);
      expect(calculateCostPerNut(50.50, 5)).toBe(10.10);
    });

    it('should return 0 when totalNuts is 0', () => {
      expect(calculateCostPerNut(100, 0)).toBe(0);
    });

    it('should handle decimal results and round to 2 places', () => {
      expect(calculateCostPerNut(100, 3)).toBe(33.33);
      expect(calculateCostPerNut(10, 3)).toBe(3.33);
    });

    it('should handle negative values', () => {
      expect(calculateCostPerNut(-100, 10)).toBe(-10);
    });

    it('should handle very small values', () => {
      expect(calculateCostPerNut(0.01, 1)).toBe(0.01);
    });

    it('should handle very large values', () => {
      expect(calculateCostPerNut(10000000, 1000000)).toBe(10);
    });
  });

  describe('calculateTimePerNut', () => {
    it('should calculate time per nut correctly', () => {
      expect(calculateTimePerNut(120, 10)).toBe(12);
      expect(calculateTimePerNut(65, 5)).toBe(13);
    });

    it('should return 0 when totalNuts is 0', () => {
      expect(calculateTimePerNut(120, 0)).toBe(0);
    });

    it('should handle decimal results and round to 2 places', () => {
      expect(calculateTimePerNut(100, 3)).toBe(33.33);
      expect(calculateTimePerNut(10, 3)).toBe(3.33);
    });

    it('should handle fractional minutes', () => {
      expect(calculateTimePerNut(1.5, 3)).toBe(0.5);
    });
  });

  describe('calculateCostPerHour', () => {
    it('should calculate cost per hour correctly', () => {
      expect(calculateCostPerHour(100, 60)).toBe(100);
      expect(calculateCostPerHour(50, 30)).toBe(100);
    });

    it('should return 0 when totalMinutes is 0', () => {
      expect(calculateCostPerHour(100, 0)).toBe(0);
    });

    it('should convert minutes to hours correctly', () => {
      expect(calculateCostPerHour(120, 120)).toBe(60);
      expect(calculateCostPerHour(200, 240)).toBe(50);
    });

    it('should handle decimal results and round to 2 places', () => {
      expect(calculateCostPerHour(100, 90)).toBe(66.67);
    });

    it('should handle fractional values', () => {
      expect(calculateCostPerHour(25.50, 30)).toBe(51);
    });
  });

  describe('calculateNutsPerHour', () => {
    it('should calculate nuts per hour correctly', () => {
      expect(calculateNutsPerHour(10, 60)).toBe(10);
      expect(calculateNutsPerHour(5, 30)).toBe(10);
    });

    it('should return 0 when totalMinutes is 0', () => {
      expect(calculateNutsPerHour(10, 0)).toBe(0);
    });

    it('should convert minutes to hours correctly', () => {
      expect(calculateNutsPerHour(120, 60)).toBe(120);
      expect(calculateNutsPerHour(20, 120)).toBe(10);
    });

    it('should handle decimal results and round to 2 places', () => {
      expect(calculateNutsPerHour(10, 90)).toBe(6.67);
    });

    it('should handle very fast rates', () => {
      expect(calculateNutsPerHour(100, 10)).toBe(600);
    });
  });

  describe('calculateEfficiencyScore', () => {
    it('should calculate efficiency score with all factors', () => {
      const result = calculateEfficiencyScore(10, 100, 60, 8);
      // nutsPerDollar * 100 + nutsPerHour * 10 + rating
      // (10/100) * 100 + (10/60)*60 * 10 + 8 = 10 + 100 + 8 = 118
      expect(result).toBe(118);
    });

    it('should handle zero values gracefully', () => {
      expect(calculateEfficiencyScore(0, 0, 0, 0)).toBe(0);
    });

    it('should return rating only when no nuts or time', () => {
      expect(calculateEfficiencyScore(0, 100, 60, 5)).toBe(5);
    });

    it('should handle high efficiency scenarios', () => {
      const result = calculateEfficiencyScore(100, 50, 30, 10);
      expect(result).toBeGreaterThan(0);
    });

    it('should handle low efficiency scenarios', () => {
      const result = calculateEfficiencyScore(1, 1000, 600, 3);
      expect(result).toBeGreaterThan(0);
    });

    it('should round to 2 decimal places', () => {
      const result = calculateEfficiencyScore(7, 33, 45, 6.5);
      expect(result).toBe(Math.round(result * 100) / 100);
    });

    it('should weight nuts per dollar heavily', () => {
      // High nuts per dollar should increase score significantly
      const highNpd = calculateEfficiencyScore(100, 10, 100, 5);
      const lowNpd = calculateEfficiencyScore(10, 100, 100, 5);
      expect(highNpd).toBeGreaterThan(lowNpd);
    });

    it('should factor in nuts per hour', () => {
      // Faster rate should increase score
      const fast = calculateEfficiencyScore(10, 100, 30, 5);
      const slow = calculateEfficiencyScore(10, 100, 120, 5);
      expect(fast).toBeGreaterThan(slow);
    });
  });

  describe('formatCurrency', () => {
    it('should format currency with dollar sign and 2 decimals', () => {
      expect(formatCurrency(100)).toBe('$100.00');
      expect(formatCurrency(10.5)).toBe('$10.50');
      expect(formatCurrency(0.99)).toBe('$0.99');
    });

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should handle negative values', () => {
      expect(formatCurrency(-50.25)).toBe('$-50.25');
    });

    it('should handle very small values', () => {
      expect(formatCurrency(0.01)).toBe('$0.01');
    });

    it('should handle very large values', () => {
      expect(formatCurrency(1000000.99)).toBe('$1000000.99');
    });

    it('should always show 2 decimal places', () => {
      expect(formatCurrency(100)).toBe('$100.00');
      expect(formatCurrency(100.1)).toBe('$100.10');
    });
  });

  describe('formatTime', () => {
    it('should format minutes less than 60', () => {
      expect(formatTime(30)).toBe('30m');
      expect(formatTime(59)).toBe('59m');
      expect(formatTime(1)).toBe('1m');
    });

    it('should format exact hours', () => {
      expect(formatTime(60)).toBe('1h');
      expect(formatTime(120)).toBe('2h');
      expect(formatTime(180)).toBe('3h');
    });

    it('should format hours and minutes', () => {
      expect(formatTime(90)).toBe('1h 30m');
      expect(formatTime(125)).toBe('2h 5m');
      expect(formatTime(195)).toBe('3h 15m');
    });

    it('should handle zero', () => {
      expect(formatTime(0)).toBe('0m');
    });

    it('should handle large values', () => {
      expect(formatTime(1440)).toBe('24h');
      expect(formatTime(1500)).toBe('25h');
    });

    it('should not show minutes when 0', () => {
      expect(formatTime(120)).toBe('2h');
      expect(formatTime(180)).toBe('3h');
    });
  });

  describe('formatRating', () => {
    it('should format rating with star and /10', () => {
      expect(formatRating(8.5)).toBe('★8.5/10');
      expect(formatRating(10)).toBe('★10.0/10');
      expect(formatRating(0)).toBe('★0.0/10');
    });

    it('should always show 1 decimal place', () => {
      expect(formatRating(5)).toBe('★5.0/10');
      expect(formatRating(7.123)).toBe('★7.1/10');
    });

    it('should handle negative values', () => {
      expect(formatRating(-1)).toBe('★-1.0/10');
    });

    it('should handle values over 10', () => {
      expect(formatRating(15)).toBe('★15.0/10');
    });

    it('should round to 1 decimal place', () => {
      expect(formatRating(8.95)).toBe('★9.0/10');
      expect(formatRating(8.94)).toBe('★8.9/10');
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle division by zero gracefully', () => {
      expect(calculateCostPerNut(100, 0)).toBe(0);
      expect(calculateTimePerNut(100, 0)).toBe(0);
      expect(calculateCostPerHour(100, 0)).toBe(0);
      expect(calculateNutsPerHour(100, 0)).toBe(0);
    });

    it('should handle very small decimal values', () => {
      expect(calculateCostPerNut(0.001, 1)).toBe(0);
      expect(calculateCostPerNut(0.01, 1)).toBe(0.01);
    });

    it('should handle infinity scenarios', () => {
      const result = calculateCostPerNut(Infinity, 1);
      expect(result).toBe(Infinity);
    });

    it('should handle NaN inputs gracefully', () => {
      const result = calculateCostPerNut(NaN, 10);
      expect(isNaN(result)).toBe(true);
    });
  });

  describe('Precision and Rounding', () => {
    it('should consistently round to 2 decimal places', () => {
      expect(calculateCostPerNut(10, 3)).toBe(3.33);
      expect(calculateCostPerNut(20, 3)).toBe(6.67);
      expect(calculateCostPerNut(100, 3)).toBe(33.33);
    });

    it('should handle rounding edge cases', () => {
      expect(calculateCostPerNut(10, 7)).toBe(1.43);
      expect(calculateCostPerNut(100, 7)).toBe(14.29);
    });

    it('should maintain precision across multiple calculations', () => {
      const cpn = calculateCostPerNut(100, 10);
      const cph = calculateCostPerHour(100, 60);
      expect(cpn + cph).toBe(110);
    });
  });
});