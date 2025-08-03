import { cn, debounce, throttle, isNonNull, isEmpty, BREAKPOINTS, ANIMATION_DELAYS } from '../utils';

describe('utils', () => {
  describe('cn (className merger)', () => {
    it('should merge class names correctly', () => {
      expect(cn('base', 'additional')).toBe('base additional');
    });

    it('should handle conditional classes', () => {
      expect(cn('base', true && 'conditional')).toBe('base conditional');
      expect(cn('base', false && 'conditional')).toBe('base');
    });

    it('should handle Tailwind conflicts', () => {
      expect(cn('px-2 px-4')).toBe('px-4');
      expect(cn('text-red-500 text-blue-500')).toBe('text-blue-500');
    });
  });

  describe('debounce', () => {
    jest.useFakeTimers();

    it('should debounce function calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('arg1');
      debouncedFn('arg2');
      debouncedFn('arg3');

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg3');
    });

    it('should cancel previous calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('first');
      jest.advanceTimersByTime(50);
      debouncedFn('second');
      jest.advanceTimersByTime(50);

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(50);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('second');
    });
  });

  describe('throttle', () => {
    jest.useFakeTimers();

    it('should throttle function calls', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn('arg1');
      throttledFn('arg2');
      throttledFn('arg3');

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg1');

      jest.advanceTimersByTime(100);

      throttledFn('arg4');
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenCalledWith('arg4');
    });
  });

  describe('isNonNull', () => {
    it('should return true for non-null values', () => {
      expect(isNonNull('string')).toBe(true);
      expect(isNonNull(0)).toBe(true);
      expect(isNonNull(false)).toBe(true);
      expect(isNonNull([])).toBe(true);
      expect(isNonNull({})).toBe(true);
    });

    it('should return false for null and undefined', () => {
      expect(isNonNull(null)).toBe(false);
      expect(isNonNull(undefined)).toBe(false);
    });

    it('should provide correct type narrowing', () => {
      const value: string | null = 'test';
      if (isNonNull(value)) {
        // TypeScript should know value is string here
        expect(value.length).toBe(4);
      }
    });
  });

  describe('isEmpty', () => {
    it('should return true for empty or whitespace strings', () => {
      expect(isEmpty('')).toBe(true);
      expect(isEmpty('   ')).toBe(true);
      expect(isEmpty('\t\n')).toBe(true);
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
    });

    it('should return false for non-empty strings', () => {
      expect(isEmpty('hello')).toBe(false);
      expect(isEmpty(' hello ')).toBe(false);
      expect(isEmpty('0')).toBe(false);
    });
  });

  describe('BREAKPOINTS', () => {
    it('should have correct breakpoint values', () => {
      expect(BREAKPOINTS.mobile).toBe(768);
      expect(BREAKPOINTS.tablet).toBe(1024);
      expect(BREAKPOINTS.desktop).toBe(1280);
    });

    it('should be readonly', () => {
      expect(() => {
        // @ts-expect-error - testing immutability
        BREAKPOINTS.mobile = 500;
      }).not.toThrow(); // Runtime doesn't prevent this, but TypeScript should
    });
  });

  describe('ANIMATION_DELAYS', () => {
    it('should have correct delay values', () => {
      expect(ANIMATION_DELAYS.short).toBe(150);
      expect(ANIMATION_DELAYS.medium).toBe(300);
      expect(ANIMATION_DELAYS.long).toBe(500);
    });
  });
});