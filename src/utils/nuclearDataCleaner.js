/**
 * Nuclear option for data cleaning - removes ALL potentially problematic properties
 * This is the most aggressive approach to prevent circular structure errors
 */

/**
 * Completely strips an object of any potentially dangerous properties
 * and creates a new clean object with only safe, primitive values
 */
export function nuclearClean(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  // If it's an array, clean each item
  if (Array.isArray(obj)) {
    return obj.map(item => nuclearClean(item)).filter(item => item !== null);
  }

  // Create a completely new object with only safe properties
  const cleanObj = {};
  
  // Define exactly which properties we allow (whitelist approach)
  const allowedProperties = [
    'id', 'title', 'name', 'overview', 'poster_path', 'poster_url',
    'backdrop_path', 'backdrop_url', 'release_date', 'first_air_date',
    'vote_average', 'vote_count', 'media_type', 'genre_ids', 'genres',
    'runtime', 'status', 'tagline', 'homepage', 'imdb_id',
    'watched', 'added_at', 'profile_path', 'profile_url',
    'character', 'job', 'department', 'known_for_department'
  ];

  for (const prop of allowedProperties) {
    if (obj.hasOwnProperty(prop)) {
      const value = obj[prop];
      
      // Only allow primitive values or clean nested objects
      if (value === null || value === undefined) {
        cleanObj[prop] = value;
      } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        cleanObj[prop] = value;
      } else if (typeof value === 'object' && !isContaminated(value)) {
        // Recursively clean nested objects
        cleanObj[prop] = nuclearClean(value);
      }
      // Skip anything else (functions, contaminated objects, etc.)
    }
  }

  return cleanObj;
}

/**
 * Check if an object is contaminated with React or DOM properties
 */
function isContaminated(obj) {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  try {
    // Check constructor
    const constructorName = obj.constructor?.name;
    if (constructorName && (
      constructorName.includes('HTML') ||
      constructorName.includes('Element') ||
      constructorName.includes('Node') ||
      constructorName.includes('Fiber') ||
      constructorName.includes('React')
    )) {
      return true;
    }

    // Check for DOM properties
    if ('nodeType' in obj || 'tagName' in obj || 'innerHTML' in obj) {
      return true;
    }

    // Check all keys for React fiber patterns
    const keys = Object.keys(obj);
    return keys.some(key => 
      key.includes('react') ||
      key.includes('React') ||
      key.includes('fiber') ||
      key.includes('Fiber') ||
      key.includes('__') ||
      key === 'stateNode' ||
      key === 'return' ||
      key === 'child' ||
      key === 'sibling'
    );
  } catch (error) {
    // If we can't inspect it safely, consider it contaminated
    return true;
  }
}

/**
 * Triple-safe cleaning with JSON round-trip
 */
export function tripleClean(obj) {
  try {
    // Step 1: Nuclear clean
    const step1 = nuclearClean(obj);
    
    // Step 2: JSON round-trip to remove any hidden properties
    const step2 = JSON.parse(JSON.stringify(step1));
    
    // Step 3: Nuclear clean again to be absolutely sure
    const step3 = nuclearClean(step2);
    
    return step3;
  } catch (error) {
    console.error('Triple clean failed:', error);
    return null;
  }
}

/**
 * Safe watchlist item creator - guaranteed clean
 */
export function createSafeWatchlistItem(sourceItem) {
  if (!sourceItem) {
    return null;
  }

  // Extract only the essential data we need
  const essentialData = {
    id: typeof sourceItem.id === 'number' ? sourceItem.id : Date.now(),
    title: typeof sourceItem.title === 'string' ? sourceItem.title : 
           typeof sourceItem.name === 'string' ? sourceItem.name : 'Unknown Title',
    poster_path: typeof sourceItem.poster_path === 'string' ? sourceItem.poster_path : null,
    poster_url: typeof sourceItem.poster_url === 'string' ? sourceItem.poster_url : null,
    media_type: typeof sourceItem.media_type === 'string' ? sourceItem.media_type : 'movie',
    release_date: typeof sourceItem.release_date === 'string' ? sourceItem.release_date :
                  typeof sourceItem.first_air_date === 'string' ? sourceItem.first_air_date : null,
    vote_average: typeof sourceItem.vote_average === 'number' ? sourceItem.vote_average : null,
    overview: typeof sourceItem.overview === 'string' ? sourceItem.overview : null,
    watched: false,
    added_at: new Date().toISOString()
  };

  // Triple clean the essential data
  return tripleClean(essentialData);
}
