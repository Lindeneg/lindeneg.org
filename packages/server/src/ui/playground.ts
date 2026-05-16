import {marked} from "marked";
import sanitizeHtml from "sanitize-html";
import {
    DEFAULT_PAGE_SIZE,
    success,
    failure,
    type NavigationResponse,
    type NavigationItemResponse,
    type PageResponse,
    type Paginated,
    type PostResponse,
    type PostSummaryResponse,
    type Result,
    type UserResponse,
} from "@lindeneg/shared";
import type PageService from "../services/page-service.js";
import type LoggerService from "../services/logger-service.js";
import type NavigationService from "../services/navigation-service.js";
import type PostService from "../services/post-service.js";

// --- sanitize (markdown content only) --------------------------------------

const MD_SANITIZE: sanitizeHtml.IOptions = {
    allowedTags: [
        "h1", "h2", "h3", "h4", "h5", "h6",
        "p", "blockquote", "hr", "br",
        "strong", "em", "code", "pre",
        "ul", "ol", "li",
        "a", "img",
        "table", "thead", "tbody", "tr", "th", "td",
        "span", "div",
        "iframe",
    ],
    allowedAttributes: {
        "*": ["id", "class"],
        a: ["href", "target", "rel"],
        img: ["src", "alt", "loading"],
        iframe: [
            "src",
            "title",
            "width",
            "height",
            "frameborder",
            "allow",
            "allowfullscreen",
            "loading",
            "referrerpolicy",
        ],
    },
    allowedIframeHostnames: [
        "www.youtube.com",
        "youtube.com",
        "www.youtube-nocookie.com",
        "youtube-nocookie.com",
    ],
    transformTags: {
        a: (tagName, attribs) => {
            const href = attribs.href ?? "";
            if (/^https?:\/\//i.test(href)) {
                return {tagName, attribs: {...attribs, target: "_blank", rel: "noopener noreferrer"}};
            }
            return {tagName, attribs};
        },
        img: (tagName, attribs) => ({tagName, attribs: {...attribs, loading: "lazy"}}),
        iframe: (tagName, attribs) => ({tagName, attribs: {...attribs, loading: "lazy"}}),
    },
};

function md(content: string): string {
    return sanitizeHtml(marked.parse(content, {async: false}), MD_SANITIZE);
}

function esc(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// --- shared chrome ---------------------------------------------------------

const ICON_SUN = `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>`;

const ICON_MOON = `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

const ICON_MENU = `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`;

const ICON_CLOSE = `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

const ICON_EXT = `<svg class="icon icon-ext" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;

const ICON_GITHUB = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>`;

const ICON_LINKEDIN = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`;

function normalizePath(p: string): string {
    if (!p) return "/";
    const lower = p.toLowerCase();
    return lower.length > 1 && lower.endsWith("/") ? lower.slice(0, -1) : lower;
}

function isActive(itemHref: string, currentPath: string): boolean {
    if (/^https?:\/\//i.test(itemHref)) return false;
    const item = normalizePath(itemHref);
    const cur = normalizePath(currentPath);
    if (item === "/") return cur === "/";
    return cur === item || cur.startsWith(item + "/");
}

function navLink(item: NavigationItemResponse, currentPath: string, mobile = false): string {
    const isExternal = item.newTab || /^https?:\/\//i.test(item.href);
    const target = isExternal ? ` target="_blank" rel="noopener noreferrer"` : "";
    const current = isActive(item.href, currentPath) ? ` aria-current="page"` : "";
    const cls = mobile ? "nav-link nav-link--mobile" : "nav-link";
    const ext = isExternal ? ICON_EXT : "";
    return `<a href="${esc(item.href)}" class="${cls}"${target}${current}>${esc(item.name)}${ext}</a>`;
}

function Nav(nav: NavigationResponse, currentPath: string): string {
    const sorted = [...nav.items].sort((a, b) => a.position - b.position);
    const left = sorted.filter((i) => i.alignment?.toUpperCase() === "LEFT");
    const right = sorted.filter((i) => i.alignment?.toUpperCase() !== "LEFT");

    const leftDesktop = left.map((i) => navLink(i, currentPath)).join("");
    const rightDesktop = right.map((i) => navLink(i, currentPath)).join("");
    const allMobile = sorted.map((i) => navLink(i, currentPath, true)).join("");

    return `
        <nav class="site-nav">
            <div class="site-nav-inner">
                <div class="site-nav-group">
                    <a href="/" class="site-brand">${esc(nav.brandName)}</a>
                    <div class="site-nav-items site-nav-items--desktop">${leftDesktop}</div>
                </div>
                <div class="site-nav-group">
                    <div class="site-nav-items site-nav-items--desktop">${rightDesktop}</div>
                    <button class="icon-btn" type="button" data-theme-toggle aria-label="Toggle theme">
                        <span class="icon-slot icon-slot--sun">${ICON_SUN}</span>
                        <span class="icon-slot icon-slot--moon">${ICON_MOON}</span>
                    </button>
                    <button class="icon-btn site-mobile-toggle" type="button" data-mobile-open aria-label="Open menu">
                        ${ICON_MENU}
                    </button>
                </div>
            </div>
        </nav>
        <div class="mobile-drawer" data-mobile-drawer hidden>
            <div class="mobile-drawer-overlay" data-mobile-close></div>
            <aside class="mobile-drawer-panel" role="dialog" aria-modal="true" aria-label="Site navigation">
                <div class="mobile-drawer-head">
                    <span class="mobile-drawer-title">${esc(nav.brandName)}</span>
                    <button class="icon-btn" type="button" data-mobile-close aria-label="Close menu">${ICON_CLOSE}</button>
                </div>
                <div class="mobile-drawer-items">${allMobile}</div>
            </aside>
        </div>
    `;
}

function Footer(): string {
    return `
        <footer class="site-footer">
            <div class="site-footer-inner">
                <p class="site-footer-copy">&copy; Christian Lindeneg ${new Date().getFullYear()}</p>
                <div class="site-footer-social">
                    <a href="https://github.com/lindeneg" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="GitHub">${ICON_GITHUB}</a>
                    <a href="https://www.linkedin.com/in/christian-l-954960190/" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="LinkedIn">${ICON_LINKEDIN}</a>
                </div>
            </div>
        </footer>
    `;
}

const THEME_BOOT = `(function(){try{var t=localStorage.getItem('theme');var p=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(!t&&p))document.documentElement.classList.add('dark');}catch(e){}})();`;

type LayoutProps = {
    title: string;
    description?: string | null;
    nav: NavigationResponse;
    currentPath: string;
    children: string;
};

function Layout({title, description, nav, currentPath, children}: LayoutProps): string {
    const desc = description ? `<meta name="description" content="${esc(description)}" />` : "";
    return `<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    ${desc}
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap" />
    <link rel="stylesheet" href="/styles.css" />
    <title>${esc(title)}</title>
    <script>${THEME_BOOT}</script>
</head>
<body>
    ${Nav(nav, currentPath)}
    <main class="site-main">${children}</main>
    ${Footer()}
    <script src="/client.js" defer></script>
</body>
</html>`;
}

// --- formatting helpers ----------------------------------------------------

const SHORT_DATE: Intl.DateTimeFormatOptions = {month: "short", day: "numeric", year: "numeric"};
const LONG_DATE: Intl.DateTimeFormatOptions = {month: "long", day: "numeric", year: "numeric"};

function formatDate(date: string, style: "short" | "long" = "short"): string {
    return new Date(date).toLocaleDateString("en-US", style === "long" ? LONG_DATE : SHORT_DATE);
}

function readingTime(content: string): string {
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.round(words / 200));
    return `${minutes} min read`;
}

function initials(name: string): string {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

function authorAvatar(author: UserResponse, size = "md"): string {
    const cls = `author-avatar author-avatar--${size}`;
    if (author.photo) {
        return `<img src="${esc(author.photo)}" alt="${esc(author.name)}" class="${cls}" loading="lazy" />`;
    }
    return `<div class="${cls} author-avatar--initials">${esc(initials(author.name))}</div>`;
}

const ICON_ARROW_LEFT = `<svg class="icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`;

// --- blog templates --------------------------------------------------------

function PostCard(post: PostSummaryResponse): string {
    const thumb = post.thumbnail
        ? `<div class="post-card-thumb"><img src="${esc(post.thumbnail)}" alt="${esc(post.title)}" loading="lazy" /></div>`
        : "";
    return `
        <a href="/blog/${esc(post.slug)}" class="post-card">
            ${thumb}
            <div class="post-card-body">
                <h2 class="post-card-title">${esc(post.title)}</h2>
                <p class="post-card-author">${esc(post.author.name)}</p>
                <p class="post-card-date">${esc(formatDate(post.createdAt))}</p>
            </div>
        </a>
    `;
}

function Pagination(page: number, totalPages: number): string {
    if (totalPages <= 1) return "";
    const prev = page > 1 ? `<a href="/blog?page=${page - 1}" class="pager-btn">Previous</a>` : `<span class="pager-btn is-disabled">Previous</span>`;
    const next = page < totalPages ? `<a href="/blog?page=${page + 1}" class="pager-btn">Next</a>` : `<span class="pager-btn is-disabled">Next</span>`;
    return `
        <div class="pager">
            ${prev}
            <span class="pager-info">Page ${page} of ${totalPages}</span>
            ${next}
        </div>
    `;
}

type BlogListProps = {
    posts: Paginated<PostSummaryResponse>;
    nav: NavigationResponse;
    currentPath: string;
};

function BlogList({posts, nav, currentPath}: BlogListProps): string {
    const body =
        posts.data.length === 0
            ? `<div class="empty-state">No posts yet. Check back soon.</div>`
            : `
                <div class="post-grid">${posts.data.map(PostCard).join("")}</div>
                ${Pagination(posts.page, posts.totalPages)}
            `;
    return Layout({
        title: "Blog — Lindeneg",
        nav,
        currentPath,
        children: `
            <h1 class="blog-title">Blog</h1>
            ${body}
        `,
    });
}

type BlogPostProps = {
    post: PostResponse;
    nav: NavigationResponse;
    currentPath: string;
};

function BlogPost({post, nav, currentPath}: BlogPostProps): string {
    return Layout({
        title: `${post.title} — Lindeneg`,
        nav,
        currentPath,
        children: `
            <article class="blog-post">
                <a href="/blog" class="back-link">${ICON_ARROW_LEFT}<span>Back to blog</span></a>
                <header class="blog-post-header">
                    <h1 class="blog-post-title">${esc(post.title)}</h1>
                    <div class="blog-post-meta">
                        ${authorAvatar(post.author, "md")}
                        <div>
                            <p class="blog-post-author">${esc(post.author.name)}</p>
                            <p class="blog-post-byline">${esc(formatDate(post.createdAt, "long"))} &middot; ${esc(readingTime(post.content))}</p>
                        </div>
                    </div>
                </header>
                <div class="markdown">${md(post.content)}</div>
            </article>
        `,
    });
}

// --- pages -----------------------------------------------------------------

type PageProps = {
    page: PageResponse;
    nav: NavigationResponse;
    currentPath: string;
};

function Page({page, nav, currentPath}: PageProps): string {
    const sections = [...page.sections]
        .filter((s) => s.published)
        .sort((a, b) => a.position - b.position)
        .map((s) => `<section class="page-section markdown">${md(s.content)}</section>`)
        .join("");
    return Layout({
        title: page.title,
        description: page.description,
        nav,
        currentPath,
        children: `<div class="page-sections">${sections}</div>`,
    });
}

function NotFound(nav: NavigationResponse, currentPath: string): string {
    return Layout({
        title: "Not Found — Lindeneg",
        nav,
        currentPath,
        children: `
            <div class="not-found">
                <h1 class="not-found-title">404</h1>
                <p class="not-found-text">This page doesn't exist.</p>
                <a href="/" class="not-found-link">Go home</a>
            </div>
        `,
    });
}

interface Serializeable {
    serialize(): string;
}

const TEMPLATE_ERR = {
    PAGE_NOT_FOUND: 0,
    NAV_NOT_FOUND: 1,
    POST_NOT_FOUND: 2,
    BLOG_LIST_ERROR: 3,
};

type TemplateError = (typeof TEMPLATE_ERR)[keyof typeof TEMPLATE_ERR];

export class TemplateService {
    // TODO think about invalidation, TTL etc..
    #cache: Map<string, string> = new Map();

    constructor(
        private readonly pageService: PageService,
        private readonly navigationService: NavigationService,
        private readonly postService: PostService,
        private readonly logger: LoggerService
    ) {}

    async getPage(
        name: string,
        currentPath: string,
        ctx?: Serializeable
    ): Promise<Result<string, TemplateError>> {
        const key = (ctx ? name + ":" + ctx.serialize() : name) + "@" + currentPath;
        const current = this.#cache.get(key);
        if (current) return success(current);

        const [pageResult, navResult] = await Promise.all([
            this.pageService.getPageBySlug(name, true),
            this.navigationService.getNavigation(),
        ]);

        if (!navResult.ok) {
            this.logger.error(navResult.ctx);
            return failure(TEMPLATE_ERR.NAV_NOT_FOUND);
        }

        if (!pageResult.ok) {
            this.logger.error(pageResult.ctx);
            return failure(TEMPLATE_ERR.PAGE_NOT_FOUND);
        }

        const html = Page({page: pageResult.data, nav: navResult.data, currentPath});
        this.#cache.set(key, html);
        return success(html);
    }

    async getBlogList(
        page: number,
        currentPath: string
    ): Promise<Result<string, TemplateError>> {
        const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
        const key = `blog:list:${safePage}@${currentPath}`;
        const current = this.#cache.get(key);
        if (current) return success(current);

        const [postsResult, navResult] = await Promise.all([
            this.postService.listPosts({page: safePage, pageSize: DEFAULT_PAGE_SIZE}, true),
            this.navigationService.getNavigation(),
        ]);

        if (!navResult.ok) {
            this.logger.error(navResult.ctx);
            return failure(TEMPLATE_ERR.NAV_NOT_FOUND);
        }

        if (!postsResult.ok) {
            this.logger.error(postsResult.ctx);
            return failure(TEMPLATE_ERR.BLOG_LIST_ERROR);
        }

        const html = BlogList({posts: postsResult.data, nav: navResult.data, currentPath});
        this.#cache.set(key, html);
        return success(html);
    }

    async getBlogPost(
        slug: string,
        currentPath: string
    ): Promise<Result<string, TemplateError>> {
        const key = `blog:post:${slug}@${currentPath}`;
        const current = this.#cache.get(key);
        if (current) return success(current);

        const [postResult, navResult] = await Promise.all([
            this.postService.getPostBySlug(slug, true),
            this.navigationService.getNavigation(),
        ]);

        if (!navResult.ok) {
            this.logger.error(navResult.ctx);
            return failure(TEMPLATE_ERR.NAV_NOT_FOUND);
        }

        if (!postResult.ok) {
            this.logger.error(postResult.ctx);
            return failure(TEMPLATE_ERR.POST_NOT_FOUND);
        }

        const html = BlogPost({post: postResult.data, nav: navResult.data, currentPath});
        this.#cache.set(key, html);
        return success(html);
    }

    async getNotFound(currentPath: string): Promise<string> {
        const navResult = await this.navigationService.getNavigation();
        const nav: NavigationResponse = navResult.ok
            ? navResult.data
            : {id: "", brandName: "Lindeneg", items: []};
        return NotFound(nav, currentPath);
    }
}
