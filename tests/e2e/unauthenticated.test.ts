import {afterAll, beforeAll, describe, expect, it} from "vitest";
import {randomUUID} from "node:crypto";
import jwt from "jsonwebtoken";
import {
    cacheStats,
    db,
    env,
    get,
    imageBlob,
    login,
    postForm,
    postMultipart,
    uid,
    type TestResponse,
} from "./helpers.js";

type Seed = {
    pageId: string;
    sectionId: string;
    postId: string;
    navigationId: string;
    itemId: string;
    messageId: string;
    userId: string;
    userName: string;
};

type Route = {route: string; send: (s: Seed, cookie?: string) => Promise<TestResponse>};
type Variant = {variant: string; cookie: (s: Seed) => string | undefined};

const SEED_PHOTO = "https://images.test/unauthenticated-seed";

function multipart(fields: Record<string, string>, file?: string): FormData {
    const form = new FormData();
    for (const [key, value] of Object.entries(fields)) form.set(key, value);
    if (file) form.set(file, imageBlob(), "image.png");
    return form;
}

// every route mounted behind adminAuth, with payloads that would change something if the guard were missing
const routes: Route[] = [
    {route: "POST /admin/logout", send: (_, c) => postForm("/admin/logout", {}, c)},
    {route: "GET /admin", send: (_, c) => get("/admin", c)},

    {route: "GET /admin/pages", send: (_, c) => get("/admin/pages", c)},
    {route: "GET /admin/pages/new", send: (_, c) => get("/admin/pages/new", c)},
    {
        route: "POST /admin/pages/new",
        send: (_, c) =>
            postForm("/admin/pages/new", {name: `Unauth ${uid()}`, title: "t", description: "", published: "1"}, c),
    },
    {route: "GET /admin/pages/:id/edit", send: (s, c) => get(`/admin/pages/${s.pageId}/edit`, c)},
    {
        route: "POST /admin/pages/:id/edit",
        send: (s, c) =>
            postForm(
                `/admin/pages/${s.pageId}/edit`,
                {name: "Hacked", slug: "hacked", title: "Hacked", description: ""},
                c
            ),
    },
    {route: "POST /admin/pages/:id/delete", send: (s, c) => postForm(`/admin/pages/${s.pageId}/delete`, {}, c)},
    {route: "GET /admin/pages/:id/sections/new", send: (s, c) => get(`/admin/pages/${s.pageId}/sections/new`, c)},
    {
        route: "POST /admin/pages/:id/sections/new",
        send: (s, c) =>
            postForm(`/admin/pages/${s.pageId}/sections/new`, {content: "hacked", position: "0", published: "1"}, c),
    },
    {route: "GET /admin/sections/:id/edit", send: (s, c) => get(`/admin/sections/${s.sectionId}/edit`, c)},
    {
        route: "POST /admin/sections/:id/edit",
        send: (s, c) =>
            postForm(`/admin/sections/${s.sectionId}/edit`, {content: "hacked", position: "9", published: "1"}, c),
    },
    {
        route: "POST /admin/sections/:id/delete",
        send: (s, c) => postForm(`/admin/sections/${s.sectionId}/delete`, {}, c),
    },

    {route: "GET /admin/blog", send: (_, c) => get("/admin/blog", c)},
    {route: "GET /admin/blog/new", send: (_, c) => get("/admin/blog/new", c)},
    {
        route: "POST /admin/blog/new",
        send: (_, c) =>
            postMultipart(
                "/admin/blog/new",
                multipart({title: `Unauth ${uid()}`, content: "x", published: "1"}, "thumbnail"),
                c
            ),
    },
    {route: "GET /admin/blog/:id/edit", send: (s, c) => get(`/admin/blog/${s.postId}/edit`, c)},
    {
        route: "POST /admin/blog/:id/edit",
        send: (s, c) =>
            postMultipart(
                `/admin/blog/${s.postId}/edit`,
                multipart({title: "Hacked", content: "hacked", published: "1"}, "thumbnail"),
                c
            ),
    },
    {route: "POST /admin/blog/:id/delete", send: (s, c) => postForm(`/admin/blog/${s.postId}/delete`, {}, c)},

    {route: "GET /admin/navigation", send: (_, c) => get("/admin/navigation", c)},
    {route: "POST /admin/navigation", send: (_, c) => postForm("/admin/navigation", {brandName: "Hacked"}, c)},
    {route: "GET /admin/nav-items/new", send: (_, c) => get("/admin/nav-items/new", c)},
    {
        route: "POST /admin/nav-items/new",
        send: (s, c) =>
            postForm(
                "/admin/nav-items/new",
                {navigationId: s.navigationId, name: "Hacked", href: "/hacked", position: "0", alignment: "LEFT"},
                c
            ),
    },
    {route: "GET /admin/nav-items/:id/edit", send: (s, c) => get(`/admin/nav-items/${s.itemId}/edit`, c)},
    {
        route: "POST /admin/nav-items/:id/edit",
        send: (s, c) =>
            postForm(
                `/admin/nav-items/${s.itemId}/edit`,
                {navigationId: s.navigationId, name: "Hacked", href: "/hacked", position: "0", alignment: "LEFT"},
                c
            ),
    },
    {route: "POST /admin/nav-items/:id/delete", send: (s, c) => postForm(`/admin/nav-items/${s.itemId}/delete`, {}, c)},

    {route: "GET /admin/messages", send: (_, c) => get("/admin/messages", c)},
    {
        route: "POST /admin/messages/:id/toggle-read",
        send: (s, c) => postForm(`/admin/messages/${s.messageId}/toggle-read`, {}, c),
    },
    {
        route: "POST /admin/messages/:id/delete",
        send: (s, c) => postForm(`/admin/messages/${s.messageId}/delete`, {}, c),
    },

    {route: "GET /admin/settings", send: (_, c) => get("/admin/settings", c)},
    {
        route: "POST /admin/settings/photo",
        send: (_, c) => postMultipart("/admin/settings/photo", multipart({}, "photo"), c),
    },
    {route: "POST /admin/settings/photo/delete", send: (_, c) => postForm("/admin/settings/photo/delete", {}, c)},
    {route: "POST /admin/settings/cache/clear", send: (_, c) => postForm("/admin/settings/cache/clear", {}, c)},

    {route: "GET /admin/does-not-exist", send: (_, c) => get("/admin/does-not-exist", c)},
];

const payload = (s: Seed) => ({userId: s.userId, name: s.userName, role: "ADMIN"});
const named = (token: string) => `${env.JWT_COOKIE_NAME}=${token}`;
const base64url = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");

const variants: Variant[] = [
    {variant: "no cookie", cookie: () => undefined},
    {variant: "a garbage token", cookie: () => named("not.a.jwt")},
    {variant: "a token signed with another secret", cookie: (s) => named(jwt.sign(payload(s), "other-secret"))},
    {
        variant: "an expired token",
        cookie: (s) => named(jwt.sign(payload(s), env.JWT_SECRET, {expiresIn: -10})),
    },
    {
        variant: "an unsigned token",
        cookie: (s) => named(`${base64url({alg: "none", typ: "JWT"})}.${base64url(payload(s))}.`),
    },
    {
        variant: "a token for an unknown user",
        cookie: (s) => named(jwt.sign({...payload(s), userId: randomUUID()}, env.JWT_SECRET)),
    },
    {
        variant: "a token with a stale name",
        cookie: (s) => named(jwt.sign({...payload(s), name: "Someone Else"}, env.JWT_SECRET)),
    },
    {
        variant: "a valid token under the wrong cookie name",
        cookie: (s) => `not-the-auth-cookie=${jwt.sign(payload(s), env.JWT_SECRET)}`,
    },
];

const cases = routes.flatMap((r) => variants.map((v) => ({...r, ...v})));

async function snapshot(s: Seed) {
    const [page, post, navigation, message, user, counts] = await Promise.all([
        db.p.page.findUnique({where: {id: s.pageId}, include: {sections: true}}),
        db.p.post.findUnique({where: {id: s.postId}}),
        db.p.navigation.findUnique({where: {id: s.navigationId}, include: {items: true}}),
        db.p.contactMessage.findUnique({where: {id: s.messageId}}),
        db.p.user.findUnique({where: {id: s.userId}, select: {photo: true, photoId: true, name: true}}),
        Promise.all([
            db.p.page.count(),
            db.p.pageSection.count(),
            db.p.post.count(),
            db.p.navigationItem.count(),
            db.p.contactMessage.count(),
        ]),
    ]);
    return {page, post, navigation, message, user, counts};
}

describe("unauthenticated access", () => {
    let seed: Seed;
    let before: Awaited<ReturnType<typeof snapshot>>;
    let adminCookie: string;
    let entriesBefore: number;

    beforeAll(async () => {
        adminCookie = await login();
        const user = await db.p.user.findUniqueOrThrow({where: {email: env.SUPER_USER!.email}});
        await db.p.user.update({where: {id: user.id}, data: {photo: SEED_PHOTO, photoId: "unauthenticated-seed"}});
        const navigation = await db.p.navigation.findFirstOrThrow();
        const page = await db.p.page.create({
            data: {
                name: `Guarded ${uid()}`,
                slug: `guarded-${uid()}`,
                title: "Guarded",
                description: "",
                published: true,
                sections: {create: {content: "guarded", position: 0, published: true}},
            },
            include: {sections: true},
        });
        const post = await db.p.post.create({
            data: {
                title: "Guarded",
                slug: `guarded-${uid()}`,
                content: "guarded",
                published: true,
                thumbnail: "",
                authorId: user.id,
            },
        });
        const item = await db.p.navigationItem.create({
            data: {navigationId: navigation.id, name: `Guarded${uid()}`, href: "/guarded"},
        });
        const message = await db.p.contactMessage.create({
            data: {name: "Guarded", email: "guarded@example.com", message: "guarded"},
        });

        seed = {
            pageId: page.id,
            sectionId: page.sections[0].id,
            postId: post.id,
            navigationId: navigation.id,
            itemId: item.id,
            messageId: message.id,
            userId: user.id,
            userName: user.name,
        };
        before = await snapshot(seed);

        await get("/blog");
        entriesBefore = (await cacheStats(adminCookie)).entries;
    });

    afterAll(async () => {
        await db.p.user.update({where: {id: seed.userId}, data: {photo: null, photoId: null}});
    });

    it("accepts a correctly signed token, so the rejections below are for the right reason", async () => {
        const res = await get("/admin", named(jwt.sign(payload(seed), env.JWT_SECRET)));

        expect(res.status).toBe(200);
    });

    it.each(cases)("$route with $variant redirects to login", async ({send, cookie}) => {
        const res = await send(seed, cookie(seed));

        expect(res.status).toBe(302);
        expect(res.location).toBe("/admin/login");
        expect(res.setCookies).toEqual([]);
        expect(res.html).not.toContain("admin-sidebar");
    });

    it("changed nothing", async () => {
        const after = await snapshot(seed);

        expect(after).toEqual(before);
        expect(after.message?.read).toBe(false);
        expect(after.user?.photo).toBe(SEED_PHOTO);
    });

    it("did not clear the cache", async () => {
        expect(entriesBefore).toBeGreaterThan(0);
        expect((await cacheStats(adminCookie)).entries).toBe(entriesBefore);
    });

    it("still serves the public site and login page without a cookie", async () => {
        for (const path of ["/", "/blog", "/admin/login"]) {
            const res = await get(path);
            expect(res.status, path).not.toBe(302);
            expect(res.location, path).toBeNull();
        }
    });
});
