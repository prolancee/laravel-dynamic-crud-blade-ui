/**
 * Extract update-related attributes (column, unique, primary)
 */
function updateObject({ global, formName }) 
{
  return {
    column: global.formsAttributesMap?.[formName]?.[`${global.attributePrefix}column`] ?? '',
    unique: global.formsAttributesMap?.[formName]?.[`${global.attributePrefix}unique`] ?? '',
  };
}

/**
 * Extract search-related attributes
 */
function searchObject({ global, target }) 
{
  return {
    column: target?.getAttribute('name') ?? '',
    unique: target?.value ?? '',
    message: target?.getAttribute(global.attributePrefix + 'message') ?? '',
  };
}

/**
 * Extract upload-related attributes
 */
function uploadObject({ global, target }) 
{
  return {
    folder: target?.getAttribute(global.attributePrefix + 'folder') ?? '',
    size: target?.getAttribute(global.attributePrefix + 'size') ?? '',
    type: target?.getAttribute(global.attributePrefix + 'type') ?? '',
    message_size: target?.getAttribute(global.attributePrefix + 'message-size') ?? '',
    message_type: target?.getAttribute(global.attributePrefix + 'message-type') ?? '',
    multiple: target?.hasAttribute('multiple') ?? false,
  };
}

/**
 * Main mapper function
 *
 * @param {Object} param
 * @param {Object} param.modules - modules helper object
 * @param {Object} param.global - Global configuration object
 * @param {Object} param.options - Options for mapping
 * @param {Object} param.options.action - Action (method, base, endpoint, open)
 * @param {string|null} [param.options.formNameSelector] - Form name selector
 * @param {HTMLElement|null} [param.options.target] - Target element
 *
 * @returns {Promise<Object>} Structured mapping object
 */
async function mapping({ modules, global, options: { action, formNameSelector = null, target = null } }) 
{
  try {
    const formName = modules.helpers_selector.normalizeFormName(formNameSelector);

    // Step 1: Resolve intermediate route (default if missing)
    const intmdRoute = global.formsAttributesMap?.[formName]?.[`${global.attributePrefix}intermediate`]
      ?? "default-intermediate";

    // Step 2: Construct and validate full route
    const route = modules.helpers_route.cleanAndValidateRoute(
      action.base + intmdRoute + action.endpoint
    );

    if (!route) return { required: [] };

    // Step 3: Serialize form data
    const serialize = modules.forms_mapper_serializer.serializeData({ modules, global, options: { action, formNameSelector } });
    if (!serialize || typeof serialize !== 'object') return { required: [] };

    // If serializeData failed validation, return only required fields
    if (!serialize.r) return { required: serialize.required };

    // Step 4: Build base mapping object
    let data = {
      route,
      method: action.method.toUpperCase(),
      table: global.formsAttributesMap?.[formName]?.[`${global.attributePrefix}table`] ?? '',
      redirect: global.formsAttributesMap?.[formName]?.[`${global.attributePrefix}redirect`] ?? '',
      required: serialize.required,
      data: serialize.a ?? {},
      submitOpen: action?.open ?? '',
      formName: formName ?? '',
    };

    // Step 5: Extend mapping based on endpoint + method
    if (action.endpoint === '/blade/update/single' && action.method.toUpperCase() === 'PUT') {
      Object.assign(data, updateObject({ global, formName }));
    }

    if (action.endpoint === '/blade/fetch/single' && action.method.toUpperCase() === 'GET') {
      Object.assign(data, searchObject({ global, target }));
    }

    if (action.endpoint === '/blade/files/upload' && action.method.toUpperCase() === 'POST') {
      Object.assign(data, uploadObject({ global, target }));
    }

    return data;
  } catch (e) {
    return { required: [] };
  }
}

/**
 * Exported object.
 */
export const forms_mapper_builder = {
  mapping,
};
