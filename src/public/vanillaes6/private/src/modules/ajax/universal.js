/**
 * Performs a universal AJAX request with CSRF token support, form data handling, 
 * and response processing.
 *
 * Features:
 *  - Handles GET/POST/HEAD and file uploads via FormData.
 *  - Automatically removes circular data like route, method, table from payload.
 *  - Calls optional hooks: beforeSend, success, complete.
 *  - Disables/enables the submit button while the request is in progress.
 *  - Delegates CRUD and observer actions to handleResponse for standardized processing.
 *
 * @param {string} target CSS selector or form name to identify the form
 * @param {Object} data Payload to send with the request; can contain:
 *                      - route: endpoint URL (string)
 *                      - method: HTTP method (string)
 *                      - table: optional table name
 *                      - fileData: FormData object for file uploads
 *                      - beforeSend: callback before sending
 *                      - success: callback on success
 *                      - complete: callback on completion
 * @param {string} pre Prefix used in custom attributes for forms/buttons
 * @param {string} us User/session identifier used in attributes
 * @param {Object} modules Optional helper object with methods like normalizeFormName, disabledSubmitButton, handleError
 * @return {Promise<Object|boolean>} Returns processed response object or false if failed
 */
async function ajaxUniversal({ modules, global, options: { data, target = null } }) 
{
  const url = typeof data?.route === 'string' ? data.route : '';

  const method = data?.method?.toUpperCase();
  const csrfToken = modules.ajax_csrftoken.getCSRFToken();

  const isFormData = (typeof FormData !== 'undefined' && data?.fileData instanceof FormData)
    || Object.prototype.toString.call(data?.fileData) === '[object FormData]';

  const headers = {
    'X-CSRF-TOKEN': csrfToken,
    ...(isFormData ? {} : {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    })
  };

  const flatData = isFormData ? data?.fileData : Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, (typeof v === 'object' && v !== null) ? JSON.stringify(v) : v])
  );

  const isGet = method === 'GET' || method === 'HEAD';
  const queryString = isGet ? new URLSearchParams(flatData).toString() : '';

  const options = {
    method,
    headers,
    ...(isGet ? {} : { body: isFormData ? data?.fileData : new URLSearchParams(flatData).toString() })
  };

  data.beforeSend?.(target);

  const n = modules.helpers_selector.normalizeFormName(target);
  const submitButton = n && global.attributePrefix
    ? document.querySelector(`[${global.attributePrefix}form="${n}"]`)
    : null;

  if (submitButton) modules.helpers_button.disabledSubmitButton(submitButton);
  try {
    const finalUrl = isGet ? `${url}?${queryString}` : url;
    const response = await fetch(finalUrl, options);

    if (!response.ok) {
      const text = await response.text();
      throw {
        code: response.code,
        codeText: response.codeText,
        ...(JSON.parse(text || '{}') || { message: text })
      };
    }

    const resJson = await response.json();
    data.success?.(resJson);

    const action = resJson?.option?.process?.trim()?.toLowerCase();
    if (['store', 'read', 'update', 'delete', "upload", "observer", "decrypted", "encrypted"].includes(action)) {
      return (["read", "upload", "observer", "decrypted", "encrypted"].includes(action))
        ? resJson
        : await modules.ajax_responser.handleResponse({
          modules,
          global,
          options: {
            data: {
              response: resJson,
              data
            },
            target
          }
        });
    }
    return false;

  } catch (e) {
    return modules.logs_logger.ajaxError(e);

  } finally {
    data.complete?.(target);
    if (submitButton) modules.helpers_button.undisabledSubmitButton(submitButton);
  }
}

/**
 * Exported object.
 */
export const ajax_universal = {
  ajaxUniversal
};
