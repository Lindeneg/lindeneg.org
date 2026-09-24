import {beforeAll, describe, expect, it} from "vitest";
import {get, imageBlob, login, postForm, postMultipart} from "./helpers.js";

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
});
