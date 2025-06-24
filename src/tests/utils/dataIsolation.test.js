import { describe, it, expect, beforeEach } from 'vitest';
import { 
  createIsolatedCopy,
  createSafeWatchlistItem,
  createSafeContentItem,
  deepIsolate,
  validateSafeForSerialization
} from '../../utils/dataIsolation';

describe('dataIsolation utilities', () => {
  describe('createIsolatedCopy', () => {
    it('should handle null and undefined', () => {
      expect(createIsolatedCopy(null)).toBe(null);
      expect(createIsolatedCopy(undefined)).toBe(undefined);
    });

    it('should handle primitives', () => {
      expect(createIsolatedCopy('string')).toBe('string');
      expect(createIsolatedCopy(123)).toBe(123);
      expect(createIsolatedCopy(true)).toBe(true);
    });

    it('should handle arrays', () => {
      const arr = [1, 'test', { value: 42 }];
      const result = createIsolatedCopy(arr);
      
      expect(result).toEqual([1, 'test', { value: 42 }]);
      expect(result).not.toBe(arr); // Should be a new array
    });

    it('should handle dates', () => {
      const date = new Date('2023-01-01');
      const result = createIsolatedCopy(date);
      
      expect(result).toEqual(date);
      expect(result).not.toBe(date); // Should be a new date object
    });

    it('should filter out React properties', () => {
      const obj = {
        name: 'test',
        value: 123,
        __reactFiber$abc: 'should be removed',
        _reactInternalFiber: 'should be removed',
        ref: 'should be removed',
        key: 'should be removed',
        _owner: 'should be removed',
        _store: 'should be removed'
      };

      const result = createIsolatedCopy(obj);
      
      expect(result).toEqual({
        name: 'test',
        value: 123
      });
    });

    it('should handle nested objects', () => {
      const obj = {
        name: 'test',
        nested: {
          value: 456,
          __reactFiber$abc: 'should be removed'
        },
        array: [1, { inner: 'value' }]
      };

      const result = createIsolatedCopy(obj);
      
      expect(result).toEqual({
        name: 'test',
        nested: {
          value: 456
        },
        array: [1, { inner: 'value' }]
      });
    });

    it('should handle objects with inaccessible properties', () => {
      const obj = {};
      
      // Create a property that throws when accessed
      Object.defineProperty(obj, 'problematic', {
        get() {
          throw new Error('Cannot access this property');
        },
        enumerable: true
      });
      
      obj.safe = 'value';
      
      const result = createIsolatedCopy(obj);
      
      expect(result).toEqual({
        safe: 'value'
      });
    });
  });

  describe('createSafeWatchlistItem', () => {
    it('should create safe watchlist item from movie data', () => {
      const movieItem = {
        id: 123,
        title: 'Test Movie',
        poster_path: '/test.jpg',
        media_type: 'movie',
        release_date: '2023-01-01',
        vote_average: 8.5,
        overview: 'A test movie',
        __reactFiber$abc: 'should be removed'
      };

      const result = createSafeWatchlistItem(movieItem);
      
      expect(result).toMatchObject({
        id: 123,
        title: 'Test Movie',
        poster_path: '/test.jpg',
        poster_url: null,
        media_type: 'movie',
        release_date: '2023-01-01',
        vote_average: 8.5,
        overview: 'A test movie',
        watched: false,
        added_at: expect.any(String)
      });
      
      expect(result).not.toHaveProperty('__reactFiber$abc');
    });

    it('should create safe watchlist item from TV show data', () => {
      const tvItem = {
        id: 456,
        name: 'Test TV Show',
        poster_path: '/test-tv.jpg',
        first_air_date: '2023-01-01',
        vote_average: 7.8,
        overview: 'A test TV show'
      };

      const result = createSafeWatchlistItem(tvItem);
      
      expect(result).toMatchObject({
        id: 456,
        title: 'Test TV Show',
        poster_path: '/test-tv.jpg',
        poster_url: null,
        media_type: 'tv',
        release_date: '2023-01-01',
        vote_average: 7.8,
        overview: 'A test TV show',
        watched: false,
        added_at: expect.any(String)
      });
    });

    it('should handle invalid or missing data', () => {
      const invalidItem = {
        id: 'not-a-number',
        vote_average: 'not-a-number'
      };

      const result = createSafeWatchlistItem(invalidItem);

      expect(result).toMatchObject({
        id: null, // Will be null since 'not-a-number' is not a valid number
        title: null,
        poster_path: null,
        poster_url: null,
        media_type: null,
        release_date: null,
        vote_average: null,
        overview: null,
        watched: false,
        added_at: expect.any(String)
      });
    });

    it('should handle completely invalid input', () => {
      const result = createSafeWatchlistItem(null);
      
      expect(result).toMatchObject({
        id: null,
        title: null,
        poster_path: null,
        poster_url: null,
        media_type: null,
        release_date: null,
        vote_average: null,
        overview: null,
        watched: false,
        added_at: expect.any(String)
      });
    });

    it('should limit string lengths', () => {
      const longItem = {
        id: 123,
        title: 'A'.repeat(1000),
        overview: 'B'.repeat(5000),
        poster_path: 'C'.repeat(500)
      };

      const result = createSafeWatchlistItem(longItem);
      
      expect(result.title.length).toBeLessThanOrEqual(500);
      expect(result.overview.length).toBeLessThanOrEqual(2000);
      expect(result.poster_path.length).toBeLessThanOrEqual(200);
    });

    it('should return fallback item on error', () => {
      // Create an object that throws when properties are accessed
      const problematicItem = {};
      Object.defineProperty(problematicItem, 'id', {
        get() {
          throw new Error('Cannot access id');
        },
        enumerable: true
      });

      const result = createSafeWatchlistItem(problematicItem);
      
      expect(result).toMatchObject({
        id: expect.any(Number),
        title: 'Unknown Title',
        poster_path: null,
        poster_url: null,
        media_type: 'movie',
        release_date: null,
        vote_average: 0,
        overview: null,
        watched: false,
        added_at: expect.any(String)
      });
    });
  });

  describe('createSafeContentItem', () => {
    it('should create safe content item', () => {
      const item = {
        id: 123,
        title: 'Test Movie',
        media_type: 'movie',
        __reactFiber$abc: 'should be removed'
      };

      const result = createSafeContentItem(item);
      
      expect(result).toEqual({
        id: 123,
        title: 'Test Movie',
        media_type: 'movie'
      });
    });

    it('should handle TV shows', () => {
      const item = {
        id: 456,
        name: 'Test TV Show'
      };

      const result = createSafeContentItem(item);
      
      expect(result).toEqual({
        id: 456,
        title: 'Test TV Show',
        media_type: 'tv'
      });
    });

    it('should return null for invalid input', () => {
      expect(createSafeContentItem(null)).toBe(null);
      expect(createSafeContentItem(undefined)).toBe(null);
      expect(createSafeContentItem('string')).toBe(null);
    });

    it('should limit string lengths', () => {
      const item = {
        id: 123,
        title: 'A'.repeat(500),
        media_type: 'B'.repeat(50)
      };

      const result = createSafeContentItem(item);
      
      expect(result.title.length).toBeLessThanOrEqual(200);
      expect(result.media_type.length).toBeLessThanOrEqual(20);
    });
  });

  describe('deepIsolate', () => {
    it('should isolate objects using JSON round-trip', () => {
      const obj = {
        name: 'test',
        value: 123,
        nested: {
          inner: 'value'
        }
      };

      const result = deepIsolate(obj);
      
      expect(result).toEqual(obj);
      expect(result).not.toBe(obj);
      expect(result.nested).not.toBe(obj.nested);
    });

    it('should filter out non-serializable values', () => {
      const obj = {
        name: 'test',
        func: () => 'function',
        date: new Date('2023-01-01'), // Use fixed date for consistent testing
        nested: {
          value: 123
        }
      };

      const result = deepIsolate(obj);

      expect(result).toEqual({
        name: 'test',
        nested: {
          value: 123
        }
      });
    });

    it('should fallback to createIsolatedCopy on JSON error', () => {
      const obj = { name: 'test' };
      obj.circular = obj; // Create circular reference

      // This should not throw and should return a clean object
      expect(() => {
        const result = deepIsolate(obj);
        expect(result).toEqual({
          name: 'test'
        });
      }).not.toThrow();
    });
  });

  describe('validateSafeForSerialization', () => {
    it('should return true for safe objects', () => {
      const safeObj = {
        name: 'test',
        value: 123,
        nested: {
          inner: 'value'
        }
      };

      expect(validateSafeForSerialization(safeObj)).toBe(true);
    });

    it('should return false for circular references', () => {
      const obj = { name: 'test' };
      obj.circular = obj;

      expect(validateSafeForSerialization(obj)).toBe(false);
    });

    it('should re-throw non-circular errors', () => {
      // Mock JSON.stringify to throw a non-circular error
      const originalStringify = JSON.stringify;
      JSON.stringify = () => {
        throw new Error('Some other error');
      };

      expect(() => {
        validateSafeForSerialization({ test: 'value' });
      }).toThrow('Some other error');

      // Restore original
      JSON.stringify = originalStringify;
    });
  });
});
