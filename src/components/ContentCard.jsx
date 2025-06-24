import React from 'react';
import { Star, Calendar, Plus, Check, Eye, EyeOff } from 'lucide-react';
import { useWatchlist } from '../hooks/useWatchlist';
import { formatYear, formatRating, truncateText, getMediaTypeDisplay } from '../utils/formatters';
import { cleanForSerialization } from '../utils/safeJson';

function ContentCard({ item, onClick, showWatchlistControls = true }) {
  const { isInWatchlist, addToWatchlist, removeFromWatchlist, toggleWatched, getWatchlistItem } = useWatchlist();
  
  const inWatchlist = isInWatchlist(item.id);
  const watchlistItem = getWatchlistItem(item.id);
  const isWatched = watchlistItem?.watched || false;

  const title = item.title || item.name;
  const releaseDate = item.release_date || item.first_air_date;
  const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
  const posterUrl = item.poster_url || (item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null);

  const handleWatchlistToggle = (e) => {
    e.stopPropagation();
    if (inWatchlist) {
      removeFromWatchlist(item.id);
    } else {
      // Clean the item data to remove any circular references before adding to watchlist
      const cleanItem = cleanForSerialization(item);
      addToWatchlist(cleanItem);
    }
  };

  const handleWatchedToggle = (e) => {
    e.stopPropagation();
    toggleWatched(item.id);
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(item);
    }
  };

  return (
    <div className="content-card" onClick={handleCardClick}>
      <div className="content-card-poster">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={title}
            className="poster-image"
            loading="lazy"
          />
        ) : (
          <div className="poster-placeholder">
            <span>No Image</span>
          </div>
        )}
        
        {showWatchlistControls && (
          <div className="card-actions">
            <button
              onClick={handleWatchlistToggle}
              className={`action-button watchlist-button ${inWatchlist ? 'active' : ''}`}
              title={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
            >
              {inWatchlist ? <Check size={16} /> : <Plus size={16} />}
            </button>
            
            {inWatchlist && (
              <button
                onClick={handleWatchedToggle}
                className={`action-button watched-button ${isWatched ? 'active' : ''}`}
                title={isWatched ? 'Mark as unwatched' : 'Mark as watched'}
              >
                {isWatched ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            )}
          </div>
        )}

        <div className="card-overlay">
          <div className="media-type-badge">
            {getMediaTypeDisplay(mediaType)}
          </div>
          
          {item.vote_average > 0 && (
            <div className="rating-badge">
              <Star size={12} fill="currentColor" />
              <span>{formatRating(item.vote_average)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="content-card-info">
        <h3 className="content-title" title={title}>
          {truncateText(title, 50)}
        </h3>
        
        <div className="content-meta">
          {releaseDate && (
            <div className="release-date">
              <Calendar size={12} />
              <span>{formatYear(releaseDate)}</span>
            </div>
          )}
          
          {item.vote_average > 0 && (
            <div className="rating">
              <Star size={12} />
              <span>{item.vote_average.toFixed(1)}</span>
            </div>
          )}
        </div>

        {item.overview && (
          <p className="content-overview">
            {truncateText(item.overview, 100)}
          </p>
        )}

        {inWatchlist && (
          <div className="watchlist-status">
            <span className={`status-badge ${isWatched ? 'watched' : 'unwatched'}`}>
              {isWatched ? 'Watched' : 'To Watch'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ContentCard;
