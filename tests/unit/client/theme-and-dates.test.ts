// @vitest-environment jsdom
import {afterEach, describe, expect, it, vi} from "vitest";
import {runScript} from "./run-script.js";

afterEach(() => {
    document.documentElement.classList.remove("dark");
    document.body.innerHTML = "";
    localStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe("theme boot", () => {
    const boot = (stored: string | null, systemDark: boolean) => {
        if (stored) localStorage.setItem("theme", stored);
        vi.stubGlobal("matchMedia", (query: string) => ({
            matches: query === "(prefers-color-scheme: dark)" && systemDark,
        }));
        runScript("theme-boot.js");
        return document.documentElement.classList.contains("dark");
    };

    it.each([
        ["a stored dark choice", "dark", false, true],
        ["a stored light choice over a dark system", "light", true, false],
        ["no choice with a dark system", null, true, true],
        ["no choice with a light system", null, false, false],
    ])("follows %s", (_, stored, systemDark, dark) => {
        expect(boot(stored, systemDark)).toBe(dark);
    });

    it("falls back to light when storage is unavailable", () => {
        vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
            throw new Error("blocked");
        });

        expect(() => boot(null, true)).not.toThrow();
        expect(document.documentElement.classList.contains("dark")).toBe(false);
    });
});

describe("local dates", () => {
    const originalTz = process.env.TZ;

    afterEach(() => {
        process.env.TZ = originalTz;
    });

    // the server renders utc; the visitor's own timezone decides the day they see
    const localize = (tz: string, html: string) => {
        process.env.TZ = tz;
        document.body.innerHTML = html;
        runScript("local-dates.js");
        return [...document.querySelectorAll("time")].map((t) => t.textContent);
    };

    it("shows a late utc evening as the next day further east", () => {
        expect(
            localize(
                "Asia/Tokyo",
                `<time datetime="2024-01-05T20:00:00.000Z" data-local-date="short">Jan 5, 2024</time>`
            )
        ).toEqual(["Jan 6, 2024"]);
    });

    it("shows an early utc morning as the previous day further west", () => {
        expect(
            localize(
                "America/Los_Angeles",
                `<time datetime="2024-01-05T03:00:00.000Z" data-local-date="long">January 5, 2024</time>`
            )
        ).toEqual(["January 4, 2024"]);
    });

    it("keeps the same format as the server", () => {
        expect(
            localize(
                "Europe/Copenhagen",
                `<time datetime="2024-03-01T10:00:00.000Z" data-local-date="short">x</time>
                 <time datetime="2024-03-01T10:00:00.000Z" data-local-date="long">x</time>`
            )
        ).toEqual(["Mar 1, 2024", "March 1, 2024"]);
    });

    it("leaves invalid dates, unknown formats and other time elements untouched", () => {
        expect(
            localize(
                "Asia/Tokyo",
                `<time datetime="not-a-date" data-local-date="short">keep 1</time>
                 <time datetime="2024-01-05T20:00:00.000Z" data-local-date="weird">keep 2</time>
                 <time datetime="2024-01-05T20:00:00.000Z">keep 3</time>`
            )
        ).toEqual(["keep 1", "keep 2", "keep 3"]);
    });
});
