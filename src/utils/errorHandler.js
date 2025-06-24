/**
 * Global error handler for circular structure JSON errors
 */

// Track circular reference errors to prevent spam
let circularErrorCount = 0;
const MAX_CIRCULAR_ERRORS = 5;

/**
 * Handle circular structure JSON errors globally
 * @param {Error} error - The error object
 * @param {string} context - Context where the error occurred
 */
export function handleCircularStructureError(error, context = 'unknown') {
  if (error.message && error.message.includes('circular structure')) {
    circularErrorCount++;
    
    console.warn(`Circular structure error detected in ${context}:`, {
      message: error.message,
      count: circularErrorCount,
      stack: error.stack
    });
    
    // If we've seen too many circular errors, something is seriously wrong
    if (circularErrorCount >= MAX_CIRCULAR_ERRORS) {
      console.error('Too many circular structure errors detected. This indicates a serious issue with data handling.');
      
      // Clear localStorage to prevent persistent issues
      try {
        localStorage.removeItem('entertainment-watchlist');
        localStorage.removeItem('entertainment-preferences');
        console.warn('Cleared localStorage due to persistent circular structure errors');
      } catch (clearError) {
        console.error('Failed to clear localStorage:', clearError);
      }
      
      // Reset counter to prevent infinite clearing
      circularErrorCount = 0;
    }
    
    return true; // Indicates this was a circular structure error
  }
  
  return false; // Not a circular structure error
}

/**
 * Safe wrapper for JSON.stringify that handles circular references
 * @param {any} obj - Object to stringify
 * @param {string} context - Context for error reporting
 * @returns {string|null} - JSON string or null if failed
 */
export function safeStringifyWithErrorHandling(obj, context = 'unknown') {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    if (handleCircularStructureError(error, context)) {
      // Try to create a simple representation
      try {
        return JSON.stringify({
          error: 'Circular structure detected',
          context: context,
          type: typeof obj,
          isArray: Array.isArray(obj)
        });
      } catch (fallbackError) {
        console.error('Even fallback stringify failed:', fallbackError);
        return null;
      }
    } else {
      // Re-throw non-circular errors
      throw error;
    }
  }
}

/**
 * Install global error handlers for unhandled circular structure errors
 */
export function installGlobalErrorHandlers() {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && handleCircularStructureError(event.reason, 'unhandledrejection')) {
      event.preventDefault(); // Prevent the error from being logged to console
    }
  });
  
  // Handle global errors
  window.addEventListener('error', (event) => {
    if (event.error && handleCircularStructureError(event.error, 'global')) {
      event.preventDefault(); // Prevent the error from being logged to console
    }
  });
  
  // Override console.error to catch circular structure errors
  const originalConsoleError = console.error;
  console.error = function(...args) {
    const errorMessage = args.join(' ');
    if (errorMessage.includes('circular structure')) {
      handleCircularStructureError(new Error(errorMessage), 'console.error');
    }
    originalConsoleError.apply(console, args);
  };
  
  console.log('Global error handlers installed for circular structure detection');
}

/**
 * Reset the circular error counter (useful for testing)
 */
export function resetCircularErrorCount() {
  circularErrorCount = 0;
}

/**
 * Get the current circular error count
 */
export function getCircularErrorCount() {
  return circularErrorCount;
}
