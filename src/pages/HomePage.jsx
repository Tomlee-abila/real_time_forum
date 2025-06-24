import React, { useState } from 'react';
import { TrendingUp, Star, Calendar } from 'lucide-react';
import { useContent } from '../hooks/useContent';
import ContentGrid from '../components/ContentGrid';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

function HomePage({ onItemClick }) {
  const {
    trending,
    trendingLoading,
    trendingError,
    popularMovies,
    popularTVShows,
    popularLoading,
    popularError,
    loadTrending,
    loadPopularMovies,
    loadPopularTVShows,
  } = useContent();

  const [trendingTimeWindow, setTrendingTimeWindow] = useState('day');

  const handleTrendingTimeChange = (timeWindow) => {
    setTrendingTimeWindow(timeWindow);
    loadTrending('all', timeWindow);
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Discover Your Next Favorite
          </h1>
          <p className="hero-subtitle">
            Explore trending movies and TV shows, manage your watchlist, and never miss the latest entertainment.
          </p>
        </div>
      </section>

      {/* Trending Section */}
      <section className="content-section">
        <div className="section-header">
          <div className="section-title">
            <TrendingUp size={24} />
            <h2>Trending Now</h2>
          </div>
          <div className="section-controls">
            <button
              onClick={() => handleTrendingTimeChange('day')}
              className={`time-filter ${trendingTimeWindow === 'day' ? 'active' : ''}`}
            >
              Today
            </button>
            <button
              onClick={() => handleTrendingTimeChange('week')}
              className={`time-filter ${trendingTimeWindow === 'week' ? 'active' : ''}`}
            >
              This Week
            </button>
          </div>
        </div>

        {trendingLoading && trending.length === 0 ? (
          <LoadingSpinner message="Loading trending content..." />
        ) : trendingError ? (
          <ErrorMessage 
            message={trendingError} 
            onRetry={() => loadTrending('all', trendingTimeWindow)}
          />
        ) : (
          <ContentGrid
            items={trending.slice(0, 12)}
            onItemClick={onItemClick}
            emptyMessage="No trending content available"
          />
        )}
      </section>

      {/* Popular Movies Section */}
      <section className="content-section">
        <div className="section-header">
          <div className="section-title">
            <Star size={24} />
            <h2>Popular Movies</h2>
          </div>
        </div>

        {popularLoading && popularMovies.length === 0 ? (
          <LoadingSpinner message="Loading popular movies..." />
        ) : popularError ? (
          <ErrorMessage 
            message={popularError} 
            onRetry={loadPopularMovies}
          />
        ) : (
          <ContentGrid
            items={popularMovies.slice(0, 8)}
            onItemClick={onItemClick}
            emptyMessage="No popular movies available"
          />
        )}
      </section>

      {/* Popular TV Shows Section */}
      <section className="content-section">
        <div className="section-header">
          <div className="section-title">
            <Calendar size={24} />
            <h2>Popular TV Shows</h2>
          </div>
        </div>

        {popularLoading && popularTVShows.length === 0 ? (
          <LoadingSpinner message="Loading popular TV shows..." />
        ) : popularError ? (
          <ErrorMessage 
            message={popularError} 
            onRetry={loadPopularTVShows}
          />
        ) : (
          <ContentGrid
            items={popularTVShows.slice(0, 8)}
            onItemClick={onItemClick}
            emptyMessage="No popular TV shows available"
          />
        )}
      </section>
    </div>
  );
}

export default HomePage;
