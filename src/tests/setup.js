import '@testing-library/jest-dom'

// Mock environment variables for tests
global.import = {
  meta: {
    env: {
      VITE_TMDB_API_KEY: 'test_tmdb_key',
      VITE_TMDB_BASE_URL: 'https://api.themoviedb.org/3',
      VITE_TMDB_IMAGE_BASE_URL: 'https://image.tmdb.org/t/p'
    }
  }
}

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock
