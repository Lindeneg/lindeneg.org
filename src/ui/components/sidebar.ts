import {icon, type IconName} from "../icons.js";
import {esc, isActive} from "../lib.js";

export type SidebarItem = {href: string; label: string; iconName: IconName};

export type SidebarProps = {
    brand: {href: string; label: string};
    items: SidebarItem[];
    currentPath: string;
};

export function Sidebar({brand, items, currentPath}: SidebarProps): string {
    const links = items
        .map((item) => {
            const active = isActive(item.href, currentPath, brand.href) ? ` aria-current="page"` : "";
            return `<a href="${esc(item.href)}" class="admin-side-link"${active}>${icon(item.iconName)}<span>${esc(item.label)}</span></a>`;
        })
        .join("");
    return `
        <aside class="admin-sidebar">
            <a href="${esc(brand.href)}" class="admin-brand">${esc(brand.label)}</a>
            <nav class="admin-side-nav">${links}</nav>
        </aside>
    `;
}
