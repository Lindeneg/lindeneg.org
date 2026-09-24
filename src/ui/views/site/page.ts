import type {NavigationWithItems} from "../../../repositories/navigation-repository.js";
import type {PageWithSections} from "../../../repositories/page-repository.js";
import {SiteLayout} from "../../components/layout.js";
import {md} from "../../lib.js";

export type PageViewProps = {
    page: PageWithSections;
    nav: NavigationWithItems;
    currentPath: string;
};

export function PageView({page, nav, currentPath}: PageViewProps): string {
    const sections = [...page.sections]
        .filter((s) => s.published)
        .sort((a, b) => a.position - b.position)
        .map((s) => `<section class="page-section markdown">${md(s.content)}</section>`)
        .join("");
    return SiteLayout({
        title: page.title,
        description: page.description,
        nav,
        currentPath,
        children: `<div class="page-sections">${sections}</div>`,
    });
}
