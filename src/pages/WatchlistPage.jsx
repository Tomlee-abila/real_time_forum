import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bookmark, 
  Filter, 
  SortAsc, 
  Download, 
  Trash2, 
  Eye, 
  EyeOff,
  BarChart3,
  Calendar,
  Star
} from 'lucide-react';
import { useWatchlist } from '../hooks/useWatchlist';
import ContentGrid from '../components/ContentGrid';
import { formatDate } from '../utils/formatters';

function WatchlistPage() {
  const navigate = useNavigate();
  const { 
    watchlist, 
    filterWatchlist, 
    getWatchlistStats, 
    clearWatchlist,
    toggleWatched,
    removeFromWatchlist
  } = useWatchlist();

  const [filters, setFilters] = useState({
    mediaType: 'all',
    watched: undefined,
    sortBy: 'date_added'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const stats = getWatchlistStats();
  const filteredItems = useMemo(() => 
    filterWatchlist(filters), 
    [filterWatchlist, filters]
  );

  const handleItemClick = (item) => {
    navigate(`/detail/${item.media_type}/${item.id}`);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleExportWatchlist = () => {
    const csvContent = [
      ['Title', 'Type', 'Release Date', 'Rating', 'Status', 'Added Date'].join(','),
      ...filteredItems.map(item => [
        `"${item.title}"`,
        item.media_type,
        item.release_date || '',
        item.vote_average || '',
        item.watched ? 'Watched' : 'To Watch',
        formatDate(item.added_at)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-watchlist.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleClearWatchlist = () => {
    if (window.confirm('Are you sure you want to clear your entire watchlist? This action cannot be undone.')) {
      clearWatchlist();
    }
  };

  const handleBulkMarkWatched = () => {
    const unwatchedItems = filteredItems.filter(item => !item.watched);
    if (unwatchedItems.length === 0) return;
    
    if (window.confirm(`Mark ${unwatchedItems.length} items as watched?`)) {
      unwatchedItems.forEach(item => {
        if (!item.watched) {
          toggleWatched(item.id);
        }
      });
    }
  };

  if (watchlist.length === 0) {
    return (
      <div className="watchlist-page">
        <div className="page-header">
          <h1>My Watchlist</h1>
        </div>
        
        <div className="empty-watchlist">
          <Bookmark size={64} className="empty-icon" />
          <h2>Your watchlist is empty</h2>
          <p>Start adding movies and TV shows to keep track of what you want to watch!</p>
          <button 
            onClick={() => navigate('/')}
            className="action-button primary"
          >
            Discover Content
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="watchlist-page">
      <div className="page-header">
        <div className="header-title">
          <h1>My Watchlist</h1>
          <span className="item-count">
            {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
          </span>
        </div>
        
        <div className="header-actions">
          <button
            onClick={() => setShowStats(!showStats)}
            className="action-button outline"
          >
            <BarChart3 size={16} />
            Stats
          </button>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`action-button outline ${showFilters ? 'active' : ''}`}
          >
            <Filter size={16} />
            Filters
          </button>
          
          <button
            onClick={handleExportWatchlist}
            className="action-button outline"
            disabled={filteredItems.length === 0}
          >
            <Download size={16} />
            Export
          </button>
          
          <button
            onClick={handleClearWatchlist}
            className="action-button danger"
          >
            <Trash2 size={16} />
            Clear All
          </button>
        </div>
      </div>

      {showStats && (
        <div className="watchlist-stats">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total Items</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.watched}</div>
              <div className="stat-label">Watched</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.unwatched}</div>
              <div className="stat-label">To Watch</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.movies}</div>
              <div className="stat-label">Movies</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.tvShows}</div>
              <div className="stat-label">TV Shows</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">
                {stats.total > 0 ? Math.round((stats.watched / stats.total) * 100) : 0}%
              </div>
              <div className="stat-label">Completion</div>
            </div>
          </div>
        </div>
      )}

      {showFilters && (
        <div className="watchlist-filters">
          <div className="filter-row">
            <div className="filter-group">
              <label className="filter-label">Content Type:</label>
              <select
                value={filters.mediaType}
                onChange={(e) => handleFilterChange('mediaType', e.target.value)}
                className="filter-select"
              >
                <option value="all">All</option>
                <option value="movie">Movies</option>
                <option value="tv">TV Shows</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Status:</label>
              <select
                value={filters.watched === undefined ? 'all' : filters.watched ? 'watched' : 'unwatched'}
                onChange={(e) => {
                  const value = e.target.value;
                  handleFilterChange('watched', 
                    value === 'all' ? undefined : value === 'watched'
                  );
                }}
                className="filter-select"
              >
                <option value="all">All</option>
                <option value="unwatched">To Watch</option>
                <option value="watched">Watched</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Sort By:</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="filter-select"
              >
                <option value="date_added">Date Added</option>
                <option value="title">Title</option>
                <option value="release_date">Release Date</option>
                <option value="rating">Rating</option>
              </select>
            </div>
          </div>

          <div className="filter-actions">
            <button
              onClick={handleBulkMarkWatched}
              className="action-button outline"
              disabled={filteredItems.filter(item => !item.watched).length === 0}
            >
              <Eye size={16} />
              Mark All Watched
            </button>
            
            <button
              onClick={() => setFilters({
                mediaType: 'all',
                watched: undefined,
                sortBy: 'date_added'
              })}
              className="action-button outline"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      <div className="watchlist-content">
        <ContentGrid
          items={filteredItems}
          onItemClick={handleItemClick}
          showWatchlistControls={true}
          emptyMessage={
            filters.mediaType !== 'all' || filters.watched !== undefined
              ? "No items match your current filters"
              : "Your watchlist is empty"
          }
          className="watchlist-grid"
        />
      </div>
    </div>
  );
}

export default WatchlistPage;
