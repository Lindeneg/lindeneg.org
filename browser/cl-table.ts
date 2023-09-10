'use strict';
(() => {
    const createActionRow = (
        id: string,
        onUpdate = (target: HTMLSpanElement) => {},
        onDelete = (target: HTMLSpanElement) => {}
    ) => {
        const cell = document.createElement('td');
        cell.id = 'table-actions';

        const updateSpan = document.createElement('span');
        updateSpan.dataset.itemId = id;
        updateSpan.className = 'update-table-btn';
        updateSpan.innerText = 'Update';
        updateSpan.addEventListener('click', (event) => onUpdate(event.target as HTMLSpanElement));

        const deleteSpan = document.createElement('span');
        deleteSpan.dataset.itemId = id;
        deleteSpan.className = 'delete-table-btn';
        deleteSpan.innerText = 'Delete';
        deleteSpan.addEventListener('click', (event) => onDelete(event.target as HTMLSpanElement));

        cell.appendChild(updateSpan);
        cell.appendChild(document.createTextNode(' | '));
        cell.appendChild(deleteSpan);

        return cell;
    };

    const createTableApi: ClTableModule['createTableApi'] = (rootNode, opts) => {
        const deletedRowsIds = new Set();
        const newRowsIds = new Set();
        const editedRowsIds = new Set();
        const columnsWrapper = rootNode.querySelector('#table-columns')!;
        const rowWrapper = rootNode.querySelector('#table-rows')!;
        const columns = Array.from(columnsWrapper.querySelectorAll('th'));
        const columnNames = columns.slice(0, columns.length - 1).map((el) => String(el.innerHTML));
        const rows = Array.from(rowWrapper.querySelectorAll('tr'));
        const updateActionBtns = rootNode.querySelectorAll('.update-table-btn');
        const deleteActionBtns = rootNode.querySelectorAll('.delete-table-btn');

        let updatingRowId: string | null = null;

        const onUpdateClick = (target: HTMLSpanElement) => {
            if (opts?.onUpdateClick) {
                opts.onUpdateClick(target.parentElement?.parentElement as HTMLTableRowElement, updatingRowId);
            }
            if (updatingRowId === target.dataset.itemId) {
                updatingRowId = null;
                return inputToRow(target.dataset.itemId);
            }
            if (updatingRowId) {
                inputToRow(updatingRowId);
            }
            updatingRowId = target.dataset.itemId!;
            rowToInput(target.dataset.itemId!);
        };

        const deleteRow: ClTableApi['deleteRow'] = (id) => {
            const row = rows.find((row) => row.id === id);
            if (!row) return;
            rowWrapper.removeChild(row);
            rows.slice(rows.indexOf(row), 1);
            if (newRowsIds.has(row.id)) {
                newRowsIds.delete(row.id);
                return;
            }
            if (editedRowsIds.has(row.id)) {
                editedRowsIds.delete(row.id);
            }
            deletedRowsIds.add(row.id);
        };

        const onDeleteClick = (target: HTMLSpanElement) => {
            if (opts?.onDeleteClick) {
                opts.onDeleteClick(target.parentElement?.parentElement as HTMLTableRowElement);
            }
            deleteRow(target.dataset.itemId!);
            if (updatingRowId === target.dataset.itemId) {
                updatingRowId = null;
            }
        };

        updateActionBtns.forEach((el) => {
            el.addEventListener('click', (event) => onUpdateClick(event.target as HTMLSpanElement));
        });

        deleteActionBtns.forEach((el) => {
            el.addEventListener('click', (event) => onDeleteClick(event.target as HTMLSpanElement));
        });

        const createTempId = () => {
            return 'NEW_ROW_TEMP_ID-' + Date.now() + '-' + Math.floor(Math.random() * 100000);
        };

        const rowToInput = (id: string) => {
            const row = rows.find((row) => row.id === id);

            if (!row) return;

            const cells = Array.from(row.querySelectorAll('td'));

            cells.forEach((cell) => {
                if (cell.id === 'table-actions') return;

                if (opts?.cellToInput) {
                    cell.innerHTML = opts.cellToInput(cell);
                    return;
                }

                cell.innerHTML = `<input value="${cell.innerHTML}" ></input>`;
            });
        };

        const inputToRow = (id: string) => {
            const row = rows.find((row) => row.id === id);

            if (!row) return;

            const cells = Array.from(row.querySelectorAll('td'));

            cells.forEach((cell) => {
                if (cell.id === 'table-actions') return;

                const target = (cell.children[0] as HTMLInputElement) || cell;

                if (opts?.inputToCell) {
                    cell.innerHTML = opts.inputToCell(target);
                    return;
                }

                if (target?.type === 'checkbox') {
                    return target.checked ? 'true' : 'false';
                }

                cell.innerHTML = target?.value || target?.innerText || '';
            });

            if (newRowsIds.has(row.id) || editedRowsIds.has(row.id)) return;

            editedRowsIds.add(row.id);
        };

        const getPayloadFromRow: ClTableApi['getPayloadFromRow'] = <T>(
            { childNodes }: HTMLTableRowElement,
            payload: T,
            transform: (col: string, val: string) => any
        ) => {
            let didAdd = false;

            for (const _cell of childNodes) {
                const cell = _cell as HTMLTableCellElement;

                if (cell.id === 'table-actions' || !cell.dataset.columnName) {
                    continue;
                }

                // TODO:
                // take an additional nullable argument, originalEntry
                // and compare new value against original value, if
                // same value, then continue else add it to the payload

                payload[<keyof T>cell.dataset.columnName] = transform(cell.dataset.columnName, cell.innerText);
                didAdd = true;
            }

            return [JSON.stringify(payload), didAdd];
        };

        return {
            destroyTable() {
                rootNode.remove();
            },
            addRow(initialValues = {}) {
                const id = createTempId();
                const row = document.createElement('tr');
                row.id = id;

                columnNames.forEach((columnName) => {
                    const cell = document.createElement('td');
                    cell.innerHTML = initialValues[columnName];
                    cell.dataset.columnName = columnName;
                    row.appendChild(cell);
                });

                row.appendChild(createActionRow(id, onUpdateClick, onDeleteClick));
                rows.push(row);

                rowWrapper.appendChild(row);
                newRowsIds.add(id);
            },

            updateRow(id, column, value) {
                const row = rows.find((row) => row.id === id);

                if (!row) return;

                const target = Array.from(row.querySelectorAll('td')).find(
                    (cell) => cell.dataset.columnName! === column
                );

                if (!target) return;

                target.innerHTML = value(target);

                if (newRowsIds.has(row.id)) return;

                editedRowsIds.add(row.id);
            },

            deleteRow,

            getPayloadFromRow,

            getNewRows() {
                return rows.filter((row) => newRowsIds.has(row.id));
            },

            getEditedRows() {
                return rows.filter((row) => editedRowsIds.has(row.id));
            },

            getDeletedRows() {
                return rows.filter((row) => deletedRowsIds.has(row.id));
            },

            getRootNode() {
                return rootNode;
            },
        };
    };

    const createTableFromData: ClTableModule['createTableFromData'] = ({ id, columns, rows, ...opts }) => {
        const table = document.createElement('table');
        table.id = id;
        table.className = 'pure-table pure-table-bordered';

        const tableHead = document.createElement('thead');
        const columnsRow = document.createElement('tr');
        columnsRow.id = 'table-columns';

        [...columns, 'actions'].forEach((columnName) => {
            const cell = document.createElement('th');
            cell.innerHTML = columnName;
            columnsRow.appendChild(cell);
        });

        tableHead.appendChild(columnsRow);
        table.appendChild(tableHead);

        const tableBody = document.createElement('tbody');
        tableBody.id = 'table-rows';

        Object.values(rows).forEach((row) => {
            const rowElement = document.createElement('tr');
            rowElement.id = row.id;
            columns.forEach((columnName) => {
                const cell = document.createElement('td');
                const value = row[columnName];

                cell.innerHTML = opts.transform ? opts.transform(columnName, value) : value;
                cell.dataset.columnName = columnName;

                rowElement.appendChild(cell);
            });
            rowElement.appendChild(createActionRow(row.id));
            tableBody.appendChild(rowElement);
        });

        table.appendChild(tableBody);

        return createTableApi(table, opts);
    };

    window.clTable = {
        createTableApi,
        createTableFromData,
    };
})();
