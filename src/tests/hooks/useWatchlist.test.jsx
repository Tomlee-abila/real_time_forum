import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWatchlist } from '../../hooks/useWatchlist';
import { AppProvider } from '../../contexts/AppContext';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

const wrapper = ({ children }) => <AppProvider>{children}</AppProvider>;

describe('useWatchlist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should add item to watchlist', () => {
    const { result } = renderHook(() => useWatchlist(), { wrapper });

    const testItem = {
      id: 1,
      title: 'Test Movie',
      poster_path: '/test.jpg',
      media_type: 'movie',
      release_date: '2023-01-01',
      vote_average: 8.5,
      overview: 'Test overview'
    };

    act(() => {
      result.current.addToWatchlist(testItem);
    });

    expect(result.current.watchlist).toHaveLength(1);
    expect(result.current.isInWatchlist(1)).toBe(true);
    expect(result.current.watchlist[0]).toMatchObject({
      id: 1,
      title: 'Test Movie',
      watched: false
    });
  });

  it('should remove item from watchlist', () => {
    const { result } = renderHook(() => useWatchlist(), { wrapper });

    const testItem = {
      id: 1,
      title: 'Test Movie',
      media_type: 'movie'
    };

    act(() => {
      result.current.addToWatchlist(testItem);
    });

    expect(result.current.watchlist).toHaveLength(1);

    act(() => {
      result.current.removeFromWatchlist(1);
    });

    expect(result.current.watchlist).toHaveLength(0);
    expect(result.current.isInWatchlist(1)).toBe(false);
  });

  it('should toggle watched status', () => {
    const { result } = renderHook(() => useWatchlist(), { wrapper });

    const testItem = {
      id: 1,
      title: 'Test Movie',
      media_type: 'movie'
    };

    act(() => {
      result.current.addToWatchlist(testItem);
    });

    expect(result.current.getWatchlistItem(1).watched).toBe(false);

    act(() => {
      result.current.toggleWatched(1);
    });

    expect(result.current.getWatchlistItem(1).watched).toBe(true);

    act(() => {
      result.current.toggleWatched(1);
    });

    expect(result.current.getWatchlistItem(1).watched).toBe(false);
  });

  it('should get watchlist stats', () => {
    const { result } = renderHook(() => useWatchlist(), { wrapper });

    const movie = { id: 1, title: 'Movie', media_type: 'movie' };
    const tvShow = { id: 2, title: 'TV Show', media_type: 'tv' };

    act(() => {
      result.current.addToWatchlist(movie);
      result.current.addToWatchlist(tvShow);
      result.current.toggleWatched(1); // Mark movie as watched
    });

    const stats = result.current.getWatchlistStats();

    expect(stats).toEqual({
      total: 2,
      watched: 1,
      unwatched: 1,
      movies: 1,
      tvShows: 1
    });
  });

  it('should filter watchlist', () => {
    const { result } = renderHook(() => useWatchlist(), { wrapper });

    const movie = { id: 1, title: 'Movie', media_type: 'movie' };
    const tvShow = { id: 2, title: 'TV Show', media_type: 'tv' };

    act(() => {
      result.current.addToWatchlist(movie);
      result.current.addToWatchlist(tvShow);
      result.current.toggleWatched(1);
    });

    // Filter by media type
    const movies = result.current.filterWatchlist({ mediaType: 'movie' });
    expect(movies).toHaveLength(1);
    expect(movies[0].media_type).toBe('movie');

    // Filter by watched status
    const watched = result.current.filterWatchlist({ watched: true });
    expect(watched).toHaveLength(1);
    expect(watched[0].watched).toBe(true);

    // Filter by unwatched status
    const unwatched = result.current.filterWatchlist({ watched: false });
    expect(unwatched).toHaveLength(1);
    expect(unwatched[0].watched).toBe(false);
  });

  it('should clear watchlist', () => {
    const { result } = renderHook(() => useWatchlist(), { wrapper });

    const testItem = { id: 1, title: 'Test Movie', media_type: 'movie' };

    act(() => {
      result.current.addToWatchlist(testItem);
    });

    expect(result.current.watchlist).toHaveLength(1);

    act(() => {
      result.current.clearWatchlist();
    });

    expect(result.current.watchlist).toHaveLength(0);
  });
});
