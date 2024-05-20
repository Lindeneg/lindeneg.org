(async () => {
    const { clElements, clTable, clHttp } = window;

    const messagesRes = await clHttp.getJson<Record<string, string>[]>('/cl-software');

    if (!messagesRes) {
        clHttp.clearError();
    }

    const messages = (messagesRes ?? []).map((e) => ({ ...e, contact: e.name }));
    const columns = ['contact', 'email', 'message', 'createdAt'];

    const table = clTable.createTableFromData({
        id: 'messages-table',
        columns: columns,
        rows: messages,
    });

    const commitChanges = () => {
        table.getDeletedRows().forEach(async (row) => {
            await clHttp.deleteEntity('/cl-software/' + row.id);
        });
    };

    const resetChanges = () => {
        return window.location.reload();
    };

    const commitBtns = clElements.getConfirmButtons(commitChanges, resetChanges);
    const [adminSection, adminSectionContent] = clElements.getAdminSection('CL Software Messages');

    window.clView.messages = (app) => {
        adminSectionContent.appendChild(table.getRootNode());
        adminSectionContent.appendChild(commitBtns.element);
        adminSection.appendChild(adminSectionContent);
        app.appendChild(adminSection);
    };

    window.dispatchEvent(new CustomEvent('core-view-initialized'));
})();
