import type {User} from "../../../repositories/user-repository.js";
import type {PageWithSections} from "../../../repositories/page-repository.js";
import type {Paginated} from "../../../lib/pagination.js";
import {esc, localDate} from "../../lib.js";
import {AdminLayout} from "../../components/layout.js";
import {ConfirmForm} from "../../components/confirm-form.js";
import {PageHeader} from "../../components/page-header.js";
import {Pagination} from "../../components/pagination.js";

export type PagesListViewProps = {
    user: User;
    currentPath: string;
    pages: Paginated<PageWithSections>;
};

function row(p: PageWithSections): string {
    return `
        <tr>
            <td>
                <a href="/admin/pages/${esc(p.id)}/edit" class="row-link">${esc(p.name)}</a>
                <p class="row-sub">/${esc(p.slug)} · ${p.sections.length} section${p.sections.length === 1 ? "" : "s"}</p>
            </td>
            <td>${localDate(p.updatedAt)}</td>
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

export function PagesListView({user, currentPath, pages}: PagesListViewProps): string {
    const body =
        pages.data.length === 0
            ? `<p class="empty-state">No pages yet. <a href="/admin/pages/new">Create one</a>.</p>`
            : `
                <table class="admin-table">
                    <thead>
                        <tr><th>Name</th><th>Updated</th><th>Status</th><th></th></tr>
                    </thead>
                    <tbody>${pages.data.map(row).join("")}</tbody>
                </table>
                ${Pagination({page: pages.page, totalPages: pages.totalPages, basePath: "/admin/pages", buttonClass: "btn btn-ghost btn-sm"})}
            `;
    return AdminLayout({
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
