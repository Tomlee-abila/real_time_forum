import React, { useEffect, useRef, useCallback } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { useSearch } from '../hooks/useSearch';
import { useApp } from '../contexts/AppContext';
import ContentGrid from '../components/ContentGrid';
import LoadingSpinner from '../components/LoadingSpinner';

function SearchPage({ onItemClick }) {
  const { state } = useApp();
  const { 
    searchResults, 
    searchLoading, 
    searchError, 
    searchQuery,
    currentPage,
    searchMore 
  } = useSearch();
  
  const observerRef = useRef();
  const loadingRef = useRef();

  // Infinite scroll implementation
  const lastElementRef = useCallback((node) => {
    if (searchLoading) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && searchResults?.results?.length > 0) {
        const hasMorePages = currentPage < (searchResults.total_pages || 1);
        if (hasMorePages) {
          searchMore(currentPage + 1);
        }
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [searchLoading, searchResults, currentPage, searchMore]);

  // Show search prompt if no query
  if (!searchQuery.trim()) {
    return (
      <div className="search-page">
        <div className="search-prompt">
          <SearchIcon size={64} className="search-prompt-icon" />
          <h2>Search for Movies and TV Shows</h2>
          <p>Use the search bar above to find your favorite entertainment content.</p>
        </div>
      </div>
    );
  }

  // Show loading for initial search
  if (searchLoading && (!searchResults?.results || searchResults.results.length === 0)) {
    return (
      <div className="search-page">
        <LoadingSpinner message={`Searching for "${searchQuery}"...`} />
      </div>
    );
  }

  const results = searchResults?.results || [];
  const totalResults = searchResults?.total_results || 0;
  const hasMorePages = currentPage < (searchResults?.total_pages || 1);

  return (
    <div className="search-page">
      <div className="search-header">
        <h1>Search Results</h1>
        <p className="search-info">
          {totalResults > 0 ? (
            <>
              Found <strong>{totalResults.toLocaleString()}</strong> results for "<strong>{searchQuery}</strong>"
              {state.selectedMediaType !== 'all' && (
                <> in <strong>{state.selectedMediaType === 'movie' ? 'Movies' : 'TV Shows'}</strong></>
              )}
            </>
          ) : (
            <>No results found for "<strong>{searchQuery}</strong>"</>
          )}
        </p>
      </div>

      <ContentGrid
        items={results}
        loading={searchLoading}
        error={searchError}
        onItemClick={onItemClick}
        emptyMessage={`No ${state.selectedMediaType === 'all' ? 'content' : state.selectedMediaType === 'movie' ? 'movies' : 'TV shows'} found for "${searchQuery}"`}
        className="search-results"
      />

      {/* Infinite scroll trigger */}
      {results.length > 0 && hasMorePages && (
        <div ref={lastElementRef} className="scroll-trigger">
          {searchLoading && (
            <LoadingSpinner size="small" message="Loading more results..." />
          )}
        </div>
      )}

      {/* End of results indicator */}
      {results.length > 0 && !hasMorePages && !searchLoading && (
        <div className="end-of-results">
          <p>You've reached the end of the results</p>
        </div>
      )}
    </div>
  );
}

export default SearchPage;
