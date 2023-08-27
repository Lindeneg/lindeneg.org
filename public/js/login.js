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
    const loginBtn = document.getElementById('login-button');
    const login = () => __awaiter(void 0, void 0, void 0, function* () {
        const email = window.funkalleroCore.getInputFieldValue(document.getElementById('email-field'));
        const password = window.funkalleroCore.getInputFieldValue(document.getElementById('password-field'));
        if (!email || !password) {
            window.funkalleroCore.setError('Please fill in all fields');
            return;
        }
        const body = JSON.stringify({ email, password });
        return window.funkalleroCore.postJson('/login', body, () => {
            window.location.reload();
        });
    });
    window.funkalleroCore.setKeyPressHandler('Enter', login);
    loginBtn === null || loginBtn === void 0 ? void 0 : loginBtn.addEventListener('click', login);
})();
