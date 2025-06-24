/**
 * Format runtime from minutes to hours and minutes
 * @param {number} minutes - Runtime in minutes
 * @returns {string} - Formatted runtime
 */
export function formatRuntime(minutes) {
  if (minutes === null || minutes === undefined) return 'N/A';
  if (minutes === 0) return '0m';

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  return remainingMinutes === 0
    ? `${hours}h`
    : `${hours}h ${remainingMinutes}m`;
}

/**
 * Format date to readable format
 * @param {string} dateString - Date string
 * @returns {string} - Formatted date
 */
export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return dateString;
  }
}

/**
 * Format year from date string
 * @param {string} dateString - Date string
 * @returns {string} - Year
 */
export function formatYear(dateString) {
  if (!dateString) return 'N/A';
  
  try {
    return new Date(dateString).getFullYear().toString();
  } catch (error) {
    return 'N/A';
  }
}

/**
 * Format vote average to percentage
 * @param {number} voteAverage - Vote average (0-10)
 * @returns {string} - Formatted percentage
 */
export function formatRating(voteAverage) {
  if (voteAverage === null || voteAverage === undefined) return 'N/A';
  return `${Math.round(voteAverage * 10)}%`;
}

/**
 * Format vote count with K/M suffixes
 * @param {number} voteCount - Vote count
 * @returns {string} - Formatted vote count
 */
export function formatVoteCount(voteCount) {
  if (!voteCount) return '0';
  
  if (voteCount >= 1000000) {
    return `${(voteCount / 1000000).toFixed(1)}M`;
  }
  
  if (voteCount >= 1000) {
    return `${(voteCount / 1000).toFixed(1)}K`;
  }
  
  return voteCount.toString();
}

/**
 * Format currency
 * @param {number} amount - Amount in dollars
 * @returns {string} - Formatted currency
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return 'N/A';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
export function truncateText(text, maxLength = 150) {
  if (!text) return '';
  
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Get media type display name
 * @param {string} mediaType - Media type (movie, tv, person)
 * @returns {string} - Display name
 */
export function getMediaTypeDisplay(mediaType) {
  const types = {
    movie: 'Movie',
    tv: 'TV Show',
    person: 'Person',
  };
  
  return types[mediaType] || 'Unknown';
}

/**
 * Format genre list
 * @param {Array} genres - Array of genre objects
 * @returns {string} - Comma-separated genre names
 */
export function formatGenres(genres) {
  if (!genres || !Array.isArray(genres) || genres.length === 0) return 'N/A';

  return genres.map(genre => genre.name).join(', ');
}
