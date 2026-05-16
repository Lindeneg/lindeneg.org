import {Marked} from "marked";
import hljs from "highlight.js";
import sanitizeHtml from "sanitize-html";

const marked = new Marked({
    renderer: {
        code({text, lang}) {
            const language = lang && hljs.getLanguage(lang) ? lang : "plaintext";
            const highlighted = hljs.highlight(text, {language}).value;
            return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`;
        },
    },
});

export function esc(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

const MD_SANITIZE: sanitizeHtml.IOptions = {
    allowedTags: [
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "p",
        "blockquote",
        "hr",
        "br",
        "strong",
        "em",
        "code",
        "pre",
        "ul",
        "ol",
        "li",
        "a",
        "img",
        "table",
        "thead",
        "tbody",
        "tr",
        "th",
        "td",
        "span",
        "div",
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
                return {
                    tagName,
                    attribs: {...attribs, target: "_blank", rel: "noopener noreferrer"},
                };
            }
            return {tagName, attribs};
        },
        img: (tagName, attribs) => ({tagName, attribs: {...attribs, loading: "lazy"}}),
        iframe: (tagName, attribs) => ({tagName, attribs: {...attribs, loading: "lazy"}}),
    },
};

export function md(content: string): string {
    return sanitizeHtml(marked.parse(content, {async: false}), MD_SANITIZE);
}

export function normalizePath(p: string): string {
    if (!p) return "/";
    const lower = p.toLowerCase();
    return lower.length > 1 && lower.endsWith("/") ? lower.slice(0, -1) : lower;
}

export function isActive(itemHref: string, currentPath: string): boolean {
    if (/^https?:\/\//i.test(itemHref)) return false;
    const item = normalizePath(itemHref);
    const cur = normalizePath(currentPath);
    if (item === "/") return cur === "/";
    return cur === item || cur.startsWith(item + "/");
}

const SHORT_DATE: Intl.DateTimeFormatOptions = {month: "short", day: "numeric", year: "numeric"};
const LONG_DATE: Intl.DateTimeFormatOptions = {month: "long", day: "numeric", year: "numeric"};

export function formatDate(date: Date | string, style: "short" | "long" = "short"): string {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString("en-US", style === "long" ? LONG_DATE : SHORT_DATE);
}

export function readingTime(content: string): string {
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.round(words / 200));
    return `${minutes} min read`;
}

export function initials(name: string): string {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

