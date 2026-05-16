import type {NavigationWithItems, PageWithSections} from "../../services/template-service.js";
import {Layout} from "../components/layout.js";
import {md} from "../lib.js";

export type PageProps = {
    page: PageWithSections;
    nav: NavigationWithItems;
    currentPath: string;
};

export function Page({page, nav, currentPath}: PageProps): string {
    const sections = [...page.sections]
        .filter((s) => s.published)
        .sort((a, b) => a.position - b.position)
        .map((s) => `<section class="page-section markdown">${md(s.content)}</section>`)
        .join("");
    return Layout({
        title: page.title,
        description: page.description,
        nav,
        currentPath,
        children: `<div class="page-sections">${sections}</div>`,
    });
}
