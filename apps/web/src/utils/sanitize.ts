/**
 * HTML Sanitization Utilities
 *
 * Prevents XSS attacks by escaping HTML content before inserting into DOM
 */

/**
 * Escapes HTML characters to prevent XSS attacks
 * @param str - The string to escape
 * @returns Escaped HTML string
 */
export const escapeHtml = (str: string | number): string => {
  if (typeof str === 'number') {
    return str.toString();
  }

  if (!str) {
    return '';
  }

  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

/**
 * Sanitizes a URL to prevent javascript: URLs and other XSS vectors
 * @param url - The URL to sanitize
 * @returns Sanitized URL or empty string if invalid
 */
export const sanitizeUrl = (url: string): string => {
  if (!url) return '';

  // Block javascript: and data: URLs
  const lowerUrl = url.toLowerCase().trim();
  if (lowerUrl.startsWith('javascript:') || lowerUrl.startsWith('data:')) {
    return '';
  }

  try {
    const urlObj = new URL(url, window.location.origin);
    // Only allow http, https, and mailto protocols
    if (['http:', 'https:', 'mailto:'].includes(urlObj.protocol)) {
      return urlObj.toString();
    }
  } catch {
    // Invalid URL
    return '';
  }

  return '';
};

/**
 * Sanitizes an object's string properties for safe HTML insertion
 * @param obj - Object with properties to sanitize
 * @returns New object with sanitized string properties
 */
export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  const sanitized = { ...obj };

  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string') {
      (sanitized as any)[key] = escapeHtml(value);
    }
  }

  return sanitized;
};
