(() => {
    const DISABLED_BTN_CLASS = 'pure-button-disabled';
    const { app, ...core } = window.funkalleroAdminCore;

    const state = {
        pages: null as Editable<PageWithSections>[] | null,
        original: null as PageWithSections[] | null,
        editor: null as SimpleMDE | null,
        pageColumns: null as string[] | null,
        pageSectionColumns: null as string[] | null,
        editingEntry: null as Editable<PageWithSections> | null,
        editingEntrySection: null as Editable<PageSection> | null,
        isCreatingPage: false,
        isCreatingSection: false,
    };

    const getEditorTextArea = () => {
        if (!state.editingEntrySection && !state.isCreatingSection) return '';
        return `
<h3>Section Content</h3>
<small>Use fullscreen mode for better editing</small>
<textarea id='editor'>
</textarea>`;
    };

    const getEditorHtml = () => {
        if (!state.editingEntry) return '';

        return `<div class='mdeContainer'>
<h1>Page Sections</h1>
<button 
    id='add-page-section-btn' 
    style='margin-bottom:1rem;'
    class='pure-button pure-button-primary'
>
    Add Page Section
</button>
${getSectionsTable()}
${getEditorTextArea()}
</div>`;
    };

    const initializeEditor = async () => {
        if ((state.editingEntrySection || state.isCreatingSection) && !state.editor) {
            state.editor = new SimpleMDE({
                element: document.getElementById('editor')!,
                initialValue: state.editingEntrySection?.content ?? '',
            });
        }
    };

    const handleRowInput = async (target: HTMLInputElement) => {
        const name = target.name;
        const isPage = target.classList.contains('editable-page-row');
        let value = target.value as any;

        if (!name) return;

        const mutatedTarget = isPage ? state.editingEntry! : state.editingEntrySection!;
        let originalTarget: any;

        if (name === 'published') {
            value = target.checked;
        }

        if (isPage) {
            originalTarget = state.original?.find((e) => e.id === state.editingEntry?.id);
        } else {
            let isDone = false;
            for (const page of state.original!) {
                for (const section of page.sections) {
                    if (section.id === state.editingEntrySection?.id) {
                        originalTarget = section;
                        isDone = true;
                        break;
                    }
                }
                if (isDone) break;
            }
        }

        mutatedTarget[name as keyof typeof mutatedTarget] = value as never;
        mutatedTarget._meta.edited = !originalTarget || value !== originalTarget[name as keyof typeof originalTarget];

        if (mutatedTarget._meta.edited && !mutatedTarget._meta.changedProperties.includes(name)) {
            mutatedTarget._meta.changedProperties.push(name);
        } else {
            mutatedTarget._meta.changedProperties = mutatedTarget._meta.changedProperties.filter((e) => e !== name);
        }
    };

    const getEditablePageRowHtml = (row: Page, name: keyof Page): string => {
        const value = row[name];

        if (name === 'name' || name === 'slug' || name === 'description' || name === 'title') {
            return `<input name='${name}' class='editable-page-row' value='${value}'></input>`;
        }

        if (name === 'published') {
            return `<input name='${name}' class='editable-page-row' type='checkbox' ${value ? 'checked' : ''}></input>`;
        }

        return String(value);
    };

    const getEditableSectionRowHtml = (row: PageSection, name: keyof PageSection): string => {
        const value = row[name];

        if (name === 'position') {
            return `<input style='width:4rem;' name='${name}' class='editable-section-row' type='number' value='${value}'></input>`;
        }

        if (name === 'published') {
            return `<input name='${name}' class='editable-section-row' type='checkbox' ${
                value ? 'checked' : ''
            }></input>`;
        }

        return String(value);
    };

    const getPagesTable = () => {
        return core.getTableHtml(
            state.pageColumns!,
            core.withoutDeleted(state.pages),
            state.editingEntry?.id ?? null,
            true,
            getEditablePageRowHtml,
            'pages'
        );
    };

    const getSectionsTable = () => {
        if (!state.editingEntry?.sections?.length) return '';

        return core.getTableHtml(
            state.pageSectionColumns!.filter((e) => e !== 'content'),
            core.withoutDeleted(state.editingEntry.sections),
            state.editingEntrySection?.id ?? null,
            true,
            getEditableSectionRowHtml,
            'sections'
        );
    };

    const getPagesHtml = async () => {
        return `
<section class='admin-section'>
    <div class='admin-section-content'>
        <h1>Pages</h1>
        <button 
            id='add-page-btn' 
            style='margin-bottom:1rem;'
            class='pure-button pure-button-primary'
        >
            Add Page
        </button>
        ${getPagesTable()}
        ${getEditorHtml()}
    </div>
</div>
    
</section>
 `;
    };

    const handleRowClick = async (target: HTMLSpanElement) => {
        const id = target.dataset.itemId;
        const context = target.dataset.itemContext;
        const mode = target.innerText.toLowerCase();

        if (!id || !mode || !context) return;

        if (mode === 'update') {
            if (context === 'pages') {
                state.editingEntrySection = null;
                state.isCreatingSection = false;
                state.editor = null;
                state.editingEntry = state.pages?.find((e) => e.id === id)!;
            } else if (context === 'sections') {
                state.editor = null;
                state.editingEntrySection = state.editingEntry?.sections?.find((e) => e.id === id)! as any;
            }
        } else if (mode === 'delete') {
            const target =
                context === 'pages'
                    ? state.pages?.find((e) => e.id === id)!
                    : (state.editingEntry?.sections?.find((e) => e.id === id)! as any);

            target._meta.edited = true;
            target._meta.deleted = true;
        }

        if (mode === 'done' || mode === 'delete') {
            if (mode === 'done' && state.editor) {
                const value = state.editor.value();
                await handleRowInput({ name: 'content', classList: { contains: () => false }, value } as any);
            }

            if (context === 'sections') {
                state.editingEntrySection = null;
                state.isCreatingSection = false;
                state.editor = null;
            } else {
                state.editingEntry = null;
                state.isCreatingPage = false;
                state.editingEntrySection = null;
                state.isCreatingSection = false;
                state.editor = null;
            }
        }

        await setPagesHtml();
    };

    const addPageRow = async () => {
        state.isCreatingPage = true;

        const entry = core.withMeta(
            {
                id: core.createTempId(),
                name: 'page name',
                slug: '/page-slug',
                title: 'Page Title',
                description: 'Page description',
                published: false,
                sections: [],
            },
            { edited: true }
        ) as unknown as Editable<PageWithSections>;

        state.pages!.push(entry);

        state.editingEntry = entry;
        state.isCreatingPage = true;
        state.editingEntrySection = null;
        state.editor = null;
        state.isCreatingSection = false;

        await setPagesHtml();
    };

    const addPageSectionRow = async () => {
        if (!state.editingEntry) return;

        const entry = core.withMeta(
            {
                id: core.createTempId(),
                content: 'Section Content',
                position: 0,
                published: false,
                pageId: state.editingEntry.id,
            },
            { edited: true }
        ) as unknown as Editable<PageSection>;

        state.editingEntry.sections.push(entry);

        state.editingEntrySection = entry;
        state.isCreatingSection = true;
        state.editor = null;

        await setPagesHtml();
    };

    const setPagesListeners = () => {
        const actionElements = document.querySelectorAll('.update-table-btn,.delete-table-btn');
        const addPageBtn = document.getElementById('add-page-btn');
        const addPageSectionBtn = document.getElementById('add-page-section-btn');
        const editableRowElements = document.querySelectorAll('.editable-page-row,.editable-section-row');

        addPageBtn?.addEventListener('click', addPageRow);
        addPageSectionBtn?.addEventListener('click', addPageSectionRow);

        editableRowElements.forEach((element) => {
            element.addEventListener('input', ({ target }) => handleRowInput(target as any));
        });

        actionElements.forEach((element) => {
            element.addEventListener('click', ({ target }) => handleRowClick(target as any));
        });
    };

    const setPagesHtml = async () => {
        if (!state.pages || !state.pageColumns || !state.pageSectionColumns) {
            const [pages, pageColumns, pageSectionColumns] = await Promise.all([
                core.getJson<PageWithSections[]>('/pages'),
                core.getJson<string[]>('/pages-columns'),
                core.getJson<string[]>('/pages-section-columns'),
            ]);

            if (!pages || !pageColumns || !pageSectionColumns) return;

            state.original = pages;
            state.pages = pages.map((page) => ({
                ...core.withMeta(page),
                sections: page.sections.map((section) => ({
                    ...core.withMeta(section),
                })),
            }));
            state.pageColumns = pageColumns;
            state.pageSectionColumns = pageSectionColumns;
        }

        app.innerHTML = await getPagesHtml();

        await initializeEditor();
        //updateConfirmButtonState();
        setPagesListeners();
    };

    window.funkalleroCoreViews.pages = setPagesHtml;
})();