import type {NavigationWithItems, PostWithAuthor} from "../../services/template-service.js";
import type {Paginated} from "../../lib/pagination.js";
import {Layout} from "../components/layout.js";
import {Pagination} from "../components/pagination.js";
import {PostCard} from "../components/post-card.js";

export type BlogListProps = {
    posts: Paginated<PostWithAuthor>;
    nav: NavigationWithItems;
    currentPath: string;
};

export function BlogList({posts, nav, currentPath}: BlogListProps): string {
    const body =
        posts.data.length === 0
            ? `<div class="empty-state">No posts yet. Check back soon.</div>`
            : `
                <div class="post-grid">${posts.data.map(PostCard).join("")}</div>
                ${Pagination(posts.page, posts.totalPages)}
            `;
    return Layout({
        title: `Blog — ${nav.brandName}`,
        nav,
        currentPath,
        children: `
            <h1 class="blog-title">Blog</h1>
            ${body}
        `,
    });
}
