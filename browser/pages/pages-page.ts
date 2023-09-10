'use strict';
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
    let mainSectionElement: HTMLElement | null = null;

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
                mainSectionElement?.remove();
                mainSectionElement = null;
                // ...
                return;
            }

            adminSectionContent.appendChild(createPagesSectionContainer(editingId || target.id));

            console.log(target, editingId);
        },
    });

    const createSectionTable = (pageId: string) => {
        return clTable.createTableFromData({
            id: 'section-table-' + pageId,
            columns: sectionsColumns.filter((e) => e !== 'content'),
            rows: pages.find((e) => e.id === pageId)?.sections || [],

            onDeleteClick() {
                pagesTable.updateRow(pageId, 'sections', (e) => parseInt(e.innerText) - 1);
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
                mainSectionElement!.querySelector('#something')?.remove();

                if (editingId === target.id) {
                    // ...
                    return;
                }

                const div = document.createElement('div');
                div.id = 'something';
                div.innerHTML = `<h3>Section Content</h3>
                <small>Use fullscreen mode for better editing</small>
                <textarea id='editor'>
                </textarea>`;

                mainSectionElement!.appendChild(div);

                const t = pages.find((e) => e.id === pageId)?.sections.find((e) => e.id === (editingId || target.id));

                new SimpleMDE({
                    element: mainSectionElement?.querySelector('#editor')!,
                    initialValue: t?.content || '',
                });
            },
        });
    };

    const createPagesSectionContainer = (pageId: string) => {
        const sectionTable = createSectionTable(pageId);

        const mainSection = clElements.getAddItemsSection('Page Sections', 'Add Page Section', () => {
            pagesTable.updateRow(pageId, 'sections', (e) => parseInt(e.innerText) + 1);
            sectionTable.addRow({
                position: 1,
                published: false,
            });
        });
        mainSection.id = 'mdeContainer';

        mainSection.appendChild(sectionTable.getRootNode());

        mainSectionElement = mainSection;

        return mainSection;
    };

    const [adminSection, adminSectionContent] = clElements.getAdminSection('Pages');
    const addPageItem = clElements.getAddItemsSection('', 'Add Page', () =>
        pagesTable.addRow({
            name: 'Jazz',
            slug: '/jazz',
            title: 'Jazz',
            description: 'Kind of Blue',
            published: false,
            sections: 0,
        })
    );

    window.clView.pages = (app) => {
        adminSectionContent.appendChild(addPageItem);
        adminSectionContent.appendChild(pagesTable.getRootNode());
        adminSection.appendChild(adminSectionContent);
        app.appendChild(adminSection);
    };

    window.dispatchEvent(new CustomEvent('core-view-initialized'));
})();
