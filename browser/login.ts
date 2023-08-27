(() => {
    const loginBtn = document.getElementById('login-button');

    const login = async () => {
        const email = window.funkalleroCore.getInputFieldValue(
            document.getElementById('email-field')
        );
        const password = window.funkalleroCore.getInputFieldValue(
            document.getElementById('password-field')
        );

        if (!email || !password) {
            window.funkalleroCore.setError('Please fill in all fields');
            return;
        }

        const body = JSON.stringify({ email, password });

        return window.funkalleroCore.postJson('/login', body, () => {
            window.location.reload();
        });
    };

    window.funkalleroCore.setKeyPressHandler('Enter', login);
    loginBtn?.addEventListener('click', login);
})();
