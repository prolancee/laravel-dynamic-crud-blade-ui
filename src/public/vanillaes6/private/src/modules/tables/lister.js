/**
 * Generates the configuration object for listing a table.
 *
 * @param {string} tableSelector - Selector for the table element.
 * @param {string} routeRender - Route suffix for rendering data.
 * @param {string} pre - Prefix used for custom attributes (e.g., "data-").
 * @returns {Object|boolean} Object containing method, route, data, and reload info; false if table not found or error occurs.
 */
function listTable({ modules, global, options: { tableNameSelector } }) {
  try {
    const elem = document.querySelector(tableNameSelector);
    if (!elem) return false;

    const getAttr = (attr) => elem.getAttribute(`${global.attributePrefix}${attr}`) || '';
    const intermediate = getAttr('intermediate') ?? 'default-intermediate';
    const callback = getAttr('callback');
    const reload = getAttr('reload');

    const paramsMatch = callback?.match(/\(([^)]*)\)/);
    const params = paramsMatch && paramsMatch[1].trim()
      ? paramsMatch[1].split(',').map(s => s.trim())
      : [];

    const sanitizedCallback = callback?.replace(/\([^)]*\)/, '()');

    return {
      method: global.routeList.crud.builder.method,
      route: global.routeList.base + intermediate + global.routeList.crud.builder.endpoint,
      data: {
        callback: sanitizedCallback,
        params
      }
    };
  } catch (e) {
    return false;
  }
}

/**
 * Populates the tbody of a table with result data and triggers auto-pagination and search.
 *
 * @param {string} tableSelector - Selector for the table element.
 * @param {Object} result - Object containing the data to populate (expects `result.data` as HTML string).
 * @param {string} pre - Prefix used for custom attributes.
 * @returns {boolean|undefined} False if an error occurs; undefined otherwise.
 */
function listTBoday({ modules, global, options: { result, tableNameSelector } }) {
  try {
    const table = document.querySelector(tableNameSelector);
    const tbody = table?.querySelector('tbody');
    if (!table || !tbody) return;

    const isHtmlString = typeof result?.data === 'string';
    if (isHtmlString) {
      tbody.innerHTML = result.data;
    }

    autoPaginatetbody();
    autoSearchtbody({ modules, global });

  } catch (e) {
    return false;
  }
}

/**
 * Exported object.
 */
export const tables_lister = {
  listTable,
  listTBoday
};
