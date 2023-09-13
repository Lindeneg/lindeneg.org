(() => {
    let requestsInProgress = 0;
    let requestsDone = 0;

    window.addEventListener('cl-http-request-in-progress', (event: Event) => {
        const customEvent = event as CustomEvent<boolean>;
        const loadingElements = document.querySelectorAll('.ripple-wrapper,.ripple-background');

        if (customEvent.detail) {
            requestsInProgress++;
            loadingElements.forEach((e) => {
                if (e.classList.contains('hidden')) {
                    e.classList.remove('hidden');
                }
            });
            return;
        }

        requestsDone++;
        if (requestsDone === requestsInProgress) {
            requestsDone = 0;
            requestsInProgress = 0;
            loadingElements.forEach((e) => {
                if (!e.classList.contains('hidden')) {
                    e.classList.add('hidden');
                }
            });
        }
    });

    const setError: ClHttpModule['setError'] = (error) => {
        let errorDiv = document.getElementById('cl-http-error-div');

        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'cl-http-error-div';
            document.body.appendChild(errorDiv);
        }

        const errorEl = document.createElement('p');
        errorEl.innerText = error;
        errorDiv.appendChild(errorEl);
    };

    const clearError: ClHttpModule['clearError'] = () => {
        const errorDiv = document.getElementById('cl-http-error-div');

        if (!errorDiv) return;

        errorDiv.remove();
    };

    const emitLoading = (load: boolean) => {
        window.dispatchEvent(new CustomEvent('cl-http-request-in-progress', { detail: load }));
    };

    const sendRequest: ClHttpModule['sendRequest'] = async (path, method, headers, body, onSuccess, onError) => {
        emitLoading(true);

        const opts: RequestInit = { method, headers };
        if (method !== 'GET' && body) {
            opts.body = body;
        }

        const response = await fetch('/api' + path, opts);

        if (response.ok) {
            emitLoading(false);
            if (onSuccess) {
                return onSuccess(response);
            }
            return response;
        }

        const { message, error } = await response.json();

        emitLoading(false);

        if (onError) {
            return onError(error, message);
        }

        if (Array.isArray(error)) {
            setError(JSON.stringify(error));
        } else {
            setError(message);
        }

        setTimeout(clearError, 5000);

        return null;
    };

    const getJson: ClHttpModule['getJson'] = async (path, onSuccess, onError) => {
        const response = await sendRequest(path, 'GET', undefined, null, undefined, onError);

        if (response?.ok) {
            if (onSuccess) return onSuccess(response);
            return response.json();
        }

        return null;
    };

    const postJson: ClHttpModule['postJson'] = async (path, body, onSuccess, onError) => {
        return sendRequest(path, 'POST', { 'Content-Type': 'application/json' }, body, onSuccess, onError);
    };

    const patchJson: ClHttpModule['patchJson'] = async (path, body, onSuccess, onError) => {
        return sendRequest(path, 'PATCH', { 'Content-Type': 'application/json' }, body, onSuccess, onError);
    };

    const deleteEntity: ClHttpModule['deleteEntity'] = async (path, onSuccess, onError) => {
        return sendRequest(path, 'DELETE', undefined, null, onSuccess, onError);
    };

    window.clHttp = {
        sendRequest,
        postJson,
        patchJson,
        deleteEntity,
        getJson,
        setError,
        clearError,
    };
})();
