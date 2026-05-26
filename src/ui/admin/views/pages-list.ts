import type {Page, PageSection, User} from "@prisma/client";
import {esc, formatDate} from "../../lib.js";
import {AdminShell} from "../layout.js";
import {ConfirmForm, PageHeader, Pagination} from "../components.js";

export type PagesListViewProps = {
    user: User;
    currentPath: string;
    pages: (Page & {sections: PageSection[]})[];
    page: number;
    totalPages: number;
};

function row(p: Page & {sections: PageSection[]}): string {
    return `
        <tr>
            <td>
                <a href="/admin/pages/${esc(p.id)}/edit" class="row-link">${esc(p.name)}</a>
                <p class="row-sub">/${esc(p.slug)} · ${p.sections.length} section${p.sections.length === 1 ? "" : "s"}</p>
            </td>
            <td>${esc(formatDate(p.updatedAt))}</td>
            <td>
                <span class="badge ${p.published ? "badge-on" : "badge-off"}">${p.published ? "Published" : "Draft"}</span>
            </td>
            <td class="row-actions">
                <a href="/admin/pages/${esc(p.id)}/edit" class="btn btn-ghost btn-sm">Edit</a>
                ${ConfirmForm({action: `/admin/pages/${p.id}/delete`, confirm: `Delete page "${p.name}"?`, label: "Delete", variant: "danger"})}
            </td>
        </tr>
    `;
}

export function PagesListView({user, currentPath, pages, page, totalPages}: PagesListViewProps): string {
    const body =
        pages.length === 0
            ? `<p class="empty-state">No pages yet. <a href="/admin/pages/new">Create one</a>.</p>`
            : `
                <table class="admin-table">
                    <thead>
                        <tr><th>Name</th><th>Updated</th><th>Status</th><th></th></tr>
                    </thead>
                    <tbody>${pages.map(row).join("")}</tbody>
                </table>
                ${Pagination({page, totalPages, basePath: "/admin/pages"})}
            `;
    return AdminShell({
        title: "Pages",
        user,
        currentPath,
        children: `
            ${PageHeader({
                title: "Pages",
                right: `<a href="/admin/pages/new" class="btn btn-primary">New page</a>`,
            })}
            ${body}
        `,
    });
}
