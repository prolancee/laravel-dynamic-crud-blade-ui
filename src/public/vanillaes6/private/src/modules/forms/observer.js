/**
 * Cache for current form HTML insertions
 * @type {Map<string, boolean>}
 */
const currenthtmlCache = new Map();

/**
 * Cache for observed form HTML insertions
 * @type {Map<string, boolean>}
 */
const observerhtmlCache = new Map();

/**
 * Extracts initial forms from the document and stores their HTML and metadata
 *
 * @param {Object} initialHtml - Object to store form data
 * @param {string} pre - Prefix for custom data attributes
 * @param {string} us - Separator used in texteditor attributes
 * @param {Object} rt - Role attributes { roleAttrName, roleAttrValue }
 * @param {Object} modules - Helper modules object with utility functions
 */
function extractInitialForms({modules, global}) {
  const tMode = `${global.udscore}temporary:edit${global.udscore}`, pMode = `${global.udscore}permanent:edit${global.udscore}`;

  const processedHashes = new Set();
  let formTagUniqueId = '';

  const forms = document.querySelectorAll('form');

  for (const form of forms) {
    const role = form.getAttribute(global.roleAttributeTag.roleAttrName);
    if (role !== global.roleAttributeTag.roleAttrValue) continue;

    const modeAttr = form.getAttribute(`${global.attributePrefix}mode`);
    let mode = '';
    if (modeAttr === tMode) mode = 'temporary';
    else if (modeAttr === pMode) mode = 'permanent';
    else continue;

    formTagUniqueId = modules.helpers_unique.generateUniqueId();
    form.setAttribute(`${pre}added`, formTagUniqueId);

    form.querySelectorAll('*').forEach(child => {
      child.setAttribute(`${pre}added`, modules.helpers_unique.generateUniqueId());
    });

    const html = form.outerHTML.replace(/\s+/g, ' ').trim();
    const hash = modules.helpers_utils.hashString(html);
    if (processedHashes.has(hash)) continue;
    processedHashes.add(hash);

    const formParent = modules.helpers_selector.getReadableSelector(form.parentElement) || '[data-observed-fallback]';
    const name = form.getAttribute('name');

    const entry = {
      action: 'added',
      parent: formParent,
      html: html,
      code: formTagUniqueId,
      column: form.getAttribute(`${pre}column`) || '',
      primary: form.getAttribute(`${pre}primary`) || '',
      unique: form.getAttribute(`${pre}unique`) || '',
      add: 1,
      formName: name || '',
      mode: mode
    };

    if (mode === 'temporary') {
      global.initialHtml.childList.current_temporary.push(entry);
    } else {
      global.initialHtml.childList.current_permanent.push(entry);
    }

    if (name) {
      const submitEl = document.querySelector(`[${global.attributePrefix}submit="${global.udscore}form${global.udscore}"][${global.attributePrefix}form="${name}"]`);
      let submitTagUniqueId = '';

      if (submitEl) {
        submitTagUniqueId = modules.helpers_unique.generateUniqueId();
        submitEl.setAttribute(`${pre}added`, submitTagUniqueId);

        submitEl.querySelectorAll('*').forEach(child => {
          child.setAttribute(`${pre}added`, modules.helpers_unique.generateUniqueId());
        });

        const submitHTML = submitEl.outerHTML.replace(/\s+/g, ' ').trim();
        const submitHash = modules.helpers_utils.hashString(submitHTML);

        if (!processedHashes.has(submitHash)) {
          processedHashes.add(submitHash);

          const submitParent = modules.helpers_selector.getReadableSelector(submitEl.parentElement) || '[data-observed-fallback]';
          const submitEntry = {
            action: 'added',
            parent: submitParent,
            html: submitHTML,
            code: submitTagUniqueId,
            add: 1,
            formName: name || '',
            mode: mode
          };

          if (mode === 'temporary') {
            global.initialHtml.childList.current_temporary.push(submitEntry);
          } else {
            global.initialHtml.childList.current_permanent.push(submitEntry);
          }
        }
      }
    }
  }
}

/**
 * Applies filtered removed forms back to the initialHtml object
 *
 * @param {Object} initialHtml - Object containing childLists of forms
 * @param {Object} removedFiltered - Filtered removed forms mapping
 * @returns {Object} Updated initialHtml
 */
function applyFilteredRemoveToInitial({global, options: { removedFiltered }}) 
{
  for (const listKey of ['observer_temporary', 'observer_permanent', 'current_temporary', 'current_permanent']) {
    const filteredList = removedFiltered[listKey] || {};
    const originalList = global.initialHtml.childList?.[listKey] || [];

    global.initialHtml.childList[listKey] = originalList.filter(item => {
      const { formName, code } = item;
      const match = filteredList?.[formName]?.html_array?.[code];

      if (!match) return true; 
      if (Array.isArray(match) && match.length === 0) {
        return false;
      }
      const htmlStr = filteredList?.[formName]?.html_string?.[code];

      if (typeof htmlStr === 'string' && htmlStr !== '') {
        item.html = htmlStr;
      }

      return true;
    });
  }

  return global.initialHtml;
}

/**
 * Filters and validates form blocks to identify removed, temporary, and permanent forms
 *
 * @param {Array} childLists - List of child form entries
 * @param {Object} initialHtml - Initial HTML object containing form data
 * @param {string} pre - Prefix for custom attributes
 * @param {string} us - Separator used in texteditor attributes
 * @param {Object} rt - Role attributes { roleAttrName, roleAttrValue }
 * @returns {Object} Object containing removed, removed_observer, and updated initialHtml
 */
function filterValidFormBlocks({modules, global, options: { observerChildListEntries }}) {
  const removed = [], tempList = [], permList = [], removed_observer = [];
  let _cachedFiltered = null;

  const tMode = `${us}temporary:edit${us}`;
  const pMode = `${us}permanent:edit${us}`;

  const isValid = (entry) => {
    if (entry?.action !== 'added' && entry?.action !== 'removed') return false;

    const doc = new DOMParser().parseFromString(entry.html || '', 'text/html');
    if (!doc.querySelector('input, select, textarea')) return false;

    const forms = doc.querySelectorAll('form');
    if (forms.length > 1) return false;

    const validate = (form) => {
      const role = form.getAttribute(rt.roleAttrName);
      const mode = form.getAttribute(`${pre}mode`);
      const name = form.getAttribute('name');

      if (role !== rt.roleAttrValue) return false;
      if (name) entry.formName = name;

      if (mode === tMode) {
        entry.mode = 'temporary';
        return true;
      }
      if (mode === pMode) {
        entry.mode = 'permanent';
        return true;
      }

      return false;
    };

    if (forms.length === 1) return validate(forms[0]);

    const form = document.querySelector(entry.parent)?.closest('form');
    return form ? validate(form) : false;
  };

  for (const entry of observerChildListEntries) {
    if (!isValid(entry)) {
      removed.push(entry);
    } else {
      if (entry.action === 'removed') {
        removed_observer.push(entry); 
      } else {
        (entry.mode === 'permanent' ? permList : tempList).push(entry);
      }
    }
  }

  const pushUnique = (targetList, sourceList) => {
    for (const entry of sourceList) {
      if (!targetList.some(e => e === entry)) {
        targetList.push(entry);
      }
    }
  };

  pushUnique(global.initialHtml.childList.observer_temporary, tempList);
  pushUnique(global.initialHtml.childList.observer_permanent, permList);

  function runFilteredOnce({global, options: {removed_observer}}) {
    if (!_cachedFiltered && Array.isArray(removed_observer) && removed_observer.length > 0) {
      _cachedFiltered = filterRemoveFormBlocks({global, options: {removed_observer}});
    }
    return _cachedFiltered;
  }

  let removedFiltered = runFilteredOnce({global, options: {removed_observer}});

  console.log(removedFiltered);

  if (removedFiltered && typeof removedFiltered === 'object') {
    initialHtml = applyFilteredRemoveToInitial({global, options: { removedFiltered }});
  }

  return { removed, removed_observer, initialHtml};
}

/**
 * Filters out removed form blocks from the initialHtml child lists
 *
 * @param {Object} initialHtml - Object containing child lists
 * @param {Array} removed_observer - List of removed observer entries
 * @param {string} pre - Prefix for custom attributes
 * @returns {Object} Filtered form block mapping
 */
function filterRemoveFormBlocks({global, options: {removed_observer}}) {
  const createMap = () => ({});
  const tempO = createMap(), permO = createMap();
  const tempC = createMap(), permC = createMap();
  const removedList = {};

  const extractTags = html => html.match(/<[^>]+>/g) || [];

  const attachDataToClosingTags = tags => {
    const stack = [], result = [];

    for (const tag of tags) {
      const close = /^<\/([a-z0-9]+)>$/i.exec(tag);
      if (close) {
        const tn = close[1];
        let found = false;
        for (let i = stack.length - 1; i >= 0; i--) {
          if (stack[i].tag === tn) {
            result.push(`</${tn} ${pre}added="${stack[i].data}">`);
            stack.splice(i, 1);
            found = true;
            break;
          }
        }
        if (!found) result.push(tag);
      } else {
        const open = new RegExp(`^<([a-z0-9]+)[^>]*${pre}added="([^"]+)"`, 'i').exec(tag);
        if (open) stack.push({ tag: open[1], data: open[2] });
        result.push(tag);
      }
    }

    return result;
  };

  const compareAndPush = (map, formName, b) => {
    if (formName !== b?.formName) return;
    const tags = attachDataToClosingTags(extractTags(b?.html));
    map[formName] ||= { html_array: {}, html_string: {} };
    map[formName].html_array[b.code] = tags;
    map[formName].html_string[b.code] = '';
  };

  for (const removed of removed_observer) {
    const { formName, html } = removed;
    const tags = attachDataToClosingTags(extractTags(html));
    const regex = new RegExp(`${pre}added="([^"]+)"`, 'g');

    removedList[formName] ||= { added: [] };
    let match;
    while ((match = regex.exec(html))) {
      if (!removedList[formName].added.includes(match[1])) {
        removedList[formName].added.push(match[1]);
      }
    }

    global.initialHtml.childList.observer_temporary.forEach(b => compareAndPush(tempO, formName, b));
    global.initialHtml.childList.observer_permanent.forEach(b => compareAndPush(permO, formName, b));
    global.initialHtml.childList.current_temporary.forEach(b => compareAndPush(tempC, formName, b));
    global.initialHtml.childList.current_permanent.forEach(b => compareAndPush(permC, formName, b));
  }

  return findRemoveFormBlocks({
    observer_temporary: tempO,
    observer_permanent: permO,
    current_temporary: tempC,
    current_permanent: permC,
    removedList
  }, global);
}

/**
 * Converts HTML array tags into a single string after filtering removed entries
 *
 * @param {Object} data - Object containing form block mapping and removedList
 * @param {string} pre - Prefix for custom attributes
 * @returns {Object} Updated data with filtered html_array and html_string
 */
function findRemoveFormBlocks(data, global) 
{
  for (const listName of ["observer_temporary", "observer_permanent", "current_temporary", "current_permanent"]) {
    const list = data[listName];

    for (const formName in list) {
      const block = list[formName];
      const removed = data.removedList?.[formName]?.added || [];
      if (!removed.length || typeof block.html_array !== "object") continue;

      const removedSet = new Set(removed); 

      for (const id in block.html_array) {
        const tags = block.html_array[id] || [];
        const filtered = [];

        for (let tag of tags) {
          const m = tag.match(new RegExp(`${global.attributePrefix}added\\s*=\\s*"([^"]+)"`, "i"));
          if (!m || !removedSet.has(m[1].trim())) {
            tag = tag.replace(new RegExp(`(<\\/\\w+)[^>]*${global.attributePrefix}added="[^"]+"[^>]*>`, "i"), '$1>');
            filtered.push(tag);
          } 
        }

        block.html_array[id] = filtered;
        block.html_string[id] = filtered.join('');
      }

      data.removedList[formName].added = [];
    }
  }

  return data;
}

/**
 * Decodes a compressed base64 string into a parsed JSON object
 *
 * @param {string} base64Str - Compressed base64 string
 * @param {Object} modules - modules helper object with decode and parse methods
 * @returns {Promise<Object|boolean>} Parsed object or false if failed
 */
async function compressedString({modules, options: { base64Str }}, ) 
{
  if (typeof string !== 'string' && !modules.helpers_base64.isBase64(string)) return false;

  try {
    const raw = modules.helpers_base64.decodeBase64ToBytes(base64Str);
    const jsonStr = pako.ungzip(raw, { to: 'string' }); 

    const observerData = await modules.helpers_file.parseLargeJSONInWorker(jsonStr);
    return observerData;
  } catch (e) {
    return false;
  }
}

/**
 * Creates a function to apply form changes (insert or replace HTML) dynamically
 *
 * @param {string} type - Type of insertion ('current' or 'observer')
 * @param {Map} cache - Cache to track inserted HTML
 * @param {Set} processed - Set to track processed elements
 * @param {Function} isAdmoForm - Function to check if element is a target form
 * @param {string} pre - Prefix for custom attributes
 * @param {string} us - Separator used in texteditor attributes
 * @param {boolean} replace - Whether to replace existing elements
 * @returns {Function} Function to apply changes to DOM
 */
function createApplyChanges({modules, global, options: {type, cache, processed, isAdmoForm, replace = false}}) {
  return (changes = []) => {
    const insertedNodes = [];

    changes.forEach((change, i) => {
      if (change?.action !== 'added' || !change.parent || !change.html) return;
      const parent = document.querySelector(change.parent);
      if (!parent) return;

      const htmlHash = hashString(`${change.html}_${change.parent}_${i}`);
      const cacheKey = `${change.parent}_${type}_${i}_${htmlHash}`;
      if (processed.has(htmlHash) || cache.has(cacheKey)) return;

      const temp = document.createElement('div');
      temp.innerHTML = change.html.trim();
      const newEls = Array.from(temp.children);
      if (!newEls.length) return;

      newEls.forEach(newEl => {
        if (!newEl) return;

        if (newEl.tagName === 'FORM' && !isAdmoForm(newEl)) return;

        if (
          newEl.tagName === 'FORM' &&
          [`${us}permanent:edit${global.udscore}`, `${global.udscore}temporary:edit${global.udscore}`].some(mode =>
            newEl.getAttribute(`${global.attributePrefix}mode`) === `${mode}` &&
            document.querySelector(`form[${global.attributePrefix}formkey="${change.formName}"][${global.attributePrefix}mode="${mode}"]`)
          )
        ) return;

        let matched = null;
        if (replace) {
          if (isAdmoForm(newEl)) {
            matched = [...parent.querySelectorAll('form')].find(el =>
              !processed.has(el) &&
              el.getAttribute(`${global.attributePrefix}mode`) === newEl.getAttribute(`${global.attributePrefix}mode`)
            );
          } else if (
            ['BUTTON', 'INPUT', 'SPAN', 'A'].includes(newEl.tagName) &&
            newEl.getAttribute(`${global.attributePrefix}submit`) === `${global.udscore}form${global.udscore}`
          ) {
            const newKey = newEl.getAttribute(`${global.attributePrefix}form`);
            matched = [...parent.querySelectorAll(`[${global.attributePrefix}submit="${global.udscore}form${global.udscore}"]`)].find(el =>
              el.getAttribute(`${global.attributePrefix}form`) === newKey && !processed.has(el)
            );
            if (!matched) return;
          }
        }

        matched ? matched.replaceWith(newEl) : (!replace ? parent.appendChild(newEl) : false);
        if (matched) processed.add(matched);
        processed.add(newEl);
        insertedNodes.push(newEl);

        if (isAdmoForm(newEl)) {
          ['column', 'primary', 'unique'].forEach(attr => {
            newEl.setAttribute(`${global.attributePrefix}${attr}`, change[attr] || '');
          });
          if (!newEl.hasAttribute(`${global.attributePrefix}formkey`) || newEl.getAttribute(`${global.attributePrefix}formkey`) !== change.formName) {
            newEl.setAttribute(`${global.attributePrefix}formkey`, change.formName || '');
          }
        }

        const fallback = newEl.tagName === 'FORM' ? newEl : newEl.closest('form');
        if (fallback && isAdmoForm(fallback) && fallback.getAttribute(`${global.attributePrefix}formkey`) !== change.formName) {
          fallback.setAttribute(`${global.attributePrefix}formkey`, change.formName || '');
        }

        processed.add(htmlHash);
        cache.set(cacheKey, true);
      });
    });

    // Ensure assignNames runs only once, with context
    if (insertedNodes.length && window.PROLANCEE?.assignNames) {
      insertedNodes.forEach(node => {
        window.PROLANCEE.assignNames(false, node);
      });
    }
  };
}

/**
 * Inserts or replaces current form entries in the DOM
 *
 * @param {Object} data - Object containing childLists of current forms
 * @param {string} pre - Prefix for custom attributes
 * @param {string} us - Separator used in texteditor attributes
 * @param {Object} rt - Role attributes { roleAttrName, roleAttrValue }
 * @returns {Promise<boolean>} True if insertion succeeded
 */
async function processCurrentFormInsertions({modules, global, options: { response }}) 
{
  try {
    if (!response?.childList) return false;
    const processed = new Set();
    const modes = [`${global.udscore}permanent:edit${global.udscore}`, `${global.udscore}temporary:edit${global.udscore}`];
    const isAdmoForm = el => el?.tagName === 'FORM' && el.getAttribute(rt.roleAttrName) === rt.roleAttrValue && modes.includes(el.getAttribute(`${global.attributePrefix}mode`));
    const apply = createApplyChanges({modules, global, options: {type: 'current', cache: currenthtmlCache, processed, isAdmoForm, replace: true}});
    apply(response.childList.current_permanent);
    apply(response.childList.current_temporary);
    return true;
  } catch {
    return false;
  }
}

/**
 * Inserts observed form entries into the DOM without replacing existing forms
 *
 * @param {Object} data - Object containing childLists of observed forms
 * @param {string} pre - Prefix for custom attributes
 * @param {string} us - Separator used in texteditor attributes
 * @param {Object} rt - Role attributes { roleAttrName, roleAttrValue }
 * @returns {Promise<boolean>} True if insertion succeeded
 */
async function processObservedFormInsertions({modules, global, options: { response }}) 
{
  try {
    if (!response?.childList) return false;
    const processed = new Set();
    const modes = [`${global.udscore}permanent:edit${global.udscore}`, `${global.udscore}temporary:edit${global.udscore}`];
    const isAdmoForm = el => el?.tagName === 'FORM' && el.getAttribute(rt.roleAttrName) === rt.roleAttrValue && modes.includes(el.getAttribute(`${pre}mode`));
    const apply = createApplyChanges({modules, global, options: {type: 'observer', cache: observerhtmlCache, processed, isAdmoForm, replace: false}});
    apply(response.childList.observer_permanent);
    apply(response.childList.observer_temporary);
    return true;
  } catch {
    return false;
  }
}

/**
 * Updates form keys to actual form names in childLists
 *
 * @param {Object} reObserved - Object containing observed form childLists
 * @param {string} pre - Prefix for custom attributes
 */
function formKeysToChanges({modules, global, options: { response }}) 
{
  const changeLists = [
    response?.childList?.current_permanent,
    response?.childList?.current_temporary,
    response?.childList?.observer_permanent,
    response?.childList?.observer_temporary
  ];

  const setActualName = (lists = [], key, actualName) => {
    lists?.forEach(list => {
      list?.forEach(change => {
        if (!change?.formName || change?.formName === key) {
          change.formName = actualName;
        }
      });
    });
  };

  document.querySelectorAll('form').forEach(form => {
    const key = form.getAttribute(`${global.attributePrefix}formkey`);
    const actualName = form.getAttribute('name');
    if (!key || !actualName) return;
    setActualName(changeLists, key, actualName);
    form.removeAttribute(`${global.attributePrefix}formkey`);
  });

  return;
}

/**
 * Exported object.
 */
export const forms_observer = {
    extractInitialForms,
    filterValidFormBlocks,
    compressedString,
    processCurrentFormInsertions,
    processObservedFormInsertions,
    formKeysToChanges,
};
