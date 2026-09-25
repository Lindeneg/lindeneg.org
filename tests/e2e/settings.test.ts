import {beforeAll, describe, expect, it} from "vitest";
import {env, get, imageBlob, login, postForm, postMultipart, uid, type TestResponse} from "./helpers.js";

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
