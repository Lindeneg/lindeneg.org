import type {User} from "../../../repositories/user-repository.js";
import type {CacheStats} from "../../../lib/page-cache.js";
import {esc} from "../../lib.js";
import {AdminLayout} from "../../components/layout.js";
import {Avatar} from "../../components/avatar.js";
import {ConfirmForm} from "../../components/confirm-form.js";
import {TopError} from "../../components/form.js";
import {PageHeader} from "../../components/page-header.js";

export type SettingsViewProps = {
    user: User;
    currentPath: string;
    cacheStats: CacheStats;
    photoError?: string;
    photoMessage?: string;
};

function hitRate({hits, misses}: CacheStats): string {
    const lookups = hits + misses;
    return lookups === 0 ? "—" : `${Math.round((hits / lookups) * 100)}%`;
}

export function SettingsView({user, currentPath, cacheStats, photoError, photoMessage}: SettingsViewProps): string {
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
    return AdminLayout({
        title: "Settings",
        user,
        currentPath,
        children: `
            ${PageHeader({title: "Settings"})}
            <section class="admin-card">
                <h2 class="admin-h2">Profile photo</h2>
                <div class="settings-photo">
                    ${Avatar({person: user, block: "settings-avatar"})}
                    <div class="settings-photo-body">${photoBody}</div>
                </div>
            </section>
            <section class="admin-card">
                <h2 class="admin-h2">Cache</h2>
                <p class="row-sub">The public site caches rendered pages. Clear it to pick up changes immediately.</p>
                <p class="row-sub" data-cache-stats>
                    Entries: ${cacheStats.entries} / ${cacheStats.maxEntries} ·
                    Hits: ${cacheStats.hits} ·
                    Misses: ${cacheStats.misses} ·
                    Hit rate: ${hitRate(cacheStats)}
                </p>
                <form method="post" action="/admin/settings/cache/clear" class="admin-form-inline">
                    <button type="submit" class="btn btn-ghost">Clear template cache</button>
                </form>
            </section>
        `,
    });
}
