import type {User} from "@prisma/client";
import {icon} from "../icons.js";
import {esc, initials} from "../lib.js";

export function Topbar(user: User): string {
    const avatar = user.photo
        ? `<img src="${esc(user.photo)}" alt="" class="admin-avatar" />`
        : `<div class="admin-avatar admin-avatar--initials">${esc(initials(user.name))}</div>`;
    return `
        <header class="admin-topbar">
            <button type="button" class="admin-mobile-toggle" data-admin-mobile-toggle aria-label="Toggle sidebar">${icon("menu")}</button>
            <div class="admin-topbar-right">
                <div class="admin-user">
                    ${avatar}
                    <span class="admin-user-name">${esc(user.name)}</span>
                </div>
                <form method="post" action="/admin/logout" class="admin-logout-form">
                    <button type="submit" class="icon-btn" aria-label="Logout" title="Logout">${icon("logout")}</button>
                </form>
            </div>
        </header>
    `;
}
