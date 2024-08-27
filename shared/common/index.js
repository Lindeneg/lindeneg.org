(() => {
    ////////////////////////////
    ////////////////////////////
    //////// CL COMMON /////////
    ////////////////////////////
    ////////////////////////////

    if (!window.clCommon) {
        window.clCommon = {};
    }

    /** @template T
     * @param {T | T[]} val
     * @returns {T[]} */
    const ensureArray = (val) => {
        if (Array.isArray(val)) return val;
        return [val];
    };
    window.clCommon.ensureArray = ensureArray;

    /** @param {HTMLElement} el */
    const disableEl = (...el) => {
        el.forEach((e) => {
            e.setAttribute('disabled', 'true');
        });
    };
    window.clCommon.disableEl = disableEl;

    /** @param {HTMLElement} el */
    const enableEl = (...el) => {
        el.forEach((e) => {
            e.removeAttribute('disabled');
        });
    };
    window.clCommon.enableEl = enableEl;

    /** @param {HTMLButtonElement} btns */
    const disableBtn = (...btns) => {
        btns.forEach((btn) => {
            disableEl(btn);
            btn.classList.add('pure-button-disabled');
        });
    };
    window.clCommon.disableBtn = disableBtn;

    /** @param {HTMLButtonElement} btns */
    const enableBtn = (...btns) => {
        btns.forEach((btn) => {
            enableEl(btn);
            btn.classList.remove('pure-button-disabled');
        });
    };
    window.clCommon.enableBtn = enableBtn;

    /** @param {HTMLElement} el */
    const hideEl = (...el) => {
        el.forEach((e) => {
            e.classList.add('hidden');
        });
    };
    window.clCommon.hideEl = hideEl;

    /** @param {HTMLElement} el */
    const showEl = (...el) => {
        el.forEach((e) => {
            e.classList.remove('hidden');
        });
    };
    window.clCommon.showEl = showEl;

    /**
     * @param {any} condition
     * @param {HTMLElement} el */
    const showElIf = (condition, ...el) => {
        if (!!condition) return showEl(...el);
        hideEl(...el);
    };
    window.clCommon.showElIf = showElIf;

    /**
     * @param {any} condition
     * @param {HTMLButtonElement} el */
    const enableElIf = (condition, ...btns) => {
        if (!!condition) return enableBtn(...btns);
        disableBtn(...btns);
    };
    window.clCommon.enableElIf = enableElIf;

    /** @param {HTMLButtonElement[]} btns */
    const tempDisable = (...btns) => {
        /** @type {Map<HTMLButtonElement, boolean>} */
        const enabledMap = new Map();
        btns.forEach((btn) => {
            enabledMap.set(btn, !btn.hasAttribute('disabled') && !btn.classList.contains('pure-button-disabled'));
            disableEl(btn);
        });
        return {
            revert: () => {
                for (const [btn, enabled] of enabledMap.entries()) {
                    enableElIf(enabled, btn);
                }
            },
        };
    };
    window.clCommon.tempDisable = tempDisable;

    /**
     * @param {number} id
     * @param {Record<string, any>[]} obj
     * @returns {string} */
    const getNameFromId = (id, obj) => {
        const found = obj.find((e) => e.id === id);
        if (found) return found.name;
        return '';
    };
    window.clCommon.getNameFromId = getNameFromId;

    /** @param {HTMLElement | HTMLElement[]} visible
     *  @param {HTMLElement | HTMLElement[]} hidden */
    const switchVisible = (visible, hidden) => {
        showEl(...ensureArray(visible));
        hideEl(...ensureArray(hidden));
    };
    window.clCommon.switchVisible = switchVisible;

    /**
     * @param {string} str
     * @returns {number | null} */
    const strToIntId = (str) => {
        const match = str.match(/^.+-(\d+)/);
        if (match && match[1]) return Number(match[1]);
        return null;
    };
    window.clCommon.strToIntId = strToIntId;

    /**
     * @param {string} str
     * @returns {{id: number, name: string} | null} */
    const strToUser = (str) => {
        const match = str.match(/^.+-(.+)-(\d)/);
        if (match[1] && match[2]) {
            return {
                name: match[1],
                id: Number(match[2]),
            };
        }
        return null;
    };
    window.clCommon.strToUser = strToUser;

    /**
     * @param {string} started
     * @param {string} ended
     * @returns {string} */
    const durationInMins = (started, ended) => {
        if (!started || !ended) return '-';
        return `${Math.ceil((new Date(ended) - new Date(started)) / 1000 / 60)} mins`;
    };
    window.clCommon.durationInMins = durationInMins;

    ////////////////////////////
    ////////////////////////////
    //////// CL ELEMENT ////////
    ////////////////////////////
    ////////////////////////////

    if (!window.clEl) {
        window.clEl = {};
    }
    /**
     * @template {HTMLElement} T
     * @param {T} parent
     * @param {HTMLElement[]} [children = []]
     * @returns T
     * */
    const append = (parent, ...children) => {
        children.forEach((child) => {
            if (!child) return;
            parent.appendChild(child);
        });
        return parent;
    };
    window.clEl.append = append;

    /**
     * @param {string} element
     * @param {Record<string, unknown>} [props = {}]
     * @param {string[] | string} [classes = []]
     * @returns {HTMLElement} */
    const any = (element, props = {}, classes = []) => {
        const el = document.createElement(element);
        Object.entries(props).forEach(([key, value]) => {
            el[key] = value;
        });
        if (classes.length > 0) {
            if (typeof classes === 'string') {
                el.classList.add(classes);
            } else {
                el.classList.add(...classes);
            }
        }
        return el;
    };
    window.clEl.any = any;

    /**
     * @param {Record<string, unknown>} [props = {}]
     * @param {string[] | string} [classes = []]
     * @returns {HTMLDivElement} */
    const div = (props = {}, classes = []) => {
        return any('div', props, classes);
    };
    window.clEl.div = div;

    /**
     * @param {HTMLElement} el
     * @param {EventListener | null} [onClick = null]
     * @param {string} [event = "click"]
     * @returns {HTMLElement} */
    const withListener = (el, onClick, event = 'click') => {
        if (!el || typeof onClick !== 'function') return el;
        el.addEventListener(event, onClick);
        return el;
    };
    window.clEl.withListener = withListener;

    /**
     * @param {Record<string, unknown>} [props = {}]
     * @param {string[] | string} [classes = []]
     * @param {EventListener | null} [onClick = null]
     * @param {string} [as = "button"]
     * @returns {HTMLButtonElement} */
    const button = (props = {}, classes = [], onClick = null, as = 'button') => {
        const btn = any(as, { type: 'button', ...props }, ['pure-button', ...ensureArray(classes)]);
        return withListener(btn, onClick);
    };
    window.clEl.button = button;

    /**
     * @param {Record<string, unknown>} [props = {}]
     * @param {string[] | string} [classes = []]
     * @param {EventListener | null} [onChange = null]
     * @returns {HTMLInputElement} */
    const input = (props = {}, classes = [], onChange = null) => {
        const inp = any('input', props, ['pure-input', ...ensureArray(classes)]);
        return withListener(inp, onChange, 'change');
    };
    window.clEl.input = input;

    /**
     * @param {EventListener} onChange
     * @param {HTMLOptionElement[]} [options = []]
     * @param {Record<string, unknown>} [props = {}]
     * @param {string[] | string} [classes = []]
     * @returns {HTMLSelectElement} */
    const select = (onChange, options = [], props = {}, classes = []) => {
        /** @type {HTMLSelectElement} */
        const sel = withListener(any('select', props, ['pure-select', ...ensureArray(classes)]), onChange, 'change');
        options.forEach((option) => {
            sel.options.add(option);
        });
        return sel;
    };
    window.clEl.select = select;

    /**
     * @param {unknown} value
     * @param {string} displayName
     * @param {Record<string, unknown>} [props = {}]
     * @param {string[] | string} [classes = []]
     * @returns {HTMLOptionElement} */
    const option = (value, displayName, props = {}, classes = []) => {
        const opt = any('option', props, classes);
        opt.value = value;
        opt.innerText = displayName;
        return opt;
    };
    window.clEl.option = option;

    /**
     * @param {Record<string, unknown>} [props = {}]
     * @param {string[] | string} [classes = []]
     * @returns {HTMLOptionElement} */
    const hr = (props = {}, classes = []) => {
        return any('hr', props, classes);
    };
    window.clEl.hr = hr;

    ////////////////////////////
    ////////////////////////////
    ////////// CL HTTP /////////
    ////////////////////////////
    ////////////////////////////

    if (!window.clHttp) {
        window.clHttp = {};
    }

    const unknownError = new Error('Unknown Error');
    window.clHttp.unknownError = unknownError;

    const errorEl = () => document.getElementById('error-div');
    const spinnerEl = () => document.getElementById('spinner');

    /** @typedef {Record<string, unknown> | null} Data */

    /**
     * @param {Response} response
     * @returns {Promise<Data>} */
    const getData = async (response) => {
        try {
            return await response.json();
        } catch (_) {}
        return null;
    };

    /**
     * @param {string} message
     * @param {string | string[]} [error = []] */
    const setError = (message, error = []) => {
        setErrorEx(errorEl(), message, error);
    };
    window.clHttp.setError = setError;

    /**
     * @param {HTMLElement} el
     * @param {HttpError} err
     * @param {number} [timeout = 10] */
    const setErrorTimeout = (el, err, timeout = 10) => {
        setErrorEx(el, err.message, err.error);
        if (timeout > 0) {
            setTimeout(() => clearErrorEx(el), timeout * 1000);
        }
    };
    window.clHttp.setErrorTimeout = setErrorTimeout;

    /**
     * @param {HTMLElement} el
     * @param {string} message
     * @param {string | string[]} [error = []] */
    const setErrorEx = (el, message, error = []) => {
        if (!el) return;
        showEl(el);
        if (!Array.isArray(error)) {
            error = [error];
        }
        error.unshift(message);
        append(el, ...error.map((err) => any('p', { innerText: err }, ['request-error-message'])));
    };
    window.clHttp.setErrorEx = setErrorEx;

    const clearError = () => {
        clearErrorEx(errorEl());
    };
    window.clHttp.clearError = clearError;

    /** @param {HTMLElement} el */
    const clearErrorEx = (el) => {
        if (!el) return;
        el.innerHTML = '';
        hideEl(el);
    };
    window.clHttp.clearErrorEx = clearErrorEx;

    /** @typedef {{message: string, error?: string | string[]}} HttpError */

    /**
     * @param {string} path
     * @param {string} method
     * @param {RequestInit["headers"] | null} [headers = null]
     * @param {RequestInit["body"] | null} [body = null]
     * @param {number} [errorTimeout = 10]
     * @param {HTMLElement} errDiv
     * @returns {Promise<{response: Response, err: HttpError | null}>}
     * */
    const sendRequest = async (path, method, headers = null, body = null, errorTimeout = 10, errDiv = errorEl()) => {
        showEl(spinnerEl());
        const opts = { method };
        if (method !== 'GET' && body) {
            opts.body = JSON.stringify(body);
        }
        if (headers) {
            opts.headers = headers;
        }
        const response = await fetch('/api' + path, opts);
        if (response.ok) {
            hideEl(spinnerEl());
            return { response, err: null };
        }
        let err = unknownError;
        try {
            err = await response.json();
        } catch (_) {}
        if (errorTimeout > 0) {
            setErrorTimeout(errDiv, err, errorTimeout);
        }
        hideEl(spinnerEl());
        return { response: null, err };
    };
    window.clHttp.sendRequest = sendRequest;

    /**
     * @param {string} path
     * @param {number} [errorTimeout = 10]
     * @param {HTMLElement} errDiv
     * @returns {Promise<{data: Data, response: Response, err: HttpError | null}>}
     * */
    const getJson = async (path, errorTimeout = 10, errDiv = errorEl()) => {
        const result = await sendRequest(path, 'GET', null, null, errorTimeout, errDiv);
        if (result.err || !result.response.ok) return result;
        return { ...result, data: await getData(result.response) };
    };
    window.clHttp.getJson = getJson;

    /**
     * @param {string} path
     * @param {any} body
     * @param {number} [errorTimeout = 10]
     * @param {HTMLElement} errDiv
     * @returns {Promise<{data: Data, response: Response, err: HttpError | null}>}
     * */
    const postJson = async (path, body, errorTimeout = 10, errDiv = errorEl()) => {
        const result = await sendRequest(
            path,
            'POST',
            { 'Content-Type': 'application/json' },
            body,
            errorTimeout,
            errDiv
        );
        if (result.err || !result.response.ok) return result;
        return { ...result, data: await getData(result.response) };
    };
    window.clHttp.postJson = postJson;

    /**
     * @param {string} path
     * @param {number} [errorTimeout = 10]
     * @param {HTMLElement} errDiv
     * @returns {Promise<{data: Data, response: Response, err: HttpError | null}>}
     * */
    const deleteReq = async (path, errorTimeout = 10, errDiv = errorEl()) => {
        const result = await sendRequest(path, 'DELETE', null, null, errorTimeout, errDiv);
        if (result.err || !result.response.ok) return result;
        return { ...result, data: await getData(result.response) };
    };
    window.clHttp.delete = deleteReq;

    ////////////////////////////
    ////////////////////////////
    ////////// CL MODAL ////////
    ////////////////////////////
    ////////////////////////////

    if (!window.clModal) {
        window.clModal = {};
    }

    /** @typedef {Object} ModalConfig
     * @property {string} wrapperId
     * @property {string} backdropId
     * @property {boolean} withKeyListener */

    /** @param {ModalConfig} cfg */
    const initializeModal = ({ wrapperId, backdropId, withKeyListener }) => {
        /**
         * @typedef {Object} ModalQueueItem
         * @property {string} confirmName
         * @property {string} cancelName
         * @property {boolean} noConfirm
         * @property {(() => void) | undefined} cleanup
         * @property {string | HTMLElement} contents
         * @property {() => Promise<boolean>} onConfirm
         * @property {() => void} onCancel
         */

        const modalBackdrop = document.getElementById(wrapperId ?? 'modal-backdrop');
        const modalWrapper = document.getElementById(backdropId ?? 'modal-wrapper');
        /** @type {ModalQueueItem[]} */
        const modalQueue = [];
        /** @type {ModalQueueItem | null} */
        let modalItem = null;
        /** @type {(() => void) | null} */
        let modalCleanup = null;
        let isModalVisible = false;

        /** @param {boolean} visible */
        const setModalVisible = (visible) => {
            if (visible && modalItem) {
                isModalVisible = true;
                showEl(modalBackdrop, modalWrapper);
                renderModalItem();
            } else {
                isModalVisible = false;
                hideEl(modalBackdrop, modalWrapper);
                if (typeof modalCleanup === 'function') {
                    modalCleanup();
                    modalCleanup = null;
                }
                modalItem = null;
                if (modalQueue.length > 0) {
                    popModalQueue();
                }
            }
        };

        const renderModalItem = () => {
            if (!modalItem) return;
            const modal = div({}, 'modal');
            if (modalItem.contents instanceof HTMLElement) {
                modal.appendChild(modalItem.contents);
            } else {
                modal.innerHTML = modalItem.contents;
            }
            modal.appendChild(hr());

            const actions = div(
                {
                    ...(modalItem.noConfirm ? { style: 'padding:1rem;' } : {}),
                },
                modalItem.noConfirm ? '' : 'modal-actions'
            );

            let confirmButton = null;
            if (!modalItem.noConfirm) {
                confirmButton = button(
                    { innerText: modalItem.confirmName || 'Confirm' },
                    'primary',
                    modalItem.onConfirm
                );
                actions.appendChild(confirmButton);
            }

            const cancelButton = button(
                {
                    innerText: modalItem.cancelName || 'Cancel',
                    ...(modalItem.noConfirm ? { style: 'width:100%;' } : {}),
                },
                'secondary',
                modalItem.onCancel
            );

            actions.appendChild(cancelButton);
            modal.appendChild(actions);
            modalWrapper.appendChild(modal);

            const rect = modal.getBoundingClientRect();
            modalWrapper.setAttribute('style', `top: calc(50% - (${rect.height}px / 2));left: 50%;`);

            modalCleanup = () => {
                modalItem.cleanup();
                modalWrapper.style = 'top:50%; left:50%;';
                confirmButton?.removeEventListener('click', modalItem.onConfirm);
                cancelButton.removeEventListener('click', modalItem.onCancel);
                modal.remove();
            };
        };

        const popModalQueue = () => {
            if (isModalVisible || modalItem) return;
            const newItem = modalQueue.shift();
            if (!newItem) return;
            modalItem = newItem;
            setModalVisible(true);
        };

        modalBackdrop.addEventListener('click', () => {
            if (!isModalVisible || !modalItem?.onCancel) return;
            modalItem.onCancel();
        });

        if (withKeyListener) {
            document.addEventListener('keyup', ({ key }) => {
                if (!modalItem) return;
                switch (key) {
                    case 'Enter':
                        modalItem.onConfirm();
                        break;
                    case 'Escape':
                        modalItem.onCancel();
                        break;
                }
            });
        }
        return {
            visible: () => isModalVisible,
            /** @param {ModalQueueItem} item */
            addItem: (item) => {
                modalQueue.push({
                    ...item,
                    onConfirm: async () => {
                        let show = false;
                        if (typeof item.onConfirm === 'function') {
                            show = await item.onConfirm();
                        }
                        if (!show) setModalVisible(show);
                        return show;
                    },
                    onCancel: () => {
                        if (typeof item.onCancel === 'function') {
                            item.onCancel();
                        }
                        setModalVisible(false);
                    },
                    cleanup: () => {
                        if (typeof item.cleanup === 'function') {
                            item.cleanup();
                        }
                    },
                });
                popModalQueue();
            },
        };
    };
    window.clModal.initialize = initializeModal;

    ////////////////////////////
    ////////////////////////////
    ////////// CL TABLE ////////
    ////////////////////////////
    ////////////////////////////

    if (!window.clTable) {
        window.clTable = {};
    }

    /** @typedef {Object} Row
     * @property {HTMLTableRowElement} el
     * @property {(name: string) => HTMLTableCellElement | null} col
     * @property {(name: string) => string} val
     * @property {(name: string, item: string) => string} data
     * @property {() => Record<string, unknown>} state */

    /** @typedef {Record<string, unknown>} Data */

    /** @typedef {(ctx: any, name: string, value: string, row: Row, d: Data) => string | HTMLElement} Transform */

    /** @typedef {(row: Row) => void} OnClick */

    /** @typedef {(search: string) => Promise<Data[]>} OnFetch */

    /**
     * @typedef {Object} State
     * @property {URLSearchParams} search
     * @property {Record<number, Data[]>} data */

    /** @typedef {Object} TableConfig
     * @property {string} id
     * @property {string} prevId
     * @property {string} nextId
     * @property {string} sizeId
     * @property {string} currentPageId
     * @property {string} maxPageId
     * @property {number} defaultLimit
     * @property {number} defaultOffset
     * @property {Transform | null} transform
     * @property {(ctx: any, entry: Record<string, unknown>, row: Row) => void} onRender
     * @property {(ctx: any, data: Data[]) => void} afterRender
     * @property {(ctx: any, row: Row) => Record<string, unknown>} onInitialize
     * @property {OnClick | null} onClick
     * @property {OnFetch} onFetch */

    /** @param {TableConfig} config */
    const initializeTable = ({
        id,
        prevId,
        nextId,
        sizeId,
        currentPageId,
        maxPageId,
        defaultLimit,
        defaultOffset,
        transform,
        onRender,
        afterRender,
        onInitialize,
        onClick,
        onFetch,
    }) => {
        /** @type {State} */
        const state = {
            search: new URLSearchParams(window.location.search),
            data: {},
        };

        const getLimit = () => {
            const l = state.search.get('limit');
            if (l === null) return defaultLimit;
            return Number(l);
        };

        const getOffset = () => {
            const l = state.search.get('offset');
            if (l === null) return defaultOffset;
            return Number(l);
        };

        /**
         * @param {string} key
         * @param {string} value */
        const setSearchSoft = (key, value) => {
            state.search.set(key, value);
            window.history.replaceState(null, null, '?' + state.search.toString());
        };

        setSearchSoft('limit', getLimit());
        setSearchSoft('offset', getOffset());

        const page = (() => {
            const currentPage = document.getElementById(currentPageId ?? 'current-page');
            const maxPage = Number(document.getElementById(maxPageId ?? 'max-page').innerText);
            const current = () => Number(currentPage.innerText);
            const max = () => current() === maxPage;
            const min = () => current() === 1;
            return {
                current,
                max,
                min,
                inc: () => {
                    if (max()) return false;
                    currentPage.innerText = current() + 1;
                    return true;
                },
                dec: () => {
                    if (min()) return false;
                    currentPage.innerText = current() - 1;
                    return true;
                },
            };
        })();

        /** @type {HTMLButtonElement} */
        const prevBtn = document.getElementById(prevId ?? 'previous-btn');
        /** @type {HTMLButtonElement} */
        const nextBtn = document.getElementById(nextId ?? 'next-btn');
        /** @type {HTMLTableElement} */
        const root = document.getElementById(id);
        /** @type {HTMLTableSectionElement} */
        const body = root.getElementsByTagName('tbody')[0];
        /** @type {string[]} */
        const cols = [...root.querySelectorAll('th')].map((e) => e.innerText.toLowerCase());
        /** @type {Row | null} */
        let selectedRow = null;

        const hasData = () => {
            for (const key in state.data) {
                const val = state.data[key];
                if (val && Array.isArray(val) && val.length > 0) {
                    return true;
                }
            }
            return false;
        };

        /** @param {HTMLTableRowElement} tr */
        const createRow = (tr) => {
            const col = (name) => tr.querySelector(`td[data-name=${name}]`);
            return {
                el: tr,
                col,
                val: (name) => col(name).innerText ?? '',
                data: (name, item) => (name ? col(name).dataset[item] ?? '' : tr.dataset[item] ?? ''),
                setActive: () => {
                    tr.dataset.isActive = '1';
                },
                setInactive: () => {
                    tr.dataset.isActive = '0';
                },
                state: () => {
                    const id = strToIntId(tr.id);
                    const data = state.data[page.current()];
                    const item = data.find((e) => e.id === id);
                    return item || null;
                },
            };
        };

        /** @type {() => Row[]} */
        const rows = () => [...body.getElementsByTagName('tr')].map((el) => createRow(el));

        const padRows = () => {
            const r = rows();
            const limit = getLimit();
            if (r.length >= limit) return;
            const diff = limit - r.length;
            for (let i = 0; i < diff; i++) {
                const row = createRow(
                    append(
                        any('tr', {}, onClick ? 'clickable-row' : []),
                        ...cols.map((col) => {
                            const td = any('td');
                            td.dataset.name = col;
                            return td;
                        })
                    )
                );
                body.appendChild(onClick ? withListener(row.el, () => onClick(row)) : row.el);
            }
        };

        /** @param {number | string} id */
        const rowId = (id) => `${root.id}-row-${id}`;

        /**
         * @param {number | string} id
         * @param {string} name */
        const cellId = (id, name) => `${root.id}-row-${id}-data-${name}`;

        /** @returns {Row | null} */
        const active = () => {
            return rows().find((r) => r.data(null, 'isActive') === '1') ?? null;
        };

        /** @param {Row | null} [row = null] */
        const highlightActiveSession = (row = null) => {
            const activeRow = row ?? active();
            if (!activeRow) return;
            selectedRow = null;
            activeRow.el.classList.add('selected-row');
            return rows().forEach((r) => {
                if (r.el.id === activeRow.el.id) return;
                r.el.classList.remove('selected-row');
            });
        };

        /** @param {Row} row */
        const highlight = (row) => {
            if (row.data(null, 'isActive') === '1') {
                return highlightActiveSession(row);
            }
            rows().forEach((r) => {
                if (r.el.id === row.el.id) {
                    if (r.el.classList.contains('selected-row')) {
                        selectedRow = null;
                        r.el.classList.remove('selected-row');
                        return highlightActiveSession();
                    } else {
                        r.el.classList.add('selected-row');
                        selectedRow = r;
                        return;
                    }
                }
                r.el.classList.remove('selected-row');
            });
        };

        const removeHighlight = () => {
            selectedRow = null;
            rows().forEach((r) => r.el.classList.remove('selected-row'));
        };

        /**
         * @param {string} col
         * @param {Data} data
         * @param {Row} row
         * @returns {string | HTMLElement} */
        const handleTransform = (col, data, row) => {
            const val = data[col];
            if (typeof transform === 'function') {
                return transform(ctx, col, val, row, data);
            }
            return val;
        };

        const renderCurrentPage = () => {
            const data = state.data[page.current()];
            if (!data) return;
            rows().forEach((row, idx) => {
                const entry = data[idx];
                if (!entry) return hideEl(row.el);
                showEl(row.el);
                cols.forEach((col) => {
                    const cell = row.col(col);
                    const tranformed = handleTransform(col, entry, row);
                    cell.innerHTML = '';
                    if (tranformed instanceof HTMLElement) {
                        cell.appendChild(tranformed);
                    } else {
                        cell.innerText = tranformed;
                    }
                    cell.id = cellId(row.val('id'), col);
                });
                if (typeof onRender === 'function') {
                    onRender(ctx, entry, row);
                }
                row.el.id = rowId(row.val('id'));
            });
            if (typeof afterRender === 'function') {
                afterRender(ctx, data);
            }
        };

        /**
         * @param {"min" | "max"} pageKey
         * @param {HTMLButtonElement} btn
         * @param {HTMLButtonElement} otherBtn */
        const onPageChangeClick = async (pageKey, btn, otherBtn) => {
            if (page[pageKey]()) return disableBtn(btn);
            const limit = getLimit();
            const offset = getOffset();
            const normalizer = active() ? 1 : 0;
            setSearchSoft(
                'offset',
                pageKey === 'min' ? Math.max(offset - (limit - normalizer), 0) : limit + offset - normalizer
            );
            page[pageKey === 'min' ? 'dec' : 'inc']();
            if (page[pageKey]()) disableBtn(btn);
            enableElIf(!page[pageKey === 'min' ? 'max' : 'min'](), otherBtn);
            const currentPage = page.current();
            if (!state.data[currentPage]) {
                state.data[currentPage] = await onFetch(state.search.toString());
            }
            renderCurrentPage();
        };

        const pageSizeSelect = document.getElementById(sizeId ?? 'size-select');
        pageSizeSelect.addEventListener('change', ({ target }) => {
            state.search.set('limit', target.value);
            state.search.set('offset', 0);
            window.location.search = state.search.toString();
        });

        prevBtn.addEventListener('click', onPageChangeClick.bind(null, 'min', prevBtn, nextBtn));
        nextBtn.addEventListener('click', onPageChangeClick.bind(null, 'max', nextBtn, prevBtn));

        const hasClickListener = typeof onClick === 'function';
        const hasInitialize = typeof onInitialize === 'function';

        const ctx = {
            state,
            table: {
                root,
                body,
                cols,
                rows,
                selected: () => selectedRow,
                active,
                highlight,
                removeHighlight,
                rowId,
                cellId,
            },
            page,
            prevBtn,
            nextBtn,
            getLimit,
            getOffset,
            hasData,
            renderCurrentPage,
        };

        state.data[page.current()] = rows().map((row) => {
            if (hasClickListener) {
                row.el.addEventListener('click', () => onClick(row));
            }
            const initial = hasInitialize ? onInitialize(ctx, row) : {};
            return cols.reduce((acc, col) => {
                if (col === 'id') {
                    acc[col] = Number(row.val(col));
                } else {
                    acc[col] = row.val(col);
                }
                return acc;
            }, initial);
        });

        padRows();
        renderCurrentPage();

        return ctx;
    };
    window.clTable.initialize = initializeTable;
})();
