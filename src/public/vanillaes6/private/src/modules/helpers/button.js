/**
 * Dynamically injects a CSS style for disabled submit buttons
 * if it hasn't been added already.
 */
function dynamicDisabledSubmitbtnStyle() 
{
  if (!document.getElementById('dynamic-disabled-submitbtn-style')) {
      const style = document.createElement('style');
      style.id = 'dynamic-disabled-submitbtn-style';
      style.textContent = `
      .disabled {
          pointer-events: none;
          opacity: 0.6;
          cursor: not-allowed;
      }`;
      document.head.appendChild(style);
  }
}

/**
 * Disables a submit button by setting the disabled property
 * and adding a CSS class for visual feedback.
 *
 * @param {HTMLElement} submitButton - The button or input element to disable
 */
function disabledSubmitButton(submitButton)
{
  if (submitButton) {
      const tag = submitButton.tagName.toLowerCase();
      if (tag === 'button' || tag === 'input') {
          submitButton.disabled = true;
      }
      dynamicDisabledSubmitbtnStyle();
      submitButton.classList.add('disabled');
  }
}

/**
 * Re-enables a previously disabled submit button
 * by removing the CSS class and resetting the disabled property.
 *
 * @param {HTMLElement} submitButton - The button or input element to enable
 */
function undisabledSubmitButton(submitButton) 
{
  try {
      if (!submitButton || typeof submitButton !== 'object') return;
      submitButton.classList?.remove?.('disabled');
      const tag = submitButton.tagName?.toLowerCase();
      if (tag === 'button' || tag === 'input') {
          submitButton.disabled = false;
      }
  } catch (e) {
      console.error('Error in undisabledSubmitButton:', e);
  }
}

/**
 * Exported object.
 */
export const helpers_button = { 
  dynamicDisabledSubmitbtnStyle,
  disabledSubmitButton,
  undisabledSubmitButton,
};
