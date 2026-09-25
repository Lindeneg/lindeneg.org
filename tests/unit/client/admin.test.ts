// @vitest-environment jsdom
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {runScript} from "./run-script.js";

type Win = typeof window & {marked?: unknown; hljs?: unknown};

let stopTracking = () => {};

// records whether the script cancelled a submit, then cancels it anyway since jsdom can't navigate
function trackSubmits() {
    const submits: {form: HTMLFormElement; cancelled: boolean}[] = [];
    const listener = (e: Event) => {
        submits.push({form: e.target as HTMLFormElement, cancelled: e.defaultPrevented});
        e.preventDefault();
    };
    document.addEventListener("submit", listener);
    stopTracking = () => document.removeEventListener("submit", listener);
    return submits;
}

afterEach(() => {
    stopTracking();
    document.body.innerHTML = "";
    delete (window as Win).marked;
    delete (window as Win).hljs;
    vi.restoreAllMocks();
});

describe("confirm dialogs", () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <form id="delete" data-confirm="Delete it?"><button id="inside">Delete</button></form>
            <form id="remote" data-confirm="Remove photo?" hidden></form>
            <form id="upload"><button id="outside" form="remote">Remove</button></form>
            <form id="plain"><button id="plain-button">Save</button></form>
        `;
        runScript("admin.js");
    });

    it("asks before submitting and cancels when declined", () => {
        const submits = trackSubmits();
        const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);

        document.getElementById("inside")!.click();

        expect(confirm).toHaveBeenCalledWith("Delete it?");
        expect(submits).toEqual([{form: document.getElementById("delete"), cancelled: true}]);
    });

    it("submits when confirmed", () => {
        const submits = trackSubmits();
        vi.spyOn(window, "confirm").mockReturnValue(true);

        document.getElementById("inside")!.click();

        expect(submits[0].cancelled).toBe(false);
    });

    it("asks for a button that submits another form, like the photo remove button", () => {
        const submits = trackSubmits();
        const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);

        document.getElementById("outside")!.click();

        expect(confirm).toHaveBeenCalledWith("Remove photo?");
        expect(submits).toEqual([{form: document.getElementById("remote"), cancelled: true}]);
    });

    it("leaves forms without data-confirm alone", () => {
        const submits = trackSubmits();
        const confirm = vi.spyOn(window, "confirm");

        document.getElementById("plain-button")!.click();

        expect(confirm).not.toHaveBeenCalled();
        expect(submits[0].cancelled).toBe(false);
    });
});

describe("file size limit", () => {
    const TEN_MB = 10 * 1024 * 1024;
    let input: HTMLInputElement;

    const choose = (size: number | null) => {
        Object.defineProperty(input, "files", {value: size === null ? [] : [{size}], configurable: true});
        input.dispatchEvent(new Event("change"));
    };

    beforeEach(() => {
        document.body.innerHTML = `<form><input type="file" name="photo" data-max-bytes="${TEN_MB}" /></form>`;
        input = document.querySelector("input")!;
        runScript("admin.js");
    });

    it("blocks the form with a message when the file is too large", () => {
        choose(TEN_MB + 1);

        expect(input.validationMessage).toBe("Image must be 10MB or smaller");
        expect(input.form!.checkValidity()).toBe(false);
    });

    it("accepts a file of exactly the limit", () => {
        choose(TEN_MB);

        expect(input.validationMessage).toBe("");
        expect(input.form!.checkValidity()).toBe(true);
    });

    it("clears the error once a smaller file is chosen, or the choice is cleared", () => {
        choose(TEN_MB + 1);
        choose(1024);
        expect(input.form!.checkValidity()).toBe(true);

        choose(TEN_MB + 1);
        choose(null);
        expect(input.form!.checkValidity()).toBe(true);
    });
});

describe("mobile sidebar", () => {
    it("toggles the sidebar open and closed", () => {
        document.body.innerHTML = `<aside class="admin-sidebar"></aside><button data-admin-mobile-toggle></button>`;
        runScript("admin.js");
        const sidebar = document.querySelector(".admin-sidebar")!;
        const toggle = document.querySelector<HTMLButtonElement>("[data-admin-mobile-toggle]")!;

        toggle.click();
        expect(sidebar.classList.contains("is-open")).toBe(true);
        toggle.click();
        expect(sidebar.classList.contains("is-open")).toBe(false);
    });
});

describe("markdown editor", () => {
    let source: HTMLTextAreaElement;
    let preview: HTMLDivElement;
    let parse: ReturnType<typeof vi.fn>;

    const setup = (withMarked = true, withHljs = false) => {
        document.body.innerHTML = `
            <textarea data-md-source>initial</textarea>
            <div data-md-preview></div>
        `;
        source = document.querySelector("textarea")!;
        preview = document.querySelector("[data-md-preview]")!;
        parse = vi.fn((text: string) => `<p>${text}</p>`);
        if (withMarked) (window as Win).marked = {parse, use: vi.fn()};
        if (withHljs) {
            (window as Win).hljs = {
                getLanguage: (lang: string) => lang === "js",
                highlight: (text: string, {language}: {language: string}) => ({value: `${language}:${text}`}),
            };
        }
        runScript("admin.js");
    };

    beforeEach(() => {
        vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
            cb(0);
            return 1;
        });
        vi.stubGlobal("cancelAnimationFrame", vi.fn());
    });

    afterEach(() => vi.unstubAllGlobals());

    it("renders the preview right away and on every edit", () => {
        setup();
        expect(preview.innerHTML).toBe("<p>initial</p>");

        source.value = "changed";
        source.dispatchEvent(new Event("input"));

        expect(preview.innerHTML).toBe("<p>changed</p>");
    });

    it("shows the parse error instead of breaking", () => {
        setup();
        parse.mockImplementation(() => {
            throw new Error("bad markdown");
        });

        source.dispatchEvent(new Event("input"));

        expect(preview.textContent).toBe("Error: bad markdown");
    });

    it("says so when marked failed to load", () => {
        setup(false);

        expect(preview.textContent).toBe("(preview unavailable — failed to load marked.js)");
    });

    it("highlights fenced code like the server does when highlight.js loaded", () => {
        setup(true, true);
        const marked = (window as Win).marked as {use: ReturnType<typeof vi.fn>};
        const {code} = marked.use.mock.calls[0][0].renderer;

        expect(code({text: "a()", lang: "js"})).toBe(`<pre><code class="hljs language-js">js:a()</code></pre>`);
        expect(code({text: "x", lang: "nope"})).toBe(
            `<pre><code class="hljs language-plaintext">plaintext:x</code></pre>`
        );
    });

    it("inserts two spaces for tab instead of leaving the field", () => {
        setup();
        source.value = "ab";
        source.setSelectionRange(1, 1);

        const tab = new KeyboardEvent("keydown", {key: "Tab", cancelable: true});
        source.dispatchEvent(tab);

        expect(tab.defaultPrevented).toBe(true);
        expect(source.value).toBe("a  b");
        expect(source.selectionStart).toBe(3);
        expect(preview.innerHTML).toBe("<p>a  b</p>");
    });

    it("replaces a selection with the indent", () => {
        setup();
        source.value = "abcd";
        source.setSelectionRange(1, 3);

        source.dispatchEvent(new KeyboardEvent("keydown", {key: "Tab", cancelable: true}));

        expect(source.value).toBe("a  d");
    });

    it("leaves shift+tab and ctrl+tab to the browser", () => {
        setup();
        for (const init of [{shiftKey: true}, {ctrlKey: true}, {metaKey: true}]) {
            const event = new KeyboardEvent("keydown", {key: "Tab", cancelable: true, ...init});
            source.dispatchEvent(event);
            expect(event.defaultPrevented).toBe(false);
        }
        expect(source.value).toBe("initial");
    });

    describe("scroll sync", () => {
        // jsdom has no layout, so each pane gets fixed sizes and a real scrollTop
        const layout = (el: HTMLElement, scrollHeight: number, clientHeight: number) => {
            let top = 0;
            Object.defineProperty(el, "scrollHeight", {value: scrollHeight, configurable: true});
            Object.defineProperty(el, "clientHeight", {value: clientHeight, configurable: true});
            Object.defineProperty(el, "scrollTop", {
                get: () => top,
                set: (value: number) => (top = Math.max(0, Math.min(value, scrollHeight - clientHeight))),
                configurable: true,
            });
        };

        beforeEach(() => {
            setup();
            layout(source, 1100, 100);
            layout(preview, 2100, 100);
        });

        it("scrolls the preview to the same relative position as the source", () => {
            source.scrollTop = 500;
            source.dispatchEvent(new Event("scroll"));

            expect(preview.scrollTop).toBe(1000);
        });

        it("scrolls the source when the preview is scrolled", () => {
            preview.scrollTop = 1500;
            preview.dispatchEvent(new Event("scroll"));

            expect(source.scrollTop).toBe(750);
        });

        it("ignores the scroll event its own sync causes, so the panes don't fight", () => {
            source.scrollTop = 500;
            source.dispatchEvent(new Event("scroll"));
            source.scrollTop = 400;

            preview.dispatchEvent(new Event("scroll"));

            expect(source.scrollTop).toBe(400);
        });
    });
});
