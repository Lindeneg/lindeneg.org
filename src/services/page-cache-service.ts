import type {MaybeUndefined} from "../lib/types.js";

export type CacheStats = {
    entries: number;
    maxEntries: number;
    hits: number;
    misses: number;
};

// rendered public pages; only the clear button in the admin settings empties it
class PageCacheService {
    // a Map iterates in insertion order, so the first key is always the least recently used
    readonly #entries = new Map<string, string>();
    #hits = 0;
    #misses = 0;

    constructor(private readonly maxEntries: number) {}

    get(key: string): MaybeUndefined<string> {
        const html = this.#entries.get(key);
        if (html === undefined) {
            this.#misses++;
            return undefined;
        }
        this.#hits++;
        this.#entries.delete(key);
        this.#entries.set(key, html);
        return html;
    }

    set(key: string, html: string): void {
        this.#entries.delete(key);
        this.#entries.set(key, html);
        while (this.#entries.size > this.maxEntries) {
            const oldest = this.#entries.keys().next().value;
            if (oldest === undefined) break;
            this.#entries.delete(oldest);
        }
    }

    clear(): void {
        this.#entries.clear();
    }

    stats(): CacheStats {
        return {
            entries: this.#entries.size,
            maxEntries: this.maxEntries,
            hits: this.#hits,
            misses: this.#misses,
        };
    }
}

export default PageCacheService;
