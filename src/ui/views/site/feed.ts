import type {PostWithRelations} from "../../../repositories/post-repository.js";
import {esc, excerpt} from "../../lib.js";

export type FeedViewProps = {
    siteUrl: string;
    brand: string;
    description: string;
    posts: PostWithRelations[];
};

// rss 2.0
export function FeedView({siteUrl, brand, description, posts}: FeedViewProps): string {
    const items = posts
        .map((post) => {
            const link = esc(`${siteUrl}/blog/${post.slug}`);
            const categories = post.tags.map((tag) => `<category>${esc(tag.name)}</category>`).join("");
            return `    <item>
      <title>${esc(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${(post.publishedAt ?? post.createdAt).toUTCString()}</pubDate>
      <description>${esc(excerpt(post.content))}</description>
      ${categories}
    </item>`;
        })
        .join("\n");
    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(`Blog — ${brand}`)}</title>
    <link>${esc(`${siteUrl}/blog`)}</link>
    <description>${esc(description)}</description>
    <language>en</language>
    <atom:link href="${esc(`${siteUrl}/blog/feed.xml`)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
}
