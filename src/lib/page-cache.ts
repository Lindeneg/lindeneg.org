import type {MaybeUndefined} from "./types.js";

export const CacheTag = {
    nav: "nav",
    blogList: "blog-list",
    page: (id: string) => `page:${id}`,
    post: (id: string) => `post:${id}`,
    user: (id: string) => `user:${id}`,
} as const;

export type CacheStats = {
    entries: number;
    maxEntries: number;
    hits: number;
    misses: number;
};

type Entry = {
    html: string;
    tags: string[];
};

class PageCache {
    // a Map iterates in insertion order, so the first key is always the least recently used
    readonly #entries = new Map<string, Entry>();
    #hits = 0;
    #misses = 0;

    constructor(private readonly maxEntries: number) {}

    get(key: string): MaybeUndefined<string> {
        const entry = this.#entries.get(key);
        if (!entry) {
            this.#misses++;
            return undefined;
        }
        this.#hits++;
        this.#entries.delete(key);
        this.#entries.set(key, entry);
        return entry.html;
    }

    set(key: string, html: string, tags: string[]): void {
        this.#entries.delete(key);
        this.#entries.set(key, {html, tags});
        while (this.#entries.size > this.maxEntries) {
            const oldest = this.#entries.keys().next().value;
            if (oldest === undefined) break;
            this.#entries.delete(oldest);
        }
    }

    invalidate(tags: string[]): void {
        for (const [key, entry] of this.#entries) {
            if (entry.tags.some((tag) => tags.includes(tag))) this.#entries.delete(key);
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

export default PageCache;
