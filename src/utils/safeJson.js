/**
 * Safe JSON utilities to handle circular references and non-serializable objects
 */

/**
 * Safely stringify an object, handling circular references and React-specific properties
 * @param {any} obj - The object to stringify
 * @param {number} space - Number of spaces for indentation (optional)
 * @returns {string} - JSON string
 */
export function safeStringify(obj, space = 0) {
  const seen = new WeakSet();

  return JSON.stringify(obj, (key, value) => {
    // Skip React-specific properties first (before checking value type)
    if (key.startsWith('__reactFiber') ||
        key.startsWith('__reactInternalInstance') ||
        key.startsWith('_reactInternalFiber') ||
        key === '_owner' ||
        key === '_store' ||
        key === 'ref' ||
        key === 'key') {
      return undefined;
    }

    // Skip functions and undefined values
    if (typeof value === 'function' || value === undefined) {
      return undefined;
    }

    // Handle circular references
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular Reference]';
      }
      seen.add(value);

      // Skip DOM elements
      if (value instanceof Element || value instanceof Node) {
        return undefined;
      }

      // Skip React synthetic events
      if (value.nativeEvent && value.currentTarget) {
        return undefined;
      }
    }

    return value;
  }, space);
}

/**
 * Safely parse JSON with error handling
 * @param {string} jsonString - The JSON string to parse
 * @param {any} fallback - Fallback value if parsing fails
 * @returns {any} - Parsed object or fallback
 */
export function safeParse(jsonString, fallback = null) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('JSON parse error:', error);
    return fallback;
  }
}

/**
 * Clean an object to ensure it only contains serializable properties
 * @param {any} obj - The object to clean
 * @returns {any} - Cleaned object
 */
export function cleanForSerialization(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(cleanForSerialization);
  }
  
  const cleaned = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Skip React-specific properties
    if (key.startsWith('__react') || 
        key.startsWith('_react') ||
        key === '_owner' || 
        key === '_store' || 
        key === 'ref' || 
        key === 'key') {
      continue;
    }
    
    // Skip functions
    if (typeof value === 'function') {
      continue;
    }
    
    // Skip DOM elements
    if (value instanceof Element || value instanceof Node) {
      continue;
    }
    
    // Skip React synthetic events
    if (value && typeof value === 'object' && value.nativeEvent && value.currentTarget) {
      continue;
    }
    
    // Recursively clean nested objects
    if (typeof value === 'object' && value !== null) {
      cleaned[key] = cleanForSerialization(value);
    } else {
      cleaned[key] = value;
    }
  }
  
  return cleaned;
}

/**
 * Create a safe copy of watchlist item with only necessary properties
 * @param {object} item - The item to clean
 * @returns {object} - Clean watchlist item
 */
export function createSafeWatchlistItem(item) {
  return {
    id: typeof item.id === 'number' ? item.id : parseInt(item.id, 10),
    title: String(item.title || item.name || 'Unknown Title'),
    poster_path: item.poster_path ? String(item.poster_path) : null,
    poster_url: item.poster_url ? String(item.poster_url) : null,
    media_type: String(item.media_type || (item.title ? 'movie' : 'tv')),
    release_date: item.release_date || item.first_air_date || null,
    vote_average: typeof item.vote_average === 'number' ? item.vote_average : 0,
    overview: item.overview ? String(item.overview) : null,
    watched: Boolean(item.watched),
    added_at: item.added_at || new Date().toISOString(),
  };
}
