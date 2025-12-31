let idCounter = 0;

/**
 * Generates a globally unique ID based on timestamp and a counter.
 *
 * @returns {string} Unique ID string
 */
function generateUniqueId() {
  const ts = Date.now().toString(36);    
  const counter = (idCounter++).toString(36).padStart(2, '0');
  return `x${ts}${counter}`;             
}

/**
 * Generates or retrieves a unique key attribute for a DOM element.
 *
 * @param {HTMLElement} el - The DOM element
 * @param {string} pre - Prefix for the custom attribute
 * @returns {string} The unique key for the element
 */
const generateElementKey = (el, pre) => {
  if (!el?.getAttribute(`${pre}key`)) {
    el.setAttribute(`${pre}key`, `${el.tagName}-${generateUniqueId()}`);
  }
  return el.getAttribute(`${pre}key`);
};

/**
 * Exported object.
 */
export const helpers_unique = {
  generateElementKey,
  generateUniqueId,
};
