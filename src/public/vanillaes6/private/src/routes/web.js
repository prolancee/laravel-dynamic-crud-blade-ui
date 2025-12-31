/**
 * Application route configuration map.
 * 
 * This object defines all available API endpoints grouped by feature/module.
 * It provides:
 *  - A base URL used as prefix for all requests
 *  - CRUD operation routes
 *  - File upload/download handling
 *  - Observer-related interactions
 *  - Encryption and decryption service routing
 *
 * Each route entry contains:
 *  @property {string} method   - HTTP request method (GET, POST, PUT, DELETE)
 *  @property {string} endpoint - Relative path appended to the base URL
 *
 * Example usage:
 *   const url = routes.base + routes.crud.store.endpoint;
 *   const method = routes.crud.store.method;
 *   fetch(url, { method });
 */
const routes = {
  /** Base URL for all endpoints */
  base: window.location.origin + '/prolancee/web/',

  /** CRUD-related API routes */
  crud: {
    store:   { method: 'POST', endpoint: '/ajax/store/single' },
    single:  { method: 'GET',  endpoint: '/ajax/fetch/single' },
    builder: { method: 'GET',  endpoint: '/ajax/fetch/builder' },
    update:  { method: 'PUT',  endpoint: '/ajax/update/single' },
    delete:  { method: 'POST', endpoint: '/ajax/delete/single' },
  },

  /** File handling endpoints */
  files: {
    upload: { method: 'POST',   endpoint: '/ajax/files/upload' },
    delete: { method: 'DELETE', endpoint: '/ajax/files/delete' },
  },

  /** Cryptographic service endpoints */
  crypto: {
    encrypt: { method: 'POST', endpoint: '/ajax/encryption' },
    decrypt: { method: 'POST', endpoint: '/ajax/decryption' },
  }
};

export default routes;
