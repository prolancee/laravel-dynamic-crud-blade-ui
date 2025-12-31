/**
 * Extracts a normalized form name from a selector string.
 *
 * @param {string} selector - Selector string to extract form name from
 * @returns {string} Normalized form name or empty string if not found
 */
function normalizeFormName(selector) {
  const match = selector?.match(/form-?\d+/i);
  return match?.[0] || '';
}

/**
 * Extracts a normalized table name from a selector string.
 *
 * @param {string} selector - Selector string to extract table name from
 * @returns {string} Normalized table name or empty string if not found
 */
function normalizeTableName(selector) {
  const match = selector?.match(/table-?\d+/i);
  return match?.[0] || '';
}

/**
 * Builds a form CSS selector using a form name.
 *
 * @param {string} name - Form name
 * @returns {string} CSS selector string for the form
 */
function normalizeFormSelectorName(name) {
  return `form[name="${name}"]`;
}

/**
 * Builds a table CSS selector using a table name and custom prefix.
 *
 * @param {string} name - Table name
 * @param {string} pre - Prefix for the custom attribute
 * @returns {string} CSS selector string for the table
 */
function normalizeTableSelectorName(name, pre) {
  return `table[${pre}name="${name}"]`;
}

/**
 * Generates a selector string from custom attributes of an element.
 *
 * @param {HTMLElement} el - HTML element
 * @returns {string} Selector string built from custom attributes
 */
function getCustomAttributes(el) {
  return Array.from(el.attributes || [])
    .filter(attr =>
      attr.name.startsWith('data-') ||
      attr.name.startsWith('x-') ||
      attr.name.startsWith('custom-')
    )
    .map(attr => `[${attr.name}="${attr.value}"]`)
    .join('');
}

/**
 * Generates a readable selector for an element using id, class, or custom attributes.
 *
 * @param {HTMLElement} el - HTML element
 * @returns {string} Readable selector
 */
function getReadableSelector(el) {
  if (!(el instanceof HTMLElement)) return '';
  const tag = el.tagName?.toLowerCase() || '';
  if (el.id) return `${tag}#${el.id}`;
  if (el.classList.length) return `${tag}.${[...el.classList].join('.')}`;
  const attrs = getCustomAttributes(el);
  return attrs ? `${tag}${attrs}` : tag;
}

/**
 * Checks if a DOM node is relevant for forms or form controls.
 *
 * @param {Node} node - DOM node
 * @returns {boolean} True if node is relevant (form, input, select, textarea)
 */
function isRelevantNode(node) {
  return node.nodeType === 1 && (
    node.matches?.('form, input, select, textarea') ||
    node.querySelector?.('form, input, select, textarea')
  );
}

/**
 * Exported object.
 */
export const helpers_selector = { 
  normalizeFormName,
  normalizeTableName,
  normalizeFormSelectorName,
  normalizeTableSelectorName,
  getReadableSelector,
  isRelevantNode,
};
