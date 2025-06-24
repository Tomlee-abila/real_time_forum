import axios from 'axios';

// API Configuration
const config = {
  tmdb: {
    baseURL: import.meta.env.VITE_TMDB_BASE_URL,
    apiKey: import.meta.env.VITE_TMDB_API_KEY,
    imageBaseURL: import.meta.env.VITE_TMDB_IMAGE_BASE_URL,
  },
};

// Create axios instance
const tmdbApi = axios.create({
  baseURL: config.tmdb.baseURL,
  timeout: 10000,
});

// Request interceptor to add API key
tmdbApi.interceptors.request.use((config) => {
  config.params = {
    ...config.params,
    api_key: config.tmdb.apiKey,
  };
  return config;
});

// Response interceptors for error handling
const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    console.error(`API Error ${status}:`, data);
    
    switch (status) {
      case 401:
        throw new Error('Invalid API key. Please check your configuration.');
      case 404:
        throw new Error('Content not found.');
      case 429:
        throw new Error('Rate limit exceeded. Please try again later.');
      case 500:
        throw new Error('Server error. Please try again later.');
      default:
        throw new Error(data.status_message || 'An error occurred while fetching data.');
    }
  } else if (error.request) {
    // Network error
    console.error('Network Error:', error.request);
    throw new Error('Network error. Please check your internet connection.');
  } else {
    // Other error
    console.error('Error:', error.message);
    throw new Error('An unexpected error occurred.');
  }
};

tmdbApi.interceptors.response.use(
  (response) => response,
  handleApiError
);

export { tmdbApi, config };
