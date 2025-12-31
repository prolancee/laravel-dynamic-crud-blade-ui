/**
 * Processes real-time search checks for input fields.
 * Checks if a value already exists in the database and shows a warning if it does.
 *
 * @param {string} formNameSelector - Selector for the form
 * @param {Object} map - Mapping object containing searchTextarea details
 * @param {string} msgAttr - Attribute to set on the warning message
 * @param {string} msgAttrVal - Value for the message attribute
 * @param {HTMLElement} targetElem - The input element being checked
 * @param {string} val - Current input value
 * @param {string} pre - Prefix for custom attributes
 * @param {string} us - Separator used in texteditor attributes
 * @param {Object} modules - modules helper object
 * @returns {boolean} False if any error occurs
 */
function processSearch({ modules, global, options: { map, msgKey, value, formNameSelector, target } }) 
{
    try {
        if (!map?.unique) return;

        modules.ajax_circular.makeCallAjax({
            modules,
            global,
            options: {
                data: map,
                target: formNameSelector
            }
        })
            .then(result => {
                if (
                    !result?.data ||
                    (Array.isArray(result.data) &&
                        !result.data.length) ||
                    (!Array.isArray(result.data) &&
                        !Object.keys(result.data).length)
                ) return;

                const form = document.querySelector(formNameSelector);
                if (!form || !target) return;

                const respVal = String(map.unique).trim();
                const inputVal = String(val).trim();

                const curPK = map.primary || map.unique || '';
                const resPK = String(result.data?.[map.column] || '').trim();

                const isEditingSameRecord = curPK && resPK && curPK === resPK;

                if (respVal === inputVal && !isEditingSameRecord) {
                    form.querySelector(`[${global.attributePrefix}serach="${msgKey}"]`)?.remove();

                    const msg = map.searchTextarea.message
                        ? `${map.searchTextarea.message}${map.unique}`
                        : `That ${map.unique} is already taken. Try another one.`;

                    const span = document.createElement('span');
                    span.setAttribute(`${global.attributePrefix}serach`, msgKey);
                    span.style.color = 'red';
                    span.textContent = msg;

                    target.insertAdjacentElement('afterend', span);
                }
            })
            .catch(e => {
                throw e;
            });

    } catch (e) {
        return false;
    }
}

/**
 * Exported object.
 */
export const forms_search = {
    processSearch,
};