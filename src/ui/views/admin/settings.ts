import type {User} from "../../../repositories/user-repository.js";
import type {CacheStats} from "../../../lib/page-cache.js";
import {MAX_UPLOAD_BYTES} from "../../../lib/http.js";
import {AdminLayout} from "../../components/layout.js";
import {Avatar} from "../../components/avatar.js";
import {Field, TopError} from "../../components/form.js";
import {PageHeader} from "../../components/page-header.js";

export type SettingsViewProps = {
    user: User;
    currentPath: string;
    cacheStats: CacheStats;
    photoError?: string;
    passwordErrors?: Record<string, string>;
    passwordTopError?: string;
    passwordChanged?: boolean;
};

function hitRate({hits, misses}: CacheStats): string {
    const lookups = hits + misses;
    return lookups === 0 ? "—" : `${Math.round((hits / lookups) * 100)}%`;
}

export function SettingsView({
    user,
    currentPath,
    cacheStats,
    photoError,
    passwordErrors,
    passwordTopError,
    passwordChanged,
}: SettingsViewProps): string {
    // the remove button sits in the upload form's button row but submits its own (empty) form
    const removeForm = user.photo
        ? `<form id="photo-delete" method="post" action="/admin/settings/photo/delete" data-confirm="Remove profile photo?" hidden></form>`
        : "";
    const removeButton = user.photo
        ? `<button type="submit" form="photo-delete" class="btn btn-danger">Remove photo</button>`
        : "";
    const e = passwordErrors ?? {};
    const changed = passwordChanged ? `<p class="form-success">Password changed</p>` : "";

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
                    <div class="settings-photo-body">
                        <form method="post" action="/admin/settings/photo" enctype="multipart/form-data" class="settings-photo-form">
                            ${TopError(photoError)}
                            <input type="file" name="photo" accept="image/*" data-max-bytes="${MAX_UPLOAD_BYTES}" required class="form-input" />
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary">${user.photo ? "Replace photo" : "Upload photo"}</button>
                                ${removeButton}
                            </div>
                        </form>
                        ${removeForm}
                    </div>
                </div>
            </section>
            <section class="admin-card">
                <h2 class="admin-h2">Password</h2>
                <p class="row-sub settings-hint">Changing it signs out every other session.</p>
                <form method="post" action="/admin/settings/password" class="admin-form">
                    ${TopError(passwordTopError)}
                    ${changed}
                    ${Field({name: "currentPassword", label: "Current password", type: "password", error: e.currentPassword, required: true, autocomplete: "current-password"})}
                    ${Field({name: "newPassword", label: "New password", type: "password", error: e.newPassword, required: true, autocomplete: "new-password"})}
                    ${Field({name: "confirmPassword", label: "Confirm new password", type: "password", error: e.confirmPassword, required: true, autocomplete: "new-password"})}
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Change password</button>
                    </div>
                </form>
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
