import { useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { ActionTypes } from '../contexts/AppContext';

export function useWatchlist() {
  const { state, dispatch } = useApp();

  // Add item to watchlist
  const addToWatchlist = useCallback((item) => {
    const watchlistItem = {
      id: item.id,
      title: item.title || item.name,
      poster_path: item.poster_path,
      poster_url: item.poster_url,
      media_type: item.media_type || (item.title ? 'movie' : 'tv'),
      release_date: item.release_date || item.first_air_date,
      vote_average: item.vote_average,
      overview: item.overview,
      watched: false,
      added_at: new Date().toISOString(),
    };

    dispatch({ type: ActionTypes.ADD_TO_WATCHLIST, payload: watchlistItem });
  }, [dispatch]);

  // Remove item from watchlist
  const removeFromWatchlist = useCallback((itemId) => {
    dispatch({ type: ActionTypes.REMOVE_FROM_WATCHLIST, payload: itemId });
  }, [dispatch]);

  // Toggle watched status
  const toggleWatched = useCallback((itemId) => {
    dispatch({ type: ActionTypes.TOGGLE_WATCHED, payload: itemId });
  }, [dispatch]);

  // Clear entire watchlist
  const clearWatchlist = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_WATCHLIST });
  }, [dispatch]);

  // Check if item is in watchlist
  const isInWatchlist = useCallback((itemId) => {
    return state.watchlist.some(item => item.id === itemId);
  }, [state.watchlist]);

  // Get watchlist item
  const getWatchlistItem = useCallback((itemId) => {
    return state.watchlist.find(item => item.id === itemId);
  }, [state.watchlist]);

  // Get watchlist stats
  const getWatchlistStats = useCallback(() => {
    const total = state.watchlist.length;
    const watched = state.watchlist.filter(item => item.watched).length;
    const unwatched = total - watched;
    const movies = state.watchlist.filter(item => item.media_type === 'movie').length;
    const tvShows = state.watchlist.filter(item => item.media_type === 'tv').length;

    return {
      total,
      watched,
      unwatched,
      movies,
      tvShows,
    };
  }, [state.watchlist]);

  // Filter watchlist
  const filterWatchlist = useCallback((filters = {}) => {
    let filtered = [...state.watchlist];

    if (filters.mediaType && filters.mediaType !== 'all') {
      filtered = filtered.filter(item => item.media_type === filters.mediaType);
    }

    if (filters.watched !== undefined) {
      filtered = filtered.filter(item => item.watched === filters.watched);
    }

    if (filters.sortBy) {
      filtered.sort((a, b) => {
        switch (filters.sortBy) {
          case 'title':
            return a.title.localeCompare(b.title);
          case 'date_added':
            return new Date(b.added_at) - new Date(a.added_at);
          case 'release_date':
            return new Date(b.release_date) - new Date(a.release_date);
          case 'rating':
            return (b.vote_average || 0) - (a.vote_average || 0);
          default:
            return 0;
        }
      });
    }

    return filtered;
  }, [state.watchlist]);

  return {
    watchlist: state.watchlist,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatched,
    clearWatchlist,
    isInWatchlist,
    getWatchlistItem,
    getWatchlistStats,
    filterWatchlist,
  };
}
