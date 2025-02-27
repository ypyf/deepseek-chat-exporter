/**
 * DeepSeek Chat Exporter - Utility Functions
 *
 * Common utility functions that can be used across the extension.
 */

/**
 * Generate a unique ID
 * @returns {string} A unique ID
 */
function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Format a timestamp as a human-readable date string
 * @param {number} timestamp - The timestamp to format
 * @returns {string} A formatted date string
 */
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

/**
 * Sanitize a string for use in filenames
 * @param {string} str - The string to sanitize
 * @returns {string} A sanitized string
 */
function sanitizeFilename(str) {
  return str.replace(/[/\\?%*:|"<>]/g, '-');
}

/**
 * Create a hash from a string
 * @param {string} str - The string to hash
 * @returns {string} A hash of the string
 */
function createHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}

/**
 * Debounce a function
 * @param {Function} func - The function to debounce
 * @param {number} wait - The debounce wait time in milliseconds
 * @returns {Function} A debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

/**
 * Throttle a function
 * @param {Function} func - The function to throttle
 * @param {number} limit - The throttle limit in milliseconds
 * @returns {Function} A throttled function
 */
function throttle(func, limit) {
  let lastFunc;
  let lastRan;
  return function(...args) {
    const context = this;
    if (!lastRan) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(function() {
        if ((Date.now() - lastRan) >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

// Export functions if in a module context
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateUniqueId,
    formatTimestamp,
    sanitizeFilename,
    createHash,
    debounce,
    throttle
  };
}
