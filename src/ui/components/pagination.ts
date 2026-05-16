export function Pagination(page: number, totalPages: number): string {
    if (totalPages <= 1) return "";
    const prev = page > 1
        ? `<a href="/blog?page=${page - 1}" class="pager-btn">Previous</a>`
        : `<span class="pager-btn is-disabled">Previous</span>`;
    const next = page < totalPages
        ? `<a href="/blog?page=${page + 1}" class="pager-btn">Next</a>`
        : `<span class="pager-btn is-disabled">Next</span>`;
    return `
        <div class="pager">
            ${prev}
            <span class="pager-info">Page ${page} of ${totalPages}</span>
            ${next}
        </div>
    `;
}
