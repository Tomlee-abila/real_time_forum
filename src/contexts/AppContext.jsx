import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { safeStringify, safeParse } from '../utils/safeJson';

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
      return { ...state, watchlist: [...state.watchlist, action.payload] };
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
    try {
      const serializedWatchlist = safeStringify(state.watchlist);
      localStorage.setItem('entertainment-watchlist', serializedWatchlist);
    } catch (error) {
      console.error('Error saving watchlist to localStorage:', error);
      // Fallback: try to save a cleaned version
      try {
        const cleanedWatchlist = state.watchlist.map(item => ({
          id: item.id,
          title: item.title,
          poster_path: item.poster_path,
          poster_url: item.poster_url,
          media_type: item.media_type,
          release_date: item.release_date,
          vote_average: item.vote_average,
          overview: item.overview,
          watched: item.watched,
          added_at: item.added_at
        }));
        localStorage.setItem('entertainment-watchlist', JSON.stringify(cleanedWatchlist));
      } catch (fallbackError) {
        console.error('Fallback save also failed:', fallbackError);
      }
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
