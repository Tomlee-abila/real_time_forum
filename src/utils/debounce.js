/**
 * Debounce function to limit the rate of function calls
 * @param {Function} func - The function to debounce
 * @param {number} delay - The delay in milliseconds
 * @returns {Function} - The debounced function
 */
export function debounce(func, delay) {
  let timeoutId;
  
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Throttle function to limit the rate of function calls
 * @param {Function} func - The function to throttle
 * @param {number} delay - The delay in milliseconds
 * @returns {Function} - The throttled function
 */
export function throttle(func, delay) {
  let lastCall = 0;
  
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return func.apply(this, args);
    }
  };
}
