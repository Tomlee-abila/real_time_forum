import { useCallback, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { ActionTypes } from '../contexts/AppContext';
import entertainmentService from '../services/entertainmentService';
import { debounce } from '../utils/debounce';

export function useSearch() {
  const { state, dispatch } = useApp();
  const searchTimeoutRef = useRef(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query, mediaType = 'all', page = 1) => {
      if (!query.trim()) {
        dispatch({ type: ActionTypes.CLEAR_SEARCH });
        return;
      }

      try {
        dispatch({ type: ActionTypes.SET_SEARCH_LOADING, payload: true });
        
        let results;
        if (mediaType === 'movie') {
          results = await entertainmentService.tmdb.searchMovies(query, page);
        } else if (mediaType === 'tv') {
          results = await entertainmentService.tmdb.searchTVShows(query, page);
        } else {
          results = await entertainmentService.search(query, page);
        }

        dispatch({ type: ActionTypes.SET_SEARCH_RESULTS, payload: results });
      } catch (error) {
        console.error('Search error:', error);
        dispatch({ 
          type: ActionTypes.SET_SEARCH_ERROR, 
          payload: error.message || 'Search failed. Please try again.' 
        });
      }
    }, 300),
    [dispatch]
  );

  // Search function
  const search = useCallback((query, mediaType = 'all', page = 1) => {
    dispatch({ type: ActionTypes.SET_SEARCH_QUERY, payload: query });
    debouncedSearch(query, mediaType, page);
  }, [dispatch, debouncedSearch]);

  // Clear search
  const clearSearch = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_SEARCH });
  }, [dispatch]);

  // Search more (pagination)
  const searchMore = useCallback(async (page) => {
    if (!state.searchQuery.trim()) return;

    try {
      dispatch({ type: ActionTypes.SET_SEARCH_LOADING, payload: true });
      
      let results;
      const { searchQuery, selectedMediaType } = state;
      
      if (selectedMediaType === 'movie') {
        results = await entertainmentService.tmdb.searchMovies(searchQuery, page);
      } else if (selectedMediaType === 'tv') {
        results = await entertainmentService.tmdb.searchTVShows(searchQuery, page);
      } else {
        results = await entertainmentService.search(searchQuery, page);
      }

      // Append new results to existing ones
      const updatedResults = {
        ...results,
        results: [...state.searchResults.results, ...results.results]
      };

      dispatch({ type: ActionTypes.SET_SEARCH_RESULTS, payload: updatedResults });
      dispatch({ type: ActionTypes.SET_CURRENT_PAGE, payload: page });
    } catch (error) {
      console.error('Search more error:', error);
      dispatch({ 
        type: ActionTypes.SET_SEARCH_ERROR, 
        payload: error.message || 'Failed to load more results.' 
      });
    }
  }, [state.searchQuery, state.selectedMediaType, state.searchResults, dispatch]);

  return {
    searchQuery: state.searchQuery,
    searchResults: state.searchResults,
    searchLoading: state.searchLoading,
    searchError: state.searchError,
    currentPage: state.currentPage,
    search,
    clearSearch,
    searchMore,
  };
}
