import { tmdbApi, config } from './api.js';

class TMDBService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Cache management
  getCacheKey(endpoint, params) {
    return `${endpoint}_${JSON.stringify(params)}`;
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  // Image URL helpers
  getImageUrl(path, size = 'w500') {
    if (!path) return null;
    return `${config.tmdb.imageBaseURL}/${size}${path}`;
  }

  getPosterUrl(path) {
    return this.getImageUrl(path, 'w500');
  }

  getBackdropUrl(path) {
    return this.getImageUrl(path, 'w1280');
  }

  // API methods
  async makeRequest(endpoint, params = {}) {
    const cacheKey = this.getCacheKey(endpoint, params);
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await tmdbApi.get(endpoint, { params });
      const data = response.data;
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`TMDB API Error for ${endpoint}:`, error);
      throw error;
    }
  }

  // Search methods
  async searchMovies(query, page = 1) {
    return this.makeRequest('/search/movie', {
      query,
      page,
      include_adult: false,
    });
  }

  async searchTVShows(query, page = 1) {
    return this.makeRequest('/search/tv', {
      query,
      page,
      include_adult: false,
    });
  }

  async searchMulti(query, page = 1) {
    return this.makeRequest('/search/multi', {
      query,
      page,
      include_adult: false,
    });
  }

  // Trending content
  async getTrending(mediaType = 'all', timeWindow = 'day') {
    return this.makeRequest(`/trending/${mediaType}/${timeWindow}`);
  }

  async getTrendingMovies(timeWindow = 'day') {
    return this.makeRequest(`/trending/movie/${timeWindow}`);
  }

  async getTrendingTVShows(timeWindow = 'day') {
    return this.makeRequest(`/trending/tv/${timeWindow}`);
  }

  // Popular content
  async getPopularMovies(page = 1) {
    return this.makeRequest('/movie/popular', { page });
  }

  async getPopularTVShows(page = 1) {
    return this.makeRequest('/tv/popular', { page });
  }

  // Top rated content
  async getTopRatedMovies(page = 1) {
    return this.makeRequest('/movie/top_rated', { page });
  }

  async getTopRatedTVShows(page = 1) {
    return this.makeRequest('/tv/top_rated', { page });
  }

  // Detailed information
  async getMovieDetails(movieId) {
    return this.makeRequest(`/movie/${movieId}`, {
      append_to_response: 'credits,videos,reviews,similar,recommendations',
    });
  }

  async getTVShowDetails(tvId) {
    return this.makeRequest(`/tv/${tvId}`, {
      append_to_response: 'credits,videos,reviews,similar,recommendations',
    });
  }

  // Genres
  async getMovieGenres() {
    return this.makeRequest('/genre/movie/list');
  }

  async getTVGenres() {
    return this.makeRequest('/genre/tv/list');
  }

  // Discover content by genre
  async discoverMovies(params = {}) {
    return this.makeRequest('/discover/movie', {
      sort_by: 'popularity.desc',
      include_adult: false,
      ...params,
    });
  }

  async discoverTVShows(params = {}) {
    return this.makeRequest('/discover/tv', {
      sort_by: 'popularity.desc',
      include_adult: false,
      ...params,
    });
  }

  // Person details
  async getPersonDetails(personId) {
    return this.makeRequest(`/person/${personId}`, {
      append_to_response: 'movie_credits,tv_credits',
    });
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

export default new TMDBService();
