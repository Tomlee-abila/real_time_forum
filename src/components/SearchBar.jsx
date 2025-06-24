import React, { useState, useEffect } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { useSearch } from '../hooks/useSearch';
import { useApp } from '../contexts/AppContext';
import { ActionTypes } from '../contexts/AppContext';

function SearchBar() {
  const { state, dispatch } = useApp();
  const { search, clearSearch, searchQuery } = useSearch();
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [showFilters, setShowFilters] = useState(false);

  // Sync local query with global state
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setLocalQuery(value);
    search(value, state.selectedMediaType);
  };

  const handleClear = () => {
    setLocalQuery('');
    clearSearch();
  };

  const handleMediaTypeChange = (mediaType) => {
    dispatch({ type: ActionTypes.SET_MEDIA_TYPE, payload: mediaType });
    if (localQuery.trim()) {
      search(localQuery, mediaType);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (localQuery.trim()) {
      search(localQuery, state.selectedMediaType);
    }
  };

  return (
    <div className="search-bar">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-container">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Search for movies, TV shows..."
            value={localQuery}
            onChange={handleInputChange}
            className="search-input"
            autoComplete="off"
          />
          {localQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="clear-button"
              aria-label="Clear search"
            >
              <X size={18} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`filter-button ${showFilters ? 'active' : ''}`}
            aria-label="Toggle filters"
          >
            <Filter size={18} />
          </button>
        </div>
      </form>

      {showFilters && (
        <div className="search-filters">
          <div className="filter-group">
            <label className="filter-label">Content Type:</label>
            <div className="filter-options">
              <button
                type="button"
                onClick={() => handleMediaTypeChange('all')}
                className={`filter-option ${state.selectedMediaType === 'all' ? 'active' : ''}`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => handleMediaTypeChange('movie')}
                className={`filter-option ${state.selectedMediaType === 'movie' ? 'active' : ''}`}
              >
                Movies
              </button>
              <button
                type="button"
                onClick={() => handleMediaTypeChange('tv')}
                className={`filter-option ${state.selectedMediaType === 'tv' ? 'active' : ''}`}
              >
                TV Shows
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchBar;
