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
    allowedIframeHostnames: ["www.youtube.com", "youtube.com", "www.youtube-nocookie.com", "youtube-nocookie.com"],
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

const TEXT_ONLY: sanitizeHtml.IOptions = {allowedTags: [], allowedAttributes: {}};

// sanitize-html escapes the text it keeps; a description is plain text and gets escaped where it's rendered
function unescapeText(text: string): string {
    return text
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&");
}

// the first paragraph with text as plain text, cut at a word boundary to at most max characters; posts can start
// with raw html (links, an embedded video), so it reads the rendered html instead of the markdown source
export function excerpt(content: string, max = 160): string {
    for (const [, inner] of md(content).matchAll(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/g)) {
        const text = unescapeText(sanitizeHtml(inner, TEXT_ONLY)).replace(/\s+/g, " ").trim();
        if (!text) continue;
        if (text.length <= max) return text;
        const cut = text.slice(0, max - 1);
        const lastSpace = cut.lastIndexOf(" ");
        return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:!?-]+$/, "")}…`;
    }
    return "";
}

export function normalizePath(p: string): string {
    if (!p) return "/";
    const lower = p.toLowerCase();
    return lower.length > 1 && lower.endsWith("/") ? lower.slice(0, -1) : lower;
}

export function isActive(itemHref: string, currentPath: string, root = "/"): boolean {
    if (/^https?:\/\//i.test(itemHref)) return false;
    const item = normalizePath(itemHref);
    const cur = normalizePath(currentPath);
    if (item === normalizePath(root)) return cur === item;
    return cur === item || cur.startsWith(item + "/");
}

type DateStyle = "short" | "long";

const SHORT_DATE: Intl.DateTimeFormatOptions = {month: "short", day: "numeric", year: "numeric", timeZone: "UTC"};
const LONG_DATE: Intl.DateTimeFormatOptions = {month: "long", day: "numeric", year: "numeric", timeZone: "UTC"};

export function formatDate(date: Date | string, style: DateStyle = "short"): string {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString("en-US", style === "long" ? LONG_DATE : SHORT_DATE);
}

// rendered in UTC so the cached html is the same for every visitor; /local-dates.js rewrites it in their timezone
export function localDate(date: Date | string, style: DateStyle = "short"): string {
    const d = date instanceof Date ? date : new Date(date);
    return `<time datetime="${d.toISOString()}" data-local-date="${style}">${esc(formatDate(d, style))}</time>`;
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
