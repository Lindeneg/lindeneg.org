'use strict';
(() => {
    const createActionRow = (
        id: string,
        onUpdate = (target: HTMLButtonElement) => {},
        onDelete = (target: HTMLButtonElement) => {}
    ) => {
        const cell = document.createElement('td');
        cell.id = 'table-actions';

        const updateBtn = document.createElement('button');
        updateBtn.dataset.itemId = id;
        updateBtn.className = 'update-table-btn';
        updateBtn.innerText = 'Update';
        updateBtn.addEventListener('click', (event) => onUpdate(event.target as HTMLButtonElement));

        const deleteBtn = document.createElement('button');
        deleteBtn.dataset.itemId = id;
        deleteBtn.className = 'delete-table-btn';
        deleteBtn.innerText = 'Delete';
        deleteBtn.addEventListener('click', (event) => onDelete(event.target as HTMLButtonElement));

        cell.appendChild(updateBtn);
        cell.appendChild(document.createTextNode(' | '));
        cell.appendChild(deleteBtn);

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
        const updateActionBtns = () => rootNode.querySelectorAll('.update-table-btn');
        const deleteActionBtns = () => rootNode.querySelectorAll('.delete-table-btn');

        let updatingRowId: string | null = null;

        const startEditing = (rowId: string) => {
            if (updatingRowId) {
                stopEditing();
            }

            updatingRowId = rowId;
            rowToInput(rowId);
            freezeActions(true);
        };

        const stopEditing = () => {
            if (!updatingRowId) return;

            inputToRow(updatingRowId);
            updatingRowId = null;
            unfreezeActions();
        };

        const freezeActions = (ignoreCurrentlyEditingRow = false) => {
            const shouldIgnore = (el: any) => ignoreCurrentlyEditingRow && el.dataset.itemId === updatingRowId;

            updateActionBtns().forEach((el) => {
                if (shouldIgnore(el)) {
                    (el as any).innerText = 'Done';
                    return;
                }
                el.classList.add('pure-button-disabled');
            });

            deleteActionBtns().forEach((el) => {
                if (shouldIgnore(el)) return;
                el.classList.add('pure-button-disabled');
            });
        };

        const unfreezeActions = () => {
            updateActionBtns().forEach((el) => {
                if ((el as any).innerText === 'Done') {
                    (el as any).innerText = 'Update';
                    return;
                }
                el.classList.remove('pure-button-disabled');
            });

            deleteActionBtns().forEach((el) => {
                el.classList.remove('pure-button-disabled');
            });
        };

        const onUpdateClick = (target: HTMLButtonElement) => {
            if (opts?.onUpdateClick) {
                opts.onUpdateClick(target.parentElement?.parentElement as HTMLTableRowElement, updatingRowId);
            }

            if (updatingRowId === target.dataset.itemId) {
                stopEditing();
                return;
            }

            startEditing(target.dataset.itemId!);
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

        const onDeleteClick = (target: HTMLButtonElement) => {
            if (opts?.onDeleteClick) {
                opts.onDeleteClick(target.parentElement?.parentElement as HTMLTableRowElement);
            }

            deleteRow(target.dataset.itemId!);
            stopEditing();
        };

        updateActionBtns().forEach((el) => {
            el.addEventListener('click', (event) => onUpdateClick(event.target as HTMLButtonElement));
        });

        deleteActionBtns().forEach((el) => {
            el.addEventListener('click', (event) => onDeleteClick(event.target as HTMLButtonElement));
        });

        const createTempId = () => {
            return 'NEW_ROW_TEMP_ID-' + Date.now() + '-' + Math.floor(Math.random() * 100000);
        };

        const handleOrElementOrNonElementRowMutation = (cell: HTMLTableCellElement, result: HTMLElement | string) => {
            cell.innerHTML = '';
            if (result instanceof HTMLElement) {
                cell.appendChild(result);
            } else {
                cell.innerHTML = result;
            }
        };

        const rowToInput = (id: string) => {
            const row = rows.find((row) => row.id === id);

            if (!row) return;

            const cells = Array.from(row.querySelectorAll('td'));

            cells.forEach((cell) => {
                if (cell.id === 'table-actions') return;

                if (opts?.cellToInput) {
                    handleOrElementOrNonElementRowMutation(cell, opts.cellToInput(cell));
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
            transform: (col: string, val: string) => RowTransformResult
        ) => {
            let didAdd = false;

            for (const _cell of childNodes) {
                const cell = _cell as HTMLTableCellElement;

                if (cell.id === 'table-actions' || !cell.dataset.columnName) {
                    continue;
                }

                const result = transform(cell.dataset.columnName, cell.innerText);

                if (!result.success) continue;

                payload[<keyof T>cell.dataset.columnName] = result.value;
                didAdd = true;
            }

            return [JSON.stringify(payload), didAdd];
        };

        const getRowColumnCell: ClTableApi['getRowColumnCell'] = (rowId, columnName) => {
            const row = rows.find((row) => row.id === rowId);

            if (!row) return null;

            const cell = Array.from(row.querySelectorAll('td')).find((cell) => cell.dataset.columnName === columnName);

            if (!cell) return null;

            return cell;
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
                    const value = initialValues[columnName];
                    cell.innerHTML = opts?.transform ? opts.transform(columnName, value) : value;
                    cell.dataset.columnName = columnName;
                    row.appendChild(cell);
                });

                row.appendChild(createActionRow(id, onUpdateClick, onDeleteClick));
                rows.push(row);

                rowWrapper.appendChild(row);
                newRowsIds.add(id);

                return id;
            },

            updateRow(id, column, value) {
                const target = getRowColumnCell(id, column);

                if (!target) return;

                const result = value(target);

                handleOrElementOrNonElementRowMutation(target, result);

                if (newRowsIds.has(id)) return;

                editedRowsIds.add(id);
            },

            getRowFromId(id) {
                const row = rows.find((row) => row.id === id);

                if (!row) return null;

                return row;
            },

            deleteRow,
            getPayloadFromRow,
            getRowColumnCell,
            startEditing,
            stopEditing,
            freezeActions,
            unfreezeActions,

            freezeNonEditingRows() {
                freezeActions(true);
            },

            getEditingId() {
                return updatingRowId;
            },

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
