import type {NavigationWithItems} from "../../../repositories/navigation-repository.js";
import type {PostWithRelations, TagWithCount} from "../../../repositories/post-repository.js";
import type {Paginated} from "../../../lib/pagination.js";
import type {MaybeUndefined} from "../../../lib/types.js";
import {esc} from "../../lib.js";
import {SiteLayout} from "../../components/layout.js";
import {Pagination} from "../../components/pagination.js";
import {PostCard} from "../../components/post-card.js";
import {TagBar} from "../../components/tags.js";

export type BlogListViewProps = {
    posts: Paginated<PostWithRelations>;
    tags: TagWithCount[];
    activeTag: MaybeUndefined<string>;
    nav: NavigationWithItems;
    currentPath: string;
    canonical: string;
};

// the blog's description names its most used tags; the feed uses it too
export function blogDescription(brand: string, tags: TagWithCount[]): string {
    const top = [...tags]
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
        .slice(0, 5)
        .map((tag) => tag.name);
    return top.length > 0 ? `Posts by ${brand} on ${top.join(", ")}.` : `Posts by ${brand}.`;
}

export function BlogListView({posts, tags, activeTag, nav, currentPath, canonical}: BlogListViewProps): string {
    const params: Record<string, string> = activeTag ? {tag: activeTag} : {};
    const body =
        posts.data.length === 0
            ? `<div class="empty-state">No posts yet. Check back soon.</div>`
            : `
                <div class="post-grid">${posts.data.map(PostCard).join("")}</div>
                ${Pagination({page: posts.page, totalPages: posts.totalPages, basePath: "/blog", params})}
            `;
    const heading = activeTag
        ? `Blog <span class="blog-title-tag">#${esc(activeTag)}</span> <a href="/blog" class="blog-title-clear">clear</a>`
        : "Blog";
    const name = activeTag ? `Posts tagged #${activeTag}` : "Blog";
    const page = posts.page > 1 ? `, page ${posts.page}` : "";
    return SiteLayout({
        title: `${name}${page} — ${nav.brandName}`,
        description: activeTag
            ? `Posts tagged #${activeTag} by ${nav.brandName}.`
            : blogDescription(nav.brandName, tags),
        canonical,
        nav,
        currentPath,
        children: `
            <h1 class="blog-title">${heading}</h1>
            ${TagBar({tags, active: activeTag})}
            ${body}
        `,
    });
}
