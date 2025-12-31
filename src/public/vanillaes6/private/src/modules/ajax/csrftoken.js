/**
 * Retrieves the CSRF token from meta tags in the document head.
 *
 * Checks the following meta tag names in order:
 *  - "prolancee-csrf-token"
 *  - "csrf-token"
 *  - "csrf_token"
 *
 * @return {string|null} The CSRF token if found, otherwise null
 */
function getCSRFToken() 
{
  const selectors = [
    'meta[name="prolancee-csrf-token"]',
    'meta[name="csrf-token"]',
    'meta[name="csrf_token"]'
  ];
  
  for (const selector of selectors) {
    const tag = document.querySelector(selector);
    if (tag?.content) return tag.content;
  }

  return null; 
}

/**
 * Exported object.
 */
export const ajax_csrftoken = { 
  getCSRFToken
};
