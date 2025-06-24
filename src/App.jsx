import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { useSearch } from './hooks/useSearch';
import SearchBar from './components/SearchBar';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import './App.css';
import './styles/components.css';

function AppContent() {
  const { searchQuery } = useSearch();
  const [selectedItem, setSelectedItem] = useState(null);

  const handleItemClick = (item) => {
    setSelectedItem(item);
    // TODO: Navigate to detail page or open modal
    console.log('Item clicked:', item);
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="app-footer">
        <p>&copy; 2024 Entertainment Discovery App. Built with React & TMDB API.</p>
      </footer>
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
