import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppProvider } from '../../contexts/AppContext';
import { useWatchlist } from '../../hooks/useWatchlist';
import React from 'react';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Test component that uses watchlist
function TestWatchlistComponent() {
  const { addToWatchlist, watchlist } = useWatchlist();

  const handleAddItem = () => {
    // Create an item that might have circular references (simulating real API data)
    const mockItem = {
      id: 123,
      title: 'Test Movie',
      poster_path: '/test.jpg',
      media_type: 'movie',
      release_date: '2023-01-01',
      vote_average: 8.5,
      overview: 'A test movie',
    };

    // Simulate adding React-specific properties that could cause circular references
    mockItem.__reactFiber$test = { stateNode: mockItem }; // Circular reference
    mockItem.someFunction = () => 'test'; // Function
    mockItem.domElement = document.createElement('div'); // DOM element

    addToWatchlist(mockItem);
  };

  return (
    <div>
      <button onClick={handleAddItem} data-testid="add-button">
        Add to Watchlist
      </button>
      <div data-testid="watchlist-count">
        Watchlist: {watchlist.length} items
      </div>
    </div>
  );
}

describe('Watchlist Serialization', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
  });

  it('should handle items with circular references without throwing errors', () => {
    // Mock localStorage.getItem to return empty array initially
    localStorageMock.getItem.mockReturnValue('[]');

    render(
      <AppProvider>
        <TestWatchlistComponent />
      </AppProvider>
    );

    // Initially should show 0 items
    expect(screen.getByTestId('watchlist-count')).toHaveTextContent('Watchlist: 0 items');

    // Add an item with potential circular references
    const addButton = screen.getByTestId('add-button');
    
    // This should not throw an error
    expect(() => {
      fireEvent.click(addButton);
    }).not.toThrow();

    // Should show 1 item after adding
    expect(screen.getByTestId('watchlist-count')).toHaveTextContent('Watchlist: 1 items');

    // Verify that localStorage.setItem was called (meaning serialization worked)
    expect(localStorageMock.setItem).toHaveBeenCalled();
    
    // Get the last call to setItem to check the serialized data
    const setItemCalls = localStorageMock.setItem.mock.calls;
    const lastCall = setItemCalls[setItemCalls.length - 1];
    
    expect(lastCall[0]).toBe('entertainment-watchlist');
    
    // The serialized data should be valid JSON
    expect(() => {
      JSON.parse(lastCall[1]);
    }).not.toThrow();

    // Parse the data and verify it contains the expected item
    const parsedData = JSON.parse(lastCall[1]);
    expect(parsedData).toHaveLength(1);
    expect(parsedData[0]).toMatchObject({
      id: 123,
      title: 'Test Movie',
      poster_path: '/test.jpg',
      media_type: 'movie',
      release_date: '2023-01-01',
      vote_average: 8.5,
      overview: 'A test movie',
      watched: false
    });

    // Verify that React-specific properties are not included
    const serializedItem = parsedData[0];
    expect(serializedItem).not.toHaveProperty('__reactFiber$test');
    expect(serializedItem).not.toHaveProperty('someFunction');
    expect(serializedItem).not.toHaveProperty('domElement');
  });

  it('should handle localStorage errors gracefully', () => {
    // Mock localStorage.getItem to return empty array initially
    localStorageMock.getItem.mockReturnValue('[]');
    
    // Mock setItem to throw an error (simulating storage quota exceeded)
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    // Mock console.error to avoid noise in test output
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <AppProvider>
        <TestWatchlistComponent />
      </AppProvider>
    );

    const addButton = screen.getByTestId('add-button');
    
    // This should not throw an error even when localStorage fails
    expect(() => {
      fireEvent.click(addButton);
    }).not.toThrow();

    // Should still show 1 item (in memory state should work)
    expect(screen.getByTestId('watchlist-count')).toHaveTextContent('Watchlist: 1 items');

    // Verify that error was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error saving watchlist to localStorage'),
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('should load watchlist from localStorage on mount', () => {
    const mockWatchlistData = JSON.stringify([
      {
        id: 456,
        title: 'Saved Movie',
        poster_path: '/saved.jpg',
        media_type: 'movie',
        release_date: '2022-01-01',
        vote_average: 7.5,
        overview: 'A saved movie',
        watched: true,
        added_at: '2023-01-01T00:00:00.000Z'
      }
    ]);

    localStorageMock.getItem.mockReturnValue(mockWatchlistData);

    render(
      <AppProvider>
        <TestWatchlistComponent />
      </AppProvider>
    );

    // Should show the loaded item
    expect(screen.getByTestId('watchlist-count')).toHaveTextContent('Watchlist: 1 items');
    
    // Verify that getItem was called
    expect(localStorageMock.getItem).toHaveBeenCalledWith('entertainment-watchlist');
  });
});
