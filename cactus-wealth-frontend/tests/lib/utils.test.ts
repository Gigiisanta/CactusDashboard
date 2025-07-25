import { formatCurrency, formatPercentage, formatDate, truncateText, formatNumber, formatPhoneNumber, validateEmail, generateId, debounce, throttle, getRiskProfileLabel, getRiskProfileColor } from '@/lib/utils';

describe('Utils', () => {
  describe('formatCurrency', () => {
    it('formats positive numbers correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(1000000)).toBe('$1,000,000.00');
    });

    it('formats negative numbers correctly', () => {
      expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
      expect(formatCurrency(-1000000)).toBe('-$1,000,000.00');
    });

    it('handles decimal places correctly', () => {
      expect(formatCurrency(1234)).toBe('$1,234.00');
      expect(formatCurrency(1234.1)).toBe('$1,234.10');
      expect(formatCurrency(1234.123)).toBe('$1,234.12');
    });

    it('handles zero and edge cases', () => {
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(0.01)).toBe('$0.01');
      expect(formatCurrency(999999999.99)).toBe('$999,999,999.99');
    });

    it('handles different currencies', () => {
      expect(formatCurrency(1234.56, 'EUR')).toBe('$1,235');
      expect(formatCurrency(1234.56, 'GBP')).toBe('$1,235');
    });
  });

  describe('formatPercentage', () => {
    it('formats percentages correctly', () => {
      expect(formatPercentage(12.34)).toBe('12.34%');
      expect(formatPercentage(0.5)).toBe('0.50%');
    });

    it('handles negative percentages', () => {
      expect(formatPercentage(-12.34)).toBe('-12.34%');
      expect(formatPercentage(-0.5)).toBe('-0.50%');
    });

    it('handles zero and edge cases', () => {
      expect(formatPercentage(0)).toBe('0.00%');
      expect(formatPercentage(100)).toBe('100.00%');
      expect(formatPercentage(0.001)).toBe('0.00%');
    });

    it('handles custom decimal places', () => {
      expect(formatPercentage(12.345, 1)).toBe('12.3%');
      expect(formatPercentage(12.345, 3)).toBe('12.345%');
    });
  });

  describe('formatDate', () => {
    it('formats dates correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      expect(formatDate(date)).toBe('Jan 15, 2024');
    });

    it('handles different date formats', () => {
      const date = new Date('2024-12-25T12:00:00Z');
      expect(formatDate(date, 'short')).toBe('12/25/2024');
      expect(formatDate(date, 'long')).toBe('December 25, 2024');
    });

    it('handles invalid dates', () => {
      expect(formatDate('invalid')).toBe('Invalid Date');
      expect(formatDate(null)).toBe('Invalid Date');
    });

    it('handles different locales', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      expect(formatDate(date, 'default', 'es-ES')).toContain('15');
    });
  });

  describe('truncateText', () => {
    it('truncates long text correctly', () => {
      const longText = 'This is a very long text that should be truncated';
      expect(truncateText(longText, 20)).toBe('This is a very lo...');
    });

    it('returns original text if shorter than limit', () => {
      const shortText = 'Short text';
      expect(truncateText(shortText, 20)).toBe('Short text');
    });

    it('handles empty string', () => {
      expect(truncateText('', 10)).toBe('');
    });

    it('handles null and undefined', () => {
      expect(truncateText(null, 10)).toBe('');
      expect(truncateText(undefined, 10)).toBe('');
    });

    it('handles custom suffix', () => {
      const longText = 'This is a very long text';
      expect(truncateText(longText, 10, '***')).toBe('This is***');
    });
  });

  describe('formatNumber', () => {
    it('formats numbers with commas', () => {
      expect(formatNumber(1234567)).toBe('1,234,567');
      expect(formatNumber(1000)).toBe('1,000');
    });

    it('handles decimals', () => {
      expect(formatNumber(1234.56)).toBe('1,234.56');
      expect(formatNumber(1234.567, 2)).toBe('1,234.57');
    });

    it('handles negative numbers', () => {
      expect(formatNumber(-1234567)).toBe('-1,234,567');
    });
  });

  describe('formatPhoneNumber', () => {
    it('formats US phone numbers', () => {
      expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890');
      expect(formatPhoneNumber('1234567890', 'US')).toBe('(123) 456-7890');
    });

    it('handles international numbers', () => {
      expect(formatPhoneNumber('+1234567890')).toBe('(123) 456-7890');
    });

    it('handles invalid numbers', () => {
      expect(formatPhoneNumber('123')).toBe('123');
      expect(formatPhoneNumber('')).toBe('');
    });
  });

  describe('validateEmail', () => {
    it('validates correct emails', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true);
    });

    it('rejects invalid emails', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('generateId', () => {
    it('generates unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
    });

    it('generates IDs with custom prefix', () => {
      const id = generateId('test');
      expect(id).toMatch(/^test_/);
    });
  });

  describe('debounce', () => {
    it('debounces function calls', (done) => {
      let callCount = 0;
      const debouncedFn = debounce(() => {
        callCount++;
      }, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      setTimeout(() => {
        expect(callCount).toBe(1);
        done();
      }, 150);
    });
  });

  describe('throttle', () => {
    it('throttles function calls', (done) => {
      let callCount = 0;
      const throttledFn = throttle(() => {
        callCount++;
      }, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      setTimeout(() => {
        expect(callCount).toBe(1);
        done();
      }, 50);
    });
  });

  describe('getRiskProfileLabel', () => {
    it('returns correct labels for known profiles', () => {
      expect(getRiskProfileLabel('conservative')).toBe('Conservative');
      expect(getRiskProfileLabel('moderate')).toBe('Moderate');
      expect(getRiskProfileLabel('aggressive')).toBe('Aggressive');
      expect(getRiskProfileLabel('low')).toBe('Low Risk');
      expect(getRiskProfileLabel('medium')).toBe('Medium Risk');
      expect(getRiskProfileLabel('high')).toBe('High Risk');
    });

    it('returns original value for unknown profiles', () => {
      expect(getRiskProfileLabel('unknown')).toBe('unknown');
    });
  });

  describe('getRiskProfileColor', () => {
    it('returns correct colors for known profiles', () => {
      expect(getRiskProfileColor('conservative')).toBe(
        'bg-green-100 text-green-800'
      );
      expect(getRiskProfileColor('moderate')).toBe('bg-blue-100 text-blue-800');
      expect(getRiskProfileColor('aggressive')).toBe(
        'bg-orange-100 text-orange-800'
      );
      expect(getRiskProfileColor('low')).toBe('bg-green-100 text-green-800');
      expect(getRiskProfileColor('medium')).toBe(
        'bg-yellow-100 text-yellow-800'
      );
      expect(getRiskProfileColor('high')).toBe('bg-red-100 text-red-800');
    });

    it('returns default color for unknown profiles', () => {
      expect(getRiskProfileColor('unknown')).toBe('bg-gray-100 text-gray-800');
    });
  });
});
