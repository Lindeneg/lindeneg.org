import type {User} from "../../repositories/user-repository.js";
import {icon} from "../icons.js";
import {esc} from "../lib.js";
import {Avatar} from "./avatar.js";

export type TopbarProps = {
    user: User;
    logoutAction: string;
};

export function Topbar({user, logoutAction}: TopbarProps): string {
    return `
        <header class="admin-topbar">
            <button type="button" class="admin-mobile-toggle" data-admin-mobile-toggle aria-label="Toggle sidebar">${icon("menu")}</button>
            <div class="admin-topbar-right">
                <div class="admin-user">
                    ${Avatar({person: user, block: "admin-avatar"})}
                    <span class="admin-user-name">${esc(user.name)}</span>
                </div>
                <form method="post" action="${esc(logoutAction)}" class="admin-logout-form">
                    <button type="submit" class="icon-btn" aria-label="Logout" title="Logout">${icon("logout")}</button>
                </form>
            </div>
        </header>
    `;
}
