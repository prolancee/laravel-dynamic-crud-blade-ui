/**
 * Map to track whether events have been triggered for a form
 * Prevents attaching duplicate events.
 * @type {Map<string, boolean>}
 */
const formEventTriggered = new Map();

/**
 * Initializes binding of click and hover events for all form elements
 * matching the provided search selectors.
 *
 * @param {Object} params
 * @param {Object} params.modules modules reference object
 * @param {Object} params.global Global config
 */
function initFormField({ modules, global }) 
{
  document.querySelectorAll(global.searchSelectors.join(',')).forEach(elem => {
    if (!elem.dataset.boundHandler) {
      const handler = (event) => handleEvent(event, { modules, global });
      elem.addEventListener('click', handler);
      elem.addEventListener('mouseenter', handler);
      elem.dataset.boundHandler = handler; // preserve reference for later removal
    }
  });
}

/**
 * Attaches input events (keypress and custom event) to a form element.
 */
function attachInputEvents({global, options: {elem, msgKey, eventName, callback}}) 
{
  if (!elem.dataset.keypressAttached) {
    elem.dataset.keypressAttached = 'true';
    elem.addEventListener('keypress', () => {
      const msgElem = elem.form.querySelector(`[${global.attributePrefix}search="${msgKey}"]`);
      if (msgElem) msgElem.remove();
    });
  }
  if (!elem.dataset.eventsAttached) {
    elem.dataset.eventsAttached = 'true';
    elem.addEventListener(eventName, callback);
  }
}

/**
 * Attaches click and change events to a form element.
 */
function attachClickChange({global, options: {elem, msgKey, callback}}) 
{
  if (!elem.dataset.clickAttached) {
    elem.dataset.clickAttached = 'true';
    elem.addEventListener('click', () => {
      const msgElem = elem.form.querySelector(`[${global.attributePrefix}search="${msgKey}"]`);
      if (msgElem) msgElem.remove();
    });
  }
  if (!elem.dataset.changeAttached) {
    elem.dataset.changeAttached = 'true';
    elem.addEventListener('change', callback);
  }
}

/**
 * Attaches file input events for upload handling.
 */
function attachFileEvents({modules, global, options: {elem, formNameSelector}}) 
{
  if (!elem.dataset.clickAttached) {
    elem.dataset.clickAttached = 'true';
    elem.addEventListener('click', () => {
      const typeMsg = elem.form.querySelector(`[${global.attributePrefix}upload="${global.udscore}typeMsg${global.udscore}"]`);
      const sizeMsg = elem.form.querySelector(`[${global.attributePrefix}upload="${global.udscore}sizeMsg${global.udscore}"]`);
      if (typeMsg) typeMsg.remove();
      if (sizeMsg) sizeMsg.remove();
    });
  }

  if (!elem.dataset.eventsAttached) {
    elem.dataset.eventsAttached = 'true';
    elem.addEventListener('change', async function () {
      const files = this.files;
      if (!files || !files.length) return;

      const formName = modules.helpers_selector.normalizeFormName(formNameSelector);
      if (!formName) return;

      if (
        modules.helpers_utils.isEmpty(formsAttributesMap[formName]) &&
        modules.helpers_utils.isEmpty(formsElementAttributesMap[formName]) &&
        modules.helpers_utils.isEmpty(formshiddenElementAttributesMap[formName])
      ) return;

      const submitButton = document.querySelector(`[${global.attributePrefix}form="${formName}"]`);
      modules.helpers_button.disabledSubmitButton(submitButton);

      modules.forms_attributes.addAttributesToForms({ modules, global, options: { formNameSelector, formName } });
      modules.forms_attributes.addHiddenAttributesToForms({ modules, global, options: { formNameSelector, formName } });

      const map = await modules.forms_mapper_builder.mapping({
        modules,
        global,
        action: {
          process: 'upload',
          base: global.routeList.base,
          method: global.routeList.files.upload.method,
          endpoint: global.routeList.files.upload.endpoint,
          open: submitOpen
        },
        formNameSelector,
        target,
      });

      modules.forms_attributes.removeAttributesFromForms({ modules, global});
      modules.forms_attributes.removeHiddenAttributesFromForms({ modules, global});

      if (!map) return;
      modules.forms_upload.handleFileUpload({modules, global, options: {map, files, formNameSelector, target: this}});
    });
  }
}

/**
 * Main event handler to bind input, select, textarea, and file events
 * for a given form element when clicked or hovered.
 */
function handleEvent(event, { modules, global }) 
{
  const element = event.currentTarget;
  const closestForm = element.closest('form');
  let formName = closestForm?.getAttribute('name');
  if (!formName) return;

  const formNameSelector = `form[name="${formName}"]`;
  const formElem = document.querySelector(formNameSelector);
  if (!formElem || !formElem.contains(closestForm)) return;

  formName = modules.helpers_selector.normalizeFormName(formNameSelector);
  if (!formName) return;

  if (
    modules.helpers_utils.isEmpty(formsAttributesMap[formName]) &&
    modules.helpers_utils.isEmpty(formsElementAttributesMap[formName]) &&
    modules.helpers_utils.isEmpty(formshiddenElementAttributesMap[formName])
  ) return;

  if (formEventTriggered.get(formNameSelector)) return;
  formEventTriggered.set(formNameSelector, true); // mark as already bound

  // helper function to bind search events
  const bindSearchEvent = (selectorSuffix, validEvents, msgKey, isSelect = false) => {
    formElem.querySelectorAll(`[${global.attributePrefix}search="${selectorSuffix}"]`).forEach(elem => {
      const eventName = elem.getAttribute(`${global.attributePrefix}event`);
      if (!validEvents.includes(eventName)) return;

      const callback = async function () {
        modules.forms_attributes.addAttributesToForms({ modules, global, options: {formNameSelector, formName }});
        modules.forms_attributes.addHiddenAttributesToForms({ modules, global, options: {formNameSelector, formName}});

        const map = await modules.forms_mapper_builder.mapping({
          modules,
          global,
          options: {
            action: {
              process: 'search',
              base: global.routeList.base,
              method: global.routeList.crud.single.method,
              endpoint: global.routeList.crud.single.endpoint,
              open: ''
            },
            formNameSelector,
            target
          }
        });

        modules.forms_attributes.removeAttributesFromForms({ modules, global});
        modules.forms_attributes.removeHiddenAttributesFromForms({ modules, global});

        modules.form_search.processSearch({modules, global, options: {map, msgKey, value: this.value, formNameSelector, target: this}});
      };

      isSelect
        ? attachClickChange({global, options: {elem, msgKey, callback}})
        : attachInputEvents({global, options: {elem, msgKey, eventName, callback}});
    });
  };

  // bind all relevant search events
  bindSearchEvent(`${global.udscore}input${global.udscore}`, ['blur', 'keyup'], `${global.udscore}inputMsg${global.udscore}`);
  bindSearchEvent(`${global.udscore}select${global.udscore}`, ['change'], `${global.udscore}selectMsg${global.udscore}`, true);
  bindSearchEvent(`${global.udscore}textarea${global.udscore}`, ['blur', 'keyup'], `${global.udscore}textareaMsg${global.udscore}`);

  // bind file inputs
  formElem.querySelectorAll(`[${global.attributePrefix}upload="${global.udscore}file${global.udscore}"]`)
    .forEach(fileInput => attachFileEvents({modules, global, options: {elem: fileInput, formNameSelector}}));

  // cleanup initial trigger handlers (click / mouseenter)
  closestForm.querySelectorAll(global.searchSelectors.join(',')).forEach(elem => {
    const handler = elem.dataset.boundHandler;
    if (handler) {
      elem.removeEventListener('click', handler);
      elem.removeEventListener('mouseenter', handler);
      delete elem.dataset.boundHandler;
    }
  });
}

/**
 * Exported object.
 */
export const forms_io_binder = {
  initFormField,
};