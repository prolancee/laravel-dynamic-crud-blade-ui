/**
 * Initializes form submit buttons and binds event listeners.
 *
 * @param {Object} params
 * @param {Object} params.modules - modules helper object
 * @param {Object} params.global - Global configuration object (contains attributePrefix, udscore, formSelectorList, formsAttributesMap, routeList, initialHtml, etc.)
 * @param {Object} [params.options] - Optional options object
 * @param {Object} [params.options.size] - Optional size info for compressed payload ({ MB: number })
 */
function initSubmit({ modules, global, options: { size } }) {
  const submitSelector = `[${global.attributePrefix}submit="${global.udscore}form${global.udscore}"]`;
  const buttons = document.querySelectorAll(submitSelector);

  if (buttons.length) {
    modules.helpers_button.dynamicDisabledSubmitbtnStyle();
  }

  // map to avoid duplicate submit handling per form
  const formSubmitTriggered = new Map();

  buttons.forEach(btn => {
    if (btn.dataset.eventsAttached) return;
    btn.dataset.eventsAttached = 'true';

    // event name may come from attribute; default to click
    const evt = btn.getAttribute(`${global.attributePrefix}event`) || 'click';

    // store handler on element so it can be removed later if needed (optional)
    const handler = async (e) => {
      await handleSubmit(e, { modules, global, options: { formSubmitTriggered, size, btn } });
    };

    btn.addEventListener(evt, handler);
    // mark that handler is attached (if you later want to remove, store handler reference somewhere)
    btn.dataset.submitHandlerAttached = 'true';
  });
}

/**
 * Handles dynamic form submission.
 *
 * @param {Event} e - The triggered event.
 * @param {Object} params
 * @param {Object} params.modules
 * @param {Object} params.global
 * @param {Object} params.options
 * @param {Map<string, boolean>} params.options.formSubmitTriggered
 * @param {Object} [params.options.size]
 * @param {HTMLElement} params.options.btn
 */
async function handleSubmit(e, { modules, global, options: { formSubmitTriggered, size, btn } }) {
  if (!global || !btn) return;

  // Ensure we only respond to the matching event type for this button
  const expectedEvent = btn.getAttribute(`${global.attributePrefix}event`) || 'click';
  if (e.type !== expectedEvent) return;

  // target button might be inside some container; find closest submit attribute container
  const target = e.target.closest(`[${global.attributePrefix}submit="${global.udscore}form${global.udscore}"]`);
  if (!target) return;

  const formNameValue = target.getAttribute(`${global.attributePrefix}form`);
  if (!formNameValue) return;

  const selector = `form[name="${formNameValue}"]`;
  const formIdx = Array.isArray(global.formSelectorList) ? global.formSelectorList.findIndex(sel => sel === selector) : -1;
  if (formIdx === -1) return;

  const formNameSelector = global.formSelectorList[formIdx];
  const formElem = document.querySelector(formNameSelector);
  if (!formElem) return;

  if (formSubmitTriggered?.get(formNameSelector)) return;
  // mark as triggered/processing to prevent duplicate submission
  formSubmitTriggered?.set(formNameSelector, true);

  const formName = modules.helpers_selector.normalizeFormName(formNameSelector);
  if (!formName) {
    formSubmitTriggered?.set(formNameSelector, false);
    return;
  }

  // If there's nothing configured for this form, bail out
  if (
    modules.helpers_utils.isEmpty(global.formsAttributesMap?.[formName]) &&
    modules.helpers_utils.isEmpty(global.formsElementAttributesMap?.[formName]) &&
    modules.helpers_utils.isEmpty(global.formshiddenElementAttributesMap?.[formName])
  ) {
    formSubmitTriggered?.set(formNameSelector, false);
    return;
  }

  // Add attributes into the form before mapping
  modules.forms_attributes.addAttributesToForms({ modules, global, options: { formNameSelector, formName } });
  modules.forms_attributes.addHiddenAttributesToForms({ modules, global, options: { formNameSelector, formName } });

  // detect if this should be PUT (update) or POST (store)
  const isPut = !!(
    global.formsAttributesMap?.[formName]?.[`${global.attributePrefix}column`] &&
    (
      global.formsAttributesMap?.[formName]?.[`${global.attributePrefix}primary`] ||
      global.formsAttributesMap?.[formName]?.[`${global.attributePrefix}unique`]
    )
  );

  const submitOpen = target.getAttribute(`${global.attributePrefix}open`) || "";

  // Prepare mapping (server route + metadata)
  let data = await modules.forms_mapper_builder.mapping({
    modules,
    global,
    options: {
      action: {
        process: 'submit',
        base: global.routeList?.base,
        method: isPut
          ? (global.routeList.crud.update.method)
          : (global.routeList.crud.store.method),
        endpoint: isPut
          ? (global.routeList.crud.update.endpoint)
          : (global.routeList.crud.store.endpoint),
        open: submitOpen
      },
      formNameSelector,
      target,
    }
  });

  // Remove attributes we added before the mapping (cleanup)
  modules.forms_attributes.removeAttributesFromForms({ modules, global });
  modules.forms_attributes.removeHiddenAttributesFromForms({ modules, global });

  // if mapping failed or returned falsy, reset flag and return
  if (!data) {
    formSubmitTriggered?.set(formNameSelector, false);
    return;
  }

  // optional: attach mutation-observer snapshot compressed payload
  try {
    const htmlSnapshot = global.initialHtml;
    if (modules.helpers_utils.hasAnyMutations(htmlSnapshot)) {
      const mb = (size?.MB ?? global.size?.MB);
      if (typeof mb === 'number' && mb <= 50) {
        const compressed = pako?.gzip(JSON.stringify(htmlSnapshot), { level: 9 });
        if (compressed?.length > 0) {
          const base64 = await modules.helpers_base64.toBase64WithBlob?.(compressed);
          if (base64) data['observer'] = base64;
        }
      }
    }
  } catch (err) {
    throw err;
  }
  
  // validation for required mapping properties
  if (data?.required?.length && !data?.table && !data?.route) {
    formSubmitTriggered?.set(formNameSelector, false);
    return;
  }

  console.log(data);

  try {
    // Using the call-signature you used elsewhere: (modules, global, map, formNameSelector)
    await modules.ajax_circular.makeCallAjax({
      modules,
      global,
      options: {
        data,
        target: formNameSelector
      }
    });
  } catch (err) {
    formSubmitTriggered?.set(formNameSelector, false);
    throw err;
  }

  // reset flag after successful call
  formSubmitTriggered?.set(formNameSelector, false);
}

/**
 * Exported object.
 */
export const forms_io_submit = {
  initSubmit,
};
