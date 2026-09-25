import {beforeAll, describe, expect, it} from "vitest";
import {MAX_UPLOAD_BYTES} from "../../src/lib/http.js";
import {db, env, get, imageBlob, login, postForm, postMultipart, uid, type TestResponse} from "./helpers.js";

const FAKE_IMAGE = /https:\/\/images\.test\/fake-\d+/;

describe("settings", () => {
    let cookie: string;

    beforeAll(async () => {
        cookie = await login();
    });

    it("renders the settings page", async () => {
        expect((await get("/admin/settings", cookie)).status).toBe(200);
    });

    it("requires a file for the photo upload", async () => {
        const form = new FormData();
        form.set("unrelated", "field");

        const res = await postMultipart("/admin/settings/photo", form, cookie);

        expect(res.status).toBe(400);
        expect(res.html).toContain("Choose an image");
    });

    it("uploads and removes the profile photo", async () => {
        const form = new FormData();
        form.set("photo", imageBlob(), "me.png");

        const uploaded = await postMultipart("/admin/settings/photo", form, cookie);
        expect(uploaded.status).toBe(302);
        expect(uploaded.location).toBe("/admin/settings");
        expect((await get("/admin/settings", cookie)).html).toMatch(FAKE_IMAGE);

        const removed = await postForm("/admin/settings/photo/delete", {}, cookie);
        expect(removed.status).toBe(302);
        expect((await get("/admin/settings", cookie)).html).not.toMatch(FAKE_IMAGE);
    });

    it("replaces an existing photo directly and offers replace and remove", async () => {
        const upload = async () => {
            const form = new FormData();
            form.set("photo", imageBlob(), "me.png");
            expect((await postMultipart("/admin/settings/photo", form, cookie)).status).toBe(302);
            return (await db.p.user.findFirstOrThrow({where: {email: env.SUPER_USER!.email}})).photo;
        };

        const first = await upload();
        const second = await upload();
        expect(second).not.toBe(first);

        const html = (await get("/admin/settings", cookie)).html;
        expect(html).toContain("Replace photo");
        expect(html).toContain(`form="photo-delete"`);
        expect(html).toContain(second!);

        await postForm("/admin/settings/photo/delete", {}, cookie);
        const after = (await get("/admin/settings", cookie)).html;
        expect(after).toContain("Upload photo");
        expect(after).not.toContain("Remove photo");
    });

    it("rejects an oversized photo with a message on the settings page", async () => {
        const form = new FormData();
        form.set("photo", new Blob([Buffer.alloc(MAX_UPLOAD_BYTES + 1)], {type: "image/png"}), "big.png");

        const res = await postMultipart("/admin/settings/photo", form, cookie);

        expect(res.status).toBe(400);
        expect(res.html).toContain("Image must be 10MB or smaller");
    });

    it("shows a new author photo on their already cached posts", async () => {
        const post = await db.p.post.create({
            data: {
                title: `Cached ${uid()}`,
                slug: `cached-${uid()}`,
                content: "c",
                published: true,
                publishedAt: new Date(),
                author: {connect: {email: env.SUPER_USER!.email}},
            },
        });
        await get(`/blog/${post.slug}`);

        const form = new FormData();
        form.set("photo", imageBlob(), "me.png");
        await postMultipart("/admin/settings/photo", form, cookie);
        const photo = (await db.p.user.findFirstOrThrow({where: {email: env.SUPER_USER!.email}})).photo!;

        expect((await get(`/blog/${post.slug}`)).html).toContain(photo);
        await postForm("/admin/settings/photo/delete", {}, cookie);
    });

    it("clears the template cache", async () => {
        const res = await postForm("/admin/settings/cache/clear", {}, cookie);

        expect(res.status).toBe(302);
        expect(res.location).toBe("/admin/settings");
    });

    describe("password", () => {
        const password = env.SUPER_USER!.password;
        const newPassword = `new-password-${uid()}`;

        const change = (current: string, next: string, confirm: string, c: string) =>
            postForm(
                "/admin/settings/password",
                {currentPassword: current, newPassword: next, confirmPassword: confirm},
                c
            );

        const sessionCookie = (res: TestResponse) =>
            res.setCookies.find((c) => c.startsWith(`${env.JWT_COOKIE_NAME}=`))!.split(";")[0];

        it("rejects a wrong current password, a short one and a mismatch", async () => {
            expect((await change("wrong", newPassword, newPassword, cookie)).html).toContain("Wrong password");
            expect((await change(password, "short", "short", cookie)).html).toContain("Use at least 12 characters");
            expect((await change(password, newPassword, `${newPassword}x`, cookie)).html).toContain(
                "Passwords don&#39;t match"
            );
        });

        it("changes it, keeps this session and signs out the others", async () => {
            const other = await login();

            const res = await change(password, newPassword, newPassword, cookie);
            expect(res.status).toBe(302);
            expect(res.location).toBe("/admin/settings?password=changed");
            const fresh = sessionCookie(res);

            expect((await get("/admin/settings", fresh)).status).toBe(200);
            expect((await get("/admin/settings", other)).location).toBe("/admin/login");
            expect((await get("/admin/settings", cookie)).location).toBe("/admin/login");

            // back to the configured password, so the other test files can still log in
            const restored = await change(newPassword, password, password, fresh);
            expect(restored.status).toBe(302);
            cookie = sessionCookie(restored);
        });
    });
});
