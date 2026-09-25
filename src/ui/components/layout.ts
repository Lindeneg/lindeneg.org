import type {NavigationWithItems} from "../../repositories/navigation-repository.js";
import type {User} from "../../repositories/user-repository.js";
import type {MaybeNull} from "../../lib/types.js";
import {esc} from "../lib.js";
import {Nav} from "./nav.js";
import {Footer} from "./footer.js";
import {Sidebar, type SidebarItem} from "./sidebar.js";
import {Topbar} from "./topbar.js";

// third-party scripts are pinned to a version and checked against their hash
type Script = {src: string; integrity: string};

type HeadProps = {
    title: string;
    description?: MaybeNull<string>;
    styles: string[];
    scripts?: Script[];
    // extra tags for the head: the public site's seo tags, or noindex for the admin
    meta?: string;
};

const NOINDEX = `<meta name="robots" content="noindex" />`;

function head({title, description, styles, scripts = [], meta = ""}: HeadProps): string {
    const desc = description ? `<meta name="description" content="${esc(description)}" />` : "";
    return `
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <!-- lets the browser paint the blank page between navigations dark when the os is, before the css has loaded -->
    <meta name="color-scheme" content="light dark" />
    ${desc}
    ${meta}
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    ${styles.map((href) => `<link rel="stylesheet" href="${href}" />`).join("\n    ")}
    ${scripts.map((s) => `<script src="${s.src}" integrity="${s.integrity}" crossorigin="anonymous"></script>`).join("\n    ")}
    <script src="/theme-boot.js"></script>
    <script src="/local-dates.js" defer></script>
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

export type Article = {
    publishedTime: Date;
    modifiedTime: Date;
    tags: string[];
};

export type SiteLayoutProps = Shell & {
    description?: MaybeNull<string>;
    // absolute url of the page, for the canonical link and og:url
    canonical?: string;
    image?: MaybeNull<string>;
    article?: Article;
    jsonLd?: Record<string, unknown>;
    nav: NavigationWithItems;
    currentPath: string;
};

function property(name: string, content: string): string {
    return `<meta property="${name}" content="${esc(content)}" />`;
}

// canonical link, feed link, open graph and twitter tags, and structured data for search engines and link previews
function siteMeta(
    {title, description, canonical, image, article, jsonLd}: Omit<SiteLayoutProps, "nav" | "currentPath" | "children">,
    brand: string
): string {
    const tags = [
        canonical ? `<link rel="canonical" href="${esc(canonical)}" />` : "",
        `<link rel="alternate" type="application/rss+xml" title="${esc(`Blog — ${brand}`)}" href="/blog/feed.xml" />`,
        property("og:site_name", brand),
        property("og:title", title),
        description ? property("og:description", description) : "",
        canonical ? property("og:url", canonical) : "",
        property("og:type", article ? "article" : "website"),
        image ? property("og:image", image) : "",
        article ? property("article:published_time", article.publishedTime.toISOString()) : "",
        article ? property("article:modified_time", article.modifiedTime.toISOString()) : "",
        ...(article?.tags ?? []).map((tag) => property("article:tag", tag)),
        `<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}" />`,
        // < is escaped so the json can't close the script tag
        jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>` : "",
    ];
    return tags.filter(Boolean).join("\n    ");
}

export function SiteLayout(props: SiteLayoutProps): string {
    const {title, description, nav, currentPath, children} = props;
    return document(
        head({
            title,
            description,
            styles: ["/highlight-github-dark.css", "/styles.css"],
            meta: siteMeta(props, nav.brandName),
        }),
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
        head({title, styles: ADMIN_STYLES, meta: NOINDEX}),
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
        head({title, styles: ADMIN_STYLES, meta: NOINDEX}),
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
            meta: NOINDEX,
            styles: [...ADMIN_STYLES, "/highlight-github-dark.css"],
            scripts: [
                {
                    src: "https://cdn.jsdelivr.net/npm/marked@18.0.14/lib/marked.umd.js",
                    integrity: "sha384-2vpGtuKqJvFlwJqYnf/wUMuzUfhUnYBt9oay0e2yaFcq0Dh6/aEbQ8YAOeKGzlYo",
                },
                {
                    src: "https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.12.0/highlight.min.js",
                    integrity: "sha384-wjfDDhOPPdjtva8vWBhWeVprSpmxisEu5aYT3q1JyACqXpdKpo3PWZTMVq24MBix",
                },
            ],
        }),
        `
    ${headerBar}
    <div class="admin-editor-body-inner">${children}</div>
    <script src="/admin.js" defer></script>`,
        "admin-editor-body"
    );
}
