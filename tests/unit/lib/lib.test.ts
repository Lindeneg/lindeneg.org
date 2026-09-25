import {afterEach, describe, expect, it, vi} from "vitest";
import z from "zod";
import type {Request} from "express";
import {slugify} from "../../../src/lib/slugify.js";
import {DEFAULT_PAGE_SIZE, paginate, parsePagination, toSkipTake} from "../../../src/lib/pagination.js";
import {checkbox, fieldErrors, optStr, toBool} from "../../../src/lib/validation.js";
import {emptySuccess, failure, success} from "../../../src/lib/result.js";
import {envFiles, isInTestMode, loadAppEnv, parseSiteUrl, parseSuperUser} from "../../../src/lib/env.js";
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

    it("takes SITE_URL as an origin without a trailing slash", () => {
        expect(parseSiteUrl("SITE_URL", "https://lindeneg.org/")).toEqual(success("https://lindeneg.org"));
        expect(parseSiteUrl("SITE_URL", "http://localhost:3000")).toEqual(success("http://localhost:3000"));
    });

    it.each([undefined, "", "lindeneg.org", "ftp://lindeneg.org", "https://lindeneg.org/blog", "https://x.org/?a=1"])(
        "rejects %s as SITE_URL",
        (value) => {
            expect(parseSiteUrl("SITE_URL", value)).toEqual(
                failure("must be an absolute url like https://lindeneg.org")
            );
        }
    );

    it("rejects a SUPER_USER password over bcrypt's 72 bytes", () => {
        expect(parseSuperUser(`a@example.com,Ada,Lovelace,${"æ".repeat(37)}`)).toEqual(
            failure("Use at most 72 bytes (letters like æøå count as 2)")
        );
        expect(parseSuperUser(`a@example.com,Ada,Lovelace,${"æ".repeat(36)}`).ok).toBe(true);
    });

    describe("loadAppEnv", () => {
        // .env.test is the base; process.env wins over it, which is how a server's environment configures the app
        it("lets process.env override the env files", () => {
            vi.stubEnv("PORT", "4321");
            vi.stubEnv("ORIGINS", "https://a.example,https://b.example");

            const env = loadAppEnv();

            expect(env.PORT).toBe(4321);
            expect(env.ORIGINS).toEqual(["https://a.example", "https://b.example"]);
        });

        it("rejects a JWT_SECRET shorter than 32 characters", () => {
            vi.stubEnv("JWT_SECRET", "x".repeat(31));

            expect(() => loadAppEnv()).toThrow(/JWT_SECRET/);
        });

        it.each(["3", "13"])("rejects BCRYPT_ROUNDS=%s outside 4..12", (rounds) => {
            vi.stubEnv("BCRYPT_ROUNDS", rounds);

            expect(() => loadAppEnv()).toThrow(/BCRYPT_ROUNDS/);
        });

        it("rejects an unknown NODE_ENV", () => {
            vi.stubEnv("NODE_ENV", "staging");

            expect(() => loadAppEnv()).toThrow(/NODE_ENV/);
        });

        it("rejects a malformed SUPER_USER", () => {
            vi.stubEnv("SUPER_USER", "a@example.com,Ada");

            expect(() => loadAppEnv()).toThrow(/must be email,firstname,lastname,password/);
        });

        it.each([
            ["1", 1],
            ["loopback", "loopback"],
            ["loopback, uniquelocal", "loopback, uniquelocal"],
            ["", "loopback"],
        ])("reads TRUST_PROXY=%j as %j", (value, expected) => {
            vi.stubEnv("TRUST_PROXY", value);

            expect(loadAppEnv().TRUST_PROXY).toEqual(expected);
        });

        it("trusts a proxy on the same host when TRUST_PROXY is not set", () => {
            vi.stubEnv("TRUST_PROXY", undefined);

            expect(loadAppEnv().TRUST_PROXY).toBe("loopback");
        });

        it("defaults the optional settings", () => {
            vi.stubEnv("BCRYPT_ROUNDS", undefined);
            vi.stubEnv("JWT_COOKIE_NAME", undefined);

            const env = loadAppEnv();

            expect(env.JWT_COOKIE_NAME).toBe("lindeneg-org-auth");
            expect(env.LOG_LEVEL).toBeUndefined();
        });
    });
});
