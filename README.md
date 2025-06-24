# 🎬 Entertainment Discovery App

A comprehensive movie and TV show discovery platform built with React and Vite. Users can search for entertainment content, view detailed information, manage personal watchlists, and discover trending content.

## ✨ Features

### Core Features
- 🔍 **Search Functionality** - Real-time search for movies and TV shows with debouncing
- 📱 **Detailed View Pages** - Complete information including plot, cast, ratings, and poster images
- 📝 **Personal Watchlist** - Add/remove titles and mark as watched (localStorage)
- 🔥 **Trending Dashboard** - Popular movies and shows
- 🎭 **Genre Filtering** - Browse content by categories
- ⭐ **Multi-source Ratings** - IMDB, Rotten Tomatoes, and TMDB ratings
- 🤖 **Recommendation Engine** - Based on user's watchlist preferences
- 📱 **Responsive Design** - Mobile and desktop optimized

### Technical Features
- 🛡️ **Error Handling** - Comprehensive API error handling and loading states
- 📄 **Pagination** - Efficient content loading
- 💾 **Caching** - API response caching for improved performance
- 🚦 **Rate Limiting** - Graceful API rate limit handling
- 🔒 **Secure API Keys** - Environment variable management
- ⚡ **Performance Optimized** - Debounced search and optimized rendering

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- TMDB API key
- OMDB API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/vomolo/entertainment-discovery-app.git
   cd entertainment-discovery-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your API keys:
   ```env
   VITE_TMDB_API_KEY=your_tmdb_api_key_here
   VITE_OMDB_API_KEY=your_omdb_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Run tests with coverage

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── services/           # API services and utilities
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── contexts/           # React contexts
├── styles/             # Global styles
└── tests/              # Test files
```

## 🔌 API Integration

### TMDB API
- Primary source for movie/TV data
- Images and trending content
- Genre information

### OMDB API
- Additional ratings and plot information
- Fallback data source

## 🧪 Testing

The project uses Vitest for testing with React Testing Library.

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [TMDB](https://www.themoviedb.org/) for providing comprehensive movie data
- [OMDB](https://www.omdbapi.com/) for additional movie information
- [Lucide React](https://lucide.dev/) for beautiful icons
