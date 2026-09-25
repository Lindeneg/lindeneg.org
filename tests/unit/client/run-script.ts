import {readFileSync} from "node:fs";
import {resolve} from "node:path";

// runs a script from public/ against the current jsdom document, the way the browser would
export function runScript(name: string): void {
    const source = readFileSync(resolve(import.meta.dirname, "../../../public", name), "utf8");
    new Function(source)();
    if (document.readyState === "loading") document.dispatchEvent(new Event("DOMContentLoaded"));
}
