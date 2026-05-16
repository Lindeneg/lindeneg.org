import {icon, type IconName} from "../icons.js";
import {esc, normalizePath} from "../lib.js";

type Item = {href: string; label: string; iconName: IconName};

const ITEMS: Item[] = [
    {href: "/admin", label: "Dashboard", iconName: "dashboard"},
    {href: "/admin/pages", label: "Pages", iconName: "file"},
    {href: "/admin/navigation", label: "Navigation", iconName: "nav"},
    {href: "/admin/blog", label: "Blog", iconName: "post"},
    {href: "/admin/messages", label: "Messages", iconName: "mail"},
    {href: "/admin/settings", label: "Settings", iconName: "settings"},
];

function isAdminActive(itemHref: string, currentPath: string): boolean {
    const item = normalizePath(itemHref);
    const cur = normalizePath(currentPath);
    if (item === "/admin") return cur === "/admin";
    return cur === item || cur.startsWith(item + "/");
}

export function Sidebar(currentPath: string): string {
    const items = ITEMS.map((item) => {
        const active = isAdminActive(item.href, currentPath) ? ` aria-current="page"` : "";
        return `<a href="${item.href}" class="admin-side-link"${active}>${icon(item.iconName)}<span>${esc(item.label)}</span></a>`;
    }).join("");
    return `
        <aside class="admin-sidebar">
            <a href="/admin" class="admin-brand">Admin</a>
            <nav class="admin-side-nav">${items}</nav>
        </aside>
    `;
}
