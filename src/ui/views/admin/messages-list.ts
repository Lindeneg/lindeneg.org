import type {ContactMessage} from "@prisma/client";
import type {User} from "../../../repositories/user-repository.js";
import type {Paginated} from "../../../lib/pagination.js";
import {esc, formatDate} from "../../lib.js";
import {AdminLayout} from "../../components/layout.js";
import {ConfirmForm} from "../../components/confirm-form.js";
import {PageHeader} from "../../components/page-header.js";
import {Pagination} from "../../components/pagination.js";

export type MessagesListViewProps = {
    user: User;
    currentPath: string;
    messages: Paginated<ContactMessage>;
};

function row(m: ContactMessage): string {
    return `
        <details class="message-row ${m.read ? "" : "is-unread"}">
            <summary class="message-summary">
                <div class="message-head">
                    <span class="message-name">${esc(m.name)}</span>
                    <span class="row-sub">${esc(m.email)} · ${esc(formatDate(m.createdAt, "long"))}</span>
                </div>
                <span class="badge ${m.read ? "badge-off" : "badge-on"}">${m.read ? "Read" : "Unread"}</span>
            </summary>
            <div class="message-body">
                <pre class="message-text">${esc(m.message)}</pre>
                <div class="row-actions">
                    <form method="post" action="/admin/messages/${esc(m.id)}/toggle-read" class="inline-form">
                        <button type="submit" class="btn btn-ghost btn-sm">${m.read ? "Mark unread" : "Mark read"}</button>
                    </form>
                    ${ConfirmForm({action: `/admin/messages/${m.id}/delete`, confirm: `Delete message from ${m.name}?`, label: "Delete", variant: "danger"})}
                </div>
            </div>
        </details>
    `;
}

export function MessagesListView({user, currentPath, messages}: MessagesListViewProps): string {
    const body =
        messages.data.length === 0
            ? `<p class="empty-state">No messages yet.</p>`
            : `
                <div class="message-list">${messages.data.map(row).join("")}</div>
                ${Pagination({page: messages.page, totalPages: messages.totalPages, basePath: "/admin/messages", buttonClass: "btn btn-ghost btn-sm"})}
            `;
    return AdminLayout({
        title: "Messages",
        user,
        currentPath,
        children: `
            ${PageHeader({title: "Messages"})}
            ${body}
        `,
    });
}
