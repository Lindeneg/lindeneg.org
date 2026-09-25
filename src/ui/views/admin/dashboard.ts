import type {User} from "../../../repositories/user-repository.js";
import type {DashboardCounts} from "../../../services/dashboard-service.js";
import {AdminLayout} from "../../components/layout.js";
import {PageHeader} from "../../components/page-header.js";

export type DashboardViewProps = {
    user: User;
    currentPath: string;
    counts: DashboardCounts;
};

function statCard(label: string, value: number, href: string, hint?: string): string {
    const hintHtml = hint ? `<p class="stat-hint">${hint}</p>` : "";
    return `
        <a href="${href}" class="stat-card">
            <p class="stat-label">${label}</p>
            <p class="stat-value">${value}</p>
            ${hintHtml}
        </a>
    `;
}

export function DashboardView({user, currentPath, counts}: DashboardViewProps): string {
    return AdminLayout({
        title: "Dashboard",
        user,
        currentPath,
        children: `
            ${PageHeader({title: "Dashboard"})}
            <div class="stat-grid">
                ${statCard("Pages", counts.pages, "/admin/pages")}
                ${statCard("Posts", counts.posts, "/admin/blog")}
                ${statCard("Messages", counts.messages, "/admin/messages", counts.unreadMessages > 0 ? `${counts.unreadMessages} unread` : "All read")}
            </div>
            <div class="quick-actions">
                <a href="/admin/pages/new" class="btn btn-primary">New page</a>
                <a href="/admin/blog/new" class="btn btn-primary">New post</a>
                <a href="/" class="btn btn-ghost" target="_blank" rel="noopener noreferrer">View site</a>
            </div>
        `,
    });
}
