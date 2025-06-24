import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ContentCard from '../../components/ContentCard';
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

const mockItem = {
  id: 1,
  title: 'Test Movie',
  poster_path: '/test.jpg',
  media_type: 'movie',
  release_date: '2023-01-01',
  vote_average: 8.5,
  overview: 'This is a test movie overview that should be displayed in the card.'
};

describe('ContentCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should render movie information correctly', () => {
    render(
      <ContentCard item={mockItem} />,
      { wrapper }
    );

    expect(screen.getByText('Test Movie')).toBeInTheDocument();
    expect(screen.getByText('2023')).toBeInTheDocument();
    expect(screen.getByText('8.5')).toBeInTheDocument();
    expect(screen.getByText(/This is a test movie overview/)).toBeInTheDocument();
    expect(screen.getByText('Movie')).toBeInTheDocument();
  });

  it('should render TV show information correctly', () => {
    const tvItem = {
      ...mockItem,
      name: 'Test TV Show',
      title: undefined,
      media_type: 'tv',
      first_air_date: '2023-01-01',
      release_date: undefined
    };

    render(
      <ContentCard item={tvItem} />,
      { wrapper }
    );

    expect(screen.getByText('Test TV Show')).toBeInTheDocument();
    expect(screen.getByText('TV Show')).toBeInTheDocument();
  });

  it('should handle missing poster image', () => {
    const itemWithoutPoster = {
      ...mockItem,
      poster_path: null
    };

    render(
      <ContentCard item={itemWithoutPoster} />,
      { wrapper }
    );

    expect(screen.getByText('No Image')).toBeInTheDocument();
  });

  it('should call onClick when card is clicked', () => {
    const handleClick = vi.fn();

    render(
      <ContentCard item={mockItem} onClick={handleClick} />,
      { wrapper }
    );

    fireEvent.click(screen.getByText('Test Movie').closest('.content-card'));
    expect(handleClick).toHaveBeenCalledWith(mockItem);
  });

  it('should add item to watchlist when plus button is clicked', () => {
    render(
      <ContentCard item={mockItem} />,
      { wrapper }
    );

    const addButton = screen.getByTitle('Add to watchlist');
    fireEvent.click(addButton);

    // After adding, the button should change to "Remove from watchlist"
    expect(screen.getByTitle('Remove from watchlist')).toBeInTheDocument();
  });

  it('should toggle watched status when eye button is clicked', () => {
    render(
      <ContentCard item={mockItem} />,
      { wrapper }
    );

    // First add to watchlist
    const addButton = screen.getByTitle('Add to watchlist');
    fireEvent.click(addButton);

    // Then toggle watched status
    const watchedButton = screen.getByTitle('Mark as watched');
    fireEvent.click(watchedButton);

    // Should show "Mark as unwatched" and "Watched" status
    expect(screen.getByTitle('Mark as unwatched')).toBeInTheDocument();
    expect(screen.getByText('Watched')).toBeInTheDocument();
  });

  it('should not show watchlist controls when disabled', () => {
    render(
      <ContentCard item={mockItem} showWatchlistControls={false} />,
      { wrapper }
    );

    expect(screen.queryByTitle('Add to watchlist')).not.toBeInTheDocument();
  });

  it('should handle items without vote average', () => {
    const itemWithoutRating = {
      ...mockItem,
      vote_average: 0
    };

    render(
      <ContentCard item={itemWithoutRating} />,
      { wrapper }
    );

    // Should not show rating elements
    expect(screen.queryByText('8.5')).not.toBeInTheDocument();
  });

  it('should truncate long titles and overviews', () => {
    const itemWithLongText = {
      ...mockItem,
      title: 'This is a very long movie title that should be truncated because it exceeds the maximum length',
      overview: 'This is a very long overview that should be truncated because it exceeds the maximum length limit that we have set for the overview text in the content card component.'
    };

    render(
      <ContentCard item={itemWithLongText} />,
      { wrapper }
    );

    // Should show truncated text with ellipsis
    expect(screen.getByText(/This is a very long movie title.*\.\.\./)).toBeInTheDocument();
    expect(screen.getByText(/This is a very long overview.*\.\.\./)).toBeInTheDocument();
  });
});
