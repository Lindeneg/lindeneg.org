import {vi, type Mock} from "vitest";
import type {ContactMessage, NavigationItem, PageSection} from "../../src/generated/prisma/client.js";
import type LoggerService from "../../src/services/logger-service.js";
import type PageCache from "../../src/lib/page-cache.js";
import type {User, UserWithPassword} from "../../src/repositories/user-repository.js";
import type {PostWithRelations} from "../../src/repositories/post-repository.js";
import type {PageWithSections} from "../../src/repositories/page-repository.js";
import type {NavigationWithItems} from "../../src/repositories/navigation-repository.js";

// classes with private members can't be satisfied structurally, so fakes are cast
export function fake<T>(impl: object): T {
    return impl as T;
}

export function fakeLog() {
    return fake<LoggerService>({
        trace: vi.fn(),
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        fatal: vi.fn(),
    });
}

export function fakeCache(): {invalidate: Mock; cache: PageCache} {
    const invalidate = vi.fn();
    return {invalidate, cache: fake<PageCache>({invalidate, clear: vi.fn(), get: vi.fn(), set: vi.fn()})};
}

const date = new Date("2024-01-05T12:00:00Z");

export function makeUser(overrides: Partial<User> = {}): User {
    return {
        id: "user-1",
        email: "admin@example.com",
        name: "Ada Lovelace",
        photo: null,
        photoId: null,
        role: "ADMIN",
        createdAt: date,
        ...overrides,
    };
}

export function makeUserWithPassword(password: string, overrides: Partial<User> = {}): UserWithPassword {
    return {...makeUser(overrides), password};
}

export function makePost(overrides: Partial<PostWithRelations> = {}): PostWithRelations {
    return {
        id: "post-1",
        title: "Hello World",
        slug: "hello-world",
        content: "Some **markdown**",
        published: true,
        thumbnail: "",
        thumbnailId: "",
        authorId: "user-1",
        author: makeUser(),
        tags: [{id: "tag-1", name: "jazz"}],
        createdAt: date,
        updatedAt: date,
        ...overrides,
    };
}

export function makeSection(overrides: Partial<PageSection> = {}): PageSection {
    return {
        id: "section-1",
        pageId: "page-1",
        content: "# About",
        position: 0,
        published: true,
        createdAt: date,
        updatedAt: date,
        ...overrides,
    };
}

export function makePage(overrides: Partial<PageWithSections> = {}): PageWithSections {
    return {
        id: "page-1",
        name: "About",
        slug: "about",
        title: "About",
        description: "",
        published: true,
        sections: [makeSection()],
        createdAt: date,
        updatedAt: date,
        ...overrides,
    };
}

export function makeNavItem(overrides: Partial<NavigationItem> = {}): NavigationItem {
    return {
        id: "item-1",
        navigationId: "nav-1",
        name: "Blog",
        href: "/blog",
        position: 0,
        alignment: "RIGHT",
        newTab: false,
        ...overrides,
    };
}

export function makeNav(overrides: Partial<NavigationWithItems> = {}): NavigationWithItems {
    return {id: "nav-1", brandName: "Brand", items: [makeNavItem()], ...overrides};
}

export function makeMessage(overrides: Partial<ContactMessage> = {}): ContactMessage {
    return {
        id: "message-1",
        name: "Grace",
        email: "grace@example.com",
        message: "Hi",
        read: false,
        createdAt: date,
        ...overrides,
    };
}
