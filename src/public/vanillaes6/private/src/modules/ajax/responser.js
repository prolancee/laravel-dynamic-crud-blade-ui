/**
 * Handles modules responses and performs actions based on response codes and directives.
 *
 * Supported actions based on `res.submitOpen`:
 *  - Redirects to a given URL
 *  - Refreshes the page
 *  - Resets forms (fresh)
 *  - Handles temporary or permanent edit operations
 *  - Upload success handling
 *
 * @param {string} target CSS selector of the form or container
 * @param {Object} res modules response object
 * @param {string} pre Prefix used in custom attributes
 * @param {string} us User/session identifier used in attributes
 * @param {Object} modules Optional modules helper and form methods
 * @return {Promise<Object|boolean>} Returns the response object on success, false on error
 */
async function handleResponse({modules, global, options: {data, target = null}}) 
{
    try {
        const { code, message } = data.response;

        if (code === 200 || code === 201) {
            switch (data?.data?.submitOpen) {
                case `${global.udscore}redirect${global.udscore}`:
                    window.sessionStorage.setItem("success", message);
                    window.location.href = window.location.origin + (data?.data?.redirect?.startsWith?.('/') ? data?.data?.redirect : '/' + data?.data?.redirect);
                    break;

                case `${global.udscore}refresh${global.udscore}`:
                    window.sessionStorage.setItem("success", message);
                    window.location.reload();
                    break;

                case `${global.udscore}fresh${global.udscore}`:
                    if (await modules.ajax_resetform.resetForm({modules, global, options: { target }})) {
                        modules.responsor_sweetalert2.success(message);
                    }
                    break;

                case `${global.udscore}temporary:edit${global.udscore}`:
                case `${global.udscore}permanent:edit${global.udscore}`:
                    window.sessionStorage.setItem("success", message);
                    await modules.forms_edit.handleEditData(true, modules);
                    window.location.reload();
                    break;

                default:
                    if (data?.data?.redirect) {
                        window.sessionStorage.setItem("success", message);
                        window.location.href = window.location.origin + (data?.data?.redirect?.startsWith('/') ? data?.data?.redirect : '/' + data?.data?.redirect);
                    } else {
                        if (await modules.ajax_resetform.resetForm({modules, global, options: { target }})) {
                            modules.responsor_sweetalert2.success(message);
                        }
                    }
                    break;
            }
            return data.response;

        } else {
            if (code === 500) modules.responsor_sweetalert2.error(message);
            if (code === 206) modules.responsor_sweetalert2.warn(message);
            if (code === 202) modules.responsor_sweetalert2.info(message);
            return res.res;
        }
    } catch (e) {
        return false;
    }
}

/**
 * Exported object.
 */
export const ajax_responser = { 
    handleResponse
};