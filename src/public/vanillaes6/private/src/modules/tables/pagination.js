let filteredRowsGlobal = [];

/**
 * Initializes pagination for a table body based on attributes and current filters.
 *
 * @param {string} pre - Prefix for custom attributes (e.g., "data-").
 * @returns {boolean|undefined} False if an error occurs, otherwise undefined.
 */
function autoPaginatetbody({modules, global}) {
  try {
    const paginationControls = document.querySelector('.pageofpaginatetbody');
    if (!paginationControls) return;

    const perPageAttr = paginationControls.getAttribute(global.attributePrefix + 'perpage');
    const currentPageAttr = paginationControls.getAttribute(global.attributePrefix + 'currentpage');
    const tableBodySelector = paginationControls.getAttribute(global.attributePrefix + 'autopaginatetbody');

    const perPage = perPageAttr ? parseInt(perPageAttr, 10) : 10;

    // Reset page to 1 after filter
    paginationControls.setAttribute(global.attributePrefix + 'currentpage', 1);

    autoPaginatePageOfNumbertbody(perPage, 1, tableBodySelector, paginationControls);
  } catch (e) {
    return false;
  }
}

/**
 * Paginates the given table body for a specific page number.
 *
 * @param {number} perPage - Number of rows per page.
 * @param {number} currentPage - Current page to display.
 * @param {string} tableBodySelector - Selector for the table body.
 * @param {HTMLElement} paginationControls - Pagination controls container element.
 * @returns {boolean|undefined} False if an error occurs, otherwise undefined.
 */
function autoPaginatePageOfNumbertbody(perPage, currentPage, tableBodySelector, paginationControls) {
  try {
    const tbody = document.querySelector(tableBodySelector);
    if (!tbody) return;

    const allRows = Array.from(tbody.querySelectorAll('tr:not(.no-results)'));

    // Detect if search filter is active
    const searchInput = document.querySelector('input.autosearchtbody');
    const searchActive = searchInput && searchInput.value.trim().length > 0;

    // Use filtered rows if search is active, otherwise use all
    const rows = (filteredRowsGlobal.length > 0 || searchActive) ? filteredRowsGlobal : allRows;
    const totalRows = rows.length;

    if (totalRows > perPage) {
      const totalPages = Math.ceil(totalRows / perPage);

      allRows.forEach(row => row.style.display = 'none');

      const startIndex = (currentPage - 1) * perPage;
      const endIndex = startIndex + perPage;

      rows.slice(startIndex, endIndex).forEach(row => row.style.display = '');

      const pageText = paginationControls.querySelector('.page-of');
      if (pageText) pageText.textContent = `Page ${currentPage} of ${totalPages}`;

      const prevBtn = paginationControls.querySelector('.prev');
      const nextBtn = paginationControls.querySelector('.next');

      if (prevBtn) prevBtn.style.display = currentPage === 1 ? 'none' : 'inline-block';
      if (nextBtn) nextBtn.style.display = currentPage === totalPages ? 'none' : 'inline-block';

      // Rebind pagination buttons
      if (prevBtn) {
        const newPrevBtn = prevBtn.cloneNode(true);
        prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
        newPrevBtn.addEventListener('click', () => {
          if (currentPage > 1) {
            autoPaginatePageOfNumbertbody(perPage, currentPage - 1, tableBodySelector, paginationControls);
          }
        });
      }

      if (nextBtn) {
        const newNextBtn = nextBtn.cloneNode(true);
        nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
        newNextBtn.addEventListener('click', () => {
          if (currentPage < totalPages) {
            autoPaginatePageOfNumbertbody(perPage, currentPage + 1, tableBodySelector, paginationControls);
          }
        });
      }

    } else {
      // Display all rows when total is less than perPage
      allRows.forEach(row => row.style.display = 'none');
      rows.forEach(row => row.style.display = '');

      const pageText = paginationControls.querySelector('.page-of');
      if (pageText) pageText.textContent = '';

      const prevBtn = paginationControls.querySelector('.prev');
      const nextBtn = paginationControls.querySelector('.next');
      if (prevBtn) prevBtn.style.display = 'none';
      if (nextBtn) nextBtn.style.display = 'none';
    }
  } catch (e) {
    return false;
  }
}

/**
 * Placeholder for future 3rd page pagination logic.
 */
function autoPaginate3rdOfNumbertbody() {
  // Implementation pending
}

/**
 * Placeholder for future dotted pagination logic.
 */
function autoPaginate4thOfNumberDottbody() {
  // Implementation pending
}

/**
 * Exported object.
 */
export const tables_pagination = {
  autoPaginatetbody,
  autoPaginatePageOfNumbertbody,
  autoPaginate3rdOfNumbertbody,
  autoPaginate4thOfNumberDottbody
};
