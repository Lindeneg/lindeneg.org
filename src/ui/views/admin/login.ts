import {esc} from "../../lib.js";
import {AuthLayout} from "../../components/layout.js";
import {Field, TopError} from "../../components/form.js";

export type LoginViewProps = {
    error?: string;
    email?: string;
};

export function LoginView({error, email}: LoginViewProps): string {
    return AuthLayout({
        title: "Sign in",
        children: `
            <form method="post" action="/admin/login" class="auth-card">
                <h1 class="auth-title">Sign in</h1>
                ${TopError(error)}
                ${Field({name: "email", label: "Email", type: "email", value: email ?? "", required: true, autocomplete: "email"})}
                ${Field({name: "password", label: "Password", type: "password", required: true, autocomplete: "current-password"})}
                <button type="submit" class="btn btn-primary btn-block">Sign in</button>
                <p class="auth-hint">${esc("Admin area")}</p>
            </form>
        `,
    });
}
