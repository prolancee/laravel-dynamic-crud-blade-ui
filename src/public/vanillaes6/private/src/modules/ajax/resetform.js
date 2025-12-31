/**
 * Resets a form and its associated rich text editors (Summernote and CKEditor).
 *
 * Steps performed:
 *  1. Resets the native HTML form using `form.reset()`.
 *  2. Resets Summernote editors within the form.
 *  3. Resets CKEditor instances within the form.
 *
 * @param {string} target CSS selector of the form to reset
 * @param {string} pre Prefix used in the custom texteditor attribute
 * @param {string} us User/session identifier used in the texteditor attribute
 * @return {Promise<boolean>} Returns true on success, false if an error occurs
 */
async function resetForm({modules, global, options: { target = null }}) 
{
    try {
        const form = document.querySelector(target);
        if (form) form.reset();

        const ckeditorSelector = `${target} texteditor[${global.attributePrefix}texteditor="${global.udscore}ckeditor${global.udscore}"]`;
        const ckeditors = document.querySelectorAll(ckeditorSelector);

        ckeditors.forEach((elem, index) => {
            const editorId = `editor${index + 1}`;
            const instance = CKEDITOR?.instances[editorId];
            if (instance) {
                instance.setData('');
            }
        });
    } catch (e) {
        return false;
    }

    return true;
}

/**
 * Exported object.
 */
export const ajax_resetform = { 
    resetForm
};