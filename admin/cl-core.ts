(async () => {
    if (!window.clView) {
        window.clView = {};
    }

    const { clHttp } = window;
    const app = document.getElementById('app')!;
    const navEntries = Array.from(document.querySelectorAll('.nav-entry')) as HTMLButtonElement[];
    const ACTIVE_NAV_CLASS = 'pure-button-secondary';
    const INACTIVE_NAV_CLASS = 'pure-button-primary';
    const NEW_ENTRY_REGEX = /NEW_ROW_TEMP_ID-/;

    const handleFileUpload = (target: HTMLInputElement, callback: (fr: FileReader) => void) => {
        const fileReader: FileReader = new FileReader();

        fileReader.onload = () => {
            callback(fileReader);
        };

        fileReader.readAsDataURL(target.files![0]);
    };

    const getChangedSectionColumns = <T>(mutated: T, original: T, keys: Array<keyof T>) => {
        return keys.reduce(
            (acc, key) => {
                if (!original || mutated[key] !== original[key]) {
                    acc[key] = mutated[key];
                }

                return acc;
            },
            {} as Record<keyof T, unknown>
        );
    };

    const setDataSectionsAttribute = (el?: HTMLElement | null, ...elements: string[]) => {
        const currentSections = getDataSectionsAttribute(el);

        elements.forEach((e) => {
            if (currentSections.includes(e)) return;

            currentSections.push(e);
        });

        el?.setAttribute('data-sections', currentSections.join(','));
    };

    const getDataSectionsAttribute = (el?: HTMLElement | null) => {
        return (
            el
                ?.getAttribute('data-sections')
                ?.split(',')
                .filter((e) => !!e) ?? []
        );
    };

    window.clCore = {
        NEW_ENTRY_REGEX,
        handleFileUpload,
        getChangedSectionColumns,
        setDataSectionsAttribute,
        getDataSectionsAttribute,
    };

    const loadCurrentViewScript = (name: string) => {
        return new Promise((resolve, reject) => {
            const newSource = `/js/pages/${name}.js`;
            const existingScript = Array.from(document.querySelectorAll('#main-admin-script')) as HTMLScriptElement[];

            for (const script of existingScript) {
                script.remove();
            }

            const script = document.createElement('script');
            script.src = newSource;
            script.id = 'main-admin-script';
            script.onload = ((done) => {
                window.addEventListener('core-view-initialized', () => {
                    done(name);
                });
                return null;
            })(resolve);

            script.onerror = reject;
            document.head.appendChild(script);
        });
    };

    const renderCoreView = async (view?: string) => {
        app.innerHTML = '';

        const actualView = view ?? (await getActiveNavButtonName());

        await loadCurrentViewScript(actualView + '-page');

        const setHtml = window.clView[actualView];

        if (typeof setHtml !== 'function') return;

        await setHtml(app);
    };

    const handleNavClick = async (event: Event) => {
        const target = event.target as HTMLButtonElement;
        const name = target.innerText.toLowerCase();

        if (name === 'logout') {
            return window.clHttp.sendRequest('/logout', 'GET', undefined, null, () => {
                window.location.href = '/';
            });
        }

        if (name === 'clear cache') {
            return window.clHttp.sendRequest('/bust-cache', 'POST');
        }

        clHttp.clearError();

        await setActiveNavButton(name, true);
        await renderCoreView(name);
    };

    const setActiveNavButton = async (active: string, setParams = false) => {
        return Promise.all(
            navEntries.map((e) => {
                if (e.innerText.toLowerCase() === active) {
                    e.classList.replace(INACTIVE_NAV_CLASS, ACTIVE_NAV_CLASS);
                    if (setParams) {
                        const url = new URL(window.location.href);
                        url.searchParams.set('view', active);
                        window.history.replaceState(null, '', url);
                    }
                } else {
                    e.classList.replace(ACTIVE_NAV_CLASS, INACTIVE_NAV_CLASS);
                }
            })
        );
    };

    const getActiveNavButtonName = async () => {
        const url = new URL(window.location.href);
        const active = url.searchParams.get('view')?.toLowerCase();

        if (active) {
            await setActiveNavButton(active);
            return active;
        }

        for (const entry of navEntries) {
            if (entry.classList.contains(ACTIVE_NAV_CLASS)) {
                return entry.innerText.toLowerCase();
            }
        }

        return '';
    };

    const setNavListeners = async () => {
        return Promise.all(navEntries.map((e) => e.addEventListener('click', handleNavClick)));
    };

    const initialize = async () => {
        await Promise.all([setNavListeners(), renderCoreView()]);
    };

    await initialize();
})();
