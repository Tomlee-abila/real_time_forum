import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Star, 
  Calendar, 
  Clock, 
  Globe, 
  DollarSign, 
  Award,
  Play,
  Plus,
  Check,
  Eye,
  EyeOff
} from 'lucide-react';
import { useContent } from '../hooks/useContent';
import { useWatchlist } from '../hooks/useWatchlist';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import ContentGrid from '../components/ContentGrid';
import { 
  formatDate, 
  formatRuntime, 
  formatCurrency, 
  formatRating,
  formatGenres 
} from '../utils/formatters';

function DetailPage() {
  const { id, type } = useParams();
  const navigate = useNavigate();
  const { getDetailedInfo } = useContent();
  const { 
    isInWatchlist, 
    addToWatchlist, 
    removeFromWatchlist, 
    toggleWatched, 
    getWatchlistItem 
  } = useWatchlist();

  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const inWatchlist = content ? isInWatchlist(content.id) : false;
  const watchlistItem = content ? getWatchlistItem(content.id) : null;
  const isWatched = watchlistItem?.watched || false;

  useEffect(() => {
    loadContent();
  }, [id, type]);

  const loadContent = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDetailedInfo(parseInt(id), type);
      setContent(data);
    } catch (err) {
      setError(err.message || 'Failed to load content details');
    } finally {
      setLoading(false);
    }
  };

  const handleWatchlistToggle = () => {
    if (inWatchlist) {
      removeFromWatchlist(content.id);
    } else {
      addToWatchlist(content);
    }
  };

  const handleWatchedToggle = () => {
    toggleWatched(content.id);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleItemClick = (item) => {
    navigate(`/detail/${item.media_type || type}/${item.id}`);
  };

  if (loading) {
    return (
      <div className="detail-page">
        <LoadingSpinner message="Loading details..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="detail-page">
        <ErrorMessage message={error} onRetry={loadContent} />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="detail-page">
        <ErrorMessage message="Content not found" />
      </div>
    );
  }

  const title = content.title || content.name;
  const releaseDate = content.release_date || content.first_air_date;
  const backdropUrl = content.backdrop_url;
  const posterUrl = content.poster_url;
  const trailer = content.videos?.find(video => 
    video.type === 'Trailer' && video.site === 'YouTube'
  );

  return (
    <div className="detail-page">
      {/* Back Button */}
      <button onClick={handleBack} className="back-button">
        <ArrowLeft size={20} />
        Back
      </button>

      {/* Hero Section */}
      <div className="detail-hero" style={{
        backgroundImage: backdropUrl ? `url(${backdropUrl})` : 'none'
      }}>
        <div className="hero-overlay">
          <div className="hero-content">
            <div className="hero-poster">
              {posterUrl ? (
                <img src={posterUrl} alt={title} className="poster-image" />
              ) : (
                <div className="poster-placeholder">No Image</div>
              )}
            </div>
            
            <div className="hero-info">
              <h1 className="hero-title">{title}</h1>
              
              <div className="hero-meta">
                {content.vote_average > 0 && (
                  <div className="rating">
                    <Star size={16} fill="currentColor" />
                    <span>{content.vote_average.toFixed(1)}</span>
                    <span className="rating-percentage">
                      {formatRating(content.vote_average)}
                    </span>
                  </div>
                )}
                
                {releaseDate && (
                  <div className="release-date">
                    <Calendar size={16} />
                    <span>{formatDate(releaseDate)}</span>
                  </div>
                )}
                
                {content.runtime && (
                  <div className="runtime">
                    <Clock size={16} />
                    <span>{formatRuntime(content.runtime)}</span>
                  </div>
                )}
              </div>

              {content.genres && content.genres.length > 0 && (
                <div className="genres">
                  {content.genres.map(genre => (
                    <span key={genre.id} className="genre-tag">
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}

              <div className="hero-actions">
                {trailer && (
                  <a
                    href={`https://www.youtube.com/watch?v=${trailer.key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="action-button primary"
                  >
                    <Play size={16} />
                    Watch Trailer
                  </a>
                )}
                
                <button
                  onClick={handleWatchlistToggle}
                  className={`action-button ${inWatchlist ? 'secondary' : 'outline'}`}
                >
                  {inWatchlist ? <Check size={16} /> : <Plus size={16} />}
                  {inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                </button>
                
                {inWatchlist && (
                  <button
                    onClick={handleWatchedToggle}
                    className={`action-button ${isWatched ? 'watched' : 'outline'}`}
                  >
                    {isWatched ? <EyeOff size={16} /> : <Eye size={16} />}
                    {isWatched ? 'Mark Unwatched' : 'Mark Watched'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="detail-content">
        <div className="content-tabs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('cast')}
            className={`tab-button ${activeTab === 'cast' ? 'active' : ''}`}
          >
            Cast & Crew
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
          >
            Details
          </button>
          {(content.similar?.length > 0 || content.recommendations?.length > 0) && (
            <button
              onClick={() => setActiveTab('similar')}
              className={`tab-button ${activeTab === 'similar' ? 'active' : ''}`}
            >
              Similar
            </button>
          )}
        </div>

        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="overview-section">
                <h3>Plot Summary</h3>
                <p className="plot-text">
                  {content.detailed_plot || content.overview || 'No plot summary available.'}
                </p>
              </div>

              {content.enhanced_ratings && (
                <div className="ratings-section">
                  <h3>Ratings</h3>
                  <div className="ratings-grid">
                    {content.enhanced_ratings.imdb && (
                      <div className="rating-item">
                        <span className="rating-source">IMDb</span>
                        <span className="rating-value">
                          {content.enhanced_ratings.imdb.value}/10
                        </span>
                      </div>
                    )}
                    {content.enhanced_ratings.rottenTomatoes && (
                      <div className="rating-item">
                        <span className="rating-source">Rotten Tomatoes</span>
                        <span className="rating-value">
                          {content.enhanced_ratings.rottenTomatoes.display}
                        </span>
                      </div>
                    )}
                    {content.enhanced_ratings.metacritic && (
                      <div className="rating-item">
                        <span className="rating-source">Metacritic</span>
                        <span className="rating-value">
                          {content.enhanced_ratings.metacritic.display}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {content.awards && content.awards !== 'N/A' && (
                <div className="awards-section">
                  <h3>Awards</h3>
                  <div className="awards-text">
                    <Award size={16} />
                    <span>{content.awards}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'cast' && (
            <div className="cast-tab">
              {content.cast && content.cast.length > 0 && (
                <div className="cast-section">
                  <h3>Cast</h3>
                  <div className="cast-grid">
                    {content.cast.slice(0, 12).map(person => (
                      <div key={person.id} className="cast-member">
                        <div className="cast-photo">
                          {person.profile_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w185${person.profile_path}`}
                              alt={person.name}
                            />
                          ) : (
                            <div className="photo-placeholder">
                              {person.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="cast-info">
                          <div className="cast-name">{person.name}</div>
                          <div className="cast-character">{person.character}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {content.crew && content.crew.length > 0 && (
                <div className="crew-section">
                  <h3>Key Crew</h3>
                  <div className="crew-list">
                    {content.crew
                      .filter(person => 
                        ['Director', 'Producer', 'Writer', 'Screenplay'].includes(person.job)
                      )
                      .slice(0, 8)
                      .map((person, index) => (
                        <div key={`${person.id}-${index}`} className="crew-member">
                          <span className="crew-name">{person.name}</span>
                          <span className="crew-job">{person.job}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'details' && (
            <div className="details-tab">
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Status</span>
                  <span className="detail-value">{content.status || 'Unknown'}</span>
                </div>
                
                {content.original_language && (
                  <div className="detail-item">
                    <span className="detail-label">Original Language</span>
                    <span className="detail-value">
                      {content.original_language.toUpperCase()}
                    </span>
                  </div>
                )}
                
                {content.budget && content.budget > 0 && (
                  <div className="detail-item">
                    <span className="detail-label">Budget</span>
                    <span className="detail-value">{formatCurrency(content.budget)}</span>
                  </div>
                )}
                
                {content.revenue && content.revenue > 0 && (
                  <div className="detail-item">
                    <span className="detail-label">Box Office</span>
                    <span className="detail-value">{formatCurrency(content.revenue)}</span>
                  </div>
                )}
                
                {content.production_companies && content.production_companies.length > 0 && (
                  <div className="detail-item">
                    <span className="detail-label">Production</span>
                    <span className="detail-value">
                      {content.production_companies.map(company => company.name).join(', ')}
                    </span>
                  </div>
                )}
                
                {type === 'tv' && content.number_of_seasons && (
                  <div className="detail-item">
                    <span className="detail-label">Seasons</span>
                    <span className="detail-value">{content.number_of_seasons}</span>
                  </div>
                )}
                
                {type === 'tv' && content.number_of_episodes && (
                  <div className="detail-item">
                    <span className="detail-label">Episodes</span>
                    <span className="detail-value">{content.number_of_episodes}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'similar' && (
            <div className="similar-tab">
              {content.recommendations && content.recommendations.length > 0 && (
                <div className="similar-section">
                  <h3>Recommended</h3>
                  <ContentGrid
                    items={content.recommendations.slice(0, 8)}
                    onItemClick={handleItemClick}
                    showWatchlistControls={true}
                  />
                </div>
              )}
              
              {content.similar && content.similar.length > 0 && (
                <div className="similar-section">
                  <h3>Similar {type === 'movie' ? 'Movies' : 'TV Shows'}</h3>
                  <ContentGrid
                    items={content.similar.slice(0, 8)}
                    onItemClick={handleItemClick}
                    showWatchlistControls={true}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DetailPage;
