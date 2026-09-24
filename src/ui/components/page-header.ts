import {esc} from "../lib.js";

export type PageHeaderProps = {
    title: string;
    right?: string;
    back?: {href: string; label: string};
};

export function PageHeader({title, right = "", back}: PageHeaderProps): string {
    const backLink = back ? `<a href="${esc(back.href)}" class="back-link">← ${esc(back.label)}</a>` : "";
    return `
        <div class="admin-page-header">
            <div>
                ${backLink}
                <h1 class="admin-page-title">${esc(title)}</h1>
            </div>
            <div class="admin-page-header-right">${right}</div>
        </div>
    `;
}
