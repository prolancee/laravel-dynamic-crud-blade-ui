/**
 * Binds tables by generating unique keys, adding attributes, fetching data, and rendering tbody.
 *
 * @param {Array<string>} tableSelectorList - Array of table selectors to process.
 * @param {Object} tablesAttributesMap - Mapping of table names to attributes to add.
 * @param {Object} routeList - Object containing modules routes (e.g., fetchRender).
 * @param {string} pre - Prefix used for custom attributes.
 * @param {string} us - Separator used in attribute naming.
 * @param {Array<string>} attrsToRemove - List of table attributes to remove after binding.
 * @param {Object} modules - modules helper object with methods for table manipulation and AJAX.
 */
function bindTable({ modules, global }) 
{
  if (!Array.isArray(global.tableSelectorList) || global.tableSelectorList.length === 0) return;

  for (let i = 0; i < global.tableSelectorList.length; i++) {
    const tableNameSelector = global.tableSelectorList[i];
    const tableName = modules.helpers_selector.normalizeTableName(tableNameSelector);
    if (!tableName) continue;

    const table = document.querySelector(tableNameSelector);
    if (!table) continue;

    // Skip if table already has a key
    if (table.hasAttribute(`${pre}key`)) {
      console.log(`Skipping ${tableNameSelector} — already has ${pre}key`);
      continue;
    }

    // Generate and set unique key
    const key = modules.helpers_unique.generateElementKey({ global, table });
    table.setAttribute(`${global.attributePrefix}key`, key);

    // Add table attributes
    modules.tables_attributes.addAttributesToTables({ modules, global, options: { tableNameSelector, tableName } });

    // Prepare modules mapping
    const map = modules.tables_lister.listTable({ modules, global, options: { tableNameSelector } });
    if (!map.data?.callback) continue;

    // Fetch and render table data
    modules.ajax?.makeCallAjax({
      modules,
      global,
      options: {
        data: map,
        target: tableNameSelector
      }
    })
      .then(result => {
        console.log('Result for', tableNameSelector, result);

        modules.tables_lister.listTBoday({ 
          modules, 
          global, 
          options: {
             result, 
             tableNameSelector 
          } 
        });
        modules.tables_attributes.removeAttributesTableTables({ modules, global});
      })
      .catch(e => console.error('Error binding table:', e));
  }
}

/**
 * Exported object.
 */
export const tables_io_binder = {
  bindTable,
};