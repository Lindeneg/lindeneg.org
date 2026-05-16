import type {NavigationWithItems, PostWithAuthor} from "../../services/template-service.js";
import {AuthorAvatar} from "../components/author-avatar.js";
import {Layout} from "../components/layout.js";
import {icon} from "../icons.js";
import {esc, formatDate, md, readingTime} from "../lib.js";

export type BlogPostProps = {
    post: PostWithAuthor;
    nav: NavigationWithItems;
    currentPath: string;
};

export function BlogPost({post, nav, currentPath}: BlogPostProps): string {
    return Layout({
        title: `${post.title} — ${nav.brandName}`,
        nav,
        currentPath,
        children: `
            <article class="blog-post">
                <a href="/blog" class="back-link">${icon("arrow-left")}<span>Back to blog</span></a>
                <header class="blog-post-header">
                    <h1 class="blog-post-title">${esc(post.title)}</h1>
                    <div class="blog-post-meta">
                        ${AuthorAvatar(post.author, "md")}
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
