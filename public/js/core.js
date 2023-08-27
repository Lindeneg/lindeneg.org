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
    const logoutBtn = document.getElementById('logout-btn');
    const keyPressSingleHandlerMap = new Map();
    const debounce = (fn, ms = 300) => {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn.apply(this, args), ms);
        };
    };
    const handleKeyPress = ({ key }) => {
        var _a;
        if (keyPressSingleHandlerMap.has(key)) {
            (_a = keyPressSingleHandlerMap.get(key)) === null || _a === void 0 ? void 0 : _a();
            return;
        }
    };
    const handleLogout = () => {
        window.location.href = '/logout';
    };
    document.addEventListener('keypress', debounce(handleKeyPress));
    logoutBtn === null || logoutBtn === void 0 ? void 0 : logoutBtn.addEventListener('click', handleLogout);
    const setKeyPressHandler = (key, handler) => {
        keyPressSingleHandlerMap.set(key, handler);
    };
    const getInputFieldValue = (field) => {
        return (field === null || field === void 0 ? void 0 : field.value) || null;
    };
    const setError = (error) => {
        const errorDiv = document.getElementById('error-div');
        if (!errorDiv)
            return;
        errorDiv.innerHTML = `<p style="color:red">${error}</p>`;
    };
    const sendRequest = (path, method, headers, body, onSuccess) => __awaiter(void 0, void 0, void 0, function* () {
        const opts = { method, headers };
        if (method !== 'GET' && body) {
            opts.body = body;
        }
        const response = yield fetch('/api' + path, opts);
        if (response.ok) {
            if (onSuccess)
                return onSuccess(response);
            return response;
        }
        const { message, error } = yield response.json();
        if (Array.isArray(error)) {
            setError(JSON.stringify(error));
        }
        else {
            setError(message);
        }
        return null;
    });
    const getJson = (path, onSuccess) => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield sendRequest(path, 'GET', undefined, null, undefined);
        if (response === null || response === void 0 ? void 0 : response.ok) {
            if (onSuccess)
                return onSuccess(response);
            return response.json();
        }
        return null;
    });
    const postJson = (path, body, onSuccess) => __awaiter(void 0, void 0, void 0, function* () {
        return sendRequest(path, 'POST', { 'Content-Type': 'application/json' }, body, onSuccess);
    });
    const patchJson = (path, body, onSuccess) => __awaiter(void 0, void 0, void 0, function* () {
        return sendRequest(path, 'PATCH', { 'Content-Type': 'application/json' }, body, onSuccess);
    });
    window.funkalleroCore = {
        debounce,
        sendRequest,
        getJson,
        postJson,
        patchJson,
        setError,
        getInputFieldValue,
        setKeyPressHandler,
    };
})();
