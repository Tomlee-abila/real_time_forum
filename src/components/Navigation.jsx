import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Bookmark, Palette } from 'lucide-react';
import { useWatchlist } from '../hooks/useWatchlist';
import { useApp } from '../contexts/AppContext';
import { ActionTypes } from '../contexts/AppContext';

function Navigation() {
  const location = useLocation();
  const { state, dispatch } = useApp();
  const { getWatchlistStats } = useWatchlist();
  
  const stats = getWatchlistStats();
  const isSearchActive = location.pathname.includes('/search') || state.searchQuery.trim();

  const toggleTheme = () => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    dispatch({ type: ActionTypes.SET_THEME, payload: newTheme });
  };

  const navItems = [
    {
      to: '/',
      icon: Home,
      label: 'Home',
      active: location.pathname === '/' && !isSearchActive
    },
    {
      to: '/search',
      icon: Search,
      label: 'Search',
      active: isSearchActive
    },
    {
      to: '/watchlist',
      icon: Bookmark,
      label: 'Watchlist',
      active: location.pathname === '/watchlist',
      badge: stats.total > 0 ? stats.total : null
    }
  ];

  return (
    <nav className="navigation">
      <div className="nav-items">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`nav-item ${item.active ? 'active' : ''}`}
            >
              <div className="nav-icon-container">
                <Icon size={20} />
                {item.badge && (
                  <span className="nav-badge">{item.badge}</span>
                )}
              </div>
              <span className="nav-label">{item.label}</span>
            </Link>
          );
        })}
      </div>
      
      <div className="nav-actions">
        <button
          onClick={toggleTheme}
          className="theme-toggle"
          title={`Switch to ${state.theme === 'light' ? 'dark' : 'light'} mode`}
        >
          <Palette size={20} />
        </button>
      </div>
    </nav>
  );
}

export default Navigation;
