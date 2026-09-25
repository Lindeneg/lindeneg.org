// @vitest-environment jsdom
import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import {runScript} from "./run-script.js";

beforeAll(() => {
    // jsdom has no innerText; in a browser it's the rendered text, which is the text content for a <code>
    if (!("innerText" in HTMLElement.prototype)) {
        Object.defineProperty(HTMLElement.prototype, "innerText", {
            get(this: HTMLElement) {
                return this.textContent;
            },
            configurable: true,
        });
    }
});

let writeText: ReturnType<typeof vi.fn>;

beforeEach(() => {
    writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {value: {writeText}, configurable: true});
});

afterEach(() => {
    document.body.innerHTML = "";
    document.body.style.overflow = "";
    document.documentElement.classList.remove("dark");
    localStorage.clear();
    vi.restoreAllMocks();
    vi.useRealTimers();
});

describe("theme toggle", () => {
    beforeEach(() => {
        document.body.innerHTML = `<button data-theme-toggle></button>`;
        runScript("client.js");
    });

    const toggle = () => document.querySelector<HTMLButtonElement>("[data-theme-toggle]")!.click();

    it("switches between dark and light and remembers the choice", () => {
        toggle();
        expect(document.documentElement.classList.contains("dark")).toBe(true);
        expect(localStorage.getItem("theme")).toBe("dark");

        toggle();
        expect(document.documentElement.classList.contains("dark")).toBe(false);
        expect(localStorage.getItem("theme")).toBe("light");
    });

    it("still switches when storage is unavailable", () => {
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new Error("blocked");
        });

        toggle();

        expect(document.documentElement.classList.contains("dark")).toBe(true);
    });
});

describe("mobile drawer", () => {
    let drawer: HTMLElement;

    beforeEach(() => {
        document.body.innerHTML = `
            <button data-mobile-open></button>
            <div data-mobile-drawer hidden>
                <div class="overlay" data-mobile-close></div>
                <aside>
                    <button class="close" data-mobile-close></button>
                    <span class="title">Brand</span>
                    <a href="#blog"><span class="label">Blog</span></a>
                </aside>
            </div>
        `;
        drawer = document.querySelector("[data-mobile-drawer]")!;
        runScript("client.js");
        document.querySelector<HTMLButtonElement>("[data-mobile-open]")!.click();
    });

    const isOpen = () => drawer.classList.contains("is-open");

    it("opens and locks page scrolling", () => {
        expect(drawer.hidden).toBe(false);
        expect(isOpen()).toBe(true);
        expect(document.body.style.overflow).toBe("hidden");
    });

    it("closes from the close button and the overlay, hiding once the transition ends", () => {
        for (const selector of [".close", ".overlay"]) {
            document.querySelector<HTMLButtonElement>("[data-mobile-open]")!.click();
            document.querySelector<HTMLElement>(selector)!.click();

            expect(isOpen(), selector).toBe(false);
            expect(document.body.style.overflow, selector).toBe("");
            expect(drawer.hidden, selector).toBe(false);

            drawer.dispatchEvent(new Event("transitionend"));
            expect(drawer.hidden, selector).toBe(true);
        }
    });

    it("closes on escape", () => {
        document.dispatchEvent(new KeyboardEvent("keydown", {key: "Escape"}));

        expect(isOpen()).toBe(false);
    });

    it("closes when a link inside it is followed", () => {
        document.querySelector<HTMLElement>(".label")!.click();

        expect(isOpen()).toBe(false);
    });

    it("stays open when something else inside it is clicked", () => {
        document.querySelector<HTMLElement>(".title")!.click();

        expect(isOpen()).toBe(true);
    });
});

describe("code copy buttons", () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div class="markdown"><pre><code class="hljs">const a = 1;</code></pre></div>
            <pre id="outside"><code>not markdown</code></pre>
        `;
        runScript("client.js");
    });

    const button = () => document.querySelector<HTMLButtonElement>(".copy-btn")!;

    it("wraps each markdown code block with a copy button", () => {
        const wrap = document.querySelector(".markdown .code-wrap")!;

        expect(wrap.querySelector("pre")).not.toBeNull();
        expect(wrap.querySelector(".copy-btn")?.getAttribute("aria-label")).toBe("Copy code");
    });

    it("leaves code outside markdown alone", () => {
        expect(document.getElementById("outside")!.parentElement!.classList.contains("code-wrap")).toBe(false);
        expect(document.querySelectorAll(".copy-btn")).toHaveLength(1);
    });

    it("copies the code and confirms briefly", async () => {
        vi.useFakeTimers();

        button().click();
        await Promise.resolve();

        expect(writeText).toHaveBeenCalledWith("const a = 1;");
        expect(button().classList.contains("is-copied")).toBe(true);
        expect(button().innerHTML).toContain("#check");

        vi.advanceTimersByTime(1500);
        expect(button().classList.contains("is-copied")).toBe(false);
        expect(button().innerHTML).toContain("#copy");
    });

    it("does not wrap a block twice when the script runs again", () => {
        runScript("client.js");

        expect(document.querySelectorAll(".copy-btn")).toHaveLength(1);
        expect(document.querySelectorAll(".code-wrap")).toHaveLength(1);
    });
});

describe("heading anchors", () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div class="markdown">
                <h2>Error Handling, Done Right!</h2>
                <h3 id="custom">Kept id</h3>
                <h4>   </h4>
                <h5>Too deep</h5>
            </div>
            <h2>Outside</h2>
        `;
        runScript("client.js");
    });

    it("gives markdown headings a slug id and a link to themselves", () => {
        const h2 = document.querySelector(".markdown h2")!;
        const anchor = h2.querySelector<HTMLAnchorElement>(".heading-anchor")!;

        expect(h2.id).toBe("error-handling-done-right");
        expect(anchor.getAttribute("href")).toBe("#error-handling-done-right");
        expect(anchor.getAttribute("aria-label")).toBe("Copy link to Error Handling, Done Right!");
    });

    it("keeps an id the heading already has", () => {
        expect(document.querySelector("h3")!.querySelector("a")!.getAttribute("href")).toBe("#custom");
    });

    it("skips empty headings, headings below h4 and headings outside markdown", () => {
        expect(document.querySelector("h4 .heading-anchor")).toBeNull();
        expect(document.querySelector("h5 .heading-anchor")).toBeNull();
        expect(document.querySelector("body > h2 .heading-anchor")).toBeNull();
    });

    it("copies the heading's url when the anchor is clicked", () => {
        document.querySelector<HTMLAnchorElement>(".markdown h2 .heading-anchor")!.click();

        expect(writeText).toHaveBeenCalledWith(`${location.origin}${location.pathname}#error-handling-done-right`);
    });

    it("does not add a second anchor when the script runs again", () => {
        runScript("client.js");

        expect(document.querySelectorAll(".markdown h2 .heading-anchor")).toHaveLength(1);
    });
});
