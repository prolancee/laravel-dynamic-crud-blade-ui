/**
 * Recursively removes circular references from an object.
 *
 * @param {Object|Array} obj The object or array to clean
 * @param {WeakSet} seen Internal WeakSet to track seen objects
 * @return {Promise<Object|Array|undefined>} A clone of the object with circular references removed
 */
async function removeCircularReferences(obj, seen = new WeakSet()) 
{
    if (obj === null || typeof obj !== 'object') return obj;
    if (seen.has(obj)) return undefined;

    seen.add(obj);
    const clone = Array.isArray(obj) ? [] : {};

    for (const key in obj) {
        if (Object.hasOwn(obj, key)) {
            clone[key] = await removeCircularReferences(obj[key], seen);
        }
    }
    return clone;
}

/**
 * Makes an AJAX modules call after sanitizing the map to remove circular references.
 *
 * @param {string} target CSS selector or form name for the form
 * @param {Object} map Data map to be sent in the modules call
 * @param {Function} pre Pre-processing function (optional)
 * @param {Object} us User/session data (optional)
 * @param {string} modules modules endpoint URL
 * @return {Promise<any>} Response from the AJAX call
 */
async function makeCallAjax({modules, global, options: {data, target = null}}) 
{
    try {
        const sanitizedMap = await removeCircularReferences(data);
        const res = await modules.ajax_universal.ajaxUniversal({modules, global, options: {data: sanitizedMap, target}});
        return res;
    } catch (e) {
        throw e;
    }
}

/**
 * Exported object.
 */
export const ajax_circular = { 
    makeCallAjax
};
