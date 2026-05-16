import type {User} from "@prisma/client";
import {esc, initials} from "../../lib.js";
import {AdminShell} from "../layout.js";
import {ConfirmForm, PageHeader, TopError} from "../components.js";

export type SettingsViewProps = {
    user: User;
    currentPath: string;
    photoError?: string;
    photoMessage?: string;
};

export function SettingsView({user, currentPath, photoError, photoMessage}: SettingsViewProps): string {
    const avatar = user.photo
        ? `<img src="${esc(user.photo)}" alt="" class="settings-avatar" />`
        : `<div class="settings-avatar settings-avatar--initials">${esc(initials(user.name))}</div>`;
    const message = photoMessage ? `<p class="form-success">${esc(photoMessage)}</p>` : "";

    const photoBody = user.photo
        ? `
            <p class="row-sub">Profile photo is set. Remove it to upload a new one.</p>
            ${ConfirmForm({action: "/admin/settings/photo/delete", confirm: "Remove profile photo?", label: "Remove photo", variant: "danger"})}
        `
        : `
            <form method="post" action="/admin/settings/photo" enctype="multipart/form-data" class="admin-form">
                ${TopError(photoError)}
                ${message}
                <input type="file" name="photo" accept="image/*" required class="form-input" />
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Upload</button>
                </div>
            </form>
        `;
    return AdminShell({
        title: "Settings",
        user,
        currentPath,
        children: `
            ${PageHeader({title: "Settings"})}
            <section class="admin-card">
                <h2 class="admin-h2">Profile photo</h2>
                <div class="settings-photo">
                    ${avatar}
                    <div class="settings-photo-body">${photoBody}</div>
                </div>
            </section>
            <section class="admin-card">
                <h2 class="admin-h2">Cache</h2>
                <p class="row-sub">The public site caches rendered pages. Clear it to pick up changes immediately.</p>
                <form method="post" action="/admin/settings/cache/clear" class="admin-form-inline">
                    <button type="submit" class="btn btn-ghost">Clear template cache</button>
                </form>
            </section>
        `,
    });
}
