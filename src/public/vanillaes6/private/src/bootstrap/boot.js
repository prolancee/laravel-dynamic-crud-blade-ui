
import routes from './../routes/web.js';
import { global_initializer } from "./../modules/global/initializer.js";

(function(global, prefix = 'data-prolancee-', udscore = '_') {

  const roleSel = `${prefix}role=${udscore}ADMO${udscore}`;
  const roleAttrTag = {roleAttrName: `${prefix}role`, roleAttrValue: `${udscore}ADMO${udscore}`};

  // --------------------------
  // 1. PROLANCEE State Init
  // --------------------------
  global_initializer.initializeState(global, prefix, udscore, roleSel, roleAttrTag, routes, false);

  // --------------------------
  // 2. DOM Utilities
  // --------------------------
  const PROLANCEE_SELECTOR = '*';
  const isCustomAttr = name =>
    name && (name.startsWith('x-prolancee.') || name.startsWith('x-prolancee-'));

  function processElement(el) {
    if (!el || !el.attributes) return;
    
    const attrs = Array.from(el.attributes);

    for (const attr of attrs) {
      if (isCustomAttr(attr.name)) {
        const newName = attr.name.replace(/^x-prolancee[.-]/, prefix);
        el.setAttribute(newName, attr.value);
        el.removeAttribute(attr.name);
      }
    }
  }

  function processAll(root) {
    const elements = (root || document).querySelectorAll(PROLANCEE_SELECTOR);
    for (const el of elements) {
      processElement(el);
    }
  }

  // --------------------------
  // 3. Forms & Tables Assignment
  // --------------------------
  function assignNames(trigger, node) {
    try {
      let forms = document.querySelectorAll(`form[${roleSel}]`);
      let submits = document.querySelectorAll(`[${prefix}submit]`);
      let tables = document.querySelectorAll(`table[${roleSel}]`);

      const clear = (list, nameAttr) => {
        for (let i = 0; i < list?.length; i++) {
          list[i].removeAttribute(nameAttr);
        }
      };

      const getFromNode = (sel, node) =>
        node?.matches(sel) ? [node] : node?.querySelectorAll(sel) || [];

      if (trigger || node) {
        if (trigger) {
          clear(forms, 'name');
          clear(submits, `${prefix}form`);
          clear(tables, `${prefix}name`);
        } else {
          clear(getFromNode(`form[${roleSel}]`, node), 'name');
          clear(getFromNode(`[${prefix}submit]`, node), `${prefix}form`);
          clear(getFromNode(`table[${roleSel}]`, node), `${prefix}name`);
        }
      }

      const fl = forms?.length, sl = submits?.length;
      if (fl !== sl) {
        const [longer, shorter, clearFn] = fl > sl
          ? [forms, submits, el => { el.removeAttribute(roleSel); el.removeAttribute('name'); }]
          : [submits, forms, el => { el.removeAttribute(`${prefix}submit`); el.removeAttribute(`${prefix}form`); }];

        for (let i = shorter.length; i < longer.length; i++) clearFn(longer[i]);
        forms = forms.length > sl ? Array.prototype.slice.call(forms, 0, sl) : forms;
        submits = submits.length > fl ? Array.prototype.slice.call(submits, 0, fl) : submits;
      }

      const used = new Set();
      const collectIndex = (sel, attr, prefix) => {
        const list = document.querySelectorAll(sel);
        for (let i = 0; i < list.length; i++) {
          const val = list[i].getAttribute(attr);
          const match = val?.match(new RegExp(`^${prefix}-(\\d+)$`));
          if (match) used.add(+match[1]);
        }
      };

      collectIndex('form[name^="form-"]', 'name', 'form');
      collectIndex(`[${prefix}name^="listTable-"]`, `${prefix}name`, 'listTable');

      const genIndex = () => {
        let idx;
        do { idx = Math.floor(Math.random() * 1e6); } while (used.has(idx));
        used.add(idx);
        return idx;
      };

      const assignButton = (btnList, formName, index) => {
        for (let i = 0; i < btnList.length; i++) {
          const btn = btnList[i];
          const val = btn.getAttribute(`${prefix}submit`);
          const fkey = btn.getAttribute(`${prefix}form`);
          if (val !== `${udscore}form${udscore}` && val !== `${udscore}none${udscore}`) continue;
          if (fkey && fkey !== formName) continue;
          if (!fkey && i === index) {
            btn.setAttribute(`${prefix}form`, formName);
            return btn;
          }
          if (fkey === formName) return btn;
        }
        return null;
      };

      const setModeIfMissing = (btn, form) => {
        const s = btn?.getAttribute(`${prefix}submit`);
        const o = btn?.getAttribute(`${prefix}open`);
        const valid = ['temporary:edit', 'permanent:edit', 'refresh', 'fresh', 'redirect']
          .map(v => `${udscore}${v}${udscore}`);
        if (!form.hasAttribute(`${prefix}mode`) && s === `${udscore}form${udscore}` && valid.includes(o)) {
          form.setAttribute(`${prefix}mode`, o);
        }
      };

      for (let i = 0; i < forms.length; i++) {
        const form = forms[i];
        let name = form.getAttribute('name');
        if (!name) {
          for (let j = 0; j < submits.length; j++) {
            const btn = submits[j];
            const val = btn.getAttribute(`${prefix}submit`);
            const fkey = btn.getAttribute(`${prefix}form`);
            if ([`${udscore}form${udscore}`, `${udscore}none${udscore}`].includes(val) &&
              fkey && !Array.prototype.some.call(forms, f => f.getAttribute('name') === fkey)) {
              name = fkey;
              form.setAttribute('name', name);
              break;
            }
          }
        }
        if (!name) {
          name = `form-${genIndex()}`;
          form.setAttribute('name', name);
        }

        const btn = assignButton(submits, name, i);
        if (btn) setModeIfMissing(btn, form);
        global.PROLANCEE.pushUnique(global.PROLANCEE.formSelectorList, `form[name="${name}"]`);
      }

      for (let i = 0; i < tables.length; i++) {
        const table = tables[i];
        let tname = table.getAttribute(`${prefix}name`);
        if (!tname) {
          tname = `table-${genIndex()}`;
          table.setAttribute(`${prefix}name`, tname);
        }
        global.PROLANCEE.pushUnique(global.PROLANCEE.tableSelectorList, `table[${prefix}name="${tname}"]`);
      }
    } catch (e) {
      throw e;
    }
  }

  // --------------------------
  // 4. Mutation Observer
  // --------------------------
  const observerConfig = { childList: true, subtree: true, attributes: true };
  const DEBOUNCE_DELAY = 1000;
  let debounceTimer, isDebouncing = false;

  async function runBootstrap(trigger, node) {
    try {
      processAll();
      assignNames(trigger, node);
    } catch {
      return false;
    }
  }

  const observer = new MutationObserver(mutations => {
    if (isDebouncing) return;
    isDebouncing = true;

    global_initializer.initializeState(global, prefix, udscore, roleSel, roleAttrTag, routes, true);
  
    for (let i = 0; i < mutations.length; i++) {
      const mutation = mutations[i];

      if (mutation.addedNodes) {
        for (let j = 0; j < mutation.addedNodes.length; j++) {
          const node = mutation.addedNodes[j];
          if (node.nodeType !== 1) continue;
          processElement(node);
          runBootstrap(false, node);
        }
      }

      if (mutation.type === 'attributes' && isCustomAttr(mutation.attributeName)) {
        runBootstrap(false, false);
      }
    }

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      observer.disconnect();
      runBootstrap(false, false).finally(() => {
        observer.observe(document.body, observerConfig);
        isDebouncing = false;
      });
    }, DEBOUNCE_DELAY);
  });

  observer.observe(document.body, observerConfig);
  runBootstrap(true, false);

})(window);