/**
 * Returns today's date in YYYY-MM-DD format.
 *
 * @returns {string} Today's date
 */
function getTodayDate() 
{
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Returns the next day's date in YYYY-MM-DD format.
 *
 * @returns {string} Next day's date
 */
function getNextDayDate() 
{
  const now = new Date();
  now.setDate(now.getDate() + 1);  
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Returns the previous day's date in YYYY-MM-DD format.
 *
 * @returns {string} Previous day's date
 */
function getPreviewDayDate() 
{
  const now = new Date();
  now.setDate(now.getDate() - 1);  
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Exported object.
 */
export const helpers_date = { 
  getTodayDate,
  getNextDayDate,
  getPreviewDayDate,
};
