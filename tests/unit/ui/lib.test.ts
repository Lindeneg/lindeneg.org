import {describe, expect, it} from "vitest";
import {esc, formatDate, initials, isActive, localDate, md, normalizePath, readingTime} from "../../../src/ui/lib.js";

describe("esc", () => {
    it("escapes html special characters", () => {
        expect(esc(`<a href="x">&'`)).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&#39;");
    });
});

describe("md", () => {
    it("strips script tags", () => {
        const html = md("hello <script>alert(1)</script>");
        expect(html).not.toContain("<script");
        expect(html).toContain("hello");
    });

    it("opens external links in a new tab", () => {
        expect(md("[x](https://example.com)")).toContain(`target="_blank" rel="noopener noreferrer"`);
    });

    it("leaves internal links alone", () => {
        expect(md("[x](/about)")).not.toContain("target=");
    });

    it("keeps youtube iframes and drops other hosts", () => {
        expect(md(`<iframe src="https://www.youtube.com/embed/abc"></iframe>`)).toContain("<iframe");
        expect(md(`<iframe src="https://evil.example/embed"></iframe>`)).not.toContain("evil.example");
    });

    it("lazy-loads images", () => {
        expect(md("![alt](/a.png)")).toContain(`loading="lazy"`);
    });

    it("highlights fenced code", () => {
        expect(md("```js\nconst a = 1;\n```")).toContain(`class="hljs language-js"`);
    });

    it("drops event handler attributes", () => {
        expect(md(`<img src="/a.png" onerror="alert(1)">`)).not.toContain("onerror");
    });
});

describe("normalizePath", () => {
    it("lowercases and strips a trailing slash", () => {
        expect(normalizePath("/About/")).toBe("/about");
        expect(normalizePath("/")).toBe("/");
        expect(normalizePath("")).toBe("/");
    });
});

describe("isActive", () => {
    it("only matches root exactly", () => {
        expect(isActive("/", "/")).toBe(true);
        expect(isActive("/", "/blog")).toBe(false);
    });

    it("matches nested paths but not prefixes of other segments", () => {
        expect(isActive("/blog", "/blog/post")).toBe(true);
        expect(isActive("/blog", "/Blog/")).toBe(true);
        expect(isActive("/blog", "/blogger")).toBe(false);
    });

    it("never marks external links active", () => {
        expect(isActive("https://github.com", "/")).toBe(false);
    });

    it("treats a custom root as exact-match only", () => {
        expect(isActive("/admin", "/admin", "/admin")).toBe(true);
        expect(isActive("/admin", "/admin/pages", "/admin")).toBe(false);
        expect(isActive("/admin/pages", "/admin/pages/1/edit", "/admin")).toBe(true);
    });
});

describe("formatting", () => {
    const date = new Date("2024-01-05T12:00:00Z");

    it("formats dates short and long", () => {
        expect(formatDate(date)).toBe("Jan 5, 2024");
        expect(formatDate(date, "long")).toBe("January 5, 2024");
        expect(formatDate(date.toISOString())).toBe("Jan 5, 2024");
    });

    it("formats in utc regardless of the server timezone", () => {
        expect(formatDate(new Date("2024-01-05T23:30:00Z"))).toBe("Jan 5, 2024");
    });

    it("wraps a date in a time element the browser can localize", () => {
        expect(localDate(date, "long")).toBe(
            `<time datetime="2024-01-05T12:00:00.000Z" data-local-date="long">January 5, 2024</time>`
        );
    });

    it("estimates reading time at 200 words per minute, minimum 1", () => {
        expect(readingTime("one")).toBe("1 min read");
        expect(readingTime(Array(400).fill("word").join(" "))).toBe("2 min read");
    });

    it("builds up to two uppercase initials", () => {
        expect(initials("ada lovelace")).toBe("AL");
        expect(initials("Ada Byron King Lovelace")).toBe("AB");
    });
});
