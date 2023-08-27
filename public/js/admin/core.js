"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
(() => {
    const ACTIVE_NAV_CLASS = 'button-secondary';
    const INACTIVE_NAV_CLASS = 'pure-button-primary';
    const app = document.getElementById('app');
    const navEntries = Array.from(document.querySelectorAll('.nav-entry'));
    const getTableHtml = (columns, rows, updatingId = null, withActions = false, editableColumnHtml = null) => {
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
            .map((row) => `<tr data-item-id=${row.id} >${columns
            .map((name) => {
            const isUpdatingRow = updatingId === row.id;
            if (name === 'actions') {
                return `<td><span data-item-id=${row.id} class="update-table-btn" >${isUpdatingRow ? 'Done' : 'Update'}</span> | <span data-item-id=${row.id} class="delete-table-btn">Delete</span></td>`;
            }
            if (isUpdatingRow && editableColumnHtml) {
                return `<td>${editableColumnHtml(row, name)}</td>`;
            }
            return `<td>${row[name]}</td>`;
        })
            .join('')}</tr>`)
            .join('')}
    </tbody>
</table>`;
    };
    const loadScript = (name) => {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `/js/admin/${name}.js`;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    };
    const renderCoreView = (view) => __awaiter(void 0, void 0, void 0, function* () {
        if (!view) {
            view = getActiveNavButtonName();
        }
        yield loadScript(view);
        const setHtml = window.funkalleroCoreViews[view];
        if (typeof setHtml !== 'function')
            return;
        yield setHtml();
    });
    const setActiveNavButton = (active) => __awaiter(void 0, void 0, void 0, function* () {
        return Promise.all(navEntries.map((e) => {
            if (e.innerText.toLowerCase() === active) {
                e.classList.replace(INACTIVE_NAV_CLASS, ACTIVE_NAV_CLASS);
            }
            else {
                e.classList.replace(ACTIVE_NAV_CLASS, INACTIVE_NAV_CLASS);
            }
        }));
    });
    const getActiveNavButtonName = () => {
        for (const entry of navEntries) {
            if (entry.classList.contains(ACTIVE_NAV_CLASS))
                return entry.innerText.toLowerCase();
        }
        return '';
    };
    const handleNavClick = (event) => __awaiter(void 0, void 0, void 0, function* () {
        const target = event.target;
        const name = target.innerText.toLowerCase();
        if (name === 'logout') {
            return window.funkalleroCore.sendRequest('/logout', 'GET', undefined, null, () => {
                window.location.href = '/';
            });
        }
        return Promise.all([setActiveNavButton(name), renderCoreView(name)]);
    });
    const setNavListeners = () => __awaiter(void 0, void 0, void 0, function* () {
        return Promise.all(navEntries.map((e) => e.addEventListener('click', handleNavClick)));
    });
    const initialize = () => __awaiter(void 0, void 0, void 0, function* () {
        yield Promise.all([setNavListeners(), renderCoreView()]);
    });
    window.addEventListener('DOMContentLoaded', initialize);
    if (typeof window.funkalleroCoreViews === 'undefined') {
        window.funkalleroCoreViews = {};
    }
    window.funkalleroAdminCore = Object.assign(Object.assign({}, window.funkalleroCore), { getTableHtml,
        app });
})();
