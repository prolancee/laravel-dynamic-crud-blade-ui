/**
 * Handles file upload for a form.
 * Validates files (size and type), shows error messages, and submits files via AJAX.
 *
 * @param {string} formNameSelector - Selector for the form
 * @param {Object} map - Mapping object containing upload details (route, method, folder, multiple, data, messages)
 * @param {FileList|File[]} files - List of files selected for upload
 * @param {HTMLElement} targetElem - The input element being checked
 * @param {string} pre - Prefix for custom data attributes
 * @param {string} us - Separator used in texteditor attributes
 * @param {Object} modules - modules helper object containing ajax and helper functions
 * @returns {Promise<boolean|undefined>} False if any error occurs, otherwise undefined
 */
async function handleFileUpload({modules, global, options: {map, files, formNameSelector, target}}) 
{
  try {
    const isUploadEmpty = !map?.upload?.route && !map?.upload?.method;
    if (!map?.table && isUploadEmpty) return;

    const form = document.querySelector(formNameSelector);
    if (!form || !targetElem) return;
    let uploadType = map?.upload?.uploadType;
    if (typeof uploadType === 'string') {
      uploadType = uploadType.replace(/[\[\]]/g, '').split(',').map(s => s.trim().toLowerCase());
    }

    const fileData = new FormData();
    if (map.upload.multiple) {
      [...files].forEach(file => fileData.append("file[]", file));
    } else {
      fileData.append("file", files[0]);
    }
    fileData.append("folder", map.upload.folder);
    fileData.append("multiple", map.upload.multiple);

    const requestData = {
      route: map?.upload?.route,
      method: map?.upload?.method,
      fileData,
      submitOpen: "_upload_",
      redirect: ""
    };

    // Validate files
    const sizeLimit = map?.upload?.uploadSize || 0;
    const allowedTypes = uploadType || [];
    const sizeErrors = [], typeErrors = [];

    [...files].forEach(f => {
      if (sizeLimit && f.size > sizeLimit) sizeErrors.push(map.upload.massagesSize || 'File size exceeds limit');
      if (allowedTypes.length && !allowedTypes.includes(f.type.toLowerCase())) typeErrors.push(map.upload.massageType || 'Invalid file type');
    });

    // Remove old error messages
    ['typeMsg', 'sizeMsg'].forEach(type => {
      const msgEl = form.querySelector(`[${pre}upload=${us}${type}${us}]`);
      if (msgEl) msgEl.remove();
    });

    if (sizeErrors.length || typeErrors.length) {
      if (typeErrors.length) {
        const span = document.createElement('span');
        span.setAttribute(pre + 'upload', `${us}typeMsg${us}`);
        span.style.color = 'red';
        span.innerHTML = `⚠️ Invalid file type. Allowed: ${allowedTypes.join(', ')}`;
        targetElem.insertAdjacentElement('afterend', span);
      }
      if (sizeErrors.length) {
        const span = document.createElement('span');
        span.setAttribute(pre + 'upload', `${us}sizeMsg${us}`);
        span.style.color = 'red';
        span.innerHTML = `⚠️ File size exceeds ${convertFileSize(sizeLimit)}.`;
        targetElem.insertAdjacentElement('afterend', span);
      }
      return;
    }

    const formName = modules.helpers_selector.normalizeFormName(formNameSelector);
    const formKey = formName;
    const column = map.upload.data.column;
    const columnKey = `${column}_${formName}`;
    const columnFileKey = `${column}_${formName}_file`;
    const submitButton = document.querySelector(`[${pre}form="${formName}"]`);

    uploadFiles[formKey] = formNameSelector;
    uploadFiles[columnKey] = column;

    const result = await modules.ajax_circular.ajaxUniversal(formNameSelector, requestData);
    if (result?.file?.length) uploadFiles[columnFileKey] = result;

    modules.helpers_button.undisabledSubmitButton(submitButton);

  } catch (e) {
    return false;
  }
}

/**
 * Exported object.
 */
export const forms_upload = {
    handleFileUpload,
};
