import type {NavigationWithItems} from "../../../repositories/navigation-repository.js";
import type {PostWithAuthor} from "../../../repositories/post-repository.js";
import type {Paginated} from "../../../lib/pagination.js";
import {SiteLayout} from "../../components/layout.js";
import {Pagination} from "../../components/pagination.js";
import {PostCard} from "../../components/post-card.js";

export type BlogListViewProps = {
    posts: Paginated<PostWithAuthor>;
    nav: NavigationWithItems;
    currentPath: string;
};

export function BlogListView({posts, nav, currentPath}: BlogListViewProps): string {
    const body =
        posts.data.length === 0
            ? `<div class="empty-state">No posts yet. Check back soon.</div>`
            : `
                <div class="post-grid">${posts.data.map(PostCard).join("")}</div>
                ${Pagination({page: posts.page, totalPages: posts.totalPages, basePath: "/blog"})}
            `;
    return SiteLayout({
        title: `Blog — ${nav.brandName}`,
        nav,
        currentPath,
        children: `
            <h1 class="blog-title">Blog</h1>
            ${body}
        `,
    });
}
