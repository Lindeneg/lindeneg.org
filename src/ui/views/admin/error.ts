import type {User} from "../../../repositories/user-repository.js";
import {esc} from "../../lib.js";
import {AdminLayout} from "../../components/layout.js";
import {PageHeader} from "../../components/page-header.js";

export type ErrorViewProps = {
    user: User;
    currentPath: string;
    message: string;
};

export function ErrorView({user, currentPath, message}: ErrorViewProps): string {
    return AdminLayout({
        title: "Error",
        user,
        currentPath,
        children: `
            ${PageHeader({title: "Something went wrong"})}
            <p class="empty-state">${esc(message)}</p>
        `,
    });
}
