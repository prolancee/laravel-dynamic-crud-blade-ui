/**
 * Sleeps for the given number of milliseconds.
 *
 * @param {number} ms - Milliseconds to sleep.
 * @returns {Promise<void>}
 */
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Attempts to acquire a lock in storage with retries.
 *
 * @param {number} retries - Number of retry attempts.
 * @param {number} delayMs - Delay between retries in milliseconds.
 * @param {string} lockKey - Key used to store the lock.
 * @param {Storage} storage - Storage object (localStorage or sessionStorage).
 * @returns {Promise<boolean>} True if lock acquired, false otherwise.
 */
async function acquireLock(retries = 10, delayMs = 100, lockKey, storage) {
    while (retries-- > 0) {
        const currentLock = storage.getItem(lockKey);

        if (!currentLock) {
            try {
                storage.setItem(lockKey, Date.now().toString());
                return true;
            } catch (e) {
                return false;
            }
        } else {
            const lockTime = parseInt(currentLock, 10);
            if (!isNaN(lockTime) && Date.now() - lockTime > 5000) {
                storage.removeItem(lockKey);
            }
        }
        await sleep(delayMs);
    }
    return false;
}

/**
 * Releases a previously acquired lock.
 *
 * @param {Storage} storage - Storage object (localStorage or sessionStorage).
 * @param {string} lockKey - Key used for the lock.
 */
function releaseLock(storage, lockKey) {
    storage.removeItem(lockKey);
}

/**
 * Saves data to sessionStorage if size is within limit (~4.5MB).
 *
 * @param {*} data - Data to save (JSON-serializable).
 * @param {string} cacheKey - Key under which data will be stored.
 */
async function saveToSessionStorage(data, cacheKey) {
    const s = sessionStorage;
    try {
        const str = JSON.stringify(data);
        if (new Blob([str]).size < 4.5 * 1024 * 1024) {
            s.setItem(cacheKey, str);
        } else {
            console.warn("⚠️ Data too large to cache.");
        }
    } catch (e) {
        console.warn("⚠️ Storage error:", e);
    }
}

/**
 * Clears multiple keys from localStorage and sessionStorage.
 *
 * @param {string[]} keys - Array of keys to remove.
 */
async function clearStorageKeys(keys) {
    keys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });
    await sleep(500);
}

/**
 * Checks and clears session storage if form is not in edit mode.
 *
 * @param {Object} params
 * @param {Object} params.modules - modules reference object
 * @param {Object} params.global - Global config containing prefix, udscore, etc.
 * @param {string} params.base - Base route/key
 * @param {string} params.t - Table identifier
 * @param {string} params.n - Form identifier
 * @param {string} params.p - Prefix identifier
 */
async function checkAndClearSession({ modules, global }) {
    const [t, n, p] =
        [
            modules.helpers_date.getTodayDate(),
            modules.helpers_date.getNextDayDate(),
            modules.helpers_date.getPreviewDayDate()
        ];

    global.hasSession = sessionStorage.getItem(`${global.routeList.base}_${t}_${n}`);

    const buttons = document.querySelectorAll(
        `[${global.attributePrefix}submit="${global.udscore}form${global.udscore}"]`
    );

    const editModes = new Set([
        `${global.udscore}temporary:edit${global.udscore}`,
        `${global.udscore}permanent:edit${global.udscore}`,
    ]);

    const isEditMode = [...buttons].some((btn) =>
        editModes.has(btn?.getAttribute(`${global.attributePrefix}open`))
    );

    if (!isEditMode && global.hasSession) {
        await clearStorageKeys([
            `${global.routeList.base}_${t}_${n}`,
            `${global.routeList.base}Lock_${t}_${n}`,
            `${global.routeList.base}_${p}_${t}`,
            `${global.routeList.base}Lock_${p}_${t}`,
        ]);
        global.hasSession = null;
    }

    return global;
}

/**
 * Exported object.
 */
export const storage_session = {
    saveToSessionStorage,
    clearStorageKeys,
    acquireLock,
    releaseLock,
    checkAndClearSession
};