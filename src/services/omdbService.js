import { omdbApi } from './api.js';

class OMDBService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
  }

  // Cache management
  getCacheKey(params) {
    return JSON.stringify(params);
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

  // API methods
  async makeRequest(params = {}) {
    const cacheKey = this.getCacheKey(params);
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await omdbApi.get('/', { params });
      const data = response.data;
      
      if (data.Response === 'False') {
        throw new Error(data.Error || 'Content not found');
      }
      
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('OMDB API Error:', error);
      throw error;
    }
  }

  // Search by title
  async searchByTitle(title, year = null, type = null) {
    const params = { t: title };
    if (year) params.y = year;
    if (type) params.type = type; // movie, series, episode
    
    return this.makeRequest(params);
  }

  // Search by IMDB ID
  async searchByImdbId(imdbId) {
    return this.makeRequest({ i: imdbId });
  }

  // Search multiple results
  async search(query, page = 1, type = null) {
    const params = { s: query, page };
    if (type) params.type = type;
    
    return this.makeRequest(params);
  }

  // Get detailed plot
  async getDetailedPlot(titleOrImdbId, year = null) {
    const params = { plot: 'full' };
    
    if (titleOrImdbId.startsWith('tt')) {
      params.i = titleOrImdbId;
    } else {
      params.t = titleOrImdbId;
      if (year) params.y = year;
    }
    
    return this.makeRequest(params);
  }

  // Helper method to extract ratings
  extractRatings(omdbData) {
    const ratings = {
      imdb: null,
      rottenTomatoes: null,
      metacritic: null,
    };

    if (omdbData.imdbRating && omdbData.imdbRating !== 'N/A') {
      ratings.imdb = {
        value: parseFloat(omdbData.imdbRating),
        votes: omdbData.imdbVotes,
      };
    }

    if (omdbData.Ratings) {
      omdbData.Ratings.forEach(rating => {
        if (rating.Source === 'Rotten Tomatoes') {
          ratings.rottenTomatoes = {
            value: parseInt(rating.Value.replace('%', '')),
            display: rating.Value,
          };
        } else if (rating.Source === 'Metacritic') {
          ratings.metacritic = {
            value: parseInt(rating.Value.split('/')[0]),
            display: rating.Value,
          };
        }
      });
    }

    return ratings;
  }

  // Helper method to normalize OMDB data
  normalizeData(omdbData) {
    return {
      title: omdbData.Title,
      year: omdbData.Year,
      rated: omdbData.Rated,
      released: omdbData.Released,
      runtime: omdbData.Runtime,
      genre: omdbData.Genre,
      director: omdbData.Director,
      writer: omdbData.Writer,
      actors: omdbData.Actors,
      plot: omdbData.Plot,
      language: omdbData.Language,
      country: omdbData.Country,
      awards: omdbData.Awards,
      poster: omdbData.Poster !== 'N/A' ? omdbData.Poster : null,
      ratings: this.extractRatings(omdbData),
      metascore: omdbData.Metascore !== 'N/A' ? omdbData.Metascore : null,
      imdbRating: omdbData.imdbRating !== 'N/A' ? omdbData.imdbRating : null,
      imdbVotes: omdbData.imdbVotes,
      imdbID: omdbData.imdbID,
      type: omdbData.Type,
      dvd: omdbData.DVD,
      boxOffice: omdbData.BoxOffice,
      production: omdbData.Production,
      website: omdbData.Website,
      totalSeasons: omdbData.totalSeasons,
    };
  }

  // Enhanced search with normalization
  async getEnhancedDetails(titleOrImdbId, year = null) {
    try {
      const data = await this.getDetailedPlot(titleOrImdbId, year);
      return this.normalizeData(data);
    } catch (error) {
      console.warn('OMDB enhanced details failed:', error.message);
      return null;
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

export default new OMDBService();
