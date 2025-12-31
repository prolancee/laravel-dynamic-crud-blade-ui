/**
 * Safely splits and stringifies a nested object into JSON chunks.
 * Handles circular references by replacing them with "[Circular]".
 *
 * @param {Object} obj - Object to stringify
 * @param {number} [chunkSize=1000] - Number of items per chunk
 * @returns {string[]} Array of JSON string chunks
 */
function deepSafeSplitAndStringify(obj, chunkSize = 1000) 
{
  const chunks = [];
  const seen = new WeakSet();

  const safeStringify = (value) =>
    JSON.stringify(value, (key, val) => {
      if (typeof val === "object" && val !== null) {
        if (seen.has(val)) return "[Circular]";
        seen.add(val);
      }
      return val;
    });

  for (const [section, values] of Object.entries(obj)) {
    for (const [key, arr] of Object.entries(values)) {
      for (let i = 0; i < arr.length; i += chunkSize) {
        const slice = arr.slice(i, i + chunkSize);
        const part = { [section]: { [key]: slice } };
        chunks.push(safeStringify(part));
      }
    }
  }

  return chunks;
}

/**
 * Serializes an object into JSON and calculates its size in multiple units.
 * Uses a worker for large objects if available.
 *
 * @param {Object} obj - Object to serialize
 * @param {number} [chunkSize=10000] - Number of items per chunk
 * @returns {Promise<{size: {Bytes:number, KB:number, MB:number, GB:number}, json: string}>} Object containing size info and JSON string
 */
async function serializeObjectWithSizeInfo(obj, chunkSize = 10000) {
  const jsonChunks = await deepSafeSplitAndStringifyInWorker(obj, chunkSize);
  const json = `[${jsonChunks.join(',')}]`;

  const bytes = new TextEncoder().encode(json).length;

  const size = {
    Bytes: bytes,
    KB: +(bytes / 1024).toFixed(2),
    MB: +(bytes / (1024 * 1024)).toFixed(2),
    GB: +(bytes / (1024 * 1024 * 1024)).toFixed(2)
  };

  return { size, json };
}

/**
 * Safely splits and stringifies an object in a Web Worker.
 *
 * @param {Object} obj - Object to stringify
 * @param {number} [chunkSize=10000] - Number of items per chunk
 * @returns {Promise<string[]>} Array of JSON string chunks
 */
async function deepSafeSplitAndStringifyInWorker(obj, chunkSize = 10000) {
  return new Promise((resolve) => {
    if (!window.Worker) {
      try {
        const result = deepSafeSplitAndStringify(obj, chunkSize);
        return resolve(result);
      } catch (_) {
        return resolve([]);
      }
    }

    const workerCode = () => {
      function deepSafeSplitAndStringify(obj, chunkSize = 10000) {
        const seen = new WeakSet();
        const chunks = [];

        for (const [section, values] of Object.entries(obj || {})) {
          for (const [key, arr] of Object.entries(values || {})) {
            for (let i = 0; i < (arr?.length || 0); i += chunkSize) {
              const slice = arr.slice(i, i + chunkSize);
              const part = { [section]: { [key]: slice } };
              const safeStr = JSON.stringify(part, (k, v) => {
                if (typeof v === 'object' && v !== null) {
                  if (seen.has(v)) return '[Circular]';
                  seen.add(v);
                }
                return v;
              });
              chunks.push(safeStr);
            }
          }
        }

        return chunks;
      }

      self.onmessage = (e) => {
        try {
          const [obj, chunkSize] = e.data;
          const result = deepSafeSplitAndStringify(obj, chunkSize);
          self.postMessage({ chunks: result });
        } catch (_) {
          self.postMessage({ chunks: [] }); 
        }
      };
    };

    const blob = new Blob(['(' + workerCode.toString() + ')()'], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));

    worker.onmessage = (e) => {
      resolve(Array.isArray(e.data.chunks) ? e.data.chunks : []);
      worker.terminate();
    };

    worker.onerror = () => {
      resolve([]); 
      worker.terminate();
    };

    try {
      worker.postMessage([obj, chunkSize]);
    } catch {
      resolve([]); 
    }
  });
}

/**
 * Exported object.
 */
export const helpers_serialization = { 
  serializeObjectWithSizeInfo,
};