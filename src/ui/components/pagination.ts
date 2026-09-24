import {esc} from "../lib.js";

export type PaginationProps = {
    page: number;
    totalPages: number;
    basePath: string;
    params?: Record<string, string>;
    buttonClass?: string;
};

export function Pagination({page, totalPages, basePath, params = {}, buttonClass = "pager-btn"}: PaginationProps): string {
    if (totalPages <= 1) return "";
    const href = (target: number) => `${basePath}?${new URLSearchParams({...params, page: String(target)})}`;
    const prev =
        page > 1
            ? `<a href="${esc(href(page - 1))}" class="${buttonClass}">Previous</a>`
            : `<span class="${buttonClass} is-disabled">Previous</span>`;
    const next =
        page < totalPages
            ? `<a href="${esc(href(page + 1))}" class="${buttonClass}">Next</a>`
            : `<span class="${buttonClass} is-disabled">Next</span>`;
    return `
        <div class="pager">
            ${prev}
            <span class="pager-info">Page ${page} of ${totalPages}</span>
            ${next}
        </div>
    `;
}
