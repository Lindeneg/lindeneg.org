import type {NavigationWithItems} from "../../../repositories/navigation-repository.js";
import type {PageWithSections} from "../../../repositories/page-repository.js";
import {SiteLayout} from "../../components/layout.js";
import {md} from "../../lib.js";

export type PageViewProps = {
    page: PageWithSections;
    nav: NavigationWithItems;
    currentPath: string;
    canonical: string;
};

export function PageView({page, nav, currentPath, canonical}: PageViewProps): string {
    const sections = [...page.sections]
        .filter((s) => s.published)
        .sort((a, b) => a.position - b.position)
        .map((s) => `<section class="page-section markdown">${md(s.content)}</section>`)
        .join("");
    return SiteLayout({
        // the home page's title is used as written, other pages get the brand like the blog does
        title: page.slug === "home" ? page.title : `${page.title} — ${nav.brandName}`,
        description: page.description,
        canonical,
        nav,
        currentPath,
        children: `<div class="page-sections">${sections}</div>`,
    });
}
