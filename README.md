# 🎬 Entertainment Discovery App

A comprehensive movie and TV show discovery platform built with React and Vite. Users can search for entertainment content, view detailed information, manage personal watchlists, and discover trending content.

## ✨ Features

### Core Features
- 🔍 **Real-time Search** - Instant search for movies and TV shows with debouncing (300ms)
- 🎬 **Detailed Content Pages** - Comprehensive movie/TV information with cast, crew, and trailers
- 📋 **Advanced Watchlist** - Full watchlist management with statistics and export functionality
- 🔥 **Trending Content** - Daily and weekly trending movies and TV shows
- ⭐ **Multi-source Ratings** - Enhanced ratings from IMDB, Rotten Tomatoes, and Metacritic
- 🎭 **Cast & Crew Info** - Actor photos, character names, and key crew details
- 🎞️ **Trailer Integration** - Direct YouTube trailer links
- 🔄 **Similar Content** - Recommendations and similar titles
- 🌙 **Dark/Light Themes** - Complete theme system with smooth transitions
- 📱 **Mobile-First Design** - Responsive design optimized for all devices

### Advanced Features
- 📊 **Watchlist Analytics** - Comprehensive statistics and progress tracking
- 🔍 **Advanced Filtering** - Filter by media type, watch status, and sort options
- 💾 **Data Export** - Export watchlist as CSV for external use
- 📎 **Bulk Operations** - Mark all as watched, clear entire watchlist
- 🧭 **Smart Navigation** - Bottom navigation with active state indicators
- 🔔 **Real-time Badges** - Live watchlist count and status updates
- ⚡ **Infinite Scroll** - Seamless pagination for search results
- 🎨 **Smooth Animations** - Polished hover effects and transitions

### Technical Features
- 🛡️ **Robust Error Handling** - Comprehensive error states with retry functionality
- 💾 **Intelligent Caching** - 5-10 minute API response caching for optimal performance
- 🚦 **Rate Limiting** - Graceful API rate limit handling with fallbacks
- 🔒 **Secure Configuration** - Environment variable management for API keys
- 🎣 **Custom Hooks** - Specialized React hooks for complex state management
- 🔄 **Global State** - React Context with reducer pattern for state management
- 📱 **Responsive Grid** - CSS Grid and Flexbox for adaptive layouts
- 🧪 **Comprehensive Testing** - 34 tests covering components, hooks, and utilities

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- TMDB API key ([Get one here](https://www.themoviedb.org/settings/api))

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

   Edit `.env` and add your API key:
   ```env
   VITE_TMDB_API_KEY=your_tmdb_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

### Quick Demo
- 🔍 **Search** for any movie or TV show (try "Inception" or "Breaking Bad")
- 🎬 **Click** on any content card to view detailed information
- ➕ **Add items** to your watchlist using the plus button
- 📋 **Visit** the watchlist page to manage your saved content
- 🌙 **Toggle** between light and dark themes
- 📱 **Test** the responsive design on different screen sizes

## 🎯 Key Features Showcase

### 🏠 Home Page
- **Hero Section** with gradient background and call-to-action
- **Trending Content** with daily/weekly toggle
- **Popular Movies** and **TV Shows** sections
- **Responsive Grid** layout adapting to screen size

### 🔍 Search Experience
- **Real-time Search** with 300ms debouncing for optimal performance
- **Media Type Filtering** (All, Movies, TV Shows)
- **Infinite Scroll** for seamless result browsing
- **Search Statistics** showing total results and active filters

### 🎬 Detailed Content Pages
- **Cinematic Hero Section** with backdrop images and key information
- **Tabbed Interface** organizing content into logical sections:
  - **Overview**: Plot summary, enhanced ratings, awards
  - **Cast & Crew**: Actor photos with character names and key crew
  - **Details**: Technical info, production details, budget/revenue
  - **Similar**: Recommendations and related content
- **Watchlist Integration** with one-click add/remove functionality
- **Trailer Links** direct to YouTube for instant viewing

### 📋 Watchlist Management
- **Comprehensive Dashboard** with visual statistics
- **Advanced Filtering** by media type and watch status
- **Multiple Sorting Options** (date added, title, release date, rating)
- **Bulk Operations** for efficient list management
- **CSV Export** for external data usage
- **Progress Tracking** with completion percentages

### 🎨 User Experience
- **Dark/Light Themes** with smooth transitions and persistent preferences
- **Mobile Navigation** with bottom tab bar and active indicators
- **Touch-Optimized** interface for mobile devices
- **Loading States** and **Error Handling** throughout the application
- **Accessibility Features** with proper ARIA labels and keyboard navigation

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Run tests with coverage

## 🛠️ Technology Stack

### Frontend Framework
- **React 19** - Latest React with modern features and optimizations
- **Vite** - Fast build tool with hot module replacement
- **React Router DOM** - Client-side routing with dynamic parameters

### State Management
- **React Context API** - Global state management with useReducer pattern
- **Custom Hooks** - Specialized hooks for search, watchlist, and content operations
- **localStorage** - Persistent storage for user preferences and watchlist data

### Styling & UI
- **CSS3** - Modern CSS with Grid, Flexbox, and custom properties
- **CSS Custom Properties** - Dynamic theming system for dark/light modes
- **Responsive Design** - Mobile-first approach with desktop enhancements
- **Lucide React** - Beautiful, customizable icons

### API Integration
- **Axios** - HTTP client with interceptors and error handling
- **TMDB API** - Comprehensive source for movie and TV show data

### Testing
- **Vitest** - Fast unit testing framework
- **React Testing Library** - Component testing utilities
- **jsdom** - DOM simulation for testing environment

### Development Tools
- **ESLint** - Code linting and quality enforcement
- **Git Workflow** - Feature branches with pull request reviews
- **Environment Variables** - Secure API key management

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── SearchBar.jsx           # Advanced search with filters
│   ├── ContentCard.jsx         # Movie/TV show cards
│   ├── ContentGrid.jsx         # Responsive grid layout
│   ├── Navigation.jsx          # Bottom navigation
│   ├── LoadingSpinner.jsx      # Loading indicators
│   └── ErrorMessage.jsx        # Error handling UI
├── pages/              # Page components
│   ├── HomePage.jsx            # Main landing page
│   ├── SearchPage.jsx          # Search results
│   ├── DetailPage.jsx          # Content detail view
│   └── WatchlistPage.jsx       # Watchlist management
├── services/           # API services and utilities
│   ├── api.js                  # Base API configuration
│   ├── tmdbService.js          # TMDB API integration
│   └── entertainmentService.js # Entertainment service layer
├── hooks/              # Custom React hooks
│   ├── useSearch.js            # Search functionality
│   ├── useWatchlist.js         # Watchlist management
│   └── useContent.js           # Content loading
├── utils/              # Utility functions
│   ├── formatters.js           # Data formatting utilities
│   └── debounce.js             # Performance utilities
├── contexts/           # React contexts
│   └── AppContext.jsx          # Global state management
├── styles/             # Styling
│   ├── components.css          # Component styles
│   └── themes.css              # Theme system
└── tests/              # Test files
    ├── components/             # Component tests
    ├── hooks/                  # Hook tests
    ├── services/               # Service tests
    └── utils/                  # Utility tests
```

## 🔌 API Integration

### TMDB API
- Comprehensive source for movie/TV data
- Images and trending content
- Genre information
- Ratings and detailed metadata

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
- [Lucide React](https://lucide.dev/) for beautiful icons
