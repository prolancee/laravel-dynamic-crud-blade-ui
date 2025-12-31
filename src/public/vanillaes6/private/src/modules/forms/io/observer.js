/**
 * Stores observer data if mutations exist, otherwise triggers the delete observed route.
 *
 * @param {Object} initialHtml - The initial HTML state to check for mutations.
 * @param {Object} modules - modules helper object containing ajax and helper methods.
 * @param {Object} routeList - Object containing routes for observer actions.
 * @param {string} pre - Prefix used for custom attributes.
 * @param {string} us - Separator used in custom attributes.
 * @param {Object} size - Object containing size information of observer data (Bytes, KB, MB, GB).
 * @param {string|Uint8Array} json - Serialized observer data to store.
 */
async function storeObserver({modules, global, options: {size, json}}) 
{
    if (!modules.helpers_utils.hasAnyMutations(global.initialHtml)) {
        await modules.ajax_circular.makeCallAjax({
        modules, 
        global,
        data:{
            method: global.routeList.observer.delete.method,
            route: modules.helpers_route.cleanAndValidateRoute(
                `${global.routeList.base}observertion${global.routeList.observer.delete.endpoint}`
            )
        }
    });
        return;
    }

    if (modules.helpers_utils.hasAnyMutations(global.initialHtml)) {
        if (typeof size?.MB === 'number' && size.KB <= 1) {
            const compressed = pako?.gzip(json, { level: 9 });

            if (compressed?.length > 0) {
                const base64 = await modules.helpers_base64.toBase64WithBlob(compressed);
                if (base64) {
                    const data = { observer: base64 };
                    await modules.ajax_circular.makeCallAjax({
                    modules, 
                    global,
                    option: {
                        data:{
                            data,
                            method: global.routeList.observer.store.method,
                            route: modules.helpers_route.cleanAndValidateRoute(
                                `${global.routeList.base}observertion${global.routeList.observer.store.endpoint}`
                            )
                        },
                        target: null
                    }
                });
                }
            }
        } else {
            modules.logger.warningBanner(`Observer size ${size?.MB} MB exceeds 50MB limit.`);
        }
        return;
    }
}

/**
 * Fetches observer data from the server and processes form insertions.
 *
 * @param {Object} initialHtml - The initial HTML state to merge observed data into.
 * @param {Object} modules - modules helper object containing ajax and form methods.
 * @param {Object} routeList - Object containing routes for observer actions.
 * @param {string} pre - Prefix used for custom attributes.
 * @param {string} us - Separator used in custom attributes.
 * @param {Object} rt - Runtime or context object (optional for processing forms).
 * @param {Function} run - Callback function to execute after observer processing.
 * @param {Function} compressedStringFn - Function to decompress or parse received observer data.
 */
async function getObserver({modules, global, options: { run }}) 
{
    try {
        const res = await modules.ajax_circular.makeCallAjax({
            modules, 
            global,
            option: {
                data:{
                    method: global.routeList.observer.fetch.method,
                    route: modules.helpers_route.cleanAndValidateRoute(
                        `${global.routeList.base}observertion${global.routeList.observer.fetch.endpoint}`
                    )
                },
                target: null
            }
          });

        const response = res?.code === 200 && await compressedStringFn(res.data);
        if (response) {
            await modules.forms_observer.processCurrentFormInsertions({modules, global, options: { response }});
            await modules.forms_observer.processObservedFormInsertions({modules, global, options: { response }});
            modules.forms_observer.formKeysToChanges({modules, global, options: { response }});
            modules.helpers_utils.mergeObservedDataIntoInitial({global, options: { response }});
        }
    } catch (e) {
        throw e;
    } finally {
        run();
    }
}

/**
 * Main initializer for observer handling.
 * Handles fetching, storing, and merging observer data based on trigger and session state.
 *
 * @param {boolean} trigger - If true, skips observer initialization.
 * @param {boolean} hasSession - Indicates whether a session exists for fetching observer data.
 * @param {Object} initialHtml - Initial HTML state to check for mutations.
 * @param {Object} modules - modules helper object containing ajax, helper, form, and logger methods.
 * @param {Object} routeList - Object containing routes for observer actions.
 * @param {string} pre - Prefix used for custom attributes.
 * @param {string} us - Separator used in custom attributes.
 * @param {Object} size - Object containing size info of observer data.
 * @param {string|Uint8Array} json - Serialized observer data for storing.
 * @param {Object} rt - Runtime/context object for form processing.
 * @param {Function} run - Callback function to execute after initialization.
 * @param {Function} compressedStringFn - Function to decompress/parse observer data.
 */
async function initObserver({modules, global, options: {trigger, size, json, run}}) 
{
    try {
        if (!trigger) {
            if (hasSession) await getObserver({modules, global, options: {run}});
            await storeObserver({modules, global, options: {size, json}});
            await getObserver({modules, global, options: { run }});
        } else {
            run();
        }
    } catch {
        run();
    } finally {
        global.isInitialLoad = false;
    }
}

/**
 * Exported object.
 */
export const forms_io_observer = {
    initObserver
};