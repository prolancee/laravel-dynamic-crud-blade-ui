/**
 * Removes specified attributes from forms and their inputs/selects/textareas.
 *
 * @param {string|string[]} formSelectorList - CSS selector(s) for forms
 * @param {string[]} formAttrsToRemove - List of form-level attributes to remove
 * @param {string[]} elementAttrsToRemove - List of element-level attributes to remove
 * @returns {Array} Array of objects with removed attributes per form
 */
function removeAttributesFromForms({ modules, global}) {
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

  function processForm(selector) {
    const result = [];
    const forms = document.querySelectorAll(selector);
    for (let i = 0; i < forms.length; i++) {
      const form = forms[i];
      const fAttrAdd = removeAttrs(form, global.attrsToRemove);
      const eAttrAdd = [];
      const inputs = form.querySelectorAll('input, select, textarea, texteditor');

      for (let j = 0; j < inputs.length; j++) {
        const input = inputs[j];
        const removed = removeAttrs(input, global.elementAttrsToRemove);
        if (removed && Object.keys(removed).length > 0) {
          eAttrAdd.push({ element: input, attributes: removed });
        }
      }

      result.push({
        formName: form.getAttribute('name') || null,
        fAttrAdd,
        eAttrAdd
      });
    }
    return result;
  }

  try {
    if (Array.isArray(global.formSelectorList)) {
      let output = [];
      for (let i = 0; i < global.formSelectorList.length; i++) {
        const partial = processForm(global.formSelectorList[i]);
        if (partial && partial.length) output = output.concat(partial);
      }
      return output;
    } else {
      return processForm(global.formSelectorList);
    }
  } catch (e) {
    return [{ formName: null, fAttrAdd: {}, eAttrAdd: [] }];
  }
}

/**
 * Removes specified attributes from hidden inputs of forms.
 *
 * @param {string|string[]} formSelectorList - CSS selector(s) for forms
 * @param {string[]} elementAttrsToRemove - List of hidden element attributes to remove
 * @param {string} pre - Prefix for custom data attributes
 * @param {Object} modules - modules object for helper methods
 * @returns {Array} Array of removed attributes per form
 */
function removeHiddenAttributesFromForms({ modules, global}) {
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

  function processForm(selector) {
    const result = [];
    const forms = document.querySelectorAll(selector);

    for (let i = 0; i < forms.length; i++) {
      const form = forms[i];
      const eAttrAdd = [];
      const hiddenInputs = form.querySelectorAll('input[type="hidden"]');

      for (let j = 0; j < hiddenInputs.length; j++) {
        const input = hiddenInputs[j];
        const key = modules.helpers_unique.generateElementKey(input, pre);
        const removedAttrs = removeAttrs(input, global.elementHiddenAttrsToRemove);

        if (removedAttrs && Object.keys(removedAttrs).length > 0) {
          let found = false;
          for (let k = 0; k < eAttrAdd.length; k++) {
            const item = eAttrAdd[k];
            if (item?.element?.getAttribute(`${pre}key`) === key) {
              Object.assign(item.attributes, removedAttrs);
              found = true;
              break;
            }
          }

          if (!found) {
            eAttrAdd.push({ element: input, attributes: removedAttrs });
          }
        }
      }

      result.push({
        formName: form.getAttribute('name') || null,
        eAttrAdd
      });
    }

    return result;
  }

  try {
    if (Array.isArray(global.formSelectorList)) {
      let output = [];
      for (let i = 0; i < global.formSelectorList.length; i++) {
        const partial = processForm(global.formSelectorList[i]);
        if (partial && partial.length) output = output.concat(partial);
      }
      return output;
    } else {
      return processForm(global.formSelectorList);
    }
  } catch (e) {
    return [{ formName: null, eAttrAdd: [] }];
  }
}

/**
 * Adds multiple attributes to a single element
 *
 * @param {Element} element - DOM element
 * @param {Object} attrToAdd - Key-value map of attributes to add
 * @returns {boolean} True if attributes added successfully
 */
function addAttributes(element, attrToAdd) {
  if (!element || !attrToAdd || typeof attrToAdd !== 'object') return false;
  for (const key in attrToAdd) {
    if (Object.prototype.hasOwnProperty.call(attrToAdd, key) && key && attrToAdd[key] != null) {
      element.setAttribute(key, attrToAdd[key]);
    }
  }
  return true;
}

/**
 * Adds attributes to forms and their inputs/selects/textareas/texteditors
 */
function addAttributesToForms({ modules, global, options: { formNameSelector, formName } }) {
  try {
    const forms = document.querySelectorAll(formNameSelector);
    for (let i = 0; i < forms.length; i++) {
      const form = forms[i];
      if (
        global.formsAttributesMap[formName] && 
        typeof global.formsAttributesMap[formName] === 'object') 
        addAttributes(form, global.formsAttributesMap[formName]
      );

      if (Array.isArray(global.formsElementAttributesMap[formName]) && global.formsElementAttributesMap[formName].length > 0) {
        const inputs = form.querySelectorAll('input, select, textarea, texteditor');
        for (let j = 0; j < inputs.length; j++) {
          const input = inputs[j];
          for (let k = 0; k < global.formsElementAttributesMap[formName].length; k++) {
            const entry = global.formsElementAttributesMap[formName][k];
            if (entry.element === input && entry.attributes) {
              addAttributes(input, entry.attributes);
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
 * Adds attributes to hidden inputs in forms
 */
function addHiddenAttributesToForms({ modules, global, options: { formNameSelector, formName } }) {
  try {
    const forms = document.querySelectorAll(formNameSelector);
    for (let i = 0; i < forms.length; i++) {
      const form = forms[i];
      if (Array.isArray(global.formshiddenElementAttributesMap[formName]) && global.formshiddenElementAttributesMap[formName].length > 0) {
        const hiddenInputs = form.querySelectorAll('input[type="hidden"]');
        for (let j = 0; j < hiddenInputs.length; j++) {
          const input = hiddenInputs[j];
          for (let k = 0; k < global.formshiddenElementAttributesMap[formName].length; k++) {
            const entry = global.formshiddenElementAttributesMap[formName][k];
            if (entry.element === input && entry.attributes) {
              addAttributes(input, entry.attributes);
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
 * Removes specified attributes from a single element and returns them
 */
function removeAttributes(element, attrsToRemove) {
  const attrAdd = {};
  try {
    attrsToRemove.forEach(attr => {
      if (element.hasAttribute(attr)) {
        attrAdd[attr] = element.getAttribute(attr);
        element.removeAttribute(attr);
      }
    });
    return attrAdd;
  } catch (e) {
    return false;
  }
}

/**
 * Removes all added attributes from the body based on prefix
 */
function removeAddedAttributesFromBody({modules, global}) {
  const attrName = global.attributePrefix + 'added';
  const removedList = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
  let node = walker.nextNode();
  while (node) {
    if (node.hasAttribute(attrName)) {
      const attrValue = node.getAttribute(attrName);
      removedList.push({ element: node, removedAttributes: { [attrName]: attrValue } });
      node.removeAttribute(attrName);
    }
    node = walker.nextNode();
  }
  return removedList;
}

/**
 * Restores previously removed attributes to elements
 */
function restoreRemovedAttributes(removedList) {
  if (!Array.isArray(removedList)) return false;
  for (let i = 0; i < removedList.length; i++) {
    const entry = removedList[i];
    if (!entry || !(entry.element instanceof Element)) continue;
    const attrs = entry.removedAttributes;
    if (!attrs || typeof attrs !== 'object') continue;
    for (const key in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, key)) {
        entry.element.setAttribute(key, attrs[key] ?? '');
      }
    }
  }
  return true;
}

/**
 * Exported object.
 */
export const forms_attributes = {
  removeAttributesFromForms,
  removeHiddenAttributesFromForms,
  addAttributesToForms,
  addHiddenAttributesToForms,
  removeAddedAttributesFromBody,
  removeAttributes,
  restoreRemovedAttributes,
};