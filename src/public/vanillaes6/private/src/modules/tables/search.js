let filteredRowsGlobal = [];

/**
 * Adds live search functionality to table bodies.
 * Filters table rows based on the input value and updates pagination.
 *
 * @param {string} pre - Prefix for custom attributes (e.g., "data-").
 * @returns {boolean|undefined} False if an error occurs, otherwise undefined.
 */
function autoSearchtbody({modules, global}) {
  try {
    const inputs = document.querySelectorAll('input.autosearchtbody');

    inputs.forEach(input => {
      input.addEventListener('keyup', function () {
        const value = this.value.toLowerCase();
        const tbodySelector = this.getAttribute(global.attributePrefix + 'autosearchtbody');
        const tbody = document.querySelector(tbodySelector);
        if (!tbody) return;

        const rows = Array.from(tbody.querySelectorAll('tr:not(.no-results)'));
        let matchCount = 0;
        filteredRowsGlobal = [];

        rows.forEach(row => {
          const text = row.textContent.toLowerCase();
          if (text.includes(value)) {
            row.style.display = '';
            filteredRowsGlobal.push(row);
            matchCount++;
          } else {
            row.style.display = 'none';
          }
        });

        // Handle "no results" row
        let noResultsRow = tbody.querySelector('.no-results');
        if (matchCount === 0) {
          if (!noResultsRow) {
            noResultsRow = document.createElement('tr');
            noResultsRow.classList.add('no-results');

            const td = document.createElement('td');
            td.colSpan = 100; // span all columns
            td.style.textAlign = 'center';
            td.textContent = 'No results found.';

            noResultsRow.appendChild(td);
            tbody.appendChild(noResultsRow);
          }
        } else if (noResultsRow) {
          noResultsRow.remove();
        }

        // Update pagination for filtered rows
        modules.tables_pagination.autoPaginatetbody({modules, global});
      });
    });

  } catch (e) {
    return false;
  }
}

/**
 * Exported object.
 */
export const tables_search = {
  autoSearchtbody,
};
