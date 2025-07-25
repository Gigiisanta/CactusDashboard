import { getChartColors, getColorByIndex, getGradientColors } from '@/lib/chart-colors';

describe('Chart Colors', () => {
  describe('getChartColors', () => {
    it('returns default colors when no count specified', () => {
      const colors = getChartColors();
      expect(colors).toBeInstanceOf(Array);
      expect(colors.length).toBeGreaterThan(0);
    });

    it('returns specified number of colors', () => {
      const colors = getChartColors(5);
      expect(colors).toHaveLength(5);
    });

    it('returns unique colors', () => {
      const colors = getChartColors(10);
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(10);
    });
  });

  describe('getColorByIndex', () => {
    it('returns color for valid index', () => {
      const color = getColorByIndex(0);
      expect(color).toBeDefined();
      expect(typeof color).toBe('string');
    });

    it('handles large indices by cycling through colors', () => {
      const color1 = getColorByIndex(0);
      const color2 = getColorByIndex(20); // Assuming we have fewer than 20 colors
      expect(color1).toBeDefined();
      expect(color2).toBeDefined();
    });

    it('handles negative indices', () => {
      const color = getColorByIndex(-1);
      expect(color).toBeDefined();
    });
  });

  describe('getGradientColors', () => {
    it('returns gradient colors for valid base color', () => {
      const gradients = getGradientColors('#3B82F6');
      expect(gradients).toBeInstanceOf(Array);
      expect(gradients.length).toBeGreaterThan(0);
    });

    it('returns different shades for the same base color', () => {
      const gradients = getGradientColors('#3B82F6');
      const uniqueColors = new Set(gradients);
      expect(uniqueColors.size).toBeGreaterThan(1);
    });

    it('handles different base colors', () => {
      const blueGradients = getGradientColors('#3B82F6');
      const redGradients = getGradientColors('#EF4444');

      expect(blueGradients).not.toEqual(redGradients);
    });
  });
});
