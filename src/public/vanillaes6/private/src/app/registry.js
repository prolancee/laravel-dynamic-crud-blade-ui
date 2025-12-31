!(async (baseUrl) => {

  try {
    // --------------------------
    // 1. Import PROLANCEE modules
    // --------------------------
    const modules = await import(`${baseUrl}/vendor/prolancee/crud/blade/src/modules/main.js`);
    let global = await modules.global_initializer.ensureReady();
    const removedAddedList = [];

    // Extract initial forms
    modules.forms_observer.extractInitialForms({ modules, global });

    // Remove added attributes from body
    removedAddedList.push(
      ...(modules.forms_attributes.removeAddedAttributesFromBody({ modules, global }) || [])
    );

    // --------------------------
    // 3. Initialize CRUD Client
    // --------------------------
    const initDOCRUDCLIENT = async (trigger) => {
      const { size, json } = await modules.helpers_serialization.serializeObjectWithSizeInfo(global, 10000);

      console.log("✅ Merged initialHtml:", global.initialHtml);

      // Run decryption and form binding
      const run = async () => {
        
        await modules.crypto_decrypter.processAttributes({ modules, global }, () => {

          console.log("✅ PROLANCEE Ready State:", {
            formsAttributesMap: global.formsAttributesMap,
            formsElementAttributesMap: global.formsElementAttributesMap,
            formsElementValueMap: global.formsElementValueMap,
            formSelectorList: global.formSelectorList,
            tablesAttributesMap: global.tablesAttributesMap,
            hasSession: global.hasSession,
          });

          // --------------------------
          // Bind forms & tables
          // --------------------------
          modules.forms_io_field_binder.bindFormSelectors({ modules, global });
          modules.forms_io_submit.initSubmit({ modules, global, options: { size } });
          modules.forms_io_binder.initFormField({ modules, global });
          modules.tables_io_binder.bindTable({ modules, global });

          // --------------------------
          // Session messages
          // --------------------------
          const success = window.sessionStorage.getItem("success");
          if (success) {
            window.sessionStorage.removeItem("success");
            modules.responsor_sweetalert2.success(success);
          }
        });
      };

      // Check and clear session
      await modules.storage_session.checkAndClearSession({ modules, global });

      // Mutation observer bind
      modules.forms_io_observer.initObserver({
        modules,
        global,
        options: { trigger, size, json, run },
      });
    };

    // Safe client init
    async function safeInitClient(trigger) {
      try {
        if (!global.isInitialLoad) return;
        await initDOCRUDCLIENT(trigger);
      } catch (e) {
        console.error("Error during safeInitClient:", e);
      }
    }

    // --------------------------
    // 4. Mutation Observer
    // --------------------------
    const observerTriggerEvents = modules.helpers_utils.events() || [];
    let userEventLog = [], lastEventName = "", lastEventTime = 0;

    const observerConfig = { childList: true, subtree: true };
    const childListMap = new Map();
    const observerChildListEntries = [];
    const IS_PRODUCTION = !["localhost", "127.0.0.1"].includes(location.hostname);
    const DEBOUNCE_DELAY = IS_PRODUCTION ? 1000 : 300;

    let observerDebounceTimer, eventDebounceTimer;

    const observer = new MutationObserver(mutationList => {
      try {
        if (!global.isInitialLoad) return;

        const processedHashes = new Set();
        const parentMap = new Map();
        let firstTagUniqueId = '';

        for (const mutation of mutationList) {
          const selector = modules.helpers_selector.getReadableSelector(mutation.target) || '[data-observed-fallback]';

          if (mutation.type === 'childList') {
            // ======= ADDED =======
            if (mutation.addedNodes.length > 0) {
              const relevantNodes = Array.from(mutation.addedNodes).filter(n => n instanceof HTMLElement);

              for (const node of relevantNodes) {
                firstTagUniqueId = modules.helpers_unique.generateUniqueId();
                node.setAttribute(`${global.attributePrefix}added`, firstTagUniqueId);

                node.querySelectorAll('*').forEach(child => {
                  child.setAttribute(`${global.attributePrefix}added`, modules.helpers_unique.generateUniqueId());
                });

                const parentEl = document.querySelector(selector);
                if (!parentEl) continue;

                if (!parentMap.has(parentEl)) parentMap.set(parentEl, []);
                parentMap.get(parentEl).push(node);
              }
            }

            // ======= REMOVED =======
            const relevantRemoved = Array.from(mutation.removedNodes).filter(n => n instanceof HTMLElement);

            if (relevantRemoved.length > 0) {
              if (removedAddedList?.length > 0) {
                modules.forms_attributes.restoreRemovedAttributes(removedAddedList);
              }

              for (const node of relevantRemoved) {
                const parentEl = mutation.target;
                const finalHTML = (node.outerHTML || node.textContent).replace(/\s+/g, ' ').trim();
                const hash = modules.helpers_utils.hashString(finalHTML);
                if (processedHashes.has(hash)) continue;
                processedHashes.add(hash);

                const parentSelector = modules.helpers_selector.getReadableSelector(parentEl) || '[data-observed-fallback]';
                const codeMatch = finalHTML.match(new RegExp(`<[^>]*${global.attributePrefix}added\\s*=\\s*"([^"]+)"`, 'i'));
                const code = codeMatch?.[1] || '';

                const entry = {
                  action: 'removed',
                  parent: parentSelector,
                  html: finalHTML,
                  code,
                  column: '',
                  primary: '',
                  unique: '',
                  remove: 1
                };

                observerChildListEntries.push(entry);
                childListMap.set(parentSelector, entry);
              }
            }
          }
        }

        // ======= FINAL ADD PROCESS =======
        for (const [parentEl, nodes] of parentMap.entries()) {
          const finalHTML = nodes.map(n => n.outerHTML || n.textContent).join('').replace(/\s+/g, ' ').trim();
          const hash = modules.helpers_utils.hashString(finalHTML);
          if (processedHashes.has(hash)) continue;
          processedHashes.add(hash);

          const parentSelector = modules.helpers_selector.getReadableSelector(parentEl) || '[data-observed-fallback]';

          observerChildListEntries.push({
            action: 'added',
            parent: parentSelector,
            html: finalHTML,
            code: firstTagUniqueId,
            column: '',
            primary: '',
            unique: '',
            add: 1
          });
        }

        // ======= DEBOUNCE + FILTER =======
        clearTimeout(observerDebounceTimer);
        observerDebounceTimer = setTimeout(() => {
          observer.disconnect();
          safeInitClient(true).finally(() => {
            observer.observe(document.body, observerConfig);
            global.isInitialLoad = false;
            modules.forms_observer.filterValidFormBlocks({ modules, global, options: { observerChildListEntries } });
            removedAddedList.push(...(modules.forms_attributes.removeAddedAttributesFromBody({ modules, global }) || []));
          });
        }, DEBOUNCE_DELAY);

      } catch (e) {
        console.error("MutationObserver error:", e);
      }
    });

    observer.observe(document.body, observerConfig);
    safeInitClient(false);

    // --------------------------
    // 5. User Event Triggers
    // --------------------------
    if (Array.isArray(observerTriggerEvents) && observerTriggerEvents.length > 0) {
      observerTriggerEvents.forEach(eventName => {
        document.addEventListener(eventName, e => {
          const now = Date.now();
          if (eventName === lastEventName && (now - lastEventTime) <= 50) return;

          global.isInitialLoad = true;
          clearTimeout(eventDebounceTimer);
          eventDebounceTimer = setTimeout(() => {
            global.isInitialLoad = false;
          }, DEBOUNCE_DELAY);

          userEventLog.push({ n: eventName, t: e.target?.tagName || "", ts: now });
          if (userEventLog.length > 50) userEventLog.shift();

          lastEventName = eventName;
          lastEventTime = now;
        }, true);
      });
    }

  } catch (err) {
    console.error('❌', err);
  }

})(window.location.origin || '');
