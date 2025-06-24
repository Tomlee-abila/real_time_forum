import { describe, it, expect, vi, beforeEach } from 'vitest';
import tmdbService from '../../services/tmdbService.js';
import { tmdbApi } from '../../services/api.js';

// Mock the API
vi.mock('../../services/api.js', () => ({
  tmdbApi: {
    get: vi.fn(),
  },
  config: {
    tmdb: {
      imageBaseURL: 'https://image.tmdb.org/t/p',
    },
  },
}));

describe('TMDBService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tmdbService.clearCache();
  });

  describe('Image URL helpers', () => {
    it('should generate correct poster URL', () => {
      const posterPath = '/test-poster.jpg';
      const url = tmdbService.getPosterUrl(posterPath);
      expect(url).toBe('https://image.tmdb.org/t/p/w500/test-poster.jpg');
    });

    it('should generate correct backdrop URL', () => {
      const backdropPath = '/test-backdrop.jpg';
      const url = tmdbService.getBackdropUrl(backdropPath);
      expect(url).toBe('https://image.tmdb.org/t/p/w1280/test-backdrop.jpg');
    });

    it('should return null for empty path', () => {
      expect(tmdbService.getPosterUrl(null)).toBeNull();
      expect(tmdbService.getPosterUrl('')).toBeNull();
    });
  });

  describe('Search methods', () => {
    it('should search movies successfully', async () => {
      const mockResponse = {
        data: {
          results: [
            { id: 1, title: 'Test Movie', media_type: 'movie' }
          ],
          total_pages: 1,
          total_results: 1,
        },
      };

      tmdbApi.get.mockResolvedValue(mockResponse);

      const result = await tmdbService.searchMovies('test query');
      
      expect(tmdbApi.get).toHaveBeenCalledWith('/search/movie', {
        params: {
          query: 'test query',
          page: 1,
          include_adult: false,
        },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should search TV shows successfully', async () => {
      const mockResponse = {
        data: {
          results: [
            { id: 1, name: 'Test TV Show', media_type: 'tv' }
          ],
          total_pages: 1,
          total_results: 1,
        },
      };

      tmdbApi.get.mockResolvedValue(mockResponse);

      const result = await tmdbService.searchTVShows('test query');
      
      expect(tmdbApi.get).toHaveBeenCalledWith('/search/tv', {
        params: {
          query: 'test query',
          page: 1,
          include_adult: false,
        },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should search multi successfully', async () => {
      const mockResponse = {
        data: {
          results: [
            { id: 1, title: 'Test Movie', media_type: 'movie' },
            { id: 2, name: 'Test TV Show', media_type: 'tv' },
          ],
          total_pages: 1,
          total_results: 2,
        },
      };

      tmdbApi.get.mockResolvedValue(mockResponse);

      const result = await tmdbService.searchMulti('test query');
      
      expect(tmdbApi.get).toHaveBeenCalledWith('/search/multi', {
        params: {
          query: 'test query',
          page: 1,
          include_adult: false,
        },
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('Trending methods', () => {
    it('should get trending content', async () => {
      const mockResponse = {
        data: {
          results: [
            { id: 1, title: 'Trending Movie', media_type: 'movie' }
          ],
        },
      };

      tmdbApi.get.mockResolvedValue(mockResponse);

      const result = await tmdbService.getTrending('movie', 'week');
      
      expect(tmdbApi.get).toHaveBeenCalledWith('/trending/movie/week', {
        params: {},
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('Caching', () => {
    it('should cache API responses', async () => {
      const mockResponse = {
        data: { results: [{ id: 1, title: 'Test Movie' }] },
      };

      tmdbApi.get.mockResolvedValue(mockResponse);

      // First call
      await tmdbService.searchMovies('test');
      expect(tmdbApi.get).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await tmdbService.searchMovies('test');
      expect(tmdbApi.get).toHaveBeenCalledTimes(1);
    });

    it('should clear cache', () => {
      tmdbService.setCache('test-key', { data: 'test' });
      expect(tmdbService.getFromCache('test-key')).toBeTruthy();
      
      tmdbService.clearCache();
      expect(tmdbService.getFromCache('test-key')).toBeNull();
    });
  });

  describe('Error handling', () => {
    it('should handle API errors', async () => {
      const error = new Error('API Error');
      tmdbApi.get.mockRejectedValue(error);

      await expect(tmdbService.searchMovies('test')).rejects.toThrow('API Error');
    });
  });
});
