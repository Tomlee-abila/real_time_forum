/**
 * Event sanitizer to prevent React fiber and DOM contamination
 * This utility completely blocks any DOM/React references from entering our data flow
 */

/**
 * Sanitize event handlers to prevent DOM/React fiber contamination
 */
export function sanitizeEventHandler(handler) {
  if (!handler || typeof handler !== 'function') {
    return handler;
  }

  return function sanitizedHandler(...args) {
    try {
      // Sanitize all arguments to remove any DOM/React references
      const sanitizedArgs = args.map(arg => sanitizeEventArgument(arg));
      return handler(...sanitizedArgs);
    } catch (error) {
      console.error('Error in sanitized event handler:', error);
      // Call handler with no arguments as fallback
      try {
        return handler();
      } catch (fallbackError) {
        console.error('Fallback handler also failed:', fallbackError);
      }
    }
  };
}

/**
 * Sanitize a single event argument
 */
function sanitizeEventArgument(arg) {
  // If it's a React SyntheticEvent, extract only safe properties
  if (arg && typeof arg === 'object' && arg.nativeEvent) {
    return sanitizeSyntheticEvent(arg);
  }
  
  // If it's a DOM element, return null
  if (isDOMElement(arg)) {
    return null;
  }
  
  // If it's an object that might contain DOM references, sanitize it
  if (arg && typeof arg === 'object') {
    return sanitizeObject(arg);
  }
  
  // Primitives are safe
  return arg;
}

/**
 * Sanitize React SyntheticEvent objects
 */
function sanitizeSyntheticEvent(event) {
  const safeEvent = {
    type: event.type,
    preventDefault: () => {
      try {
        event.preventDefault();
      } catch (e) {
        // Ignore errors
      }
    },
    stopPropagation: () => {
      try {
        event.stopPropagation();
      } catch (e) {
        // Ignore errors
      }
    }
  };
  
  // Add safe properties if they exist
  if (typeof event.clientX === 'number') safeEvent.clientX = event.clientX;
  if (typeof event.clientY === 'number') safeEvent.clientY = event.clientY;
  if (typeof event.key === 'string') safeEvent.key = event.key;
  if (typeof event.keyCode === 'number') safeEvent.keyCode = event.keyCode;
  
  return safeEvent;
}

/**
 * Check if something is a DOM element
 */
function isDOMElement(obj) {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  // Check for DOM element properties
  return (
    obj.nodeType !== undefined ||
    obj.tagName !== undefined ||
    obj.classList !== undefined ||
    obj.innerHTML !== undefined ||
    obj.outerHTML !== undefined ||
    obj.style !== undefined ||
    obj.getAttribute !== undefined ||
    obj.addEventListener !== undefined ||
    obj instanceof Element ||
    obj instanceof HTMLElement ||
    obj instanceof Node
  );
}

/**
 * Sanitize an object to remove any DOM/React references
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  // Don't sanitize arrays differently
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeEventArgument(item));
  }
  
  const sanitized = {};
  
  try {
    for (const [key, value] of Object.entries(obj)) {
      // Skip React fiber properties
      if (key.startsWith('__react') || key.startsWith('_react') || 
          key === 'ref' || key === 'key' || key === '_owner' || key === '_store') {
        continue;
      }
      
      // Skip DOM-related properties
      if (key === 'target' || key === 'currentTarget' || key === 'relatedTarget' ||
          key === 'srcElement' || key === 'toElement' || key === 'fromElement') {
        continue;
      }
      
      // Skip if value is a DOM element
      if (isDOMElement(value)) {
        continue;
      }
      
      // Recursively sanitize objects
      if (value && typeof value === 'object') {
        const sanitizedValue = sanitizeEventArgument(value);
        if (sanitizedValue !== null && sanitizedValue !== undefined) {
          sanitized[key] = sanitizedValue;
        }
      } else if (typeof value === 'string' || typeof value === 'number' || 
                 typeof value === 'boolean' || value === null || value === undefined) {
        sanitized[key] = value;
      }
      // Skip functions and other non-serializable types
    }
  } catch (error) {
    console.warn('Error sanitizing object:', error);
    return {};
  }
  
  return sanitized;
}

/**
 * Create a safe event handler that completely isolates data
 */
export function createSafeEventHandler(handler, dataExtractor = null) {
  return function safeEventHandler(event) {
    try {
      // Prevent default and stop propagation safely
      if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
      }
      if (event && typeof event.stopPropagation === 'function') {
        event.stopPropagation();
      }
      
      // If a data extractor is provided, use it to get safe data
      if (dataExtractor && typeof dataExtractor === 'function') {
        try {
          const safeData = dataExtractor();
          return handler(safeData);
        } catch (extractorError) {
          console.error('Data extractor failed:', extractorError);
          return handler();
        }
      }
      
      // Otherwise call handler with no arguments to avoid contamination
      return handler();
    } catch (error) {
      console.error('Safe event handler error:', error);
    }
  };
}

/**
 * Wrap a component's event handlers to make them safe
 */
export function wrapComponentEventHandlers(component) {
  if (!component || typeof component !== 'object') {
    return component;
  }
  
  const wrapped = { ...component };
  
  // Common event handler property names
  const eventHandlerProps = [
    'onClick', 'onDoubleClick', 'onMouseDown', 'onMouseUp', 'onMouseMove',
    'onMouseEnter', 'onMouseLeave', 'onMouseOver', 'onMouseOut',
    'onKeyDown', 'onKeyUp', 'onKeyPress',
    'onFocus', 'onBlur', 'onChange', 'onInput', 'onSubmit',
    'onTouchStart', 'onTouchMove', 'onTouchEnd'
  ];
  
  for (const prop of eventHandlerProps) {
    if (wrapped[prop] && typeof wrapped[prop] === 'function') {
      wrapped[prop] = sanitizeEventHandler(wrapped[prop]);
    }
  }
  
  return wrapped;
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
