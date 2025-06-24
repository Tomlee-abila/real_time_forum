import { useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { ActionTypes } from '../contexts/AppContext';
import { createSafeWatchlistItem, validateSafeForSerialization, emergencyDataIsolation } from '../utils/dataIsolation';

export function useWatchlist() {
  const { state, dispatch } = useApp();

  // Add item to watchlist
  const addToWatchlist = useCallback((item) => {
    try {
      // First apply emergency isolation to strip any contamination
      const emergencyCleanItem = emergencyDataIsolation(item);

      // Then create a completely isolated safe watchlist item
      const watchlistItem = createSafeWatchlistItem(emergencyCleanItem);

      // Validate the item is safe for serialization before dispatching
      if (!validateSafeForSerialization(watchlistItem)) {
        console.error('Watchlist item failed serialization validation:', watchlistItem);
        return;
      }

      console.log('Adding safe watchlist item:', watchlistItem);
      dispatch({ type: ActionTypes.ADD_TO_WATCHLIST, payload: watchlistItem });
    } catch (error) {
      console.error('Error adding item to watchlist:', error);

      // Fallback: create minimal safe item
      const fallbackItem = {
        id: Date.now(),
        title: 'Unknown Title',
        poster_path: null,
        poster_url: null,
        media_type: 'movie',
        release_date: null,
        vote_average: 0,
        overview: null,
        watched: false,
        added_at: new Date().toISOString()
      };

      dispatch({ type: ActionTypes.ADD_TO_WATCHLIST, payload: fallbackItem });
    }
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
