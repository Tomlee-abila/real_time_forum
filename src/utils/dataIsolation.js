/**
 * Data isolation utilities to prevent circular references by creating completely new objects
 * This approach creates deep copies with only primitive values and plain objects
 */

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
 */
export function createSafeWatchlistItem(sourceItem) {
  // Extract only the properties we need, ensuring they're primitives
  const safeItem = {
    id: null,
    title: null,
    poster_path: null,
    poster_url: null,
    media_type: null,
    release_date: null,
    vote_average: null,
    overview: null,
    watched: false,
    added_at: new Date().toISOString()
  };
  
  try {
    // Safely extract each property
    if (sourceItem && typeof sourceItem === 'object') {
      // ID - ensure it's a number
      if (sourceItem.id !== undefined && sourceItem.id !== null) {
        const id = Number(sourceItem.id);
        if (!isNaN(id)) {
          safeItem.id = id;
        }
      }
      
      // Title - ensure it's a string
      const title = sourceItem.title || sourceItem.name;
      if (title && typeof title === 'string') {
        safeItem.title = String(title).slice(0, 500); // Limit length
      } else if (title) {
        safeItem.title = String(title).slice(0, 500);
      }
      
      // Poster path - ensure it's a string
      if (sourceItem.poster_path && typeof sourceItem.poster_path === 'string') {
        safeItem.poster_path = String(sourceItem.poster_path).slice(0, 200);
      }
      
      // Poster URL - ensure it's a string
      if (sourceItem.poster_url && typeof sourceItem.poster_url === 'string') {
        safeItem.poster_url = String(sourceItem.poster_url).slice(0, 500);
      }
      
      // Media type - ensure it's a string
      const mediaType = sourceItem.media_type || (sourceItem.title ? 'movie' : 'tv');
      if (mediaType && typeof mediaType === 'string') {
        safeItem.media_type = String(mediaType).slice(0, 20);
      }
      
      // Release date - ensure it's a string
      const releaseDate = sourceItem.release_date || sourceItem.first_air_date;
      if (releaseDate && typeof releaseDate === 'string') {
        safeItem.release_date = String(releaseDate).slice(0, 50);
      }
      
      // Vote average - ensure it's a number
      if (sourceItem.vote_average !== undefined && sourceItem.vote_average !== null) {
        const rating = Number(sourceItem.vote_average);
        if (!isNaN(rating)) {
          safeItem.vote_average = rating;
        }
      }
      
      // Overview - ensure it's a string
      if (sourceItem.overview && typeof sourceItem.overview === 'string') {
        safeItem.overview = String(sourceItem.overview).slice(0, 2000); // Limit length
      }
      
      // Watched status
      if (sourceItem.watched !== undefined) {
        safeItem.watched = Boolean(sourceItem.watched);
      }
      
      // Added at timestamp
      if (sourceItem.added_at && typeof sourceItem.added_at === 'string') {
        safeItem.added_at = String(sourceItem.added_at);
      }
    }
  } catch (error) {
    console.warn('Error creating safe watchlist item:', error);
    // Return minimal safe item
    return {
      id: Date.now(), // Use timestamp as fallback ID
      title: 'Unknown Title',
      poster_path: null,
      poster_url: null,
      media_type: 'movie',
      release_date: null,
      vote_average: 0,
      overview: null,
      watched: false,
      added_at: new Date().toISOString()
    };
  }
  
  return safeItem;
}

/**
 * Create a safe content item for navigation
 */
export function createSafeContentItem(sourceItem) {
  if (!sourceItem || typeof sourceItem !== 'object') {
    return null;
  }
  
  try {
    return {
      id: Number(sourceItem.id) || 0,
      title: String(sourceItem.title || sourceItem.name || 'Unknown').slice(0, 200),
      media_type: String(sourceItem.media_type || (sourceItem.title ? 'movie' : 'tv')).slice(0, 20)
    };
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
