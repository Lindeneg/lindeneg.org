import {esc} from "../../lib.js";

export type SitemapUrl = {
    loc: string;
    lastmod: Date;
};

export function SitemapView(urls: SitemapUrl[]): string {
    const entries = urls
        .map((url) => `  <url><loc>${esc(url.loc)}</loc><lastmod>${url.lastmod.toISOString()}</lastmod></url>`)
        .join("\n");
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
}
