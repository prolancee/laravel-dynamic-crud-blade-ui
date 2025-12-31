/**
 * Converts a file size in bytes to a human-readable string with appropriate units.
 *
 * @param {number} size - File size in bytes
 * @returns {string} Human-readable file size
 */
function convertFileSize(size) 
{
  size = Number(size);
  const units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
      size /= 1024; 
      index++; 
  }
  return size.toFixed(2) + ' ' + units[index];
}

/**
 * Parses a large JSON string using a Web Worker to avoid blocking the main thread.
 *
 * @param {string} jsonString - JSON string to parse
 * @returns {Promise<Object|null>} Parsed object or null if parsing fails
 */
async function parseLargeJSONInWorker(jsonString) 
{
  return new Promise((resolve) => {
    if (!window.Worker) {
      try {
        return resolve(JSON.parse(jsonString));
      } catch {
        return resolve(null);
      }
    }

    const workerCode = () => {
      self.onmessage = function (e) {
        try {
          const parsed = JSON.parse(e.data);
          self.postMessage({ result: parsed });
        } catch {
          self.postMessage({ error: true });
        }
      };
    };

    const blob = new Blob([`(${workerCode.toString()})()`], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));

    worker.onmessage = function (e) {
      resolve(e.data?.result || null);
      worker.terminate();
    };

    worker.onerror = () => {
      resolve(null);
      worker.terminate();
    };

    try {
      worker.postMessage(jsonString);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Exported object.
 */
export const helpers_file = { 
  convertFileSize,
  parseLargeJSONInWorker,
};
