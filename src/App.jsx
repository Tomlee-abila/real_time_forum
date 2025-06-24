import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { useSearch } from './hooks/useSearch';
import SearchBar from './components/SearchBar';
import Navigation from './components/Navigation';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import DetailPage from './pages/DetailPage';
import WatchlistPage from './pages/WatchlistPage';
import './App.css';
import './styles/components.css';
import './styles/themes.css';

function AppContent() {
  const { searchQuery } = useSearch();
  const navigate = useNavigate();

  const handleItemClick = (item) => {
    const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
    navigate(`/detail/${mediaType}/${item.id}`);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">🎬 Entertainment Discovery</h1>
          <SearchBar />
        </div>
      </header>

      <main className="app-main">
        <Routes>
          <Route
            path="/"
            element={
              searchQuery.trim() ? (
                <SearchPage onItemClick={handleItemClick} />
              ) : (
                <HomePage onItemClick={handleItemClick} />
              )
            }
          />
          <Route
            path="/search"
            element={<SearchPage onItemClick={handleItemClick} />}
          />
          <Route
            path="/detail/:type/:id"
            element={<DetailPage />}
          />
          <Route
            path="/watchlist"
            element={<WatchlistPage />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Navigation />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <Router>
        <AppContent />
      </Router>
    </AppProvider>
  );
}

export default App;
