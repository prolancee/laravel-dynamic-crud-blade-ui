/**
 * Checks if a value is empty.
 * Supports null, undefined, string, array, and object.
 *
 * @param {*} value - Value to check
 * @returns {boolean} True if value is empty
 */
function isEmpty(value) {
  if (value == null) return true; 
  if (typeof value === 'string' || Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Checks if there are any mutations in observed HTML structures.
 *
 * @param {Object} html - Object containing observer and current child lists
 * @returns {boolean} True if any mutations exist
 */
function hasAnyMutations(html) {
  return Object.values(html).some(group =>
    group?.current_temporary?.length > 0 || group?.current_permanent?.length > 0 || 
    group?.observer_temporary?.length > 0 || group?.observer_permanent?.length > 0
  );
}

/**
 * Merges observed data into initial data structure.
 *
 * @param {Object} observed - Observed data
 * @param {Object} initial - Initial data to merge into
 */
function mergeObservedDataIntoInitial({global, options: { response }}) 
{
  const c = ['current_temporary', 'current_permanent', 'observer_temporary', 'observer_permanent'];
  const copy = a => Array.isArray(a) ? a.map(e => ({ ...e })) : [];
  c.forEach(k => ['childList', 'attributes', 'characterData'].forEach(t => {
    const src = response?.[t]?.[k]; if (!src) return;
    global.initialHtml[t][k] = k.includes('observer') ? global.initialHtml[t][k].concat(copy(src)) : copy(src);
  }));
}

/**
 * Generates a hash string for a given input string.
 *
 * @param {string} str - Input string
 * @returns {string} Hexadecimal hash
 */
function hashString(str) {
  let hash = 2166136261n;
  for (let i = 0; i < str.length; i++) {
    hash ^= BigInt(str.charCodeAt(i));
    hash *= 16777619n;
  }
  return hash.toString(16);
}

/**
 * Returns an array of common browser event names.
 *
 * @returns {string[]} List of event names
 */
function events() {
  return [
    // Mouse
    "click", "dblclick", "mousedown", "mouseup",
    "mouseenter", "mouseleave", "mouseover", "mouseout",
    "contextmenu", "mousemove", "wheel",

    // Keyboard
    "keydown", "keypress", "keyup",

    // Form
    "input", "change", "submit", "reset",
    "focus", "blur", "focusin", "focusout",

    // Touch & Pointer
    "touchstart", "touchmove", "touchend", "touchcancel",
    "pointerover", "pointerenter", "pointerdown", "pointermove",
    "pointerup", "pointercancel", "pointerout", "pointerleave",

    // Drag & Drop
    "drag", "dragstart", "dragend",
    "dragenter", "dragover", "dragleave", "drop",

    // Clipboard
    "copy", "cut", "paste",

    // Media
    "play", "pause", "playing", "ended", "volumechange", "timeupdate",
    "seeked", "seeking", "ratechange", "stalled", "suspend", "waiting",
    "loadeddata", "loadedmetadata", "canplay", "canplaythrough", "durationchange",

    // Window & Document
    "load", "beforeunload", "resize", "scroll",
    "error", "hashchange", "popstate", "pageshow", "pagehide",
    "visibilitychange",

    // Animation & Transition
    "animationstart", "animationend", "animationiteration",
    "transitionstart", "transitionend", "transitionrun", "transitioncancel"
  ];
}

/**
 * Checks if a global function exists by name.
 *
 * @param {string} funcName - Name of the function
 * @returns {boolean} True if function exists
 */
function exitFunction(funcName) {
  return typeof window[funcName] === 'function';
}

/**
 * Exported object.
 */
export const helpers_utils = {
  isEmpty,
  hasAnyMutations,
  mergeObservedDataIntoInitial,
  hashString,
  events,
  exitFunction
};