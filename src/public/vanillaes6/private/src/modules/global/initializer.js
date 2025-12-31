/**
 * Initializes the global PROLANCEE state object with core properties,
 * configurations, structures, and utility methods.
 *
 * Ensures PROLANCEE has consistent defaults for form handling, route mapping,
 * search selectors, attribute removal sets, and initial HTML snapshots.
 * If called again with `observedTrigger = true`, preserves existing values
 * instead of overwriting them.
 *
 * @param {string} prefix - Attribute prefix used for custom attributes.
 * @param {string} udscore - Separator string used in attribute values.
 * @param {Object} routes - Route definitions for CRUD, files, etc.
 * @param {boolean} [observedTrigger=false] - If true, preserves previously set values.
 */
function initializeState(global, prefix, udscore, roleSel, roleAttrTag, routes, observedTrigger = false) 
{
  global.PROLANCEE = global.PROLANCEE || {};

  // Initial HTML snapshot
  const initialHtml = { childList: {}, attributes: {}, characterData: {} };
  ['current_temporary', 'current_permanent', 'observer_temporary', 'observer_permanent']
    .forEach(key => {
      initialHtml.childList[key] = [];
      initialHtml.attributes[key] = [];
      initialHtml.characterData[key] = [];
    });

  // --------------------------
  // Config blocks
  // --------------------------
  const searchSelectors = [
    `[${prefix}search="${udscore}button${udscore}"]`,
    `[${prefix}search="${udscore}input${udscore}"]`,
    `[${prefix}search="${udscore}select${udscore}"]`,
    `[${prefix}search="${udscore}textarea${udscore}"]`,
    `[${prefix}upload="${udscore}file${udscore}"]`
  ];

  const attrsToRemove = [
    "action", "method",
    `${prefix}table`,
    `${prefix}intermediate`,
    `${prefix}redirect`,
    `${prefix}column`,
    `${prefix}primary`,
    `${prefix}unique`,
    `${prefix}reload`,
    `${prefix}callback`
  ];

  const elementAttrsToRemove = [
    "name", "required",
    `${prefix}folder`,
    `${prefix}type`,
    `${prefix}size`,
    `${prefix}typemessage`,
    `${prefix}sizemessage`,
    `${prefix}message`,
    `${prefix}column`
  ];

  const elementHiddenAttrsToRemove = ["value"];

  const skipDecodeKeysRemoveAttrfAttrAdd = new Set([
    "method",
    `${prefix}table`,
    `${prefix}column`,
    `${prefix}primary`,
    `${prefix}unique`
  ]);

  const skipDecodeKeysRemoveAttreAttrAdd = new Set([
    "name",
    "column",
    `${prefix}folder`
  ]);

  const skipDecodeKeyRemoveHiddenAttr = new Set(["name"]);

  // --------------------------
  // Initialization
  // --------------------------
  const setInitProp = (key, val) => {
    global.PROLANCEE[key] = !observedTrigger ? val : (global.PROLANCEE[key] || val);
  };

  // Core props
  setInitProp("attributePrefix", prefix);
  setInitProp("udscore", udscore);
  setInitProp("roleSelector", roleSel);
  setInitProp("roleAttributeTag", roleAttrTag);
  setInitProp("routeList", routes);

  // Structures
  setInitProp("formSelectorList", []);
  setInitProp("tableSelectorList", []);
  setInitProp("formsAttributesMap", {});
  setInitProp("formsElementAttributesMap", {});
  setInitProp("formshiddenElementAttributesMap", {});
  setInitProp("formsElementValueMap", {});
  setInitProp("tablesAttributesMap", {});
  setInitProp("initialHtml", initialHtml);

  // Configurations
  setInitProp("isInitialLoad", true);
  setInitProp("hasSession", null);
  setInitProp("removedAddedList", []);
  setInitProp("searchSelectors", searchSelectors);
  setInitProp("attrsToRemove", attrsToRemove);
  setInitProp("elementAttrsToRemove", elementAttrsToRemove);
  setInitProp("elementHiddenAttrsToRemove", elementHiddenAttrsToRemove);
  setInitProp("skipDecodeKeysRemoveAttrfAttrAdd", skipDecodeKeysRemoveAttrfAttrAdd);
  setInitProp("skipDecodeKeysRemoveAttreAttrAdd", skipDecodeKeysRemoveAttreAttrAdd);
  setInitProp("skipDecodeKeyRemoveHiddenAttr", skipDecodeKeyRemoveHiddenAttr);

  // Utility
  global.PROLANCEE.pushUnique = global.PROLANCEE.pushUnique || function (arr, value) {
    if (Array.isArray(arr) && !arr.includes(value)) arr.push(value);
  };
}

/**
 * Waits for the global `PROLANCEE` object to be fully initialized and ready.
 * Checks its properties, methods, and internal structures repeatedly until all required elements are present.
 *
 * @async
 * @returns {Promise<Object>} Resolves with the `PROLANCEE` object when ready.
 * @throws {string} Rejects with "PROLANCEE not ready." if the object is not ready after max attempts.
 */
async function ensureReady() 
{
  const maxAttempts = 20, interval = 100;
  let attempts = 0;

  const isObject = obj => obj && typeof obj === "object" && !Array.isArray(obj);
  const isArray = v => Array.isArray(v);
  const isSet = v => v instanceof Set;

  const validateRoutes = (r, expected) => {
    for (const group in expected) {
      if (typeof expected[group] === "string") continue;

      for (const key in expected[group]) {
        const route = r?.[group]?.[key];

        if (!(route && typeof route.method === "string" && typeof route.endpoint === "string")) {
          return false;
        }
      }
    }
    return true;
  };

  return new Promise((resolve, reject) => {
    const check = () => {
      const a = window.PROLANCEE;

      console.log(a);

      const i = a?.initialHtml || {},
            r = a?.routeList || {},
            t = a?.roleAttributeTag || {};

      const ready =
        a &&
        typeof a.attributePrefix === "string" &&
        typeof a.udscore === "string" &&
        typeof a.roleSelector === "string" &&
        typeof a.pushUnique === "function" &&
        isArray(a.formSelectorList) &&
        isArray(a.tableSelectorList) &&
        isObject(t) &&
        typeof t.roleAttrName === "string" &&
        typeof t.roleAttrValue === "string" &&
        isObject(a.formsAttributesMap) &&
        isObject(a.formsElementAttributesMap) &&
        isObject(a.formsElementValueMap) &&
        isObject(a.formshiddenElementAttributesMap) &&
        isObject(a.tablesAttributesMap) &&
        isObject(i) &&
        isObject(r) &&
        validateRoutes(r, a.routeList) &&
        ["childList", "attributes", "characterData"].every(k =>
          isObject(i[k]) &&
          isArray(i[k].current_permanent) &&
          isArray(i[k].current_temporary) &&
          isArray(i[k].observer_permanent) &&
          isArray(i[k].observer_temporary)
        ) &&
        typeof a.isInitialLoad === "boolean" &&
        (a.hasSession === null || typeof a.hasSession === "string") &&
        isArray(a.removedAddedList) &&
        isArray(a.searchSelectors) &&
        isArray(a.attrsToRemove) &&
        isArray(a.elementAttrsToRemove) &&
        isArray(a.elementHiddenAttrsToRemove) &&
        isSet(a.skipDecodeKeysRemoveAttrfAttrAdd) &&
        isSet(a.skipDecodeKeysRemoveAttreAttrAdd) &&
        isSet(a.skipDecodeKeyRemoveHiddenAttr);

      ready
        ? resolve(a)
        : (++attempts >= maxAttempts
            ? reject("Window not ready.")
            : setTimeout(check, interval));
    };

    check();
  });
}

/**
 * Exported object.
 */
export const global_initializer = {
    initializeState,
    ensureReady,
};