/**
 * Converts special characters in a string to HTML entities.
 *
 * @param {string} str - Input string
 * @returns {string} String with HTML entities
 */
function htmlentities(str) 
{
  return str
    .replace(/&/g, "&amp;")        
    .replace(/</g, "&lt;")       
    .replace(/>/g, "&gt;")        
    .replace(/"/g, "&quot;")       
    .replace(/'/g, "&#039;");      
}

/**
 * Decodes HTML entities back to their original characters.
 *
 * @param {string} str - Input string with HTML entities
 * @returns {string} Decoded string
 */
function htmlEntityDecode(str) 
{
  return str
    .replace(/&amp;/g, "&")        
    .replace(/&lt;/g, "<")       
    .replace(/&gt;/g, ">")         
    .replace(/&quot;/g, '"')      
    .replace(/&#039;/g, "'");     
}

/**
 * Exported object.
 */
export const helpers_htmlentity = { 
  htmlentities,
  htmlEntityDecode,
};
