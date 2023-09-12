(async () => {
    const { clElements, clTable, clHttp } = window;

    const [pagesRes, pagesColumnsRes, sectionsColumnsRes] = await Promise.all([
        clHttp.getJson<PageWithSections[]>('/pages'),
        clHttp.getJson<string[]>('/pages-columns'),
        clHttp.getJson<string[]>('/pages-section-columns'),
    ]);

    const pages = pagesRes ?? [];
    const pagesColumns = pagesColumnsRes ?? [];
    const sectionsColumns = sectionsColumnsRes ?? [];

    let editor: SimpleMDE | null = null;
    let mainSectionElement: HTMLElement | null = null;
    let pageSectionTarget: PageSection | null = null;

    const pagesTable = clTable.createTableFromData({
        id: 'pages-table',
        columns: pagesColumns,
        rows: pages,

        cellToInput(cell) {
            const columnName = cell.dataset.columnName;
            const value = cell.innerText;

            if (
                columnName === 'name' ||
                columnName === 'slug' ||
                columnName === 'title' ||
                columnName === 'description'
            ) {
                return `<input name='${columnName}' class='editable-row' value='${value}'></input>`;
            }

            if (columnName === 'published') {
                return `<input name='${columnName}' class='editable-row' type='checkbox' ${
                    value === 'true' ? 'checked' : ''
                }></input>`;
            }

            return String(value);
        },

        inputToCell(input) {
            if (input?.type === 'checkbox') {
                return input.checked ? 'true' : 'false';
            }
            return input?.value || input.innerText;
        },

        transform(col, val) {
            if (col === 'sections') {
                return val.length.toString();
            }

            return val;
        },

        onUpdateClick(target, editingId) {
            if (editingId) {
                return removeMainSection();
            }

            addPageItem.querySelector('button')?.classList.add('pure-button-disabled');
            adminSectionContent.appendChild(createPagesSectionContainer(editingId || target.id));
        },

        onDeleteClick() {
            removeMainSection();
        },
    });

    const clearEditorFromDom = () => {
        mainSectionElement?.querySelector('#main-editor-section')?.remove();
        editor = null;
    };

    const removeMainSection = () => {
        addPageItem.querySelector('button')?.classList.remove('pure-button-disabled');
        mainSectionElement?.remove();
        mainSectionElement = null;
    };

    const saveEditorChanges = (editingSectionId: string, editingPageId: string) => {
        const value = editor?.value() || '';

        const targetSection = pages
            .find((e) => e.id === editingPageId)
            ?.sections.find((e) => e.id === editingSectionId);

        if (targetSection) {
            targetSection.content = value;
        }

        pagesTable.unfreezeActions();
        pagesTable.startEditing(editingPageId);
        mainSectionElement?.querySelector('button')?.classList.remove('pure-button-disabled');
        clearEditorFromDom();
        return;
    };

    const createSectionTable = (pageId: string) => {
        let editingPageId: string | null = null;

        return clTable.createTableFromData({
            id: 'section-table-' + pageId,
            columns: sectionsColumns.filter((e) => e !== 'content'),
            rows: pages.find((e) => e.id === pageId)?.sections || [],

            onDeleteClick(target) {
                pagesTable.updateRow(pageId, 'sections', () => {
                    const targetPage = pages.find((e) => e.id === pageId)!;

                    targetPage.sections = targetPage.sections.filter((e) => e.id !== target.id);

                    return targetPage.sections.length;
                });
                pagesTable.unfreezeActions();
                pagesTable.startEditing(editingPageId || pagesTable.getEditingId()!);
                mainSectionElement!.querySelector('#main-editor-section')?.remove();
                mainSectionElement?.querySelector('button')?.classList.remove('pure-button-disabled');
                pageSectionTarget = null;
            },

            cellToInput(cell) {
                const columnName = cell.dataset.columnName;
                const value = cell.innerText;

                if (columnName === 'position') {
                    return `<input style='width:4rem;' name='${columnName}' class='editable-row' type='number' value='${value}'></input>`;
                }

                if (columnName === 'published') {
                    return `<input name='${columnName}' class='editable-row' type='checkbox' ${
                        value === 'true' ? 'checked' : ''
                    }></input>`;
                }

                return String(value);
            },

            inputToCell(input) {
                if (input?.type === 'checkbox') {
                    return input.checked ? 'true' : 'false';
                }

                return input?.value || input.innerText;
            },

            onUpdateClick(target, editingId) {
                editingPageId = editingPageId || pagesTable.getEditingId()!;

                if (editingId === target.id) return saveEditorChanges(editingId, editingPageId);

                clearEditorFromDom();
                pagesTable.stopEditing();
                pagesTable.freezeActions();
                mainSectionElement?.querySelector('button')?.classList.add('pure-button-disabled');

                const div = document.createElement('div');
                div.id = 'main-editor-section';
                div.innerHTML = `<h3>Section Content</h3>
                <small>Use fullscreen mode for better editing</small>
                <textarea id='editor'>
                </textarea>`;

                mainSectionElement!.appendChild(div);

                pageSectionTarget = pages
                    .find((e) => e.id === pageId)
                    ?.sections.find((e) => e.id === (editingId || target.id))!;

                editor = new SimpleMDE({
                    element: mainSectionElement?.querySelector('#editor')!,
                    initialValue: pageSectionTarget.content,
                });
            },
        });
    };

    const createPagesSectionContainer = (pageId: string) => {
        const sectionTable = createSectionTable(pageId);

        const mainSection = clElements.getAddItemsSection('Page Sections', 'Add Page Section', () => {
            const section = {
                position: 1,
                published: false,
            };

            const id = sectionTable.addRow(section);

            pages.find((e) => e.id === pageId)?.sections.push({ ...section, id, pageId, content: 'Hello There' });

            pagesTable.updateRow(pageId, 'sections', () => {
                return pages.find((e) => e.id === pageId)!.sections.length;
            });
        });

        mainSection.id = 'mdeContainer';

        mainSection.appendChild(sectionTable.getRootNode());

        mainSectionElement = mainSection;

        return mainSection;
    };

    const [adminSection, adminSectionContent] = clElements.getAdminSection('Pages');
    const addPageItem = clElements.getAddItemsSection('', 'Add Page', () => {
        const page = {
            name: 'Jazz',
            slug: '/jazz',
            title: 'Jazz',
            description: 'Kind of Blue',
            published: false,
            sections: [],
        };

        const id = pagesTable.addRow({
            ...page,
            sections: page.sections.length,
        });

        pages.push({ ...page, id });
    });

    window.clView.pages = (app) => {
        adminSectionContent.appendChild(addPageItem);
        adminSectionContent.appendChild(pagesTable.getRootNode());
        adminSection.appendChild(adminSectionContent);
        app.appendChild(adminSection);
    };

    window.dispatchEvent(new CustomEvent('core-view-initialized'));
})();
