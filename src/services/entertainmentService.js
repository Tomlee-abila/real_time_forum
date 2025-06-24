import tmdbService from './tmdbService.js';
import omdbService from './omdbService.js';

class EntertainmentService {
  constructor() {
    this.tmdb = tmdbService;
    this.omdb = omdbService;
  }

  // Search functionality with combined results
  async search(query, page = 1) {
    try {
      const tmdbResults = await this.tmdb.searchMulti(query, page);
      
      // Enhance results with OMDB data for better ratings
      const enhancedResults = await Promise.allSettled(
        tmdbResults.results.slice(0, 5).map(async (item) => {
          try {
            const omdbData = await this.omdb.searchByTitle(
              item.title || item.name,
              item.release_date ? new Date(item.release_date).getFullYear() : 
              item.first_air_date ? new Date(item.first_air_date).getFullYear() : null
            );
            return this.mergeData(item, omdbData);
          } catch (error) {
            return item; // Return original if OMDB fails
          }
        })
      );

      return {
        ...tmdbResults,
        results: [
          ...enhancedResults.map(result => 
            result.status === 'fulfilled' ? result.value : result.reason
          ),
          ...tmdbResults.results.slice(5) // Keep remaining results as-is
        ]
      };
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  // Get detailed information combining both APIs
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

      // Try to get enhanced data from OMDB
      let omdbData = null;
      try {
        if (tmdbData.imdb_id) {
          omdbData = await this.omdb.searchByImdbId(tmdbData.imdb_id);
        } else {
          omdbData = await this.omdb.searchByTitle(
            tmdbData.title || tmdbData.name,
            tmdbData.release_date ? new Date(tmdbData.release_date).getFullYear() : 
            tmdbData.first_air_date ? new Date(tmdbData.first_air_date).getFullYear() : null,
            mediaType === 'tv' ? 'series' : 'movie'
          );
        }
      } catch (omdbError) {
        console.warn('OMDB data not available:', omdbError.message);
      }

      return this.mergeDetailedData(tmdbData, omdbData);
    } catch (error) {
      console.error('Get detailed info error:', error);
      throw error;
    }
  }

  // Merge TMDB and OMDB data
  mergeData(tmdbItem, omdbItem = null) {
    const merged = {
      ...tmdbItem,
      poster_url: this.tmdb.getPosterUrl(tmdbItem.poster_path),
      backdrop_url: this.tmdb.getBackdropUrl(tmdbItem.backdrop_path),
    };

    if (omdbItem) {
      merged.omdb_ratings = omdbService.extractRatings(omdbItem);
      merged.imdb_rating = omdbItem.imdbRating !== 'N/A' ? omdbItem.imdbRating : null;
      merged.awards = omdbItem.Awards !== 'N/A' ? omdbItem.Awards : null;
      merged.box_office = omdbItem.BoxOffice !== 'N/A' ? omdbItem.BoxOffice : null;
    }

    return merged;
  }

  // Merge detailed data from both APIs
  mergeDetailedData(tmdbData, omdbData = null) {
    const merged = {
      ...tmdbData,
      poster_url: this.tmdb.getPosterUrl(tmdbData.poster_path),
      backdrop_url: this.tmdb.getBackdropUrl(tmdbData.backdrop_path),
      cast: tmdbData.credits?.cast?.slice(0, 10) || [],
      crew: tmdbData.credits?.crew || [],
      videos: tmdbData.videos?.results || [],
      similar: tmdbData.similar?.results || [],
      recommendations: tmdbData.recommendations?.results || [],
    };

    if (omdbData) {
      const normalizedOmdb = omdbService.normalizeData(omdbData);
      merged.omdb_data = normalizedOmdb;
      merged.enhanced_ratings = normalizedOmdb.ratings;
      merged.awards = normalizedOmdb.awards;
      merged.box_office = normalizedOmdb.boxOffice;
      merged.detailed_plot = normalizedOmdb.plot;
      merged.director = normalizedOmdb.director;
      merged.writer = normalizedOmdb.writer;
      merged.actors = normalizedOmdb.actors;
    }

    return merged;
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

  // Clear all caches
  clearCache() {
    this.tmdb.clearCache();
    this.omdb.clearCache();
  }
}

export default new EntertainmentService();
