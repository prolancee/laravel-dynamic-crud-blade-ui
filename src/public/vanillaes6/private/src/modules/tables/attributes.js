/**
 * Removes specified attributes from all tables matching the provided selectors.
 *
 * @param {string|string[]} tableSelectorList - Selector(s) for the tables.
 * @param {string[]} attrsToRemove - Array of attribute names to remove.
 * @param {string} pre - Prefix for custom attributes (e.g., "data-").
 * @returns {Array<Object>} Array of objects containing tableName and removed attributes.
 */
function removeAttributesTableTables({ modules, global}) 
{
  function removeAttrs(el, attrs) {
    const removed = {};
    for (let i = 0; i < attrs.length; i++) {
      const attr = attrs[i];
      if (el.hasAttribute(attr)) {
        removed[attr] = el.getAttribute(attr);
        el.removeAttribute(attr);
      }
    }
    return removed;
  }

  function processTable(selector) {
    const result = [];
    const tables = document.querySelectorAll(selector);
    for (let i = 0; i < tables.length; i++) {
      const table = tables[i];
      result.push({
        tableName: table.getAttribute(`${global.attributePrefix}name`) || null,
        tAttrAdd: removeAttrs(table, attrsToRemove)
      });
    }
    return result;
  }

  try {
    if (Array.isArray(global.tableSelectorList)) {
      let output = [];
      for (let i = 0; i < global.tableSelectorList.length; i++) {
        const partial = processTable(global.tableSelectorList[i]);
        if (partial && partial.length) {
          output = output.concat(partial);
        }
      }
      return output;
    } else {
      return processTable(global.tableSelectorList);
    }
  } catch (e) {
    return [{
      tableName: null,
      tAttrAdd: {}
    }];
  }
}

/**
 * Adds attributes to a given element.
 *
 * @param {HTMLElement} element - Element to which attributes will be added.
 * @param {Object} attrToAdd - Key-value pairs of attributes to add.
 * @returns {boolean} True if attributes added successfully, false otherwise.
 */
function addAttributes(element, attrToAdd) 
{
  if (!element || !attrToAdd || typeof attrToAdd !== 'object') return false;

  for (const key in attrToAdd) {
    if (
      Object.prototype.hasOwnProperty.call(attrToAdd, key) &&
      key &&
      attrToAdd[key] !== undefined &&
      attrToAdd[key] !== null
    ) {
      element.setAttribute(key, attrToAdd[key]);
    }
  }

  return true;
}

/**
 * Adds attributes to tables and optionally to their cells.
 *
 * @param {string} tableNameSelector - Selector for target tables.
 * @param {Object} tAttrAdd - Attributes to add to the table itself.
 * @param {Array<Object>} eAttrAdd - Array of objects specifying cell elements and attributes to add:
 *                                   [{ element: HTMLElement, attributes: { key: value } }, ...]
 * @returns {boolean} True if operation succeeds, false otherwise.
 */
function addAttributesToTables({ modules, global, options: { tableNameSelector, formName } }) 
{
  try {
    const tables = document.querySelectorAll(tableNameSelector);
    for (let i = 0; i < tables.length; i++) {
      const table = tables[i];

      if (global.tablesAttributesMap && typeof global.tablesAttributesMap === 'object') {
        addAttributes(table, global.tablesAttributesMap);
      }

      if (Array.isArray(global.eAttrAdd) && eAttrAdd.length > 0) {
        const cells = table.querySelectorAll('tbody tfoot tr th td');
        for (let j = 0; j < cells.length; j++) {
          const cell = cells[j];
          for (let k = 0; k < global.eAttrAdd.length; k++) {
            const entry = global.eAttrAdd[k];
            if (entry.element === cell && entry.attributes && typeof entry.attributes === 'object') {
              addAttributes(cell, entry.attributes);
              break;
            }
          }
        }
      }
    }

    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Exported object.
 */
export const tables_attributes = {
  removeAttributesTableTables,
  addAttributesToTables,
};
