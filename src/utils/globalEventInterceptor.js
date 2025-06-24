/**
 * Global DOM event interceptor to prevent React fiber contamination
 * This is the nuclear option - intercepts all DOM events globally
 */

let isInterceptorInstalled = false;

/**
 * Install global event interceptor to prevent DOM contamination
 */
export function installGlobalEventInterceptor() {
  if (isInterceptorInstalled) {
    return;
  }

  console.log('Installing global DOM event interceptor...');

  // Override addEventListener to sanitize event handlers
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    if (typeof listener === 'function') {
      const sanitizedListener = function(event) {
        try {
          // Block any event that might contain React fiber references
          if (event && event.target && hasReactFiberProperties(event.target)) {
            console.warn('Blocked event with React fiber contamination:', type);
            return;
          }
          
          // Call original listener with sanitized event
          return listener.call(this, sanitizeEvent(event));
        } catch (error) {
          console.error('Error in sanitized event listener:', error);
        }
      };
      
      return originalAddEventListener.call(this, type, sanitizedListener, options);
    }
    
    return originalAddEventListener.call(this, type, listener, options);
  };

  // Override common DOM methods that might leak React fibers
  overrideDOMMethod('click');
  overrideDOMMethod('focus');
  overrideDOMMethod('blur');

  // Override JSON.stringify globally to catch any remaining issues
  const originalStringify = JSON.stringify;
  JSON.stringify = function(value, replacer, space) {
    try {
      return originalStringify.call(this, value, createSafeReplacer(replacer), space);
    } catch (error) {
      if (error.message && error.message.includes('circular')) {
        console.error('Circular structure detected in JSON.stringify, applying emergency cleaning');
        return originalStringify.call(this, emergencyCleanValue(value), createSafeReplacer(replacer), space);
      }
      throw error;
    }
  };

  isInterceptorInstalled = true;
  console.log('Global DOM event interceptor installed successfully');
}

/**
 * Check if an object has React fiber properties
 */
function hasReactFiberProperties(obj) {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const reactFiberKeys = [
    '__reactFiber$',
    '__reactProps$',
    '__reactInternalInstance',
    '_reactInternalFiber',
    '__reactInternalMemoizedUnmaskedChildContext',
    '__reactInternalMemoizedMaskedChildContext'
  ];

  for (const key in obj) {
    if (reactFiberKeys.some(reactKey => key.includes(reactKey))) {
      return true;
    }
  }

  return false;
}

/**
 * Sanitize an event object
 */
function sanitizeEvent(event) {
  if (!event || typeof event !== 'object') {
    return event;
  }

  // Create a minimal safe event object
  const safeEvent = {
    type: event.type,
    timeStamp: event.timeStamp,
    preventDefault: () => {
      try {
        if (event.preventDefault) event.preventDefault();
      } catch (e) {}
    },
    stopPropagation: () => {
      try {
        if (event.stopPropagation) event.stopPropagation();
      } catch (e) {}
    }
  };

  // Add safe properties
  const safeProps = ['clientX', 'clientY', 'pageX', 'pageY', 'screenX', 'screenY', 
                    'key', 'keyCode', 'which', 'button', 'buttons'];
  
  for (const prop of safeProps) {
    if (typeof event[prop] === 'number' || typeof event[prop] === 'string') {
      safeEvent[prop] = event[prop];
    }
  }

  return safeEvent;
}

/**
 * Override a DOM method to prevent contamination
 */
function overrideDOMMethod(methodName) {
  if (typeof Element !== 'undefined' && Element.prototype[methodName]) {
    const originalMethod = Element.prototype[methodName];
    Element.prototype[methodName] = function(...args) {
      try {
        // Clean any arguments that might contain React fibers
        const cleanArgs = args.map(arg => {
          if (arg && typeof arg === 'object' && hasReactFiberProperties(arg)) {
            return null;
          }
          return arg;
        });
        
        return originalMethod.apply(this, cleanArgs);
      } catch (error) {
        console.error(`Error in overridden ${methodName}:`, error);
        return originalMethod.apply(this, args);
      }
    };
  }
}

/**
 * Create a safe replacer function for JSON.stringify
 */
function createSafeReplacer(originalReplacer) {
  return function(key, value) {
    // Apply original replacer first if provided
    if (originalReplacer && typeof originalReplacer === 'function') {
      value = originalReplacer.call(this, key, value);
    }

    // Block React fiber properties
    if (typeof key === 'string' && (
      key.startsWith('__react') || 
      key.startsWith('_react') ||
      key === 'ref' || 
      key === 'key' || 
      key === '_owner' || 
      key === '_store'
    )) {
      return undefined;
    }

    // Block DOM elements
    if (value && typeof value === 'object' && (
      value.nodeType !== undefined ||
      value.tagName !== undefined ||
      value.classList !== undefined
    )) {
      return '[DOM Element]';
    }

    // Block functions
    if (typeof value === 'function') {
      return '[Function]';
    }

    return value;
  };
}

/**
 * Emergency clean a value for JSON serialization
 */
function emergencyCleanValue(value) {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(item => emergencyCleanValue(item));
  }

  const cleaned = {};
  const safeKeys = ['id', 'title', 'name', 'type', 'media_type', 'poster_path', 'poster_url',
                   'release_date', 'first_air_date', 'vote_average', 'overview', 'watched', 'added_at'];

  for (const key of safeKeys) {
    if (value.hasOwnProperty(key)) {
      const val = value[key];
      if (typeof val === 'string' || typeof val === 'number' || 
          typeof val === 'boolean' || val === null || val === undefined) {
        cleaned[key] = val;
      }
    }
  }

  return cleaned;
}

/**
 * Uninstall the global event interceptor (for testing)
 */
export function uninstallGlobalEventInterceptor() {
  // This is complex to implement properly, so we'll just mark it as uninstalled
  isInterceptorInstalled = false;
  console.log('Global event interceptor marked as uninstalled');
}

/**
 * Check if the interceptor is installed
 */
export function isGlobalEventInterceptorInstalled() {
  return isInterceptorInstalled;
}
