function initDebuggerUI() 
{
    const vendorToggle = document.querySelector("#vendors-stack-item");
    const vendorFrames = document.querySelectorAll(".vendor-frames");
    const stackItems = document.querySelectorAll(".stack-item");
    const codeBlocks = document.querySelectorAll("[id^='frame-code-']");

    if (vendorToggle) {
        vendorToggle.style.cursor = "pointer";
        vendorToggle.addEventListener("click", () => {

            vendorFrames.forEach(el => el.classList.toggle("show"));

            vendorToggle.textContent = vendorToggle.textContent.includes("▼")
                ? vendorToggle.textContent.replace("▼", "▲")
                : vendorToggle.textContent.replace("▲", "▼");
        });
    }

    stackItems.forEach(item => {
        item.addEventListener("click", () => {
            const frameIndex = item.dataset.frame;

            stackItems.forEach(i => i.classList.remove("active"));
            item.classList.add("active");

            codeBlocks.forEach(block => block.style.display = "none");

            const target = document.querySelector(`#frame-code-${frameIndex}`);
            if (target) target.style.display = "block";
        });
    });
}


function ajaxError(e) 
{
  if (!e?.html) return;
  document.body.innerHTML = e.html;
  initDebuggerUI();
}

/**
 * Logs detailed error information to the console.
 *
 * @param {Error} error - The error object to log
 */
function logError(error)
{
    console.group("%c🚨 ERROR LOG", "color: red; font-weight: bold; font-size: 14px;");
    console.log("%cTimestamp:", "color: gray; font-weight: bold;", new Date().toLocaleString());
    console.error("%cMessage:", "color: orange; font-weight: bold;", error.message);
    console.error("%cStack Trace:", "color: cyan; font-weight: bold;", error.stack);
    console.groupEnd();
}

/**
 * Displays a temporary warning banner at the top of the page.
 *
 * @param {string} msg - Warning message to display
 */
function warningBanner(msg) 
{
    const errorMessage = `<strong>Warning:</strong> ${msg}`;
    let errorContainer = document.getElementById('error-container');

    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.id = 'error-container';
        errorContainer.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #ffaa71;
            color: white;
            padding: 10px;
            border-radius: 5px;
            z-index: 9999;
        `;
        document.body.appendChild(errorContainer);
    }

    errorContainer.innerHTML = errorMessage;

    setTimeout(() => {
        if (errorContainer) errorContainer.remove();
    }, 5000);
}

/**
 * Formats log messages with timestamp and level.
 *
 * @param {string} level - Log level (e.g., 'info', 'warn', 'error')
 * @param {...any} args - Additional arguments to log
 * @returns {Array} Formatted log array with timestamp
 */
const formatMessage = (level, ...args) => {
  const timestamp = new Date().toISOString();
  return [`[${timestamp}] [${level.toUpperCase()}]:`, ...args];
};

/**
 * Exported object.
 */
export const logs_display = { 
    ajaxError, 
    logError, 
    warningBanner,
    formatMessage
};