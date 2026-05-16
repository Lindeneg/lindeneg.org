import type {Post, User} from "@prisma/client";
import {esc, formatDate} from "../../lib.js";
import {AdminShell} from "../layout.js";
import {ConfirmForm, PageHeader, Pagination} from "../components.js";

export type BlogListViewProps = {
    user: User;
    currentPath: string;
    posts: (Post & {author: User})[];
    page: number;
    totalPages: number;
};

function row(p: Post & {author: User}): string {
    return `
        <tr>
            <td>
                <a href="/admin/blog/${esc(p.id)}/edit" class="row-link">${esc(p.title)}</a>
                <p class="row-sub">/${esc(p.slug)} · ${esc(p.author.name)}</p>
            </td>
            <td>${esc(formatDate(p.updatedAt))}</td>
            <td>
                <span class="badge ${p.published ? "badge-on" : "badge-off"}">${p.published ? "Published" : "Draft"}</span>
            </td>
            <td class="row-actions">
                <a href="/admin/blog/${esc(p.id)}/edit" class="btn btn-ghost btn-sm">Edit</a>
                ${ConfirmForm({action: `/admin/blog/${p.id}/delete`, confirm: `Delete post "${p.title}"?`, label: "Delete", variant: "danger"})}
            </td>
        </tr>
    `;
}

export function BlogListView({user, currentPath, posts, page, totalPages}: BlogListViewProps): string {
    const body =
        posts.length === 0
            ? `<p class="empty-state">No posts yet. <a href="/admin/blog/new">Create one</a>.</p>`
            : `
                <table class="admin-table">
                    <thead>
                        <tr><th>Title</th><th>Updated</th><th>Status</th><th></th></tr>
                    </thead>
                    <tbody>${posts.map(row).join("")}</tbody>
                </table>
                ${Pagination({page, totalPages, basePath: "/admin/blog"})}
            `;
    return AdminShell({
        title: "Blog",
        user,
        currentPath,
        children: `
            ${PageHeader({
                title: "Blog",
                right: `<a href="/admin/blog/new" class="btn btn-primary">New post</a>`,
            })}
            ${body}
        `,
    });
}
