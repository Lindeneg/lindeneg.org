type Core = (typeof window)['funkalleroCore'];

(() => {
    const logoutBtn = document.getElementById('logout-btn');
    const keyPressSingleHandlerMap = new Map<string, () => void>();

    const debounce: Core['debounce'] = (fn, ms = 300) => {
        let timeoutId: ReturnType<typeof setTimeout>;
        return function (this: unknown, ...args: unknown[]) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn.apply(this, args), ms);
        };
    };

    const handleKeyPress = ({ key }: KeyboardEvent) => {
        if (keyPressSingleHandlerMap.has(key)) {
            keyPressSingleHandlerMap.get(key)?.();
        }
    };

    const handleLogout = () => {
        window.location.href = '/logout';
    };

    document.addEventListener('keypress', debounce(handleKeyPress));
    logoutBtn?.addEventListener('click', handleLogout);

    const setKeyPressHandler: Core['setKeyPressHandler'] = (key, handler) => {
        keyPressSingleHandlerMap.set(key, handler);
    };

    const getInputFieldValue: Core['getInputFieldValue'] = (field) => {
        return (field as HTMLInputElement)?.value || null;
    };

    const setError = (error: string) => {
        let errorDiv = document.getElementById('error-div');

        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'error-div';
            document.body.appendChild(errorDiv);
        }

        const errorEl = document.createElement('p');
        errorEl.innerText = error;

        errorDiv.appendChild(errorEl);
    };

    const sendRequest: Core['sendRequest'] = async (path, method, headers, body, onSuccess, onError) => {
        const opts: RequestInit = { method, headers };

        if (method !== 'GET' && body) {
            opts.body = body;
        }

        const response = await fetch('/api' + path, opts);

        if (response.ok) {
            if (onSuccess) return onSuccess(response);
            return response;
        }

        const { message, error } = await response.json();

        if (onError) return onError(error, message);

        if (Array.isArray(error)) {
            setError(JSON.stringify(error));
        } else {
            setError(message);
        }

        return null;
    };

    const getJson: Core['getJson'] = async (path, onSuccess, onError,) => {
        const response = await sendRequest(path, 'GET', undefined, null, undefined, onError);

        if (response?.ok) {
            if (onSuccess) return onSuccess(response);
            return response.json();
        }

        return null;
    };

    const postJson: Core['postJson'] = async (path, body, onSuccess) => {
        return sendRequest(path, 'POST', { 'Content-Type': 'application/json' }, body, onSuccess);
    };

    const patchJson: Core['patchJson'] = async (path, body, onSuccess) => {
        return sendRequest(path, 'PATCH', { 'Content-Type': 'application/json' }, body, onSuccess);
    };

    const deleteJson: Core['deleteJson'] = async (path, onSuccess) => {
        return sendRequest(path, 'DELETE', { 'Content-Type': 'application/json' }, null, onSuccess);
    };

    window.funkalleroCore = {
        debounce,
        sendRequest,
        getJson,
        deleteJson,
        postJson,
        patchJson,
        setError,
        getInputFieldValue,
        setKeyPressHandler,
    };
})();
