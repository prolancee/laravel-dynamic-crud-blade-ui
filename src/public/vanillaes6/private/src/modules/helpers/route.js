/**
 * Cleans a route string by removing extra slashes and whitespace,
 * and validates it to ensure it contains only alphanumeric segments separated by single slashes.
 *
 * @param {string} route - The route string to clean and validate
 * @returns {string|boolean} Cleaned route if valid, otherwise false
 */
function cleanAndValidateRoute(route) 
{
  if (!route || typeof route !== "string") return false;

  // Try parsing as full URL
  let url;
  try {
    url = new URL(route);
  } catch {
    url = null;
  }

  // Function to sanitize a path
  const sanitizePath = (path) => {
    return path
      .replace(/\\/g, '/')              // Backslashes → forward
      .replace(/[^a-zA-Z0-9/_:-]/g, '/') // Replace invalid characters
      .replace(/\/{2,}/g, '/')          // Remove duplicate slashes
      .replace(/\/+$/, '')              // Remove trailing slash
      .replace(/^\/+/, '')              // Remove leading slash
      .trim();
  };

  // If full URL → clean only pathname
  if (url) {
    url.pathname = "/" + sanitizePath(url.pathname);
    return url.toString();
  }

  // If not full URL → treat as relative path
  const cleaned = "/" + sanitizePath(route);

  return cleaned || false;
}

/**
 * Exported object.
 */
export const helpers_route = {
  cleanAndValidateRoute,
};
