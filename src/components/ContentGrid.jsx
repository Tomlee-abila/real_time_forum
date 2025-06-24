import React from 'react';
import ContentCard from './ContentCard';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

function ContentGrid({ 
  items = [], 
  loading = false, 
  error = null, 
  onItemClick,
  showWatchlistControls = true,
  emptyMessage = "No content found",
  className = ""
}) {
  if (loading && items.length === 0) {
    return (
      <div className="content-grid-container">
        <LoadingSpinner message="Loading content..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="content-grid-container">
        <ErrorMessage message={error} />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="content-grid-container">
        <div className="empty-state">
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`content-grid-container ${className}`}>
      <div className="content-grid">
        {items.map((item) => (
          <ContentCard
            key={`${item.id}-${item.media_type || 'unknown'}`}
            item={item}
            onClick={onItemClick}
            showWatchlistControls={showWatchlistControls}
          />
        ))}
      </div>
      
      {loading && items.length > 0 && (
        <div className="loading-more">
          <LoadingSpinner size="small" message="Loading more..." />
        </div>
      )}
    </div>
  );
}

export default ContentGrid;
