let uploadFiles = {};

/**
 * Serializes all form data including inputs, selects, textareas, checkboxes, radios, file inputs, and rich-text editors.
 * Marks required fields if empty and prepares a structured object for AJAX submission.
 *
 * @param {boolean|HTMLElement|null} submit Indicator or submit element to mark required fields
 * @param {string|null} formNameSelector CSS selector of the form to serialize
 * @param {string} pre Prefix used for custom data attributes
 * @param {string} us Delimiter used for form field naming in editors
 * @param {Object} modules modules object containing helper methods
 *
 * @returns {Object} Object containing:
 *   - `a` {Object}: Serialized form data
 *   - `r` {number|string}: 1 if all required fields are filled, "" if any required field is empty
 *   - `required` {Array<string>}: List of missing required field names
 */
function serializeData({ modules, global, options: { action, formNameSelector = null } }) 
{
  const result = { a: {}, r: 1, required: [] };

  try {
    const form = document.querySelector(formNameSelector);
    if (!form) throw new Error('Form not found');

    const { a, required } = result;
    const all = sel => [...form.querySelectorAll(sel)];
    const markRequired = (el, name) => {
      if (action?.process === 'submit' && el?.hasAttribute('required')) {
        required.push(name);
        result.r = "";
      }
    };

    // Standard inputs (text, number, textarea, select)
    all('input, select, textarea').forEach(el => {
      const { name, type, value } = el;
      if (!name || ['checkbox', 'radio', 'file'].includes(type)) return;
      const val = value?.trim();
      if (!val) return markRequired(el, name);

      if (name in a)
        a[name] = Array.isArray(a[name]) ? [...a[name], val] : [a[name], val];
      else
        a[name] = val;
    });

    // Checkboxes
    const cbNames = [...new Set(all('input[type="checkbox"]').map(el => el.name))];
    cbNames.forEach(name => {
      if (!name) return;
      const vals = all(`input[name="${name}"]:checked`).map(cb => cb.value);
      if (vals.length) a[name] = JSON.stringify(vals).replace(/"/g, "'");
      else markRequired(form.querySelector(`input[name="${name}"]`), name);
    });

    // Radio buttons
    const rbNames = [...new Set(all('input[type="radio"]').map(el => el.name))];
    rbNames.forEach(name => {
      if (!name) return;
      const val = all(`input[name="${name}"]`).find(rb => rb.checked)?.value;
      if (val) a[name] = val;
      else markRequired(form.querySelector(`input[name="${name}"]`), name);
    });

    // File inputs
    const idx = formNameSelector?.match(/form-(\d+)/)?.[1] || '';
    all('input[type="file"]').forEach(input => {
      const name = input.name;
      if (!name) return;
      const key = `${name}_form_${idx}_file`;
      const files = uploadFiles?.[key]?.file;
      if (files) a[name] = input.hasAttribute('multiple') ? JSON.stringify(files) : files;
      else markRequired(input, name);
    });

    // Rich-text editors
    const procEditor = (type, getVal) => {
      const selector = `texteditor[${global.attributePrefix}texteditor="${global.udscore}${type}${global.udscore}"]`;
      all(selector).forEach((el, i) => {
        const name = el.getAttribute('name');
        const val = getVal(el, i)?.trim();
        if (name && val) a[name] = modules.helpers_htmlentity.htmlentities(val);
        else if (name) markRequired(el, name);
      });
    };

    procEditor('ckeditor', (_, i) => CKEDITOR.instances['editor' + (i + 1)]?.getData());
    procEditor('ckeditor5', el => el?.ckeditorInstance?.getData?.());

    // Cleanup empty values
    Object.keys(a).forEach(k => {
      if (!a[k] || a[k] === '[]') delete a[k];
    });

    return result;

  } catch (e) {
    return { a: {}, r: "", required: [] };
  }
}

/**
 * Exported object.
 */
export const forms_mapper_serializer = {
  serializeData,
};