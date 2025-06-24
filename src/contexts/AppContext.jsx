import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { safeStringify, safeParse } from '../utils/safeJson';
import { deepIsolate, validateSafeForSerialization } from '../utils/dataIsolation';

// Initial state
const initialState = {
  // Search state
  searchQuery: '',
  searchResults: [],
  searchLoading: false,
  searchError: null,
  
  // Trending content
  trending: [],
  trendingLoading: false,
  trendingError: null,
  
  // Popular content
  popularMovies: [],
  popularTVShows: [],
  popularLoading: false,
  popularError: null,
  
  // Genres
  movieGenres: [],
  tvGenres: [],
  genresLoading: false,
  genresError: null,
  
  // UI state
  theme: 'light',
  selectedMediaType: 'all', // all, movie, tv
  currentPage: 1,
  
  // Watchlist (stored in localStorage)
  watchlist: [],
  
  // User preferences
  preferences: {
    defaultView: 'grid',
    resultsPerPage: 20,
    autoplay: false,
  },
};

// Action types
export const ActionTypes = {
  // Search actions
  SET_SEARCH_QUERY: 'SET_SEARCH_QUERY',
  SET_SEARCH_RESULTS: 'SET_SEARCH_RESULTS',
  SET_SEARCH_LOADING: 'SET_SEARCH_LOADING',
  SET_SEARCH_ERROR: 'SET_SEARCH_ERROR',
  CLEAR_SEARCH: 'CLEAR_SEARCH',
  
  // Trending actions
  SET_TRENDING: 'SET_TRENDING',
  SET_TRENDING_LOADING: 'SET_TRENDING_LOADING',
  SET_TRENDING_ERROR: 'SET_TRENDING_ERROR',
  
  // Popular actions
  SET_POPULAR_MOVIES: 'SET_POPULAR_MOVIES',
  SET_POPULAR_TV_SHOWS: 'SET_POPULAR_TV_SHOWS',
  SET_POPULAR_LOADING: 'SET_POPULAR_LOADING',
  SET_POPULAR_ERROR: 'SET_POPULAR_ERROR',
  
  // Genre actions
  SET_MOVIE_GENRES: 'SET_MOVIE_GENRES',
  SET_TV_GENRES: 'SET_TV_GENRES',
  SET_GENRES_LOADING: 'SET_GENRES_LOADING',
  SET_GENRES_ERROR: 'SET_GENRES_ERROR',
  
  // UI actions
  SET_THEME: 'SET_THEME',
  SET_MEDIA_TYPE: 'SET_MEDIA_TYPE',
  SET_CURRENT_PAGE: 'SET_CURRENT_PAGE',
  
  // Watchlist actions
  ADD_TO_WATCHLIST: 'ADD_TO_WATCHLIST',
  REMOVE_FROM_WATCHLIST: 'REMOVE_FROM_WATCHLIST',
  TOGGLE_WATCHED: 'TOGGLE_WATCHED',
  CLEAR_WATCHLIST: 'CLEAR_WATCHLIST',
  SET_WATCHLIST: 'SET_WATCHLIST',
  
  // Preferences actions
  SET_PREFERENCES: 'SET_PREFERENCES',
  UPDATE_PREFERENCE: 'UPDATE_PREFERENCE',
};

// Reducer function
function appReducer(state, action) {
  switch (action.type) {
    // Search cases
    case ActionTypes.SET_SEARCH_QUERY:
      return { ...state, searchQuery: action.payload };
    case ActionTypes.SET_SEARCH_RESULTS:
      return { ...state, searchResults: action.payload, searchLoading: false, searchError: null };
    case ActionTypes.SET_SEARCH_LOADING:
      return { ...state, searchLoading: action.payload };
    case ActionTypes.SET_SEARCH_ERROR:
      return { ...state, searchError: action.payload, searchLoading: false };
    case ActionTypes.CLEAR_SEARCH:
      return { ...state, searchQuery: '', searchResults: [], searchError: null };
    
    // Trending cases
    case ActionTypes.SET_TRENDING:
      return { ...state, trending: action.payload, trendingLoading: false, trendingError: null };
    case ActionTypes.SET_TRENDING_LOADING:
      return { ...state, trendingLoading: action.payload };
    case ActionTypes.SET_TRENDING_ERROR:
      return { ...state, trendingError: action.payload, trendingLoading: false };
    
    // Popular cases
    case ActionTypes.SET_POPULAR_MOVIES:
      return { ...state, popularMovies: action.payload, popularLoading: false, popularError: null };
    case ActionTypes.SET_POPULAR_TV_SHOWS:
      return { ...state, popularTVShows: action.payload, popularLoading: false, popularError: null };
    case ActionTypes.SET_POPULAR_LOADING:
      return { ...state, popularLoading: action.payload };
    case ActionTypes.SET_POPULAR_ERROR:
      return { ...state, popularError: action.payload, popularLoading: false };
    
    // Genre cases
    case ActionTypes.SET_MOVIE_GENRES:
      return { ...state, movieGenres: action.payload, genresLoading: false, genresError: null };
    case ActionTypes.SET_TV_GENRES:
      return { ...state, tvGenres: action.payload, genresLoading: false, genresError: null };
    case ActionTypes.SET_GENRES_LOADING:
      return { ...state, genresLoading: action.payload };
    case ActionTypes.SET_GENRES_ERROR:
      return { ...state, genresError: action.payload, genresLoading: false };
    
    // UI cases
    case ActionTypes.SET_THEME:
      return { ...state, theme: action.payload };
    case ActionTypes.SET_MEDIA_TYPE:
      return { ...state, selectedMediaType: action.payload };
    case ActionTypes.SET_CURRENT_PAGE:
      return { ...state, currentPage: action.payload };
    
    // Watchlist cases
    case ActionTypes.ADD_TO_WATCHLIST:
      // Additional safety check to prevent contaminated data from entering state
      const payload = action.payload;
      if (!payload || typeof payload !== 'object') {
        console.error('Rejected invalid payload in ADD_TO_WATCHLIST:', payload);
        return state;
      }

      // Check for any React fiber properties (dynamic property names)
      const keys = Object.keys(payload);
      const hasReactFiber = keys.some(key =>
        key.includes('reactFiber') ||
        key.includes('ReactFiber') ||
        key.startsWith('__react') ||
        key === 'nodeType' ||
        key === 'tagName' ||
        key === 'stateNode'
      );

      if (hasReactFiber) {
        console.error('Rejected contaminated payload with React fiber properties in ADD_TO_WATCHLIST:', keys);
        return state;
      }

      return { ...state, watchlist: [...state.watchlist, payload] };
    case ActionTypes.REMOVE_FROM_WATCHLIST:
      return { 
        ...state, 
        watchlist: state.watchlist.filter(item => item.id !== action.payload) 
      };
    case ActionTypes.TOGGLE_WATCHED:
      return {
        ...state,
        watchlist: state.watchlist.map(item =>
          item.id === action.payload
            ? { ...item, watched: !item.watched }
            : item
        )
      };
    case ActionTypes.CLEAR_WATCHLIST:
      return { ...state, watchlist: [] };
    case ActionTypes.SET_WATCHLIST:
      return { ...state, watchlist: action.payload };
    
    // Preferences cases
    case ActionTypes.SET_PREFERENCES:
      return { ...state, preferences: action.payload };
    case ActionTypes.UPDATE_PREFERENCE:
      return {
        ...state,
        preferences: { ...state.preferences, [action.key]: action.value }
      };
    
    default:
      return state;
  }
}

// Create context
const AppContext = createContext();

// Context provider component
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedWatchlist = localStorage.getItem('entertainment-watchlist');
      if (savedWatchlist) {
        const parsedWatchlist = safeParse(savedWatchlist, []);
        dispatch({
          type: ActionTypes.SET_WATCHLIST,
          payload: parsedWatchlist
        });
      }

      const savedPreferences = localStorage.getItem('entertainment-preferences');
      if (savedPreferences) {
        const parsedPreferences = safeParse(savedPreferences, {
          defaultView: 'grid',
          resultsPerPage: 20,
          autoplay: false,
        });
        dispatch({
          type: ActionTypes.SET_PREFERENCES,
          payload: parsedPreferences
        });
      }

      const savedTheme = localStorage.getItem('entertainment-theme');
      if (savedTheme) {
        dispatch({
          type: ActionTypes.SET_THEME,
          payload: savedTheme
        });
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    }
  }, []);

  // Save watchlist to localStorage whenever it changes
  useEffect(() => {
    // Skip saving if watchlist is empty to avoid unnecessary operations
    if (state.watchlist.length === 0) {
      localStorage.removeItem('entertainment-watchlist');
      return;
    }

    try {
      // First, deeply isolate the watchlist data to ensure no circular references
      const isolatedWatchlist = deepIsolate(state.watchlist);

      // Validate that the isolated data is safe for serialization
      if (!validateSafeForSerialization(isolatedWatchlist)) {
        throw new Error('Isolated watchlist data failed serialization validation');
      }

      // Use regular JSON.stringify since we've already isolated the data
      const serializedWatchlist = JSON.stringify(isolatedWatchlist);
      localStorage.setItem('entertainment-watchlist', serializedWatchlist);

      console.log('Successfully saved watchlist with data isolation');
    } catch (error) {
      console.error('Error saving watchlist to localStorage:', error);

      // Check if it's a circular structure error
      if (error.message && error.message.includes('circular structure')) {
        console.warn('Detected circular structure error despite isolation, attempting primitive-only save...');

        // Try primitive-only cleaning as last resort
        try {
          const primitiveOnlyWatchlist = state.watchlist.map(item => {
            const primitiveItem = {};

            // Only include primitive values
            for (const [key, value] of Object.entries(item || {})) {
              if (typeof value === 'string' ||
                  typeof value === 'number' ||
                  typeof value === 'boolean' ||
                  value === null) {
                primitiveItem[key] = value;
              }
            }

            // Ensure required fields exist
            if (!primitiveItem.id) primitiveItem.id = Date.now() + Math.random();
            if (!primitiveItem.title) primitiveItem.title = 'Unknown Title';
            if (!primitiveItem.media_type) primitiveItem.media_type = 'movie';
            if (primitiveItem.watched === undefined) primitiveItem.watched = false;
            if (!primitiveItem.added_at) primitiveItem.added_at = new Date().toISOString();

            return primitiveItem;
          });

          localStorage.setItem('entertainment-watchlist', JSON.stringify(primitiveOnlyWatchlist));
          console.log('Successfully saved with primitive-only cleaning');
          return;
        } catch (primitiveError) {
          console.error('Primitive-only cleaning also failed:', primitiveError);
        }
      }

      // Last resort: clear the problematic data
      console.warn('All serialization attempts failed, clearing watchlist');
      localStorage.removeItem('entertainment-watchlist');
    }
  }, [state.watchlist]);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    try {
      const serializedPreferences = safeStringify(state.preferences);
      localStorage.setItem('entertainment-preferences', serializedPreferences);
    } catch (error) {
      console.error('Error saving preferences to localStorage:', error);
    }
  }, [state.preferences]);

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('entertainment-theme', state.theme);
      // Apply theme to document
      document.documentElement.setAttribute('data-theme', state.theme);
    } catch (error) {
      console.error('Error saving theme to localStorage:', error);
    }
  }, [state.theme]);

  const value = {
    state,
    dispatch,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// Custom hook to use the context
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export default AppContext;
