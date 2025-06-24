import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  handleCircularStructureError, 
  safeStringifyWithErrorHandling,
  resetCircularErrorCount,
  getCircularErrorCount
} from '../../utils/errorHandler';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

describe('errorHandler utilities', () => {
  beforeEach(() => {
    resetCircularErrorCount();
    localStorageMock.removeItem.mockClear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetCircularErrorCount();
  });

  describe('handleCircularStructureError', () => {
    it('should detect circular structure errors', () => {
      const circularError = new Error('Converting circular structure to JSON');
      const result = handleCircularStructureError(circularError, 'test');
      
      expect(result).toBe(true);
      expect(getCircularErrorCount()).toBe(1);
    });

    it('should not detect non-circular errors', () => {
      const normalError = new Error('Some other error');
      const result = handleCircularStructureError(normalError, 'test');
      
      expect(result).toBe(false);
      expect(getCircularErrorCount()).toBe(0);
    });

    it('should clear localStorage after too many circular errors', () => {
      const circularError = new Error('Converting circular structure to JSON');
      
      // Trigger 5 circular errors
      for (let i = 0; i < 5; i++) {
        handleCircularStructureError(circularError, 'test');
      }
      
      expect(getCircularErrorCount()).toBe(0); // Should reset after clearing
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('entertainment-watchlist');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('entertainment-preferences');
    });

    it('should handle different circular error message formats', () => {
      const error1 = new Error('Converting circular structure to JSON --> starting at object');
      const error2 = new Error('TypeError: Converting circular structure to JSON');
      
      expect(handleCircularStructureError(error1, 'test1')).toBe(true);
      expect(handleCircularStructureError(error2, 'test2')).toBe(true);
      expect(getCircularErrorCount()).toBe(2);
    });
  });

  describe('safeStringifyWithErrorHandling', () => {
    it('should stringify normal objects', () => {
      const obj = { name: 'test', value: 123 };
      const result = safeStringifyWithErrorHandling(obj, 'test');
      
      expect(result).toBe('{"name":"test","value":123}');
    });

    it('should handle circular references gracefully', () => {
      const obj = { name: 'test' };
      obj.self = obj; // Create circular reference
      
      const result = safeStringifyWithErrorHandling(obj, 'test');
      
      expect(result).toContain('Circular structure detected');
      expect(result).toContain('test');
      expect(getCircularErrorCount()).toBe(1);
    });

    it('should return null for completely broken objects', () => {
      // Mock JSON.stringify to always throw
      const originalStringify = JSON.stringify;
      JSON.stringify = vi.fn(() => {
        throw new Error('Converting circular structure to JSON');
      });
      
      // Also mock the fallback stringify to fail
      JSON.stringify.mockImplementationOnce(() => {
        throw new Error('Converting circular structure to JSON');
      }).mockImplementationOnce(() => {
        throw new Error('Even fallback failed');
      });
      
      const obj = { test: 'value' };
      const result = safeStringifyWithErrorHandling(obj, 'test');
      
      expect(result).toBeNull();
      
      // Restore original
      JSON.stringify = originalStringify;
    });

    it('should re-throw non-circular errors', () => {
      // Mock JSON.stringify to throw a non-circular error
      const originalStringify = JSON.stringify;
      JSON.stringify = vi.fn(() => {
        throw new Error('Some other error');
      });
      
      const obj = { test: 'value' };
      
      expect(() => {
        safeStringifyWithErrorHandling(obj, 'test');
      }).toThrow('Some other error');
      
      // Restore original
      JSON.stringify = originalStringify;
    });
  });

  describe('resetCircularErrorCount', () => {
    it('should reset the error count', () => {
      const circularError = new Error('Converting circular structure to JSON');
      
      // Generate some errors
      handleCircularStructureError(circularError, 'test');
      handleCircularStructureError(circularError, 'test');
      expect(getCircularErrorCount()).toBe(2);
      
      // Reset
      resetCircularErrorCount();
      expect(getCircularErrorCount()).toBe(0);
    });
  });

  describe('getCircularErrorCount', () => {
    it('should return the current error count', () => {
      expect(getCircularErrorCount()).toBe(0);
      
      const circularError = new Error('Converting circular structure to JSON');
      handleCircularStructureError(circularError, 'test');
      
      expect(getCircularErrorCount()).toBe(1);
    });
  });

  describe('error tracking and localStorage clearing', () => {
    it('should track errors across multiple contexts', () => {
      const circularError = new Error('Converting circular structure to JSON');
      
      handleCircularStructureError(circularError, 'context1');
      handleCircularStructureError(circularError, 'context2');
      handleCircularStructureError(circularError, 'context3');
      
      expect(getCircularErrorCount()).toBe(3);
    });

    it('should handle localStorage clearing errors gracefully', () => {
      const circularError = new Error('Converting circular structure to JSON');
      
      // Mock localStorage.removeItem to throw an error
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      // Mock console.error to avoid noise in test output
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Trigger enough errors to cause localStorage clearing
      for (let i = 0; i < 5; i++) {
        handleCircularStructureError(circularError, 'test');
      }
      
      // Should have attempted to clear localStorage despite the error
      expect(localStorageMock.removeItem).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to clear localStorage:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });
});
