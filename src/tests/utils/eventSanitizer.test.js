import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  sanitizeEventHandler,
  createSafeEventHandler,
  wrapComponentEventHandlers,
  emergencyDataIsolation
} from '../../utils/eventSanitizer';

describe('eventSanitizer utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sanitizeEventHandler', () => {
    it('should return non-function handlers unchanged', () => {
      expect(sanitizeEventHandler(null)).toBe(null);
      expect(sanitizeEventHandler(undefined)).toBe(undefined);
      expect(sanitizeEventHandler('string')).toBe('string');
    });

    it('should wrap function handlers with sanitization', () => {
      const originalHandler = vi.fn();
      const sanitizedHandler = sanitizeEventHandler(originalHandler);
      
      expect(typeof sanitizedHandler).toBe('function');
      expect(sanitizedHandler).not.toBe(originalHandler);
    });

    it('should sanitize arguments passed to handler', () => {
      const originalHandler = vi.fn();
      const sanitizedHandler = sanitizeEventHandler(originalHandler);
      
      const mockEvent = {
        type: 'click',
        target: { tagName: 'BUTTON' },
        nativeEvent: { type: 'click' }
      };
      
      sanitizedHandler(mockEvent);
      
      expect(originalHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'click',
          preventDefault: expect.any(Function),
          stopPropagation: expect.any(Function)
        })
      );
    });

    it('should handle errors in sanitized handlers', () => {
      const errorHandler = vi.fn(() => {
        throw new Error('Handler error');
      });
      const sanitizedHandler = sanitizeEventHandler(errorHandler);
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => sanitizedHandler()).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('createSafeEventHandler', () => {
    it('should create a handler that prevents default and stops propagation', () => {
      const handler = vi.fn();
      const safeHandler = createSafeEventHandler(handler);
      
      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn()
      };
      
      safeHandler(mockEvent);
      
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(handler).toHaveBeenCalled();
    });

    it('should use data extractor when provided', () => {
      const handler = vi.fn();
      const dataExtractor = vi.fn(() => ({ safe: 'data' }));
      const safeHandler = createSafeEventHandler(handler, dataExtractor);
      
      safeHandler({});
      
      expect(dataExtractor).toHaveBeenCalled();
      expect(handler).toHaveBeenCalledWith({ safe: 'data' });
    });

    it('should handle data extractor errors', () => {
      const handler = vi.fn();
      const errorExtractor = vi.fn(() => {
        throw new Error('Extractor error');
      });
      const safeHandler = createSafeEventHandler(handler, errorExtractor);
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      safeHandler({});
      
      expect(handler).toHaveBeenCalledWith(); // Called with no arguments
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should handle events without preventDefault/stopPropagation', () => {
      const handler = vi.fn();
      const safeHandler = createSafeEventHandler(handler);
      
      expect(() => safeHandler({})).not.toThrow();
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('wrapComponentEventHandlers', () => {
    it('should return non-object components unchanged', () => {
      expect(wrapComponentEventHandlers(null)).toBe(null);
      expect(wrapComponentEventHandlers('string')).toBe('string');
    });

    it('should wrap event handler properties', () => {
      const component = {
        onClick: vi.fn(),
        onMouseDown: vi.fn(),
        nonEventProp: 'value',
        onInvalidHandler: 'not a function'
      };
      
      const wrapped = wrapComponentEventHandlers(component);
      
      expect(wrapped.onClick).not.toBe(component.onClick);
      expect(wrapped.onMouseDown).not.toBe(component.onMouseDown);
      expect(wrapped.nonEventProp).toBe('value');
      expect(wrapped.onInvalidHandler).toBe('not a function');
    });

    it('should preserve non-event properties', () => {
      const component = {
        onClick: vi.fn(),
        title: 'Test Component',
        data: { value: 123 }
      };
      
      const wrapped = wrapComponentEventHandlers(component);
      
      expect(wrapped.title).toBe('Test Component');
      expect(wrapped.data).toEqual({ value: 123 });
    });
  });

  describe('emergencyDataIsolation', () => {
    it('should handle primitives', () => {
      expect(emergencyDataIsolation('string')).toBe('string');
      expect(emergencyDataIsolation(123)).toBe(123);
      expect(emergencyDataIsolation(true)).toBe(true);
      expect(emergencyDataIsolation(null)).toBe(null);
    });

    it('should isolate arrays', () => {
      const arr = [
        { id: 1, title: 'Test', unwanted: 'property' },
        { id: 2, name: 'Test 2', unwanted: 'property' }
      ];
      
      const result = emergencyDataIsolation(arr);
      
      expect(result).toEqual([
        { id: 1, title: 'Test' },
        { id: 2, title: 'Test 2' }
      ]);
    });

    it('should only keep safe properties', () => {
      const obj = {
        id: 123,
        title: 'Test Movie',
        poster_path: '/test.jpg',
        media_type: 'movie',
        release_date: '2023-01-01',
        vote_average: 8.5,
        overview: 'Test overview',
        watched: false,
        added_at: '2023-01-01T00:00:00Z',
        // Unsafe properties
        __reactFiber$abc: 'should be removed',
        domElement: document.createElement('div'),
        func: () => 'function',
        circular: {}
      };
      
      obj.circular.self = obj.circular; // Create circular reference
      
      const result = emergencyDataIsolation(obj);
      
      expect(result).toEqual({
        id: 123,
        title: 'Test Movie',
        poster_path: '/test.jpg',
        media_type: 'movie',
        release_date: '2023-01-01',
        vote_average: 8.5,
        overview: 'Test overview',
        watched: false,
        added_at: '2023-01-01T00:00:00Z'
      });
    });

    it('should handle TV show data', () => {
      const tvShow = {
        id: 456,
        name: 'Test TV Show',
        first_air_date: '2023-01-01',
        vote_average: 7.8,
        unwanted: 'property'
      };
      
      const result = emergencyDataIsolation(tvShow);
      
      expect(result).toEqual({
        id: 456,
        title: 'Test TV Show', // name becomes title
        first_air_date: '2023-01-01',
        vote_average: 7.8
      });
    });

    it('should handle objects without safe properties', () => {
      const obj = {
        unwanted1: 'value1',
        unwanted2: 'value2',
        func: () => 'function'
      };
      
      const result = emergencyDataIsolation(obj);
      
      expect(result).toEqual({});
    });

    it('should handle nested objects by flattening them', () => {
      const obj = {
        id: 123,
        title: 'Test',
        nested: {
          id: 456,
          title: 'Nested'
        }
      };
      
      const result = emergencyDataIsolation(obj);
      
      expect(result).toEqual({
        id: 123,
        title: 'Test'
      });
    });

    it('should handle objects with non-primitive safe values', () => {
      const obj = {
        id: 123,
        title: { toString: () => 'Complex Title' }, // Non-string title
        vote_average: '8.5', // String number
        watched: 'true' // String boolean
      };
      
      const result = emergencyDataIsolation(obj);
      
      expect(result).toEqual({
        id: 123,
        vote_average: '8.5',
        watched: 'true'
      });
    });
  });

  describe('DOM element detection', () => {
    it('should detect DOM elements in sanitization', () => {
      const handler = vi.fn();
      const sanitizedHandler = sanitizeEventHandler(handler);
      
      const domElement = document.createElement('div');
      const mockEvent = {
        type: 'click',
        target: domElement
      };
      
      sanitizedHandler(mockEvent);
      
      // Should be called with sanitized event, not original
      expect(handler).toHaveBeenCalledWith(
        expect.not.objectContaining({
          target: domElement
        })
      );
    });
  });

  describe('React fiber property detection', () => {
    it('should filter out React fiber properties', () => {
      const obj = {
        id: 123,
        title: 'Test',
        __reactFiber$abc123: 'should be removed',
        _reactInternalFiber: 'should be removed',
        ref: 'should be removed',
        key: 'should be removed',
        _owner: 'should be removed',
        _store: 'should be removed'
      };
      
      const result = emergencyDataIsolation(obj);
      
      expect(result).toEqual({
        id: 123,
        title: 'Test'
      });
    });
  });
});
