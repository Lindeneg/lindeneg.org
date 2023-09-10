(() => {
    const { clHttp } = window;

    const login = async () => {
        const email = (document.getElementById('email-field') as HTMLInputElement).value;
        const password = (document.getElementById('password-field') as HTMLInputElement).value;

        if (!email || !password) {
            clHttp.setError('Please fill in all fields');
            return;
        }

        const body = JSON.stringify({ email, password });

        return clHttp.postJson('/login', body, () => {
            window.location.reload();
        });
    };

    document.getElementById('login-button')?.addEventListener('click', login);
})();
