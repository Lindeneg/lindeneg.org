import type {NavigationWithItems} from "../../../repositories/navigation-repository.js";
import type {PostWithRelations} from "../../../repositories/post-repository.js";
import {Avatar} from "../../components/avatar.js";
import {SiteLayout} from "../../components/layout.js";
import {TagLinks} from "../../components/tags.js";
import {icon} from "../../icons.js";
import {esc, localDate, md, readingTime} from "../../lib.js";

export type BlogPostViewProps = {
    post: PostWithRelations;
    nav: NavigationWithItems;
    currentPath: string;
};

export function BlogPostView({post, nav, currentPath}: BlogPostViewProps): string {
    return SiteLayout({
        title: `${post.title} — ${nav.brandName}`,
        nav,
        currentPath,
        children: `
            <article class="blog-post">
                <a href="/blog" class="back-link">${icon("arrow-left")}<span>Back to blog</span></a>
                <header class="blog-post-header">
                    <h1 class="blog-post-title">${esc(post.title)}</h1>
                    <div class="blog-post-meta">
                        ${Avatar({person: post.author, block: "author-avatar", modifier: "md", alt: post.author.name, lazy: true})}
                        <div>
                            <p class="blog-post-author">${esc(post.author.name)}</p>
                            <p class="blog-post-byline">${localDate(post.publishedAt ?? post.createdAt, "long")} &middot; ${esc(readingTime(post.content))}</p>
                        </div>
                    </div>
                    ${TagLinks(post.tags)}
                </header>
                <div class="markdown">${md(post.content)}</div>
            </article>
        `,
    });
}
