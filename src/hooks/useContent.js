import { useCallback, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { ActionTypes } from '../contexts/AppContext';
import entertainmentService from '../services/entertainmentService';

export function useContent() {
  const { state, dispatch } = useApp();

  // Load trending content
  const loadTrending = useCallback(async (mediaType = 'all', timeWindow = 'day') => {
    try {
      dispatch({ type: ActionTypes.SET_TRENDING_LOADING, payload: true });
      const trending = await entertainmentService.getTrending(mediaType, timeWindow);
      dispatch({ type: ActionTypes.SET_TRENDING, payload: trending.results });
    } catch (error) {
      console.error('Load trending error:', error);
      dispatch({ 
        type: ActionTypes.SET_TRENDING_ERROR, 
        payload: error.message || 'Failed to load trending content.' 
      });
    }
  }, [dispatch]);

  // Load popular movies
  const loadPopularMovies = useCallback(async (page = 1) => {
    try {
      dispatch({ type: ActionTypes.SET_POPULAR_LOADING, payload: true });
      const popular = await entertainmentService.getPopular('movie', page);
      dispatch({ type: ActionTypes.SET_POPULAR_MOVIES, payload: popular.results });
    } catch (error) {
      console.error('Load popular movies error:', error);
      dispatch({ 
        type: ActionTypes.SET_POPULAR_ERROR, 
        payload: error.message || 'Failed to load popular movies.' 
      });
    }
  }, [dispatch]);

  // Load popular TV shows
  const loadPopularTVShows = useCallback(async (page = 1) => {
    try {
      dispatch({ type: ActionTypes.SET_POPULAR_LOADING, payload: true });
      const popular = await entertainmentService.getPopular('tv', page);
      dispatch({ type: ActionTypes.SET_POPULAR_TV_SHOWS, payload: popular.results });
    } catch (error) {
      console.error('Load popular TV shows error:', error);
      dispatch({ 
        type: ActionTypes.SET_POPULAR_ERROR, 
        payload: error.message || 'Failed to load popular TV shows.' 
      });
    }
  }, [dispatch]);

  // Load genres
  const loadGenres = useCallback(async () => {
    try {
      dispatch({ type: ActionTypes.SET_GENRES_LOADING, payload: true });
      
      const [movieGenres, tvGenres] = await Promise.all([
        entertainmentService.getGenres('movie'),
        entertainmentService.getGenres('tv')
      ]);

      dispatch({ type: ActionTypes.SET_MOVIE_GENRES, payload: movieGenres.genres });
      dispatch({ type: ActionTypes.SET_TV_GENRES, payload: tvGenres.genres });
    } catch (error) {
      console.error('Load genres error:', error);
      dispatch({ 
        type: ActionTypes.SET_GENRES_ERROR, 
        payload: error.message || 'Failed to load genres.' 
      });
    }
  }, [dispatch]);

  // Discover content by genre
  const discoverByGenre = useCallback(async (mediaType, genreId, page = 1) => {
    try {
      const discovered = await entertainmentService.discoverByGenre(mediaType, genreId, page);
      return discovered;
    } catch (error) {
      console.error('Discover by genre error:', error);
      throw error;
    }
  }, []);

  // Get detailed information
  const getDetailedInfo = useCallback(async (id, mediaType) => {
    try {
      const details = await entertainmentService.getDetailedInfo(id, mediaType);
      return details;
    } catch (error) {
      console.error('Get detailed info error:', error);
      throw error;
    }
  }, []);

  // Auto-load initial content on mount
  useEffect(() => {
    loadTrending();
    loadPopularMovies();
    loadPopularTVShows();
    loadGenres();
  }, [loadTrending, loadPopularMovies, loadPopularTVShows, loadGenres]);

  return {
    // State
    trending: state.trending,
    trendingLoading: state.trendingLoading,
    trendingError: state.trendingError,
    
    popularMovies: state.popularMovies,
    popularTVShows: state.popularTVShows,
    popularLoading: state.popularLoading,
    popularError: state.popularError,
    
    movieGenres: state.movieGenres,
    tvGenres: state.tvGenres,
    genresLoading: state.genresLoading,
    genresError: state.genresError,
    
    // Actions
    loadTrending,
    loadPopularMovies,
    loadPopularTVShows,
    loadGenres,
    discoverByGenre,
    getDetailedInfo,
  };
}
