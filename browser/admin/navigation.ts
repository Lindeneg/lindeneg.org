(() => {
    const DISABLED_BTN_CLASS = 'pure-button-disabled';
    const { app, ...core } = window.funkalleroAdminCore;

    const defaultState = () => ({
        original: null as NavigationWithItems | null,
        navigation: null as Editable<Navigation> | null,
        navigationItems: null as Editable<NavigationItem>[] | null,
        columnNames: null as string[] | null,
        updatingItemId: null as string | null,
        addingRow: false,
    });

    const state = defaultState();

    window.addEventListener('reset-state', () => {
        Object.assign(state, defaultState());
    });

    const handleNavItemClick = async (target: HTMLSpanElement) => {
        const id = target.dataset.itemId;
        const mode = target.innerText.toLowerCase();

        if (!id || !mode) return;

        if (mode === 'done') {
            state.updatingItemId = null;
            state.addingRow = false;
        } else if (mode === 'update') {
            state.updatingItemId = id;
        } else if (mode === 'delete') {
            const target = state.navigationItems?.find((e) => e.id === id)!;
            target._meta.edited = true;
            target._meta.deleted = true;
            state.updatingItemId = null;
            state.addingRow = false;
        }

        await setNavigationHtml();
    };

    const handleRowInput = async (target: HTMLInputElement) => {
        const name = target.name;
        let value = target.value as any;

        if (!name || !state.updatingItemId) return;

        const navItem = state.navigationItems?.find((e) => e.id === state.updatingItemId)!;
        const originalNavItem = state.original?.navItems?.find((e) => e.id === state.updatingItemId);

        if (name === 'alignment') {
            value = value.toUpperCase();
        } else if (name === 'newTab') {
            value = (target as HTMLInputElement).checked;
        }

        navItem[name as keyof typeof navItem] = value as never;
        navItem._meta.edited = !originalNavItem || value !== originalNavItem[name as keyof typeof originalNavItem];

        if (!navItem._meta.isNew) {
            if (!navItem._meta.changedProperties.includes(name)) {
                navItem._meta.changedProperties.push(name);
            } else if (!navItem._meta.edited) {
                navItem._meta.changedProperties = navItem._meta.changedProperties.filter((e) => e !== name);
            }
        }
    };

    const addNavRow = async () => {
        state.addingRow = !state.addingRow;
        state.updatingItemId = core.createTempId();

        state.navigationItems!.push(
            core.withMeta(
                {
                    id: state.updatingItemId,
                    navigationId: state.navigation!.id,
                    name: 'Some Name',
                    href: '/example',
                    position: 10,
                    alignment: 'LEFT',
                    newTab: false,
                },
                {
                    edited: true,
                    isNew: true,
                    changedProperties: ['name', 'href', 'position', 'alignment', 'newTab', 'navigationId'],
                }
            )
        );

        await setNavigationHtml();
    };

    const resetChanges = async () => {
        state.navigationItems = state.original!.navItems.map((item) => ({
            ...core.withMeta(item),
        }));
        state.navigation = {
            ...core.withMeta(state.original!),
        };

        await setNavigationHtml();
    };

    const setNavigationListeners = () => {
        const actionElements = document.querySelectorAll('.update-table-btn,.delete-table-btn');
        const editableRowElements = document.querySelectorAll('.editable-row');
        const addNavButton = document.getElementById('add-nav-btn') as HTMLButtonElement;
        const brandField = document.getElementById('brand-field') as HTMLInputElement;
        const commitBtn = document.getElementById('nav-commit-btn') as HTMLButtonElement;
        const resetBtn = document.getElementById('nav-reset-btn') as HTMLButtonElement;

        actionElements.forEach((element) => {
            element.addEventListener('click', ({ target }) => handleNavItemClick(target as any));
        });

        editableRowElements.forEach((element) => {
            element.addEventListener('input', ({ target }) => handleRowInput(target as any));
        });

        brandField.addEventListener('input', ({ target }) => {
            if (!state.navigation) return;

            state.navigation.brandName = (target as any).value;
            state.navigation._meta.edited = state.navigation.brandName !== state.original?.brandName;
            if (state.navigation._meta.edited && !state.navigation._meta.changedProperties.includes('brandName')) {
                state.navigation._meta.changedProperties.push('brandName');
            }

            updateConfirmButtonState();
        });

        addNavButton.addEventListener('click', addNavRow);
        commitBtn.addEventListener('click', commitChanges);
        resetBtn.addEventListener('click', resetChanges);
    };

    const getEditedNavItems = () => {
        const editedItems = state.navigationItems?.filter((e) => {
            const isNew = core.NEW_ENTRY_REGEX.test(e.id);

            if (e._meta.deleted && isNew) return false;

            return e._meta.edited || e._meta.deleted;
        });

        return editedItems || [];
    };

    const updateConfirmButtonState = () => {
        const commitBtn = document.getElementById('nav-commit-btn') as HTMLButtonElement;
        const resetBtn = document.getElementById('nav-reset-btn') as HTMLButtonElement;

        const hasEdited = state.navigation?._meta.edited || getEditedNavItems().length > 0;

        if (hasEdited && !state.updatingItemId && !state.addingRow) {
            commitBtn.classList.remove(DISABLED_BTN_CLASS);
            resetBtn.classList.remove(DISABLED_BTN_CLASS);
            return;
        }

        commitBtn.classList.add(DISABLED_BTN_CLASS);
        resetBtn.classList.add(DISABLED_BTN_CLASS);
    };

    const getEditableRowHtml = (row: NavigationItem, name: keyof NavigationItem): string => {
        const value = row[name];

        if (name === 'name' || name === 'href') {
            return `<input name='${name}' class='editable-row' value='${value}'></input>`;
        }

        if (name === 'position') {
            return `<input style='width:4rem;' name='${name}' class='editable-row' type='number' value='${value}'></input>`;
        }

        if (name === 'newTab') {
            return `<input name='${name}' class='editable-row' type='checkbox' ${value ? 'checked' : ''}></input>`;
        }

        if (name === 'alignment') {
            return `
<select name='${name}' class='editable-row'>
    <option value='left' ${value === 'LEFT' ? 'selected' : ''}>Left</option>
    <option value='right' ${value === 'RIGHT' ? 'selected' : ''}>Right</option>
</select>`;
        }

        return String(value);
    };

    const getNavigationHtml = () => {
        return `
<section class='admin-section'>
    <h1>Navigation</h1>

    <div class='admin-section-content'>
        <div class='admin-navigation-name'>
            <label style='margin-bottom:1rem;' for='brand-field'>Navigation Name</label>
            <input id='brand-field' type='text' placeholder='Navigation Name' value='${state.navigation?.brandName}' />
        </div>
        <div>

        <h1>Navigation Items</h1>
        <button 
            id='add-nav-btn' 
            style='margin-bottom:1rem;'
            class='pure-button pure-button-primary'
        >
            Add Navigation Item
        </button>

        ${core.getTableHtml(
            state.columnNames || [],
            core.withoutDeleted(state.navigationItems).sort((a, b) => a.position - b.position) || [],
            state.updatingItemId,
            true,
            getEditableRowHtml
        )}

        </div>

        <div class='pure-button-group admin-confirm-actions' role='group' aria-label='...'>
            <button id='nav-commit-btn' class='pure-button pure-button-disabled pure-button-primary'>Commit Changes</button>
            <button id='nav-reset-btn' class='pure-button pure-button-disabled button-error'>Reset Changes</button>
        </div>
    </div>
</section>`;
    };

    const setNavigationHtml = async () => {
        if (!state.navigation || !state.navigationItems || !state.columnNames) {
            const [navigation, navigationColumns] = await Promise.all([
                core.getJson<NavigationWithItems>('/navigation', undefined, () => {}),
                core.getJson<string[]>('/navigation-columns'),
            ]);

            if (navigation) {
                const { navItems, ...mainNavigation } = core.deepClone(navigation);

                state.original = navigation;
                state.navigationItems = navItems.map((item) => ({
                    ...core.withMeta(item),
                }));
                state.navigation = {
                    ...core.withMeta(mainNavigation),
                };
            } else {
                state.navigation = {
                    ...core.withMeta(
                        {
                            id: core.createTempId(),
                            brandName: '',
                        },
                        { isNew: true }
                    ),
                };
                state.navigationItems = [];
            }

            state.columnNames = navigationColumns ?? [];
        }

        app.innerHTML = getNavigationHtml();

        updateConfirmButtonState();
        setNavigationListeners();
    };

    const sendRequest = async (item: Editable<any>, name: '/navigation' | '/navigation-item') => {
        if (item._meta.isNew) {
            const response = await core.postJson(name, core.getCommitPayload(item));
            if (!response?.ok) return;
            item.id = await response?.json();
            state.navigationItems?.forEach((e) => (e.navigationId = item.id));
        } else if (item._meta.deleted) {
            await core.deleteJson(`${name}/${item.id}`);
        } else if (item._meta.edited) {
            await core.patchJson(`${name}/${item.id}`, core.getCommitPayload(item));
        }
        return Promise.resolve();
    };

    const commitChanges = async () => {
        if (!state.navigation || !state.navigationItems) return;

        if (state.navigation._meta.edited) {
            await sendRequest(state.navigation, '/navigation');
        }

        await Promise.all(getEditedNavItems().map(async (item) => sendRequest(item, '/navigation-item')));

        Object.assign(state, defaultState());

        await setNavigationHtml();
    };

    window.funkalleroCoreViews.navigation = setNavigationHtml;
})();
