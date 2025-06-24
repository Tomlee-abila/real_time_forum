import { useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { ActionTypes } from '../contexts/AppContext';
import { 
  createSafeWatchlistItem, 
  validateSafeForSerialization, 
  emergencyDataIsolation 
} from '../utils/dataIsolation';
import { 
  SafeWatchlistItem, 
  RawContentData, 
  isDOMElement, 
  hasReactFiberProperties 
} from '../types/content';

/**
 * TypeScript-enhanced watchlist hook with strict type safety
 */
export function useWatchlist() {
  const { state, dispatch } = useApp();

  // Add item to watchlist with strict type checking
  const addToWatchlist = useCallback((item: RawContentData): void => {
    try {
      // Immediate rejection of DOM elements
      if (isDOMElement(item)) {
        console.error('Attempted to add DOM element to watchlist - REJECTED');
        return;
      }

      // Immediate rejection of React fiber contaminated objects
      if (hasReactFiberProperties(item)) {
        console.error('Attempted to add React fiber contaminated object to watchlist - REJECTED');
        return;
      }

      // First apply emergency isolation to strip any contamination
      const emergencyCleanItem = emergencyDataIsolation(item);
      
      // Then create a completely isolated safe watchlist item
      const watchlistItem: SafeWatchlistItem = createSafeWatchlistItem(emergencyCleanItem);
      
      // Validate the item is safe for serialization before dispatching
      if (!validateSafeForSerialization(watchlistItem)) {
        console.error('Watchlist item failed serialization validation:', watchlistItem);
        return;
      }
      
      console.log('Adding TypeScript-validated safe watchlist item:', watchlistItem);
      dispatch({ type: ActionTypes.ADD_TO_WATCHLIST, payload: watchlistItem });
    } catch (error) {
      console.error('Error adding item to watchlist:', error);
      
      // Fallback: create minimal safe item with TypeScript validation
      const fallbackItem: SafeWatchlistItem = {
        id: Date.now(),
        title: 'Unknown Title',
        poster_path: null,
        poster_url: null,
        media_type: 'movie',
        release_date: null,
        vote_average: null,
        overview: null,
        watched: false,
        added_at: new Date().toISOString()
      };
      
      dispatch({ type: ActionTypes.ADD_TO_WATCHLIST, payload: fallbackItem });
    }
  }, [dispatch]);

  // Remove item from watchlist
  const removeFromWatchlist = useCallback((id: number): void => {
    if (typeof id !== 'number' || isNaN(id)) {
      console.error('Invalid ID provided to removeFromWatchlist:', id);
      return;
    }
    
    dispatch({ type: ActionTypes.REMOVE_FROM_WATCHLIST, payload: id });
  }, [dispatch]);

  // Toggle watched status
  const toggleWatched = useCallback((id: number): void => {
    if (typeof id !== 'number' || isNaN(id)) {
      console.error('Invalid ID provided to toggleWatched:', id);
      return;
    }
    
    dispatch({ type: ActionTypes.TOGGLE_WATCHED, payload: id });
  }, [dispatch]);

  // Check if item is in watchlist
  const isInWatchlist = useCallback((id: number): boolean => {
    if (typeof id !== 'number' || isNaN(id)) {
      console.error('Invalid ID provided to isInWatchlist:', id);
      return false;
    }
    
    return state.watchlist.some((item: SafeWatchlistItem) => item.id === id);
  }, [state.watchlist]);

  // Get watchlist item by ID
  const getWatchlistItem = useCallback((id: number): SafeWatchlistItem | undefined => {
    if (typeof id !== 'number' || isNaN(id)) {
      console.error('Invalid ID provided to getWatchlistItem:', id);
      return undefined;
    }
    
    return state.watchlist.find((item: SafeWatchlistItem) => item.id === id);
  }, [state.watchlist]);

  // Get watchlist statistics
  const getWatchlistStats = useCallback(() => {
    const stats = {
      total: state.watchlist.length,
      watched: 0,
      unwatched: 0,
      movies: 0,
      tvShows: 0
    };

    state.watchlist.forEach((item: SafeWatchlistItem) => {
      if (item.watched) {
        stats.watched++;
      } else {
        stats.unwatched++;
      }

      if (item.media_type === 'movie') {
        stats.movies++;
      } else if (item.media_type === 'tv') {
        stats.tvShows++;
      }
    });

    return stats;
  }, [state.watchlist]);

  // Filter watchlist with type safety
  const filterWatchlist = useCallback((filters: {
    mediaType?: 'movie' | 'tv';
    watched?: boolean;
    search?: string;
  } = {}): SafeWatchlistItem[] => {
    return state.watchlist.filter((item: SafeWatchlistItem) => {
      // Media type filter
      if (filters.mediaType && item.media_type !== filters.mediaType) {
        return false;
      }

      // Watched status filter
      if (filters.watched !== undefined && item.watched !== filters.watched) {
        return false;
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const titleMatch = item.title.toLowerCase().includes(searchLower);
        const overviewMatch = item.overview?.toLowerCase().includes(searchLower) || false;
        
        if (!titleMatch && !overviewMatch) {
          return false;
        }
      }

      return true;
    });
  }, [state.watchlist]);

  return {
    watchlist: state.watchlist as SafeWatchlistItem[],
    addToWatchlist,
    removeFromWatchlist,
    toggleWatched,
    isInWatchlist,
    getWatchlistItem,
    getWatchlistStats,
    filterWatchlist
  };
}
