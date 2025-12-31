/**
 * Handles backend edit data caching with session storage and lock
 *
 * @param {Object} res - Response data from backend
 * @param {Object} modules - modules object with session helper methods
 * @returns {Promise<Object>} Original response after storing to session
 */
async function handleEditData(res, modules) {
  const s = sessionStorage;
  const [t, n] = [modules.helper_date.getTodayDate(), modules.helper_date.getNextDayDate()];
  const cacheKey = `editData_public_prolancee_crud_php_blade_exports_crud-ajax_${t}_${n}`;
  const lockKey = `editDataLock_public_prolancee_crud_php_blade_exports_crud-ajax_${t}_${n}`;

  if (!await modules.session.acquireLock(10, 100, lockKey, s)) return res;

  try {
    await modules.session.saveToSessionStorage(res, cacheKey);
  } catch (e) {
    throw e;
  } finally {
    modules.session.releaseLock(s, lockKey);
  }

  return res;
}

/**
 * Sets the value of a form field including checkboxes, radios, editors, inputs, selects, and textareas
 *
 * @param {HTMLFormElement} form - Target form
 * @param {string} key - Field name
 * @param {*} value - Value to set (string, array, or object)
 * @param {string} pre - Prefix for custom data attributes
 * @param {string} us - Separator used in texteditor attributes
 */
function fillFormValue(form, key, value, pre, us) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    value = Object.entries(value).reduce((arr, [k, v]) => {
      const i = k.match(/_(\d+)$/)?.[1];
      if (i !== undefined) arr[+i] = v;
      return arr;
    }, []);
  }

  const setVal = (selector, cb) => {
    const els = form.querySelectorAll(selector);
    els.forEach((el, i) => cb(el, Array.isArray(value) ? value[i] ?? "" : value));
    return els.length;
  };

  // Summernote editor
  const sn = form.querySelector(`texteditor[name="${key}"]`);
  if (sn && form.querySelector(`[${pre}texteditor="${us}summernote${us}"]`) && typeof $(sn).summernote === 'function') {
    $(sn).summernote('code', htmlEntityDecode(value)); 
    return;
  }

  // CKEditor classic
  const ck = form.querySelector(`texteditor[name="${key}"]`);
  if (ck && form.querySelector(`[${pre}texteditor="${us}ckeditor${us}"]`)) {
    const inst = CKEDITOR.instances[ck.id || `editor_${key}`];
    if (inst) { inst.setData(htmlEntityDecode(value)); return; }
  }

  // Checkboxes
  const checkboxEls = form.querySelectorAll(`input[type="checkbox"][name="${key}"]`);
  if (checkboxEls.length) {
    try {
      let vals = value;
      if (typeof vals === 'string') {
        vals = vals.trim();
        if (vals.startsWith('[') && vals.endsWith(']')) vals = JSON.parse(vals.replace(/'/g, '"'));
        else vals = [vals];
      } else if (!Array.isArray(vals)) vals = [vals];
      checkboxEls.forEach(cb => cb.checked = vals.includes(cb.value));
    } catch (e) { throw e; }
    return;
  }

  if (setVal(`input[type="radio"][name="${key}"]`, (el, val) => el.checked = el.value === val)) return;
  if (setVal(`input[name="${key}"]:not([type="checkbox"]):not([type="radio"])`, (el, val) => el.value = val)) return;
  if (setVal(`select[name="${key}"]`, (el, val) => el.value = val)) return;
  if (setVal(`textarea[name="${key}"]`, (el, val) => el.value = val)) return;
}

/**
 * Reloads form data by filling values into the form fields
 *
 * @param {Object} storedData - Stored form data containing data, column, primary, unique, and form selector
 * @param {string} pre - Prefix for custom data attributes
 * @param {string} us - Separator used in texteditor attributes
 * @returns {Promise<boolean>} True if reload successful
 */
async function reloadFormData(storedData, pre, us) {
  try {
    const form = document.querySelector(storedData.formNameSelector);
    if (!form) return false;

    const data = storedData?.data?.data;
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      Object.entries({
        column: storedData.column,
        primary: storedData.primary,
        unique: storedData.unique
      }).forEach(([key, value]) => {
        if (value) form.setAttribute(`${pre}${key}`, value);
      });

      for (const key in data) {
        let val;
        try { val = JSON.parse(data[key]); } catch { val = data[key]; }
        fillFormValue(form, key, val, pre, us);
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
export const forms_edit = {
  handleEditData,
  reloadFormData
};