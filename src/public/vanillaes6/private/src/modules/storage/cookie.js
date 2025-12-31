/**
 * Sets a cookie with the given name, value, and expiration time.
 *
 * @param {string} name - The name of the cookie.
 * @param {*} value - The value to store in the cookie. Can be any JSON-serializable value.
 * @param {number} expiryMs - Expiration time in milliseconds from now.
 */
function setCookie(name, value, expiryMs) {
    const expires = new Date(Date.now() + expiryMs).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(JSON.stringify(value))}; expires=${expires}; path=/`;
}

/**
 * Retrieves a cookie value by name.
 *
 * @param {string} name - The name of the cookie to retrieve.
 * @returns {*} The parsed value of the cookie, or null if not found or invalid.
 */
function getCookie(name) {
    const value = document.cookie.split('; ').find(row => row.startsWith(name + '='));
    if (!value) return null;
    try {
        return JSON.parse(decodeURIComponent(value.split('=')[1]));
    } catch {
        return null;
    }
}

/**
 * Exported object.
 */
export const storage_cookie = {
    setCookie,
    getCookie
};
