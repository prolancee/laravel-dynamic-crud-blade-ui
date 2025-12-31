import { logs_display } from './display.js';

/**
 * Logs a standard message with timestamp.
 * @param  {...any} args - Arguments to log
 */
const log = (...args) => console.log(...logs_display?.formatMessage('log', ...args));

/**
 * Logs a warning message with timestamp.
 * @param  {...any} args - Arguments to log
 */
const warn = (...args) => console.warn(...logs_display?.formatMessage('warn', ...args));

/**
 * Logs an error message with timestamp.
 * @param  {...any} args - Arguments to log
 */
const error = (...args) => console.error(...logs_display?.formatMessage('error', ...args));

/**
 * Logs an informational message with timestamp.
 * @param  {...any} args - Arguments to log
 */
const info = (...args) => console.info(...logs_display?.formatMessage('info', ...args));

/**
 * Logs a debug message with timestamp.
 * @param  {...any} args - Arguments to log
 */
const debug = (...args) => console.debug(...logs_display?.formatMessage('debug', ...args));

/**
 * Handles AJAX errors using logs_display handler.
 * @param  {...any} args - Error arguments
 */
const ajaxError = (...args) => logs_display?.ajaxError(...args);

/**
 * Logs detailed errors using logs_display handler.
 * @param  {...any} args - Error arguments
 */
const logError = (...args) => logs_display?.logError(...args);

/**
 * Shows a warning banner using logs_display handler.
 * @param  {...any} args - Warning message arguments
 */
const warningBanner = (...args) => logs_display?.warningBanner(...args);

/**
 * Exported object.
 */
export const logs_logger = {
    log,
    warn,
    error,
    info,
    debug,
    ajaxError,
    logError,
    warningBanner
};
