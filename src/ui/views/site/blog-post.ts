import type {NavigationWithItems} from "../../../repositories/navigation-repository.js";
import type {PostWithRelations} from "../../../repositories/post-repository.js";
import {Avatar} from "../../components/avatar.js";
import {SiteLayout} from "../../components/layout.js";
import {TagLinks} from "../../components/tags.js";
import {icon} from "../../icons.js";
import {esc, excerpt, localDate, md, readingTime} from "../../lib.js";

export type BlogPostViewProps = {
    post: PostWithRelations;
    nav: NavigationWithItems;
    currentPath: string;
    canonical: string;
};

export function BlogPostView({post, nav, currentPath, canonical}: BlogPostViewProps): string {
    const description = excerpt(post.content);
    const publishedAt = post.publishedAt ?? post.createdAt;
    const tags = post.tags.map((tag) => tag.name);
    return SiteLayout({
        title: `${post.title} — ${nav.brandName}`,
        description,
        canonical,
        image: post.thumbnail,
        article: {publishedTime: publishedAt, modifiedTime: post.updatedAt, tags},
        jsonLd: {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            ...(description ? {description} : {}),
            ...(post.thumbnail ? {image: post.thumbnail} : {}),
            datePublished: publishedAt.toISOString(),
            dateModified: post.updatedAt.toISOString(),
            author: {"@type": "Person", name: post.author.name},
            mainEntityOfPage: canonical,
            keywords: tags.join(", "),
        },
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
                            <p class="blog-post-byline">${localDate(publishedAt, "long")} &middot; ${esc(readingTime(post.content))}</p>
                        </div>
                    </div>
                    ${TagLinks(post.tags)}
                </header>
                <div class="markdown">${md(post.content)}</div>
            </article>
        `,
    });
}
