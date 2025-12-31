const formsAttributesNames = [], 
      formsElementAttributesNames = [], 
      formshiddenElementAttributesNames = [];

/**
 * Sends an array of base64-encoded values to the backend for decryption.
 *
 * @param {Array} values Array of base64-encoded values
 * @param {string} pre Prefix used in attributes
 * @param {string} us User/session identifier
 * @param {Object} modules modules helpers and AJAX methods
 * @param {Object} routeList Object containing route endpoints, e.g., { decryptData: '/modules/decrypt' }
 * @return {Promise<Array>} Returns decrypted values on success, or original values if decryption fails
 */
async function sendToBackendForDecryption({modules, global, options: { data }})
{
    try {
        const result = await modules.ajax_circulatr.makemodulesCallAjax({
            modules, 
            global,
            options:{  
               data: {
                    data,
                    route: modules.helpers_route.cleanAndValidateRoute(
                        `${global.routeList.base}attributes${global.routeList.crypto.decrypt.endpoint}`
                    ),
                    method: global.routeList.crypto.decrypt.method,
               },
               target: null
            }
        });
        if (result?.code === 200 && Array.isArray(result.data)) {
            return result.data;  
        } else {
            return data; 
        }
    } catch (e) {
        throw e; 
    }
}

/**
 * Wrapper function to get decrypted attributes if there are values to decrypt.
 *
 * @param {Array} toDecrypt Array of base64-encoded values
 * @param {string} pre Prefix used in attributes
 * @param {string} us User/session identifier
 * @param {Object} modules modules helpers and AJAX methods
 * @param {Object} routeList Object containing route endpoints
 * @return {Promise<Array>} Returns decrypted values, or empty array if nothing to decrypt
 */
async function getDecryptedAttributes({modules, global, options: { data }}) 
{
    if (!toDecrypt?.length) return [];
    return await sendToBackendForDecryption({modules, global, options: { data }});
}

/**
 * Processes form, hidden input, and table attributes by sending all base64-encoded values
 * to the backend for decryption and updates local maps accordingly.
 *
 * @param {Function} cb Optional callback to run after decryption and processing
 * @return {Promise<void>}
 */
async function processAttributes({modules, global}, cb)
{    
    try {
        if (!Array.isArray(global.formSelectorList)) return;

        const allFormData = modules.forms_attributes.removeAttributesFromForms({ modules, global});
        const hiddenFormData = modules.forms_attributes.removeHiddenAttributesFromForms({ modules, global});
        const allTableData = modules.tables_attributes.removeAttributesTableTables({ modules, global});

        const fAList = Array.isArray(allFormData) ? allFormData : [allFormData];
        const hAList = Array.isArray(hiddenFormData?.[0]) ? hiddenFormData : [hiddenFormData];
        const tAList = Array.isArray(allTableData) ? allTableData : [allTableData];

        const d = [];

        // collect base64 encoded form-level + element-level attributes
        for (let i = 0; i < fAList.length; i++) {
            const { fAttrAdd, eAttrAdd } = fAList[i];
            for (const k in fAttrAdd) {
                const v = fAttrAdd[k];
                if (modules.helpers_base64.isBase64(v) && !global.skipDecodeKeysRemoveAttrfAttrAdd.has(k)) d.push(v);
            }
            for (let j = 0; j < eAttrAdd.length; j++) {
                const attrs = eAttrAdd[j].attributes;
                for (const k in attrs) {
                    const v = attrs[k];
                    if (modules.helpers_base64.isBase64(v) && !global.skipDecodeKeysRemoveAttreAttrAdd.has(k)) d.push(v);
                }
            }
        }

        // collect base64 encoded hidden inputs
        for (let i = 0; i < hAList.length; i++) {
            const group = hAList[i];
            for (let j = 0; j < group.length; j++) {
                const v = group[j];
                if (modules.helpers_base64.isBase64(v) && !global.skipDecodeKeyRemoveHiddenAttr.has(v)) d.push(v);
            }
        }

        // collect base64 encoded table-level attributes
        for (let i = 0; i < tAList.length; i++) {
            const { tAttrAdd } = tAList[i];
            for (const k in tAttrAdd) {
                const v = tAttrAdd[k];
                if (modules.helpers_base64.isBase64(v)) d.push(v); // no skip list needed for table attr
            }
        }

        const decryptedResults = d.length > 0
            ? await getDecryptedAttributes({modules, global, options: {data: d}})
            : [];

        let index = 0;

        // decode fAList
        const updatedFList = fAList.map(({ fAttrAdd, eAttrAdd, formName }) => {
            for (const k in fAttrAdd) {
                if (modules.helpers_base64.isBase64(fAttrAdd[k]) && !global.skipDecodeKeysRemoveAttrfAttrAdd.has(k)) {
                    fAttrAdd[k] = decryptedResults[index++] || fAttrAdd[k];
                }
            }

            const newEAttrAdd = eAttrAdd.map(it => {
                const newAttrs = {};
                const oldAttrs = it.attributes || {};
                for (const k in oldAttrs) {
                    const v = oldAttrs[k];
                    newAttrs[k] = (modules.helpers_base64.isBase64(v) && !global.skipDecodeKeysRemoveAttreAttrAdd.has(k)) 
                    ? (decryptedResults[index++] || v) 
                    : v;
                }
                return { ...it, attributes: newAttrs };
            });

            return { fAttrAdd, eAttrAdd: newEAttrAdd, formName };
        });

        // decode hAList
        const updatedHList = hAList.map((group, i) => {
            const list = [];
            for (let j = 0; j < group.length; j++) {
                const v = group[j];
                list.push((modules.helpers_base64.isBase64(v) && !global.skipDecodeKeyRemoveHiddenAttr.has(v)) 
                ? (decryptedResults[index++] || v) 
                : v);
            }
            return list;
        });

        // decode tAList and store to tablesAttributesMap
        for (let i = 0; i < tAList.length; i++) {
            const { tAttrAdd, tableName } = tAList[i];
            const decodedAttrs = {};
            for (const k in tAttrAdd) {
                const v = tAttrAdd[k];
                decodedAttrs[k] = modules.helpers_base64.isBase64(v) ? (decryptedResults[index++] || v) : v;
            }
            if (!tableName) continue;
            const tn = modules.helpers_selector.normalizeTableName(tableName);
            if (!tn) continue;
            global.tablesAttributesMap[tn] = {
                ...(global.tablesAttributesMap[tn] || {}),
                ...decodedAttrs
            };
        }

        // store to formsAttributesMap, formsElementAttributesMap, etc.
        for (let i = 0; i < updatedFList.length; i++) {
            const { fAttrAdd, eAttrAdd, formName } = updatedFList[i];
            if (!formName) continue;
            const n = modules.helpers_selector.normalizeFormName(formName);
            if (!n) continue;

            global.formsAttributesMap[n] = { ...(global.formsAttributesMap[n] || {}), ...fAttrAdd };
            for (let k in fAttrAdd) global.pushUnique(formsAttributesNames, k);

            const eList = global.formsElementAttributesMap[n] ||= [];
            for (let j = 0; j < eAttrAdd.length; j++) {
                const it = eAttrAdd[j];
                if (!eList.some(e => e.element === it.element || e.element?.isSameNode(it.element))) {
                    eList.push(it);
                }
                const attrs = it.attributes || {};
                for (let k in attrs) global.pushUnique(formsElementAttributesNames, k);
            }

            const vList = global.formsElementValueMap[n] ||= [];
            for (let j = 0; j < eAttrAdd.length; j++) {
                const name = eAttrAdd[j]?.attributes?.name;
                if (name) vList.push(name);
            }
        }

        for (let i = 0; i < updatedHList.length; i++) {
            const items = updatedHList[i];
            const formName = fAList?.[i]?.formName;
            if (!formName) continue;
            const n = modules.helpers_selector.normalizeFormName(formName);
            if (!n) continue;

            const hiddenList = global.formshiddenElementAttributesMap[n] ||= [];
            hiddenList.push(...items);
            for (let j = 0; j < items.length; j++) global.pushUnique(formshiddenElementAttributesNames, items[j]);
        }

        if (typeof cb === 'function') cb();
    } catch (e) {
        throw e;
    }
}

/**
 * Exported object.
 */
export const crypto_decrypter = {
    processAttributes,
};