(async () => {
    const { clCore, clElements, clTable, clHttp } = window;

    const [pagesRes, pagesColumnsRes, sectionsColumnsRes] = await Promise.all([
        clHttp.getJson<PageWithSections[]>('/pages'),
        clHttp.getJson<string[]>('/pages-columns'),
        clHttp.getJson<string[]>('/pages-section-columns'),
    ]);

    const pages = pagesRes ?? [];
    const pagesColumns = pagesColumnsRes ?? [];
    const sectionsColumns = sectionsColumnsRes ?? [];
    const originalPages: PageWithSections[] = JSON.parse(JSON.stringify(pages));
    const changedColumnKeys = ['position', 'published', 'content'];

    let editor: SimpleMDE | null = null;
    let mainSectionElement: HTMLElement | null = null;
    let pageSectionTarget: PageSection | null = null;
    let sectionTable: ClTableApi | null = null;

    const isNewRow = (id: string) => {
        return clCore.NEW_ENTRY_REGEX.test(id);
    };

    const pagesTable = clTable.createTableFromData({
        id: 'pages-table',
        columns: pagesColumns,
        rows: pages,

        transform(col, val) {
            if (col === 'sections') {
                return val.length.toString();
            }

            return val;
        },

        onUpdateClick(target, editingId) {
            if (editingId) {
                const mutatedSections = [
                    ...(sectionTable?.getEditedRows() ?? []),
                    ...(sectionTable?.getNewRows() || []),
                ];

                mutatedSections.forEach((mutatedSection) => {
                    const section = pages
                        .find((e) => e.id === editingId)
                        ?.sections.find((e) => e.id === mutatedSection.id)!;
                    const published = sectionTable?.getRowColumnCell(mutatedSection.id, 'published')?.innerText;

                    if (!section) return;

                    section.position = parseInt(
                        sectionTable?.getRowColumnCell(mutatedSection.id, 'position')?.innerText || '0'
                    );
                    section.published = published === 'true';
                });

                sectionTable = null;
                commitBtns.unfreeze();
                return removeMainSection();
            }

            commitBtns.freeze();
            addPageItem.querySelector('button')?.classList.add('pure-button-disabled');
            adminSectionContent.appendChild(createPagesSectionContainer(editingId || target.id));
        },

        onDeleteClick() {
            commitBtns.unfreeze();
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
            clCore.setDataSectionsAttribute(pagesTable.getRowFromId(editingPageId), editingSectionId);
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

                clCore.setDataSectionsAttribute(pagesTable.getRowFromId(pageId), target.id);

                pagesTable.unfreezeActions();
                pagesTable.startEditing(editingPageId || pagesTable.getEditingId()!);
                mainSectionElement!.querySelector('#main-editor-section')?.remove();
                mainSectionElement?.querySelector('button')?.classList.remove('pure-button-disabled');
                pageSectionTarget = null;
            },

            onUpdateClick(target, editingId) {
                editingPageId = editingPageId || pagesTable.getEditingId()!;

                if (editingId === target.id) return saveEditorChanges(editingId, editingPageId);

                clearEditorFromDom();
                pagesTable.stopEditing();
                pagesTable.freezeActions();
                mainSectionElement?.querySelector('button')?.classList.add('pure-button-disabled');

                pageSectionTarget = pages
                    .find((e) => e.id === pageId)
                    ?.sections.find((e) => e.id === (editingId || target.id))!;

                editor = clElements.appendEditor(mainSectionElement!, pageSectionTarget.content);
            },
        });
    };

    const createPagesSectionContainer = (pageId: string) => {
        sectionTable = createSectionTable(pageId);

        const mainSection = clElements.getAddItemsSection('Page Sections', 'Add Page Section', () => {
            const section = {
                position: 1,
                published: false,
            };

            const id = sectionTable!.addRow(section);

            pages.find((e) => e.id === pageId)?.sections.push({ ...section, id, pageId, content: 'Hello There' });

            pagesTable.updateRow(pageId, 'sections', () => {
                return pages.find((e) => e.id === pageId)!.sections.length;
            });

            clCore.setDataSectionsAttribute(pagesTable.getRowFromId(pageId), id);
        });

        mainSection.id = 'mdeContainer';

        mainSection.appendChild(sectionTable.getRootNode());

        mainSectionElement = mainSection;

        return mainSection;
    };

    const handleSectionCallbacks = (
        originalPage: PageWithSections,
        identifier: string,
        sectionCallbacks: SectionCallbacks
    ) => {
        const sectionIds = clCore.getDataSectionsAttribute(pagesTable.getRowFromId(identifier));
        if (sectionIds.length === 0) return { success: false };

        if (!sectionCallbacks[identifier]) {
            sectionCallbacks[identifier] = [];
        }

        sectionIds.forEach((sectionId) => {
            const originalSection = originalPage?.sections.find((e) => e.id === sectionId)!;
            const pageSection = pages
                .find((page) => page.id === identifier)
                ?.sections.find((section) => section.id === sectionId)!;

            if (isNewRow(sectionId)) {
                sectionCallbacks[identifier].push(async (pageId) => {
                    const { id, ...payload } = pageSection;
                    await clHttp.postJson('/page-sections', JSON.stringify({ ...payload, pageId }));
                });

                return;
            }

            if (!pageSection) {
                sectionCallbacks[identifier].push(async () => {
                    await clHttp.deleteEntity(`/page-sections/${sectionId}`);
                });

                return;
            }

            const changedSectionColumns = clCore.getChangedSectionColumns(
                pageSection,
                originalSection,
                changedColumnKeys as any
            );

            if (Object.keys(changedSectionColumns).length === 0) return;

            sectionCallbacks[identifier].push(async () => {
                await clHttp.patchJson(`/page-sections/${sectionId}`, JSON.stringify(changedSectionColumns));
            });
        });
    };

    const handlePayloadCallback = (
        sectionCallbacks: SectionCallbacks,
        identifier: Record<'id', string>,
        col: string,
        val: unknown
    ): RowTransformResult => {
        const originalPage = originalPages.find((page) => page.id === identifier.id)!;
        let value: unknown = val;

        if (col === 'published') {
            value = val === 'true' ? true : false;
        } else if (col === 'sections') {
            handleSectionCallbacks(originalPage, identifier.id, sectionCallbacks);

            return { success: false };
        }

        if (originalPage && value === originalPage[<keyof typeof originalPage>col]) return { success: false };

        return { value, success: true };
    };

    const handleCommitRows = (type: string, rows: HTMLTableRowElement[]) => {
        const sectionCallbacks: SectionCallbacks = {};
        const payloads =
            type !== 'remove'
                ? (rows.map((row) => [
                      row.id,
                      ...pagesTable.getPayloadFromRow(row, {}, handlePayloadCallback.bind(null, sectionCallbacks, row)),
                  ]) as [string, string, boolean][])
                : [];

        if (type === 'remove') {
            return rows.map((row) => clHttp.deleteEntity(`/pages/${row.id}`));
        }

        if (type === 'add') {
            return payloads.map(async ([id, payload]) => {
                const callbacks = sectionCallbacks[id] ?? [];

                const res = await clHttp.postJson('/pages', payload);

                if (!res?.ok) return null;

                const newId = await res.json();

                await Promise.all(callbacks.map((callback) => callback(newId)));

                return res;
            });
        }

        if (type === 'edit') {
            return payloads.map(async ([id, payload, didAdd]) => {
                const callbacks = sectionCallbacks[id] ?? [];

                if (didAdd) {
                    await clHttp.patchJson(`/pages/${id}`, payload);
                }

                await Promise.all(callbacks.map((callback) => callback(id)));

                return null;
            });
        }

        return [];
    };

    const commitChanges = async () => {
        await Promise.all([
            ...handleCommitRows('add', pagesTable.getNewRows()),
            ...handleCommitRows('edit', pagesTable.getEditedRows()),
            ...handleCommitRows('remove', pagesTable.getDeletedRows()),
        ]);

        return window.location.reload();
    };

    const resetChanges = () => {
        return window.location.reload();
    };

    const commitBtns = clElements.getConfirmButtons(commitChanges, resetChanges);
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
            sections: page.sections,
        });

        pages.push({ ...page, id });
    });

    window.clView.pages = (app) => {
        adminSectionContent.appendChild(addPageItem);
        adminSectionContent.appendChild(pagesTable.getRootNode());
        adminSection.appendChild(adminSectionContent);
        adminSection.appendChild(commitBtns.element);
        app.appendChild(adminSection);
    };

    window.dispatchEvent(new CustomEvent('core-view-initialized'));
})();
