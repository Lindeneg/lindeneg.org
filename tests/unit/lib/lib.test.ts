import {afterEach, describe, expect, it, vi} from "vitest";
import z from "zod";
import type {Request} from "express";
import {slugify} from "../../../src/lib/slugify.js";
import {DEFAULT_PAGE_SIZE, paginate, parsePagination, toSkipTake} from "../../../src/lib/pagination.js";
import {checkbox, fieldErrors, optStr, toBool} from "../../../src/lib/validation.js";
import {emptySuccess, failure, success} from "../../../src/lib/result.js";
import {envFiles, isInTestMode, parseSuperUser} from "../../../src/lib/env.js";
import PageCache, {CacheTag} from "../../../src/lib/page-cache.js";
import {fake} from "../helpers.js";

describe("slugify", () => {
    it("lowercases and joins words with dashes", () => {
        expect(slugify("Hello, World!")).toBe("hello-world");
    });

    it("trims and collapses separators", () => {
        expect(slugify("  --My   Page--  ")).toBe("my-page");
    });

    it("returns an empty string for input without alphanumerics", () => {
        expect(slugify("/")).toBe("");
    });

    it("transliterates danish letters and strips accents", () => {
        expect(slugify("Blåbær & Crème Brûlée")).toBe("blaabaer-creme-brulee");
        expect(slugify("ØL")).toBe("oel");
    });
});

describe("pagination", () => {
    const req = (query: Record<string, string>) => fake<Request>({query});

    it("parses page and pageSize", () => {
        expect(parsePagination(req({page: "3", pageSize: "10"}))).toEqual({page: 3, pageSize: 10});
    });

    it("falls back to defaults on missing or invalid input", () => {
        expect(parsePagination(req({}))).toEqual({page: 1, pageSize: DEFAULT_PAGE_SIZE});
        expect(parsePagination(req({page: "abc", pageSize: "0"}))).toEqual({
            page: 1,
            pageSize: DEFAULT_PAGE_SIZE,
        });
    });

    it("clamps page to at least 1 and pageSize to at most 100", () => {
        expect(parsePagination(req({page: "-5", pageSize: "1000"}))).toEqual({page: 1, pageSize: 100});
    });

    it("converts to skip/take", () => {
        expect(toSkipTake({page: 3, pageSize: 10})).toEqual({skip: 20, take: 10});
    });

    it("computes totalPages", () => {
        expect(paginate([1, 2], 25, {page: 2, pageSize: 10})).toEqual({
            data: [1, 2],
            total: 25,
            page: 2,
            pageSize: 10,
            totalPages: 3,
        });
    });
});

describe("validation", () => {
    it("toBool accepts checkbox-ish truthy values only", () => {
        for (const v of ["1", "on", "true", true]) expect(toBool(v)).toBe(true);
        for (const v of ["0", "off", "false", false, undefined, 1]) expect(toBool(v)).toBe(false);
    });

    it("checkbox treats a missing field as unchecked", () => {
        const schema = z.object({published: checkbox()});

        expect(schema.parse({})).toEqual({published: false});
        expect(schema.parse({published: "1"})).toEqual({published: true});
        expect(schema.parse({published: "off"})).toEqual({published: false});
    });

    it("optStr returns non-blank strings only", () => {
        expect(optStr("a")).toBe("a");
        expect(optStr("   ")).toBeUndefined();
        expect(optStr(5)).toBeUndefined();
    });

    it("fieldErrors keeps the first message per field", () => {
        const schema = z.object({
            name: z.string().min(1, "Required").min(3, "Too short"),
            nested: z.object({value: z.string({error: "Nested required"})}),
        });
        const parsed = schema.safeParse({name: "", nested: {}});
        expect(parsed.success).toBe(false);
        if (parsed.success) return;
        expect(fieldErrors(parsed.error)).toEqual({name: "Required", "nested.value": "Nested required"});
    });

    it("fieldErrors uses _ for root issues", () => {
        const parsed = z.string({error: "Root"}).safeParse(1);
        if (parsed.success) throw new Error("expected failure");
        expect(fieldErrors(parsed.error)).toEqual({_: "Root"});
    });
});

describe("result", () => {
    it("builds success and failure values", () => {
        expect(success(1)).toEqual({ok: true, data: 1});
        expect(emptySuccess()).toEqual({ok: true, data: undefined});
        expect(failure("nope")).toEqual({ok: false, ctx: "nope"});
    });
});

describe("PageCache", () => {
    it("stores, returns and clears entries", () => {
        const cache = new PageCache(10);
        expect(cache.get("a")).toBeUndefined();
        cache.set("a", "<p>a</p>", []);
        expect(cache.get("a")).toBe("<p>a</p>");
        cache.clear();
        expect(cache.get("a")).toBeUndefined();
    });

    it("evicts the least recently used entry when full", () => {
        const cache = new PageCache(2);
        cache.set("a", "a", []);
        cache.set("b", "b", []);
        cache.set("c", "c", []);

        expect(cache.get("a")).toBeUndefined();
        expect(cache.get("b")).toBe("b");
        expect(cache.get("c")).toBe("c");
    });

    it("refreshes recency on a hit", () => {
        const cache = new PageCache(2);
        cache.set("a", "a", []);
        cache.set("b", "b", []);
        cache.get("a");
        cache.set("c", "c", []);

        expect(cache.get("a")).toBe("a");
        expect(cache.get("b")).toBeUndefined();
    });

    it("overwrites an existing key without growing", () => {
        const cache = new PageCache(2);
        cache.set("a", "old", []);
        cache.set("a", "new", []);

        expect(cache.get("a")).toBe("new");
        expect(cache.stats().entries).toBe(1);
    });

    it("invalidates every entry sharing a tag and nothing else", () => {
        const cache = new PageCache(10);
        cache.set("post-a", "a", [CacheTag.nav, CacheTag.post("a")]);
        cache.set("post-b", "b", [CacheTag.nav, CacheTag.post("b")]);
        cache.set("list", "l", [CacheTag.nav, CacheTag.blogList]);

        cache.invalidate([CacheTag.post("a"), CacheTag.blogList]);
        expect(cache.get("post-a")).toBeUndefined();
        expect(cache.get("list")).toBeUndefined();
        expect(cache.get("post-b")).toBe("b");

        cache.invalidate([CacheTag.nav]);
        expect(cache.get("post-b")).toBeUndefined();
    });

    it("counts hits and misses", () => {
        const cache = new PageCache(5);
        cache.set("a", "a", []);
        cache.get("a");
        cache.get("a");
        cache.get("missing");

        expect(cache.stats()).toEqual({entries: 1, maxEntries: 5, hits: 2, misses: 1});
    });
});

describe("env", () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it("uses only .env.test in test mode", () => {
        vi.stubEnv("NODE_ENV", "test");
        expect(isInTestMode()).toBe(true);
        expect(envFiles()).toEqual([".env.test"]);
    });

    it("never includes .env.test outside test mode", () => {
        vi.stubEnv("NODE_ENV", "development");
        expect(isInTestMode()).toBe(false);
        expect(envFiles()).not.toContain(".env.test");
        expect(envFiles()).toContain(".env.local");
    });

    it("parses SUPER_USER, keeping commas in the password", () => {
        expect(parseSuperUser("a@example.com,Ada,Lovelace,p,ss,word")).toEqual(
            success({email: "a@example.com", name: "Ada Lovelace", password: "p,ss,word"})
        );
    });

    it("rejects an incomplete SUPER_USER", () => {
        expect(parseSuperUser("a@example.com,Ada,Lovelace").ok).toBe(false);
        expect(parseSuperUser("a@example.com,Ada,Lovelace,").ok).toBe(false);
    });
});
