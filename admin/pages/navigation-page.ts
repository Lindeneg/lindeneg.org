(async () => {
    const { clElements, clTable, clHttp } = window;

    const [navigationRes, navigationColumnsRes] = await Promise.all([
        clHttp.getJson<NavigationWithItems>('/navigation'),
        clHttp.getJson<string[]>('/navigation-columns'),
    ]);

    if (!navigationRes) {
        clHttp.clearError();
    }

    const navigation = navigationRes ?? { id: '', brandName: '', navItems: [] };
    const navigationColumns = navigationColumnsRes ?? [];

    const table = clTable.createTableFromData({
        id: 'navigation-table',
        columns: navigationColumns,
        rows: navigation.navItems,

        onUpdateClick(target, editingId) {
            if (target.id === editingId) return enableActions();
            disableActions();
        },

        onDeleteClick() {
            enableActions();
        },
    });

    const disableActions = () => {
        commitBtns.freeze();
        addNavItem.querySelector('button')?.classList.add('pure-button-disabled');
    };

    const enableActions = () => {
        commitBtns.unfreeze();
        addNavItem.querySelector('button')?.classList.remove('pure-button-disabled');
    };

    const isOriginalValue = (rowId: string, column: string, value: unknown) => {
        const original = navigation.navItems.find((item) => item.id === rowId);

        if (!original) return false;

        return original[<keyof typeof original>column] === value;
    };

    const handleRowRequest = async (type: string, row: HTMLTableRowElement, navId: string) => {
        if (type === 'deleteEntity') {
            return clHttp.deleteEntity('/navigation-item/' + row.id);
        }

        const [payload, didAdd] = table.getPayloadFromRow(row, { navigationId: navId }, (col, val) => {
            let value: unknown = val;

            if (col === 'newTab') {
                value = val === 'true' ? true : false;
            } else if (col === 'position') {
                value = parseInt(val, 10);
            }

            if (isOriginalValue(row.id, col, value)) return { success: false };

            return {
                success: true,
                value,
            };
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

    const commitBtns = clElements.getConfirmButtons(commitChanges, resetChanges);
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
        adminSectionContent.appendChild(commitBtns.element);
        adminSection.appendChild(adminSectionContent);
        app.appendChild(adminSection);
    };

    window.dispatchEvent(new CustomEvent('core-view-initialized'));
})();
