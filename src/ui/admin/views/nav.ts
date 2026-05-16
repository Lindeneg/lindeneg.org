import type {Navigation, NavigationItem, User} from "@prisma/client";
import {esc} from "../../lib.js";
import {AdminShell} from "../layout.js";
import {ConfirmForm, Field, PageHeader, TopError} from "../components.js";

export type NavViewProps = {
    user: User;
    currentPath: string;
    nav: Navigation & {items: NavigationItem[]};
    brandValues?: {brandName?: string};
    brandErrors?: Record<string, string>;
    brandTopError?: string;
};

function itemRow(item: NavigationItem): string {
    return `
        <tr>
            <td>${esc(item.name)}</td>
            <td><code>${esc(item.href)}</code></td>
            <td>${item.position}</td>
            <td>${esc(item.alignment)}</td>
            <td>${item.newTab ? "Yes" : "No"}</td>
            <td class="row-actions">
                <a href="/admin/nav-items/${esc(item.id)}/edit" class="btn btn-ghost btn-sm">Edit</a>
                ${ConfirmForm({action: `/admin/nav-items/${item.id}/delete`, confirm: `Delete "${item.name}"?`, label: "Delete", variant: "danger"})}
            </td>
        </tr>
    `;
}

export function NavView({user, currentPath, nav, brandValues, brandErrors, brandTopError}: NavViewProps): string {
    const items = [...nav.items].sort((a, b) => a.position - b.position);
    const e = brandErrors ?? {};
    const v = brandValues ?? {brandName: nav.brandName};

    const itemsBlock =
        items.length === 0
            ? `<p class="empty-state">No nav items yet. <a href="/admin/nav-items/new">Add one</a>.</p>`
            : `
                <table class="admin-table">
                    <thead>
                        <tr><th>Name</th><th>Href</th><th>Pos</th><th>Align</th><th>New tab</th><th></th></tr>
                    </thead>
                    <tbody>${items.map(itemRow).join("")}</tbody>
                </table>
            `;

    return AdminShell({
        title: "Navigation",
        user,
        currentPath,
        children: `
            ${PageHeader({title: "Navigation"})}
            <section class="admin-card">
                <h2 class="admin-h2">Brand</h2>
                ${TopError(brandTopError)}
                <form method="post" action="/admin/navigation" class="admin-form-inline">
                    ${Field({name: "brandName", label: "Brand name", value: v.brandName, error: e.brandName, required: true})}
                    <button type="submit" class="btn btn-primary">Save</button>
                </form>
            </section>
            <section class="admin-card">
                <div class="admin-sections-head">
                    <h2 class="admin-h2">Items</h2>
                    <a href="/admin/nav-items/new" class="btn btn-primary btn-sm">New item</a>
                </div>
                ${itemsBlock}
            </section>
        `,
    });
}
