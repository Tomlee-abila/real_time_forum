/**
 * Strict TypeScript interfaces for content data to prevent circular references
 * These interfaces only allow primitive types and safe objects
 */

/**
 * Base content item with only safe primitive properties
 */
export interface SafeContentItem {
  readonly id: number;
  readonly title: string;
  readonly media_type: 'movie' | 'tv';
}

/**
 * Safe watchlist item with strict primitive types only
 */
export interface SafeWatchlistItem {
  readonly id: number;
  readonly title: string;
  readonly poster_path: string | null;
  readonly poster_url: string | null;
  readonly media_type: 'movie' | 'tv';
  readonly release_date: string | null;
  readonly vote_average: number | null;
  readonly overview: string | null;
  readonly watched: boolean;
  readonly added_at: string;
}

/**
 * Raw API response data (potentially contaminated)
 * This type represents data that might contain circular references
 */
export interface RawContentData {
  readonly id?: unknown;
  readonly title?: unknown;
  readonly name?: unknown;
  readonly poster_path?: unknown;
  readonly media_type?: unknown;
  readonly release_date?: unknown;
  readonly first_air_date?: unknown;
  readonly vote_average?: unknown;
  readonly overview?: unknown;
  readonly watched?: unknown;
  readonly added_at?: unknown;
  // Allow any other properties that might be contaminated
  readonly [key: string]: unknown;
}

/**
 * Safe event data with only primitive properties
 */
export interface SafeEventData {
  readonly type?: string;
  readonly timeStamp?: number;
  readonly clientX?: number;
  readonly clientY?: number;
  readonly key?: string;
  readonly keyCode?: number;
}

/**
 * Type guard to check if data is a safe content item
 */
export function isSafeContentItem(data: unknown): data is SafeContentItem {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as any).id === 'number' &&
    typeof (data as any).title === 'string' &&
    ((data as any).media_type === 'movie' || (data as any).media_type === 'tv')
  );
}

/**
 * Type guard to check if data is a safe watchlist item
 */
export function isSafeWatchlistItem(data: unknown): data is SafeWatchlistItem {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const item = data as any;
  
  return (
    typeof item.id === 'number' &&
    typeof item.title === 'string' &&
    (typeof item.poster_path === 'string' || item.poster_path === null) &&
    (typeof item.poster_url === 'string' || item.poster_url === null) &&
    (item.media_type === 'movie' || item.media_type === 'tv') &&
    (typeof item.release_date === 'string' || item.release_date === null) &&
    (typeof item.vote_average === 'number' || item.vote_average === null) &&
    (typeof item.overview === 'string' || item.overview === null) &&
    typeof item.watched === 'boolean' &&
    typeof item.added_at === 'string'
  );
}

/**
 * Type guard to check if something is a DOM element (to be rejected)
 */
export function isDOMElement(obj: unknown): obj is Element {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  return (
    obj instanceof Element ||
    obj instanceof HTMLElement ||
    obj instanceof Node ||
    'nodeType' in obj ||
    'tagName' in obj ||
    'classList' in obj ||
    'innerHTML' in obj ||
    'addEventListener' in obj
  );
}

/**
 * Type guard to check if something has React fiber properties (to be rejected)
 */
export function hasReactFiberProperties(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const keys = Object.keys(obj);
  return keys.some(key => 
    key.startsWith('__react') ||
    key.startsWith('_react') ||
    key === 'ref' ||
    key === 'key' ||
    key === '_owner' ||
    key === '_store'
  );
}

/**
 * Strict conversion function that only accepts safe primitive values
 */
export function extractSafePrimitive<T>(
  value: unknown,
  expectedType: 'string' | 'number' | 'boolean',
  fallback: T
): T | string | number | boolean {
  if (typeof value === expectedType) {
    return value;
  }
  return fallback;
}

/**
 * Safe string extraction with length limits
 */
export function extractSafeString(value: unknown, maxLength: number = 500): string | null {
  if (typeof value === 'string') {
    return value.slice(0, maxLength);
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value).slice(0, maxLength);
  }
  return null;
}

/**
 * Safe number extraction
 */
export function extractSafeNumber(value: unknown): number | null {
  if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (!isNaN(parsed) && isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

/**
 * Safe boolean extraction
 */
export function extractSafeBoolean(value: unknown, fallback: boolean = false): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  return fallback;
}
