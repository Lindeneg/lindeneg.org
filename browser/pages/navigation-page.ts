'use strict';
(async () => {
    const { clElements, clTable, clHttp } = window;

    const [navigationRes, navigationColumnsRes] = await Promise.all([
        clHttp.getJson<NavigationWithItems>('/navigation', undefined, () => {}),
        clHttp.getJson<string[]>('/navigation-columns'),
    ]);

    const navigation = navigationRes ?? { id: '', brandName: '', navItems: [] };
    const navigationColumns = navigationColumnsRes ?? [];

    const table = clTable.createTableFromData({
        id: 'navigation-table',
        columns: navigationColumns,
        rows: navigation.navItems,

        cellToInput(cell) {
            const columnName = cell.dataset.columnName;
            const value = cell.innerText;

            if (columnName === 'name' || columnName === 'href') {
                return `<input name='${columnName}' class='editable-row' value='${value}'></input>`;
            }

            if (columnName === 'position') {
                return `<input style='width:4rem;' name='${columnName}' class='editable-row' type='number' value='${value}'></input>`;
            }

            if (columnName === 'newTab') {
                return `<input name='${columnName}' class='editable-row' type='checkbox' ${
                    value === 'true' ? 'checked' : ''
                }></input>`;
            }

            if (columnName === 'alignment') {
                return `<select name='${columnName}' class='editable-row'>
    <option value='LEFT' ${value === 'LEFT' ? 'selected' : ''}>Left</option>
    <option value='RIGHT' ${value === 'RIGHT' ? 'selected' : ''}>Right</option>
</select>`;
            }

            return String(value);
        },

        inputToCell(input) {
            if (input.type === 'checkbox') {
                return input.checked ? 'true' : 'false';
            }
            return input.value;
        },
    });

    const handleRowRequest = async (type: string, row: HTMLTableRowElement, navId: string) => {
        if (type === 'deleteEntity') {
            return clHttp.deleteEntity('/navigation-item/' + row.id);
        }

        const [payload, didAdd] = table.getPayloadFromRow(row, { navigationId: navId }, (col, val) => {
            if (col === 'newTab') return val === 'true' ? true : false;

            if (col === 'position') return parseInt(val, 10);

            return val;
        });

        if (!didAdd) return;

        if (type === 'postJson') return clHttp.postJson('/navigation-item', payload);

        return clHttp.patchJson('/navigation-item/' + row.id, payload);
    };

    const commitChanges = async () => {
        const newBrandName = (brandNameInputField.children[1] as any).value;

        if (!navigation.id) {
            const res = await clHttp.postJson('/navigation', JSON.stringify({ brandName: newBrandName }));

            if (!res?.ok) return;

            navigation.id = await res.json();
        } else if (navigation?.brandName !== newBrandName) {
            const res = await clHttp.patchJson(
                '/navigation/' + navigation.id,
                JSON.stringify({ brandName: newBrandName })
            );

            if (!res?.ok) return;

            navigation.id = await res.json();
        }

        if (!navigation.id) return;

        const [newRows, editedRows, deletedRows] = [table.getNewRows(), table.getEditedRows(), table.getDeletedRows()];

        await Promise.all([
            ...newRows.map((row) => handleRowRequest('postJson', row, navigation.id)),
            ...editedRows.map((row) => handleRowRequest('patchJson', row, navigation.id)),
            ...deletedRows.map((row) => handleRowRequest('deleteEntity', row, navigation.id)),
        ]);

        return window.location.reload();
    };

    const resetChanges = () => {
        return window.location.reload();
    };

    const { element: commitElement } = clElements.getConfirmButtons(commitChanges, resetChanges);
    const [adminSection, adminSectionContent] = clElements.getAdminSection('Navigation');
    const brandNameInputField = clElements.getInputField('Navigation Name', navigation?.brandName || '');
    const addNavItem = clElements.getAddItemsSection('Navigation Items', 'Add Navigation Item', () =>
        table.addRow({
            name: 'Example',
            href: '/example',
            position: 10,
            alignment: 'LEFT',
            newTab: false,
        })
    );

    window.clView.navigation = (app) => {
        adminSectionContent.appendChild(brandNameInputField);
        adminSectionContent.appendChild(addNavItem);
        adminSectionContent.appendChild(table.getRootNode());
        adminSectionContent.appendChild(commitElement);
        adminSection.appendChild(adminSectionContent);
        app.appendChild(adminSection);
    };

    window.dispatchEvent(new CustomEvent('core-view-initialized'));
})();