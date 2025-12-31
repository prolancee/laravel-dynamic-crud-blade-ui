/**
 * Checks whether a string is a valid Base64 encoded string.
 *
 * @param {string} str - The string to validate
 * @returns {boolean} True if the string is valid Base64, otherwise false
 */
function isBase64(str) 
{
  if (typeof str !== 'string') return false;
  const notBase64 = /[^A-Z0-9+\/=]/i;
  const len = str.length;
  if (!len || len % 4 !== 0 || notBase64.test(str)) return false;
  const firstPaddingChar = str.indexOf('=');
  return firstPaddingChar === -1 ||
      firstPaddingChar === len - 1 ||
      (firstPaddingChar === len - 2 && str[len - 1] === '=');
}

/**
 * Decodes a Base64 string to a Uint8Array of bytes.
 *
 * @param {string} base64 - The Base64 encoded string
 * @returns {Uint8Array} The decoded bytes
 */
function decodeBase64ToBytes(base64) 
{
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Converts a Uint8Array to a Base64 encoded string using Blob and FileReader.
 *
 * @param {Uint8Array} uint8Array - The byte array to convert
 * @returns {Promise<string>} A promise that resolves with the Base64 string
 */
async function toBase64WithBlob(uint8Array) 
{
  return new Promise((resolve) => {
    try {
      const blob = new Blob([uint8Array], { type: 'application/octet-stream' });
      const reader = new FileReader();

      reader.onloadend = () => {
        try {
          const dataUrl = reader.result || '';
          const base64 = dataUrl.split(',')[1] || '';
          resolve(base64 || '');
        } catch {
          resolve('');
        }
      };

      reader.onerror = () => resolve('');
      reader.readAsDataURL(blob);
    } catch {
      resolve('');
    }
  });
}

/**
 * Exported object.
 */
export const helpers_base64 = { 
  isBase64,
  decodeBase64ToBytes,
  toBase64WithBlob,
};
