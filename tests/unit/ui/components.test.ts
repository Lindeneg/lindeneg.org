import {describe, expect, it} from "vitest";
import {Pagination} from "../../../src/ui/components/pagination.js";
import {Avatar} from "../../../src/ui/components/avatar.js";
import {Field, TopError} from "../../../src/ui/components/form.js";
import {TagBar, TagLinks, TopicLabel} from "../../../src/ui/components/tags.js";
import {Nav} from "../../../src/ui/components/nav.js";
import {makeNav, makeNavItem} from "../helpers.js";

describe("Nav", () => {
    const link = (html: string, name: string) => html.match(new RegExp(`<a [^>]*>${name}.*?</a>`))?.[0] ?? "";

    it("opens a link in a new tab only when the item says so, external or not", () => {
        const html = Nav(
            makeNav({
                items: [
                    makeNavItem({id: "a", name: "Same", href: "https://freelance.example", newTab: false}),
                    makeNavItem({id: "b", name: "New", href: "https://github.example", newTab: true}),
                    makeNavItem({id: "c", name: "Local", href: "/blog", newTab: true}),
                ],
            }),
            "/"
        );

        expect(link(html, "Same")).not.toContain(`target="_blank"`);
        expect(link(html, "Same")).not.toContain("icon-ext");
        expect(link(html, "New")).toContain(`target="_blank" rel="noopener noreferrer"`);
        expect(link(html, "New")).toContain("icon-ext");
        expect(link(html, "Local")).toContain(`target="_blank"`);
    });
});

describe("Pagination", () => {
    it("renders nothing for a single page", () => {
        expect(Pagination({page: 1, totalPages: 1, basePath: "/blog"})).toBe("");
        expect(Pagination({page: 1, totalPages: 0, basePath: "/blog"})).toBe("");
    });

    it("disables previous on the first page", () => {
        const html = Pagination({page: 1, totalPages: 3, basePath: "/blog"});
        expect(html).toContain(`<span class="pager-btn is-disabled">Previous</span>`);
        expect(html).toContain(`<a href="/blog?page=2" class="pager-btn">Next</a>`);
        expect(html).toContain("Page 1 of 3");
    });

    it("disables next on the last page and uses the given button class", () => {
        const html = Pagination({page: 3, totalPages: 3, basePath: "/admin/pages", buttonClass: "btn"});
        expect(html).toContain(`<a href="/admin/pages?page=2" class="btn">Previous</a>`);
        expect(html).toContain(`<span class="btn is-disabled">Next</span>`);
    });

    it("keeps extra params, escaped, in the page links", () => {
        const html = Pagination({page: 2, totalPages: 3, basePath: "/blog", params: {tag: "c&c"}});
        expect(html).toContain(`href="/blog?tag=c%26c&amp;page=1"`);
        expect(html).toContain(`href="/blog?tag=c%26c&amp;page=3"`);
    });
});

describe("tags", () => {
    const hash = `<span class="tag-hash">#</span>`;

    it("renders nothing without tags", () => {
        expect(TopicLabel([])).toBe("");
        expect(TagLinks([])).toBe("");
        expect(TagBar({tags: [], active: undefined})).toBe("");
    });

    it("links tags to the filtered blog list", () => {
        expect(TagLinks([{name: "music"}])).toContain(`<a href="/blog?tag=music" class="tag">${hash}music</a>`);
    });

    it("shows only the first tag as an escaped topic label, without a link", () => {
        const html = TopicLabel([{name: "<music>"}, {name: "programming"}]);
        expect(html).toBe(`<p class="post-card-topic">&lt;music&gt;</p>`);
    });

    it("marks the active tag and links it back to the unfiltered list", () => {
        const html = TagBar({
            tags: [
                {name: "music", count: 4},
                {name: "programming", count: 2},
            ],
            active: "music",
        });
        expect(html).toContain(`<a href="/blog" class="tag">All</a>`);
        expect(html).toContain(
            `<a href="/blog" class="tag" aria-current="page">${hash}music<span class="tag-count">4</span></a>`
        );
        expect(html).toContain(`<a href="/blog?tag=programming" class="tag">${hash}programming`);
    });
});

describe("Avatar", () => {
    it("renders the photo with block and modifier classes", () => {
        const html = Avatar({
            person: {name: "Ada", photo: "https://img/a.png"},
            block: "author-avatar",
            modifier: "md",
            alt: "Ada",
            lazy: true,
        });
        expect(html).toBe(
            `<img src="https://img/a.png" alt="Ada" class="author-avatar author-avatar--md" loading="lazy" />`
        );
    });

    it("falls back to escaped initials", () => {
        const html = Avatar({person: {name: "<b> x", photo: null}, block: "admin-avatar"});
        expect(html).toBe(`<div class="admin-avatar admin-avatar--initials">&lt;X</div>`);
    });
});

describe("form", () => {
    it("renders field errors and escapes values", () => {
        const html = Field({name: "title", label: "Title", value: `"><script>`, error: "Required"});
        expect(html).toContain("form-row is-invalid");
        expect(html).toContain(`<p class="form-error">Required</p>`);
        expect(html).toContain(`value="&quot;&gt;&lt;script&gt;"`);
    });

    it("renders no error markup without an error", () => {
        const html = Field({name: "title", label: "Title"});
        expect(html).not.toContain("is-invalid");
        expect(html).not.toContain("form-error");
    });

    it("TopError renders only with a message", () => {
        expect(TopError(undefined)).toBe("");
        expect(TopError("<x>")).toBe(`<div class="form-top-error">&lt;x&gt;</div>`);
    });
});
