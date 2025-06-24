// @ts-check
/**
 * Data isolation utilities to prevent circular references by creating completely new objects
 * This approach creates deep copies with only primitive values and plain objects
 */

import {
  SafeContentItem,
  SafeWatchlistItem,
  RawContentData,
  isSafeContentItem,
  isSafeWatchlistItem,
  isDOMElement,
  hasReactFiberProperties,
  extractSafeString,
  extractSafeNumber,
  extractSafeBoolean
} from '../types/content.ts';

/**
 * Create a completely isolated copy of an object with only safe properties
 * This is more aggressive than cleaning - it rebuilds the object from scratch
 */
export function createIsolatedCopy(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  // Handle primitives
  if (typeof obj !== 'object') {
    return obj;
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => createIsolatedCopy(item));
  }
  
  // Handle dates
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  // For objects, only copy enumerable own properties with safe values
  const isolated = {};
  
  try {
    // Get only enumerable own properties
    const keys = Object.keys(obj);
    
    for (const key of keys) {
      // Skip any key that looks like React internals
      if (key.startsWith('__') || key.startsWith('_react') || 
          key === 'ref' || key === 'key' || key === '_owner' || key === '_store') {
        continue;
      }
      
      try {
        const value = obj[key];
        
        // Only include safe types
        if (value === null || value === undefined) {
          isolated[key] = value;
        } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          isolated[key] = value;
        } else if (value instanceof Date) {
          isolated[key] = new Date(value.getTime());
        } else if (Array.isArray(value)) {
          isolated[key] = createIsolatedCopy(value);
        } else if (typeof value === 'object' && value.constructor === Object) {
          // Only plain objects, not DOM elements or React components
          isolated[key] = createIsolatedCopy(value);
        }
        // Skip functions, DOM elements, React components, etc.
      } catch (error) {
        // Skip properties that can't be accessed
        continue;
      }
    }
  } catch (error) {
    // If we can't enumerate properties, return a minimal object
    return {};
  }
  
  return isolated;
}

/**
 * Create a safe watchlist item with guaranteed isolation
 * @param {RawContentData} sourceItem - Raw content data that might be contaminated
 * @returns {SafeWatchlistItem} - Guaranteed safe watchlist item
 */
export function createSafeWatchlistItem(sourceItem) {
  // Reject DOM elements immediately
  if (isDOMElement(sourceItem)) {
    console.warn('Rejected DOM element in createSafeWatchlistItem');
    return createFallbackWatchlistItem();
  }

  // Reject objects with React fiber properties
  if (hasReactFiberProperties(sourceItem)) {
    console.warn('Rejected object with React fiber properties in createSafeWatchlistItem');
    return createFallbackWatchlistItem();
  }

  // Extract only the properties we need, ensuring they're primitives
  /** @type {SafeWatchlistItem} */
  const safeItem = {
    id: null,
    title: '',
    poster_path: null,
    poster_url: null,
    media_type: 'movie',
    release_date: null,
    vote_average: null,
    overview: null,
    watched: false,
    added_at: new Date().toISOString()
  };
  
  try {
    // Safely extract each property using TypeScript utility functions
    if (sourceItem && typeof sourceItem === 'object') {
      // ID - ensure it's a number
      const extractedId = extractSafeNumber(sourceItem.id);
      if (extractedId !== null) {
        safeItem.id = extractedId;
      }

      // Title - ensure it's a string
      const title = sourceItem.title || sourceItem.name;
      const extractedTitle = extractSafeString(title, 500);
      if (extractedTitle !== null) {
        safeItem.title = extractedTitle;
      }
      
      // Poster path - ensure it's a string
      const extractedPosterPath = extractSafeString(sourceItem.poster_path, 200);
      if (extractedPosterPath !== null) {
        safeItem.poster_path = extractedPosterPath;
      }

      // Poster URL - ensure it's a string
      const extractedPosterUrl = extractSafeString(sourceItem.poster_url, 500);
      if (extractedPosterUrl !== null) {
        safeItem.poster_url = extractedPosterUrl;
      }

      // Media type - ensure it's a valid string
      const mediaType = sourceItem.media_type || (sourceItem.title ? 'movie' : 'tv');
      const extractedMediaType = extractSafeString(mediaType, 20);
      if (extractedMediaType === 'movie' || extractedMediaType === 'tv') {
        safeItem.media_type = extractedMediaType;
      }

      // Release date - ensure it's a string
      const releaseDate = sourceItem.release_date || sourceItem.first_air_date;
      const extractedReleaseDate = extractSafeString(releaseDate, 50);
      if (extractedReleaseDate !== null) {
        safeItem.release_date = extractedReleaseDate;
      }

      // Vote average - ensure it's a number
      const extractedVoteAverage = extractSafeNumber(sourceItem.vote_average);
      if (extractedVoteAverage !== null) {
        safeItem.vote_average = extractedVoteAverage;
      }

      // Overview - ensure it's a string
      const extractedOverview = extractSafeString(sourceItem.overview, 2000);
      if (extractedOverview !== null) {
        safeItem.overview = extractedOverview;
      }

      // Watched status
      safeItem.watched = extractSafeBoolean(sourceItem.watched, false);

      // Added at timestamp
      const extractedAddedAt = extractSafeString(sourceItem.added_at);
      if (extractedAddedAt !== null) {
        safeItem.added_at = extractedAddedAt;
      }
    }
  } catch (error) {
    console.warn('Error creating safe watchlist item:', error);
    return createFallbackWatchlistItem();
  }

  // Validate the final item before returning
  if (!isSafeWatchlistItem(safeItem)) {
    console.warn('Created item failed safety validation, using fallback');
    return createFallbackWatchlistItem();
  }

  return safeItem;
}

/**
 * Create a fallback watchlist item when all else fails
 * @returns {SafeWatchlistItem}
 */
function createFallbackWatchlistItem() {
  /** @type {SafeWatchlistItem} */
  return {
    id: Date.now(), // Use timestamp as fallback ID
    title: 'Unknown Title',
    poster_path: null,
    poster_url: null,
    media_type: 'movie',
    release_date: null,
    vote_average: null,
    overview: null,
    watched: false,
    added_at: new Date().toISOString()
  };
}

/**
 * Create a safe content item for navigation
 * @param {RawContentData} sourceItem - Raw content data that might be contaminated
 * @returns {SafeContentItem | null} - Safe content item or null if invalid
 */
export function createSafeContentItem(sourceItem) {
  if (!sourceItem || typeof sourceItem !== 'object') {
    return null;
  }

  // Reject DOM elements immediately
  if (isDOMElement(sourceItem)) {
    console.warn('Rejected DOM element in createSafeContentItem');
    return null;
  }

  // Reject objects with React fiber properties
  if (hasReactFiberProperties(sourceItem)) {
    console.warn('Rejected object with React fiber properties in createSafeContentItem');
    return null;
  }

  try {
    const extractedId = extractSafeNumber(sourceItem.id);
    const title = sourceItem.title || sourceItem.name;
    const extractedTitle = extractSafeString(title, 200);
    const mediaType = sourceItem.media_type || (sourceItem.title ? 'movie' : 'tv');
    const extractedMediaType = extractSafeString(mediaType, 20);

    if (extractedId === null || extractedTitle === null) {
      return null;
    }

    if (extractedMediaType !== 'movie' && extractedMediaType !== 'tv') {
      return null;
    }

    /** @type {SafeContentItem} */
    const safeItem = {
      id: extractedId,
      title: extractedTitle,
      media_type: extractedMediaType
    };

    // Validate before returning
    if (!isSafeContentItem(safeItem)) {
      console.warn('Created content item failed safety validation');
      return null;
    }

    return safeItem;
  } catch (error) {
    console.warn('Error creating safe content item:', error);
    return null;
  }
}

/**
 * Completely isolate and rebuild an object to prevent any circular references
 */
export function deepIsolate(obj) {
  try {
    // Convert to JSON and back to break all references
    const jsonString = JSON.stringify(obj, (key, value) => {
      // Only include safe primitive values
      if (value === null || value === undefined) {
        return value;
      }
      
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return value;
      }
      
      if (Array.isArray(value)) {
        return value;
      }
      
      if (typeof value === 'object' && value.constructor === Object) {
        return value;
      }
      
      // Skip everything else
      return undefined;
    });
    
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('Deep isolation failed, using createIsolatedCopy:', error);
    return createIsolatedCopy(obj);
  }
}

/**
 * Validate that an object is safe for JSON serialization
 */
export function validateSafeForSerialization(obj) {
  try {
    JSON.stringify(obj);
    return true;
  } catch (error) {
    if (error.message && error.message.includes('circular')) {
      console.warn('Object contains circular references:', error);
      return false;
    }
    throw error; // Re-throw non-circular errors
  }
}

/**
 * Emergency data isolation - strips everything except basic properties
 */
export function emergencyDataIsolation(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }

  // For arrays, isolate each item
  if (Array.isArray(data)) {
    return data.map(item => emergencyDataIsolation(item));
  }

  // For objects, only keep safe primitive properties
  const isolated = {};
  const safeKeys = ['id', 'title', 'name', 'type', 'media_type', 'poster_path', 'poster_url',
                   'release_date', 'first_air_date', 'vote_average', 'overview', 'watched', 'added_at'];

  for (const key of safeKeys) {
    if (data.hasOwnProperty(key)) {
      const value = data[key];
      if (typeof value === 'string' || typeof value === 'number' ||
          typeof value === 'boolean' || value === null || value === undefined) {
        isolated[key] = value;
      }
    }
  }

  return isolated;
}
