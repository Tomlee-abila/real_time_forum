import tmdbService from './tmdbService.js';

class EntertainmentService {
  constructor() {
    this.tmdb = tmdbService;
  }

  // Search functionality using TMDB
  async search(query, page = 1) {
    try {
      const tmdbResults = await this.tmdb.searchMulti(query, page);

      // Add poster and backdrop URLs to results
      tmdbResults.results = tmdbResults.results.map(item => ({
        ...item,
        poster_url: this.tmdb.getPosterUrl(item.poster_path),
        backdrop_url: this.tmdb.getBackdropUrl(item.backdrop_path),
      }));

      return tmdbResults;
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  // Get detailed information from TMDB
  async getDetailedInfo(id, mediaType) {
    try {
      let tmdbData;

      if (mediaType === 'movie') {
        tmdbData = await this.tmdb.getMovieDetails(id);
      } else if (mediaType === 'tv') {
        tmdbData = await this.tmdb.getTVShowDetails(id);
      } else {
        throw new Error('Invalid media type');
      }

      return this.enhanceData(tmdbData);
    } catch (error) {
      console.error('Get detailed info error:', error);
      throw error;
    }
  }

  // Enhance TMDB data with additional processing
  enhanceData(tmdbData) {
    return {
      ...tmdbData,
      poster_url: this.tmdb.getPosterUrl(tmdbData.poster_path),
      backdrop_url: this.tmdb.getBackdropUrl(tmdbData.backdrop_path),
      cast: tmdbData.credits?.cast?.slice(0, 10) || [],
      crew: tmdbData.credits?.crew || [],
      videos: tmdbData.videos?.results || [],
      similar: tmdbData.similar?.results || [],
      recommendations: tmdbData.recommendations?.results || [],
    };
  }

  // Trending content
  async getTrending(mediaType = 'all', timeWindow = 'day') {
    try {
      const trending = await this.tmdb.getTrending(mediaType, timeWindow);
      
      // Add poster URLs
      trending.results = trending.results.map(item => ({
        ...item,
        poster_url: this.tmdb.getPosterUrl(item.poster_path),
        backdrop_url: this.tmdb.getBackdropUrl(item.backdrop_path),
      }));

      return trending;
    } catch (error) {
      console.error('Get trending error:', error);
      throw error;
    }
  }

  // Popular content
  async getPopular(mediaType, page = 1) {
    try {
      let popular;
      
      if (mediaType === 'movie') {
        popular = await this.tmdb.getPopularMovies(page);
      } else if (mediaType === 'tv') {
        popular = await this.tmdb.getPopularTVShows(page);
      } else {
        throw new Error('Invalid media type');
      }

      // Add poster URLs
      popular.results = popular.results.map(item => ({
        ...item,
        poster_url: this.tmdb.getPosterUrl(item.poster_path),
        backdrop_url: this.tmdb.getBackdropUrl(item.backdrop_path),
      }));

      return popular;
    } catch (error) {
      console.error('Get popular error:', error);
      throw error;
    }
  }

  // Discover by genre
  async discoverByGenre(mediaType, genreId, page = 1) {
    try {
      let discovered;
      
      if (mediaType === 'movie') {
        discovered = await this.tmdb.discoverMovies({ with_genres: genreId, page });
      } else if (mediaType === 'tv') {
        discovered = await this.tmdb.discoverTVShows({ with_genres: genreId, page });
      } else {
        throw new Error('Invalid media type');
      }

      // Add poster URLs
      discovered.results = discovered.results.map(item => ({
        ...item,
        poster_url: this.tmdb.getPosterUrl(item.poster_path),
        backdrop_url: this.tmdb.getBackdropUrl(item.backdrop_path),
      }));

      return discovered;
    } catch (error) {
      console.error('Discover by genre error:', error);
      throw error;
    }
  }

  // Get genres
  async getGenres(mediaType) {
    try {
      if (mediaType === 'movie') {
        return await this.tmdb.getMovieGenres();
      } else if (mediaType === 'tv') {
        return await this.tmdb.getTVGenres();
      } else {
        throw new Error('Invalid media type');
      }
    } catch (error) {
      console.error('Get genres error:', error);
      throw error;
    }
  }

  // Clear cache
  clearCache() {
    this.tmdb.clearCache();
  }
}

export default new EntertainmentService();
