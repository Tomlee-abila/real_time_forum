import React from 'react';
import { Star, Calendar, Plus, Check, Eye, EyeOff } from 'lucide-react';
import { useWatchlist } from '../hooks/useWatchlist';
import { formatYear, formatRating, truncateText, getMediaTypeDisplay } from '../utils/formatters';
import { createSafeContentItem, emergencyDataIsolation } from '../utils/dataIsolation';
import { createSafeEventHandler } from '../utils/eventSanitizer';
import { 
  SafeContentItem, 
  RawContentData, 
  isDOMElement, 
  hasReactFiberProperties 
} from '../types/content';

interface ContentCardProps {
  item: RawContentData;
  onClick?: (item: SafeContentItem) => void;
  showWatchlistControls?: boolean;
}

/**
 * TypeScript-enhanced ContentCard with strict type safety and DOM contamination prevention
 */
const ContentCard: React.FC<ContentCardProps> = ({ 
  item, 
  onClick, 
  showWatchlistControls = true 
}) => {
  const { addToWatchlist, removeFromWatchlist, toggleWatched, isInWatchlist, getWatchlistItem } = useWatchlist();

  // Immediate safety checks
  if (isDOMElement(item)) {
    console.error('ContentCard received DOM element as item - rendering fallback');
    return <div className="content-card error">Invalid content data</div>;
  }

  if (hasReactFiberProperties(item)) {
    console.error('ContentCard received React fiber contaminated item - rendering fallback');
    return <div className="content-card error">Invalid content data</div>;
  }

  // Extract safe properties with TypeScript validation
  const safeId = typeof item.id === 'number' ? item.id : 0;
  const safeTitle = typeof item.title === 'string' ? item.title : 
                   typeof item.name === 'string' ? item.name : 'Unknown Title';
  const safePosterPath = typeof item.poster_path === 'string' ? item.poster_path : null;
  const safeMediaType = item.media_type === 'movie' || item.media_type === 'tv' ? 
                       item.media_type : 'movie';
  const safeReleaseDate = typeof item.release_date === 'string' ? item.release_date :
                         typeof item.first_air_date === 'string' ? item.first_air_date : null;
  const safeVoteAverage = typeof item.vote_average === 'number' ? item.vote_average : null;
  const safeOverview = typeof item.overview === 'string' ? item.overview : null;

  const inWatchlist = isInWatchlist(safeId);
  const watchlistItem = getWatchlistItem(safeId);

  // TypeScript-safe event handlers with DOM contamination prevention
  const handleWatchlistToggle = createSafeEventHandler((): void => {
    if (inWatchlist) {
      removeFromWatchlist(safeId);
    } else {
      // Use emergency isolation to ensure no contamination
      const safeItem = emergencyDataIsolation(item);
      addToWatchlist(safeItem);
    }
  });

  const handleWatchedToggle = createSafeEventHandler((): void => {
    toggleWatched(safeId);
  });

  const handleCardClick = createSafeEventHandler((): void => {
    if (onClick) {
      // Create a safe content item for navigation
      const safeItem = createSafeContentItem(item);
      if (safeItem) {
        onClick(safeItem);
      }
    }
  });

  // Safe poster URL construction
  const posterUrl = safePosterPath 
    ? `https://image.tmdb.org/t/p/w500${safePosterPath}`
    : '/placeholder-poster.jpg';

  return (
    <div className="content-card" onClick={handleCardClick}>
      <div className="content-card-poster">
        <img
          src={posterUrl}
          alt={safeTitle}
          className="poster-image"
          loading="lazy"
        />
        
        {showWatchlistControls && (
          <div className="card-actions">
            <button
              className={`action-button watchlist-button ${inWatchlist ? 'in-watchlist' : ''}`}
              onClick={handleWatchlistToggle}
              title={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
            >
              {inWatchlist ? <Check size={16} /> : <Plus size={16} />}
            </button>
            
            {inWatchlist && (
              <button
                className={`action-button watched-button ${watchlistItem?.watched ? 'watched' : ''}`}
                onClick={handleWatchedToggle}
                title={watchlistItem?.watched ? 'Mark as unwatched' : 'Mark as watched'}
              >
                {watchlistItem?.watched ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            )}
          </div>
        )}
        
        <div className="card-overlay">
          <div className="media-type-badge">
            {getMediaTypeDisplay(safeMediaType)}
          </div>
          {safeVoteAverage && (
            <div className="rating-badge">
              <Star size={12} fill="currentColor" />
              <span>{formatRating(safeVoteAverage)}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="content-card-info">
        <h3 className="content-title" title={safeTitle}>
          {truncateText(safeTitle, 50)}
        </h3>
        
        <div className="content-meta">
          {safeReleaseDate && (
            <div className="release-date">
              <Calendar size={12} />
              <span>{formatYear(safeReleaseDate)}</span>
            </div>
          )}
          
          {safeVoteAverage && (
            <div className="rating">
              <Star size={12} />
              <span>{safeVoteAverage}</span>
            </div>
          )}
        </div>
        
        {safeOverview && (
          <p className="content-overview">
            {truncateText(safeOverview, 120)}
          </p>
        )}
      </div>
    </div>
  );
};

export default ContentCard;
