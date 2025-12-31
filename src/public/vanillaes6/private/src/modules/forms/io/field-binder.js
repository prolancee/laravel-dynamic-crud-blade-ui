/**
 * Reloads a form with new data while preserving attributes and then cleans up temporary attributes.
 *
 * @param {Object} params
 * @param {Object} params.modules - modules object
 * @param {Object} params.global - Global data state
 * @param {Object} params.options - options object
 * @param {string} params.options.formNameSelector - Selector of the form to reload
 * @param {string} params.options.formName - Normalized form name
 * @param {Object} params.options.response - Response data from server
 * @param {Object} params.options.map - Mapping object with route/table info
 */
const reloadForm = ({ modules, global, options: { response, map, formName, formNameSelector } }) => {
  if (
    modules.helpers_utils.isEmpty(global.formsAttributesMap?.[formName]) &&
    modules.helpers_utils.isEmpty(global.formsElementAttributesMap?.[formName]) &&
    modules.helpers_utils.isEmpty(global.formshiddenElementAttributesMap?.[formName])
  ) return;

  modules.forms_attributes.addAttributesToForms({ modules, global, options: { formName, formNameSelector } });
  modules.forms_attributes.addHiddenAttributesToForms({ modules, global, options: { formName, formNameSelector } });

  modules.forms_edit.reloadFormData({ modules, global, options: { response, map, formNameSelector } });

  modules.forms_attributes.removeAttributesFromForms({ modules, global });
  modules.forms_attributes.removeHiddenAttributesFromForms({ modules, global });
};

/**
 * Fetches data for a specific form and triggers reload with the returned data.
 */
const processForm = async ({ modules, global, options: { formNameSelector, formName, formAttribues, formElementValue } }) => {
  const form = document.querySelector(formNameSelector);
  if (!form) return false;

  const map = await modules.forms_mapper_builder.mapping({
    modules,
    global,
    options: {
      action: {
        process: "edit",
        base: global.routeList.base,
        method: global.routeList.crud.single.method,
        endpoint: global.routeList.crud.single.endpoint,
        open: "",
      },
      formNameSelector
    }
  });

  if (Array.isArray(formElementValue)) {
    map.attributes = { attributes: formElementValue };
  }

  if ((!map?.primary || !map?.unique)) return;

  try {
    const response = await modules.ajax_circular.makeCallAjax({
      modules,
      global,
      options: {
        data: map,
        target: formNameSelector
      }
    });
    if (response) {
      reloadForm({
        modules,
        global,
        options: {
          response,
          map,
          formName,
          formNameSelector,
        },
      });
    }
  } catch (err) {
    throw err;
  }
};

/**
 * Binds all forms in the list for automatic field reload and prevents invalid spaces in certain input types.
 */
function bindFormSelectors({ modules, global }) {
  if (global.formSelectorList && Array.isArray(global.formSelectorList)) {
    global.formSelectorList.forEach((formNameSelector) => {
      const formName = modules.helpers_selector.normalizeFormName(formNameSelector);
      if (!formName) return;

      const formAttribues = global.formsAttributesMap?.[formName];
      if (modules.helpers_utils.isEmpty(formAttribues)) return;

      const formElementValue = global.formsElementValueMap?.[formName];
      if (!formAttribues && !formElementValue) return;

      const col = formAttribues?.[`${global.attributePrefix}column`] || "";
      const uni = formAttribues?.[`${global.attributePrefix}unique`] || "";

      const filled = col.trim() !== "" && uni.trim() !== "";

      if (filled) {
        processForm({ modules, global, options: { formNameSelector, formName, formAttribues, formElementValue } });
      }
    });

    preventInvalidSpaces({ global });
  }
}

/**
 * Prevents invalid spaces from being entered into telephone, email, and URL inputs.
 */
function preventInvalidSpaces({ global }) {
  global.formSelectorList.forEach((formNameSelector) => {
    const inputs = document.querySelectorAll(
      `${formNameSelector} input[type='tel'], 
       ${formNameSelector} input[type='email'],
       ${formNameSelector} input[type='url']`
    );

    inputs.forEach((input) => {
      input.addEventListener("keypress", function (e) {
        const key = e.which || e.keyCode;
        if (key === 32) {
          e.preventDefault();
        }
      });
    });
  });
}

/**
 * Exported object.
 */
export const forms_io_field_binder = {
  bindFormSelectors,
};
