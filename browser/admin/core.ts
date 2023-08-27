type AdminCore = (typeof window)['funkalleroAdminCore'];

(() => {
    const ACTIVE_NAV_CLASS = 'button-secondary';
    const INACTIVE_NAV_CLASS = 'pure-button-primary';

    const app = document.getElementById('app')!;
    const navEntries = Array.from(document.querySelectorAll('.nav-entry')) as HTMLButtonElement[];

    const getTableHtml: AdminCore['getTableHtml'] = (
        columns,
        rows,
        updatingId = null,
        withActions = false,
        editableColumnHtml = null
    ) => {
        if (withActions && !columns.includes('actions')) {
            columns.push('actions');
        }
        return `
<table class="pure-table pure-table-bordered">
    <thead>
        <tr>
        ${columns.map((name) => `<th>${name}</th>`).join('')}
        </tr>
    </thead>
    <tbody>
    ${rows
        .map(
            (row) =>
                `<tr data-item-id=${row.id} >${columns
                    .map((name) => {
                        const isUpdatingRow = updatingId === row.id;

                        if (name === 'actions') {
                            return `<td><span data-item-id=${row.id} class="update-table-btn" >${
                                isUpdatingRow ? 'Done' : 'Update'
                            }</span> | <span data-item-id=${
                                row.id
                            } class="delete-table-btn">Delete</span></td>`;
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
            const script = document.createElement('script');
            script.src = `/js/admin/${name}.js`;
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

        return Promise.all([setActiveNavButton(name), renderCoreView(name)]);
    };

    const setNavListeners = async () => {
        return Promise.all(navEntries.map((e) => e.addEventListener('click', handleNavClick)));
    };

    const initialize = async () => {
        await Promise.all([setNavListeners(), renderCoreView()]);
    };

    window.addEventListener('DOMContentLoaded', initialize);

    if (typeof window.funkalleroCoreViews === 'undefined') {
        window.funkalleroCoreViews = {};
    }

    window.funkalleroAdminCore = {
        ...window.funkalleroCore,
        getTableHtml,
        app,
    };
})();
