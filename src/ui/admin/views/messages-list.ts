import type {ContactMessage, User} from "@prisma/client";
import {esc, formatDate} from "../../lib.js";
import {AdminShell} from "../layout.js";
import {ConfirmForm, PageHeader, Pagination} from "../components.js";

export type MessagesListViewProps = {
    user: User;
    currentPath: string;
    messages: ContactMessage[];
    page: number;
    totalPages: number;
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

export function MessagesListView({user, currentPath, messages, page, totalPages}: MessagesListViewProps): string {
    const body =
        messages.length === 0
            ? `<p class="empty-state">No messages yet.</p>`
            : `
                <div class="message-list">${messages.map(row).join("")}</div>
                ${Pagination({page, totalPages, basePath: "/admin/messages"})}
            `;
    return AdminShell({
        title: "Messages",
        user,
        currentPath,
        children: `
            ${PageHeader({title: "Messages"})}
            ${body}
        `,
    });
}
