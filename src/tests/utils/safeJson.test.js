import { describe, it, expect } from 'vitest';
import { safeStringify, safeParse, cleanForSerialization, createSafeWatchlistItem } from '../../utils/safeJson';

describe('safeJson utilities', () => {
  describe('safeStringify', () => {
    it('should handle normal objects', () => {
      const obj = { name: 'Test', value: 123 };
      const result = safeStringify(obj);
      expect(result).toBe('{"name":"Test","value":123}');
    });

    it('should handle circular references', () => {
      const obj = { name: 'Test' };
      obj.self = obj; // Create circular reference
      
      const result = safeStringify(obj);
      expect(result).toContain('"name":"Test"');
      expect(result).toContain('[Circular Reference]');
    });

    it('should skip functions', () => {
      const obj = { 
        name: 'Test', 
        func: () => 'hello',
        value: 123 
      };
      
      const result = safeStringify(obj);
      expect(result).toBe('{"name":"Test","value":123}');
    });

    it('should skip React fiber properties', () => {
      const obj = {
        name: 'Test',
        __reactFiber$abc123: 'should be skipped',
        __reactInternalInstance: 'should be skipped',
        value: 123
      };
      
      const result = safeStringify(obj);
      expect(result).toBe('{"name":"Test","value":123}');
    });

    it('should skip undefined values', () => {
      const obj = {
        name: 'Test',
        undefinedValue: undefined,
        value: 123
      };
      
      const result = safeStringify(obj);
      expect(result).toBe('{"name":"Test","value":123}');
    });
  });

  describe('safeParse', () => {
    it('should parse valid JSON', () => {
      const jsonString = '{"name":"Test","value":123}';
      const result = safeParse(jsonString);
      expect(result).toEqual({ name: 'Test', value: 123 });
    });

    it('should return fallback for invalid JSON', () => {
      const invalidJson = '{"name":"Test",invalid}';
      const fallback = { error: true };
      const result = safeParse(invalidJson, fallback);
      expect(result).toEqual(fallback);
    });

    it('should return null as default fallback', () => {
      const invalidJson = '{"name":"Test",invalid}';
      const result = safeParse(invalidJson);
      expect(result).toBeNull();
    });
  });

  describe('createSafeWatchlistItem', () => {
    it('should create a safe watchlist item from movie data', () => {
      const movieItem = {
        id: 123,
        title: 'Test Movie',
        poster_path: '/test.jpg',
        media_type: 'movie',
        release_date: '2023-01-01',
        vote_average: 8.5,
        overview: 'A test movie',
        // These should be filtered out
        __reactFiber$abc: 'should be removed',
        someFunction: () => 'test',
        domElement: document.createElement('div')
      };

      const result = createSafeWatchlistItem(movieItem);
      
      expect(result).toEqual({
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
    });

    it('should create a safe watchlist item from TV show data', () => {
      const tvItem = {
        id: 456,
        name: 'Test TV Show',
        poster_path: '/test-tv.jpg',
        first_air_date: '2023-01-01',
        vote_average: 7.8,
        overview: 'A test TV show'
      };

      const result = createSafeWatchlistItem(tvItem);
      
      expect(result).toEqual({
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

    it('should handle missing or invalid data', () => {
      const invalidItem = {
        id: 'not-a-number',
        // missing title/name
        vote_average: 'not-a-number'
      };

      const result = createSafeWatchlistItem(invalidItem);
      
      expect(result).toEqual({
        id: expect.any(Number),
        title: 'Unknown Title',
        poster_path: null,
        poster_url: null,
        media_type: 'tv',
        release_date: null,
        vote_average: 0,
        overview: null,
        watched: false,
        added_at: expect.any(String)
      });
    });
  });

  describe('cleanForSerialization', () => {
    it('should clean objects with React properties', () => {
      const obj = {
        name: 'Test',
        __reactFiber$abc: 'should be removed',
        _reactInternalFiber: 'should be removed',
        _owner: 'should be removed',
        _store: 'should be removed',
        ref: 'should be removed',
        key: 'should be removed',
        value: 123,
        func: () => 'should be removed'
      };

      const result = cleanForSerialization(obj);
      
      expect(result).toEqual({
        name: 'Test',
        value: 123
      });
    });

    it('should handle nested objects', () => {
      const obj = {
        name: 'Test',
        nested: {
          value: 456,
          __reactFiber$abc: 'should be removed',
          func: () => 'should be removed'
        }
      };

      const result = cleanForSerialization(obj);
      
      expect(result).toEqual({
        name: 'Test',
        nested: {
          value: 456
        }
      });
    });

    it('should handle arrays', () => {
      const arr = [
        { name: 'Item 1', __reactFiber$abc: 'should be removed' },
        { name: 'Item 2', value: 123 }
      ];

      const result = cleanForSerialization(arr);
      
      expect(result).toEqual([
        { name: 'Item 1' },
        { name: 'Item 2', value: 123 }
      ]);
    });
  });
});
