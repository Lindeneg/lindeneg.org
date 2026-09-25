import {beforeEach, describe, expect, it, vi, type Mock} from "vitest";
import {emptySuccess, failure, success} from "../../../src/lib/result.js";
import {AppError} from "../../../src/lib/errors.js";
import PageService from "../../../src/services/page-service.js";
import MessageService from "../../../src/services/message-service.js";
import DashboardService from "../../../src/services/dashboard-service.js";
import NavigationService from "../../../src/services/navigation-service.js";
import type PageRepository from "../../../src/repositories/page-repository.js";
import type SectionRepository from "../../../src/repositories/section-repository.js";
import type ContactRepository from "../../../src/repositories/contact-repository.js";
import type PostRepository from "../../../src/repositories/post-repository.js";
import type NavigationRepository from "../../../src/repositories/navigation-repository.js";
import type NavigationItemRepository from "../../../src/repositories/navigation-item-repository.js";
import {fake, fakeCache, makeMessage, makeNav, makePage, makeSection} from "../helpers.js";

describe("PageService", () => {
    let pages: Record<"getById" | "create" | "update" | "delete", Mock>;
    let sections: Record<"getById" | "create" | "update" | "delete", Mock>;
    let invalidate: Mock;
    let service: PageService;

    const input = {name: "About Me", title: "About", description: "", published: true};

    beforeEach(() => {
        pages = {
            getById: vi.fn().mockResolvedValue(success(makePage())),
            create: vi.fn().mockResolvedValue(success(makePage())),
            update: vi.fn().mockResolvedValue(success(makePage())),
            delete: vi.fn().mockResolvedValue(success(makePage())),
        };
        sections = {
            getById: vi.fn().mockResolvedValue(success({...makeSection(), page: makePage()})),
            create: vi.fn().mockResolvedValue(success(makeSection())),
            update: vi.fn().mockResolvedValue(success(makeSection())),
            delete: vi.fn().mockResolvedValue(success(makeSection())),
        };
        const c = fakeCache();
        invalidate = c.invalidate;
        service = new PageService(fake<PageRepository>(pages), fake<SectionRepository>(sections), c.cache);
    });

    it("derives the slug from the name when none is given", async () => {
        await service.create({...input, slug: "  "});

        expect(pages.create).toHaveBeenCalledWith(expect.objectContaining({slug: "about-me"}));
    });

    it("slugifies a custom slug", async () => {
        await service.update("page-1", {...input, slug: "My Custom Slug"});

        expect(pages.update).toHaveBeenCalledWith("page-1", expect.objectContaining({slug: "my-custom-slug"}));
    });

    it("invalidates nothing on create since missing pages are never cached", async () => {
        await service.create(input);

        expect(invalidate).not.toHaveBeenCalled();
    });

    it("invalidates only the affected page on page and section changes", async () => {
        const section = {content: "x", position: 0, published: true};
        await service.update("page-1", input);
        await service.delete("page-1");
        await service.createSection("page-1", section);
        await service.updateSection("section-1", section);
        await service.deleteSection("section-1");

        expect(invalidate).toHaveBeenCalledTimes(5);
        for (const call of invalidate.mock.calls) expect(call).toEqual([["page:page-1"]]);
    });

    it("transliterates danish letters in a derived slug", async () => {
        await service.create({...input, name: "Blåbær Grød"});

        expect(pages.create).toHaveBeenCalledWith(expect.objectContaining({slug: "blaabaer-groed"}));
    });

    it("leaves the cache alone when a mutation fails, passing the conflict through", async () => {
        pages.update.mockResolvedValue(failure(AppError.CONFLICT));

        expect(await service.update("page-1", input)).toEqual(failure(AppError.CONFLICT));
        expect(invalidate).not.toHaveBeenCalled();
    });

    it("distinguishes missing pages and sections from db errors", async () => {
        pages.getById.mockResolvedValue(success(null));
        sections.getById.mockResolvedValue(failure(AppError.DB_ERROR));

        expect(await service.get("x")).toEqual(failure(AppError.NOT_FOUND));
        expect(await service.getSection("x")).toEqual(failure(AppError.DB_ERROR));
    });

    it("hides unpublished pages from the public lookup", async () => {
        const getBySlug = vi.fn().mockResolvedValue(success(makePage({published: false})));
        const publicService = new PageService(
            fake<PageRepository>({getBySlug}),
            fake<SectionRepository>(sections),
            fakeCache().cache
        );

        expect(await publicService.getPublishedBySlug("about")).toEqual(failure(AppError.NOT_FOUND));
    });
});

describe("NavigationService", () => {
    let invalidate: Mock;
    let service: NavigationService;
    let get: Mock;
    let createItem: Mock;

    beforeEach(() => {
        get = vi.fn().mockResolvedValue(success(makeNav()));
        createItem = vi.fn().mockResolvedValue(success(makeNav().items[0]));
        const c = fakeCache();
        invalidate = c.invalidate;
        service = new NavigationService(
            fake<NavigationRepository>({get, update: vi.fn().mockResolvedValue(success(makeNav()))}),
            fake<NavigationItemRepository>({create: createItem, delete: vi.fn().mockResolvedValue(emptySuccess())}),
            c.cache
        );
    });

    it("creates an item in the navigation the server passes", async () => {
        const input = {name: "Blog", href: "/blog", position: 0, alignment: "RIGHT" as const, newTab: false};

        await service.createItem("nav-1", input);

        expect(createItem).toHaveBeenCalledWith({...input, navigationId: "nav-1"});
    });

    it("finds an item within the navigation", async () => {
        const result = await service.getItem("item-1");

        if (!result.ok) throw new Error("expected success");
        expect(result.data.item.id).toBe("item-1");
        expect(result.data.nav.id).toBe("nav-1");
    });

    it("returns NOT_FOUND for an unknown item or missing navigation", async () => {
        expect(await service.getItem("nope")).toEqual(failure(AppError.NOT_FOUND));
        get.mockResolvedValue(success(null));
        expect(await service.get()).toEqual(failure(AppError.NOT_FOUND));
    });

    it("invalidates everything tagged with the nav on changes", async () => {
        await service.updateBrand("nav-1", "New");
        await service.deleteItem("item-1");

        expect(invalidate).toHaveBeenCalledTimes(2);
        for (const call of invalidate.mock.calls) expect(call).toEqual([["nav"]]);
    });
});

describe("MessageService", () => {
    let repo: Record<"getById" | "update" | "create", Mock>;
    let service: MessageService;

    beforeEach(() => {
        repo = {
            getById: vi.fn().mockResolvedValue(success(makeMessage({read: false}))),
            update: vi.fn().mockResolvedValue(success(makeMessage())),
            create: vi.fn().mockResolvedValue(success(makeMessage())),
        };
        service = new MessageService(fake<ContactRepository>(repo));
    });

    it("stores a new message as unread", async () => {
        const input = {name: "Grace", email: "grace@example.com", message: "Hi"};

        expect((await service.create(input)).ok).toBe(true);
        expect(repo.create).toHaveBeenCalledWith({...input, read: false});
    });

    it("flips the read flag", async () => {
        expect((await service.toggleRead("message-1")).ok).toBe(true);
        expect(repo.update).toHaveBeenCalledWith("message-1", {read: true});
    });

    it("returns NOT_FOUND for an unknown message", async () => {
        repo.getById.mockResolvedValue(success(null));

        expect(await service.toggleRead("nope")).toEqual(failure(AppError.NOT_FOUND));
        expect(repo.update).not.toHaveBeenCalled();
    });
});

describe("DashboardService", () => {
    it("counts everything and treats failures as zero", async () => {
        const count = vi.fn().mockResolvedValueOnce(success(7)).mockResolvedValueOnce(success(2));
        const service = new DashboardService(
            fake<PageRepository>({count: vi.fn().mockResolvedValue(success(3))}),
            fake<PostRepository>({count: vi.fn().mockResolvedValue(failure("db"))}),
            fake<ContactRepository>({count})
        );

        expect(await service.counts()).toEqual({pages: 3, posts: 0, messages: 7, unreadMessages: 2});
        expect(count).toHaveBeenCalledWith({read: false});
    });
});
