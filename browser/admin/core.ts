type AdminCore = (typeof window)['funkalleroAdminCore'];

(() => {
    const ACTIVE_NAV_CLASS = 'button-secondary';
    const INACTIVE_NAV_CLASS = 'pure-button-primary';
    const NEW_ENTRY_REGEX = /NEW_ROW_TEMP_ID-/;

    const app = document.getElementById('app')!;
    const navEntries = Array.from(document.querySelectorAll('.nav-entry')) as HTMLButtonElement[];

    const createTempId = () => {
        return 'NEW_ROW_TEMP_ID-' + Date.now() + '-' + Math.floor(Math.random() * 100000);
    };

    const getColumns = (rows: any[], exclude = ['id', 'navigationId', 'createdAt', 'updatedAt']): string[] => {
        if (rows.length > 0) {
            return Object.keys(rows[0]).filter((name) => !exclude.includes(name));
        }

        return [];
    };

    const getTableHtml: AdminCore['getTableHtml'] = (
        columns,
        rows,
        updatingId = null,
        withActions = false,
        editableColumnHtml = null,
        context = null
    ) => {
        if (withActions && !columns.includes('actions')) {
            columns.push('actions');
        }
        return `
<table class='pure-table pure-table-bordered'>
    <thead>
        <tr>
        ${columns.map((name) => `<th>${name}</th>`).join('')}
        </tr>
    </thead>
    <tbody>
    ${rows
        .map(
            (row) =>
                `<tr data-item-id='${row.id}' >${columns
                    .map((name) => {
                        const isUpdatingRow = updatingId === row.id;
                        const contextAttr = context ? "data-item-context='" + context + "'" : '';

                        if (name === 'actions') {
                            return `<td><span ${
                                isUpdatingRow ? 'style="color:blue;"' : ''
                            } ${contextAttr} data-item-id='${row.id}' class='update-table-btn' >${
                                isUpdatingRow ? 'Done' : 'Update'
                            }</span> | <span ${contextAttr} data-item-id='${
                                row.id
                            }' class='delete-table-btn'>Delete</span></td>`;
                        }

                        if (name === 'sections') {
                            return `<td>${withoutDeleted(row.sections)?.length || 0}</td>`;
                        }

                        if (isUpdatingRow && editableColumnHtml) {
                            return `<td>${editableColumnHtml(row, name)}</td>`;
                        }

                        return `<td>${row[<keyof typeof row>name]}</td>`;
                    })
                    .join('')}</tr>`
        )
        .join('')}
    </tbody>
</table>`;
    };

    const loadScript = (name: string) => {
        return new Promise((resolve, reject) => {
            const newSource = `/js/admin/${name}.js`;
            const existingScript = Array.from(document.querySelectorAll('#main-admin-script')) as HTMLScriptElement[];

            for (const script of existingScript) {
                if (script.src.includes(newSource)) return resolve({});
            }

            const script = document.createElement('script');
            script.src = newSource;
            script.id = 'main-admin-script';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    };

    const renderCoreView = async (view?: string) => {
        if (!view) {
            view = getActiveNavButtonName();
        }

        await loadScript(view);

        const setHtml = window.funkalleroCoreViews[view];

        if (typeof setHtml !== 'function') return;

        await setHtml();
    };

    const setActiveNavButton = async (active: string) => {
        return Promise.all(
            navEntries.map((e) => {
                if (e.innerText.toLowerCase() === active) {
                    e.classList.replace(INACTIVE_NAV_CLASS, ACTIVE_NAV_CLASS);
                } else {
                    e.classList.replace(ACTIVE_NAV_CLASS, INACTIVE_NAV_CLASS);
                }
            })
        );
    };

    const getActiveNavButtonName = () => {
        for (const entry of navEntries) {
            if (entry.classList.contains(ACTIVE_NAV_CLASS)) return entry.innerText.toLowerCase();
        }
        return '';
    };

    const handleNavClick = async (event: Event) => {
        const target = event.target as HTMLButtonElement;
        const name = target.innerText.toLowerCase();

        if (name === 'logout') {
            return window.funkalleroCore.sendRequest('/logout', 'GET', undefined, null, () => {
                window.location.href = '/';
            });
        }

        if (name === 'clear cache') {
            target.classList.add('pure-button-disabled');
            target.innerText = 'Clearing...';

            await window.funkalleroCore.sendRequest('/bust-cache', 'POST');

            setTimeout(() => {
                target.innerText = 'Clear Cache';
                target.classList.remove('pure-button-disabled');
            }, 2000);

            return;
        }

        window.dispatchEvent(new CustomEvent('reset-state'));

        await setActiveNavButton(name);
        await renderCoreView(name);
    };

    const setNavListeners = async () => {
        return Promise.all(navEntries.map((e) => e.addEventListener('click', handleNavClick)));
    };

    const initialize = async () => {
        await Promise.all([setNavListeners(), renderCoreView()]);
    };

    const withMeta: FunkalleroAdminCore['withMeta'] = (obj, overrides) => {
        return {
            ...obj,
            _meta: {
                edited: false,
                deleted: false,
                isNew: false,
                changedProperties: [],
                ...overrides,
            },
        };
    };

    const withoutDeleted = <T extends Editable<any>[]>(rows?: T | null) => {
        return (rows || []).filter((row) => !row._meta.deleted) as T;
    };

    window.addEventListener('DOMContentLoaded', initialize);

    if (typeof window.funkalleroCoreViews === 'undefined') {
        window.funkalleroCoreViews = {};
    }

    window.funkalleroAdminCore = {
        ...window.funkalleroCore,
        deepClone: (obj) => JSON.parse(JSON.stringify(obj)),
        withoutDeleted,
        getTableHtml,
        createTempId,
        getColumns,
        withMeta,
        app,
        NEW_ENTRY_REGEX,
    };
})();
