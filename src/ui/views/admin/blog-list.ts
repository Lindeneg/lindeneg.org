import type {User} from "../../../repositories/user-repository.js";
import type {PostWithAuthor} from "../../../repositories/post-repository.js";
import type {Paginated} from "../../../lib/pagination.js";
import {esc, formatDate} from "../../lib.js";
import {AdminLayout} from "../../components/layout.js";
import {ConfirmForm} from "../../components/confirm-form.js";
import {PageHeader} from "../../components/page-header.js";
import {Pagination} from "../../components/pagination.js";

export type BlogListViewProps = {
    user: User;
    currentPath: string;
    posts: Paginated<PostWithAuthor>;
};

function row(p: PostWithAuthor): string {
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

export function BlogListView({user, currentPath, posts}: BlogListViewProps): string {
    const body =
        posts.data.length === 0
            ? `<p class="empty-state">No posts yet. <a href="/admin/blog/new">Create one</a>.</p>`
            : `
                <table class="admin-table">
                    <thead>
                        <tr><th>Title</th><th>Updated</th><th>Status</th><th></th></tr>
                    </thead>
                    <tbody>${posts.data.map(row).join("")}</tbody>
                </table>
                ${Pagination({page: posts.page, totalPages: posts.totalPages, basePath: "/admin/blog", buttonClass: "btn btn-ghost btn-sm"})}
            `;
    return AdminLayout({
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
