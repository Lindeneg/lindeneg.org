import type {NavigationWithItems} from "../../repositories/navigation-repository.js";
import type {User} from "../../repositories/user-repository.js";
import type {MaybeNull} from "../../lib/types.js";
import {esc} from "../lib.js";
import {Nav} from "./nav.js";
import {Footer} from "./footer.js";
import {Sidebar, type SidebarItem} from "./sidebar.js";
import {Topbar} from "./topbar.js";

type HeadProps = {
    title: string;
    description?: MaybeNull<string>;
    styles: string[];
    scripts?: string[];
};

function head({title, description, styles, scripts = []}: HeadProps): string {
    const desc = description ? `<meta name="description" content="${esc(description)}" />` : "";
    return `
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    ${desc}
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap" />
    ${styles.map((href) => `<link rel="stylesheet" href="${href}" />`).join("\n    ")}
    ${scripts.map((src) => `<script src="${src}"></script>`).join("\n    ")}
    <script src="/theme-boot.js"></script>
    <title>${esc(title)}</title>`;
}

function document(headHtml: string, body: string, bodyClass?: string): string {
    const cls = bodyClass ? ` class="${bodyClass}"` : "";
    return `<!doctype html>
<html lang="en">
<head>${headHtml}
</head>
<body${cls}>
    ${body}
</body>
</html>`;
}

type Shell = {
    title: string;
    children: string;
};

export type SiteLayoutProps = Shell & {
    description?: MaybeNull<string>;
    nav: NavigationWithItems;
    currentPath: string;
};

export function SiteLayout({title, description, nav, currentPath, children}: SiteLayoutProps): string {
    return document(
        head({title, description, styles: ["/highlight-github-dark.css", "/styles.css"]}),
        `
    ${Nav(nav, currentPath)}
    <main class="site-main">${children}</main>
    ${Footer()}
    <script src="/client.js" defer></script>`
    );
}

const ADMIN_STYLES = ["/styles.css", "/admin.css"];

const ADMIN_ITEMS: SidebarItem[] = [
    {href: "/admin", label: "Dashboard", iconName: "dashboard"},
    {href: "/admin/pages", label: "Pages", iconName: "file"},
    {href: "/admin/navigation", label: "Navigation", iconName: "nav"},
    {href: "/admin/blog", label: "Blog", iconName: "post"},
    {href: "/admin/messages", label: "Messages", iconName: "mail"},
    {href: "/admin/settings", label: "Settings", iconName: "settings"},
];

export type AdminLayoutProps = Shell & {
    user: User;
    currentPath: string;
};

export function AdminLayout({title, user, currentPath, children}: AdminLayoutProps): string {
    return document(
        head({title, styles: ADMIN_STYLES}),
        `
    ${Sidebar({brand: {href: "/admin", label: "Admin"}, items: ADMIN_ITEMS, currentPath})}
    <div class="admin-main">
        ${Topbar({user, logoutAction: "/admin/logout"})}
        <div class="admin-content">${children}</div>
    </div>
    <script src="/admin.js" defer></script>`,
        "admin-body"
    );
}

export function AuthLayout({title, children}: Shell): string {
    return document(
        head({title, styles: ADMIN_STYLES}),
        `<main class="admin-auth-main">${children}</main>`,
        "admin-auth-body"
    );
}

export type EditorLayoutProps = Shell & {
    headerBar: string;
};

export function EditorLayout({title, headerBar, children}: EditorLayoutProps): string {
    return document(
        head({
            title,
            styles: [...ADMIN_STYLES, "/highlight-github-dark.css"],
            scripts: [
                "https://cdn.jsdelivr.net/npm/marked@18.0.3/lib/marked.umd.js",
                "https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.11.1/highlight.min.js",
            ],
        }),
        `
    ${headerBar}
    <div class="admin-editor-body-inner">${children}</div>
    <script src="/admin.js" defer></script>`,
        "admin-editor-body"
    );
}
