import type {TagWithCount} from "../../repositories/post-repository.js";
import type {MaybeUndefined} from "../../lib/types.js";
import {esc} from "../lib.js";

type Named = {name: string};

export function tagHref(name: string): string {
    return `/blog?${new URLSearchParams({tag: name})}`;
}

function label(name: string): string {
    return `<span class="tag-hash">#</span>${esc(name)}`;
}

// the first tag as a small label, for places that are already inside a link (post cards)
export function TopicLabel(tags: Named[]): string {
    if (tags.length === 0) return "";
    return `<p class="post-card-topic">${esc(tags[0].name)}</p>`;
}

export function TagLinks(tags: Named[]): string {
    if (tags.length === 0) return "";
    const links = tags.map((t) => `<a href="${esc(tagHref(t.name))}" class="tag">${label(t.name)}</a>`).join("");
    return `<p class="tag-list">${links}</p>`;
}

export type TagBarProps = {
    tags: TagWithCount[];
    active: MaybeUndefined<string>;
};

export function TagBar({tags, active}: TagBarProps): string {
    if (tags.length === 0) return "";
    const all = `<a href="/blog" class="tag"${active ? "" : ` aria-current="page"`}>All</a>`;
    const links = tags.map((t) => {
        const isActive = t.name === active;
        const href = isActive ? "/blog" : tagHref(t.name);
        const current = isActive ? ` aria-current="page"` : "";
        return `<a href="${esc(href)}" class="tag"${current}>${label(t.name)}<span class="tag-count">${t.count}</span></a>`;
    });
    return `<nav class="tag-bar" aria-label="Filter by tag">${all}${links.join("")}</nav>`;
}
