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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
(() => {
    const DISABLED_BTN_CLASS = 'pure-button-disabled';
    const _a = window.funkalleroAdminCore, { app } = _a, core = __rest(_a, ["app"]);
    const state = {
        original: null,
        navigation: null,
        navigationItems: null,
        columnNames: null,
        updatingItemId: null,
        addingRow: false,
    };
    const handleNavItemClick = (target) => __awaiter(void 0, void 0, void 0, function* () {
        var _b;
        const id = target.dataset.itemId;
        const mode = target.innerText.toLowerCase();
        if (!id || !mode)
            return;
        if (mode === 'done') {
            state.updatingItemId = null;
            state.addingRow = false;
        }
        else if (mode === 'update') {
            state.updatingItemId = id;
        }
        else if (mode === 'delete') {
            const target = (_b = state.navigationItems) === null || _b === void 0 ? void 0 : _b.find((e) => e.id === id);
            target.edited = true;
            target.deleted = true;
            state.updatingItemId = null;
            state.addingRow = false;
        }
        yield setNavigationHtml();
    });
    const handleRowInput = (target) => __awaiter(void 0, void 0, void 0, function* () {
        var _c, _d, _e;
        const name = target.name;
        let value = target.value;
        if (!name || !state.updatingItemId)
            return;
        const navItem = (_c = state.navigationItems) === null || _c === void 0 ? void 0 : _c.find((e) => e.id === state.updatingItemId);
        const originalNavItem = (_e = (_d = state.original) === null || _d === void 0 ? void 0 : _d.navItems) === null || _e === void 0 ? void 0 : _e.find((e) => e.id === state.updatingItemId);
        if (name === 'alignment') {
            value = value.toUpperCase();
        }
        else if (name === 'newTab') {
            value = target.checked;
        }
        navItem[name] = value;
        navItem.edited =
            !originalNavItem || value !== originalNavItem[name];
    });
    const addNavRow = () => __awaiter(void 0, void 0, void 0, function* () {
        state.addingRow = !state.addingRow;
        state.updatingItemId = 'NEW_ROW_TEMP_ID-' + state.navigationItems.length;
        state.navigationItems.push({
            id: state.updatingItemId,
            navigationId: state.navigation.id,
            name: 'Some Name',
            href: '/example',
            position: 10,
            alignment: 'LEFT',
            newTab: false,
            edited: true,
            deleted: false,
        });
        yield setNavigationHtml();
    });
    const setNavigationListeners = () => {
        const actionElements = document.querySelectorAll('.update-table-btn,.delete-table-btn');
        const editableRowElements = document.querySelectorAll('.editable-row');
        const addNavButton = document.getElementById('add-nav-btn');
        const brandField = document.getElementById('brand-field');
        const commitBtn = document.getElementById('nav-commit-btn');
        const resetBtn = document.getElementById('nav-reset-btn');
        actionElements.forEach((element) => {
            element.addEventListener('click', ({ target }) => handleNavItemClick(target));
        });
        editableRowElements.forEach((element) => {
            element.addEventListener('input', ({ target }) => handleRowInput(target));
        });
        brandField.addEventListener('input', ({ target }) => {
            var _a;
            if (!state.navigation)
                return;
            state.navigation.brandName = target.value;
            state.navigation.edited = state.navigation.brandName !== ((_a = state.original) === null || _a === void 0 ? void 0 : _a.brandName);
            updateConfirmButtonState();
        });
        addNavButton.addEventListener('click', addNavRow);
        commitBtn.addEventListener('click', commitChanges);
        resetBtn.addEventListener('click', () => window.location.reload());
    };
    const updateConfirmButtonState = () => {
        var _a, _b;
        const addNavButton = document.getElementById('add-nav-btn');
        if (state.addingRow) {
            addNavButton.classList.add(DISABLED_BTN_CLASS);
        }
        else {
            addNavButton.classList.remove(DISABLED_BTN_CLASS);
        }
        const commitBtn = document.getElementById('nav-commit-btn');
        const resetBtn = document.getElementById('nav-reset-btn');
        const hasEdited = ((_a = state.navigation) === null || _a === void 0 ? void 0 : _a.edited) ||
            ((_b = state.navigationItems) === null || _b === void 0 ? void 0 : _b.some((item) => item.edited || item.deleted));
        if (hasEdited && !state.updatingItemId && !state.addingRow) {
            commitBtn.classList.remove(DISABLED_BTN_CLASS);
            resetBtn.classList.remove(DISABLED_BTN_CLASS);
            return;
        }
        commitBtn.classList.add(DISABLED_BTN_CLASS);
        resetBtn.classList.add(DISABLED_BTN_CLASS);
    };
    const getEditableRowHtml = (row, name) => {
        const value = row[name];
        if (name === 'name' || name === 'href') {
            return `<input name="${name}" class="editable-row" value=${value}></input>`;
        }
        if (name === 'position') {
            return `<input style="width:4rem;" name="${name}" class="editable-row" type="number" value=${value}></input>`;
        }
        if (name === 'newTab') {
            return `<input name="${name}" class="editable-row" type="checkbox" ${value ? 'checked' : ''}></input>`;
        }
        if (name === 'alignment') {
            return `
<select name="${name}" class="editable-row">
    <option value="left" ${value === 'LEFT' ? 'selected' : ''}>Left</option>
    <option value="right" ${value === 'RIGHT' ? 'selected' : ''}>Right</option>
</select>`;
        }
        return String(value);
    };
    const getNavigationHtml = () => {
        var _a, _b;
        return `
<section class="admin-section">
    <h1>Navigation</h1>

    <div class="admin-section-content">
        <div class="admin-navigation-name">
            <label style="margin-bottom:1rem;" for="brand-field">Navigation Name</label>
            <input id="brand-field" type="text" placeholder="Navigation Name" value="${(_a = state.navigation) === null || _a === void 0 ? void 0 : _a.brandName}" />
        </div>
        <div>

        <h1>Navigation Items</h1>
        <button 
            id="add-nav-btn" 
            style="margin-bottom:1rem;"
            class="pure-button pure-button-primary"
        >
            Add Navigation Item
        </button>

        ${core.getTableHtml(state.columnNames || [], ((_b = state.navigationItems) === null || _b === void 0 ? void 0 : _b.filter((e) => !e.deleted).sort((a, b) => a.position - b.position)) || [], state.updatingItemId, true, getEditableRowHtml)}

        </div>

        <div class="pure-button-group admin-confirm-actions" role="group" aria-label="...">
            <button id="nav-commit-btn" class="pure-button pure-button-disabled pure-button-primary">Commit Changes</button>
            <button id="nav-reset-btn" class="pure-button pure-button-disabled button-error">Reset Changes</button>
        </div>
    </div>
</section>`;
    };
    const setNavigationHtml = () => __awaiter(void 0, void 0, void 0, function* () {
        if (!state.navigation || !state.navigationItems || !state.columnNames) {
            const navigation = yield core.getJson('/navigation');
            if (!navigation)
                return;
            state.original = navigation;
            state.navigationItems = navigation.navItems.map((item) => (Object.assign(Object.assign({}, item), { edited: false, deleted: false })));
            state.navigation = Object.assign(Object.assign({}, navigation), { edited: false, deleted: false });
            state.columnNames = navigation.navItems.length
                ? Object.keys(navigation.navItems[0]).filter((name) => name !== 'id' && name !== 'navigationId')
                : [];
        }
        app.innerHTML = getNavigationHtml();
        updateConfirmButtonState();
        setNavigationListeners();
    });
    const commitChanges = () => __awaiter(void 0, void 0, void 0, function* () { });
    window.funkalleroCoreViews.navigation = setNavigationHtml;
})();
