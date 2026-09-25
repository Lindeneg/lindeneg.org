import {afterAll, beforeAll, describe, expect, it} from "vitest";
import express from "express";
import {MAX_FORM_BYTES, MAX_UPLOAD_BYTES} from "../../../src/lib/http.js";
import {singleImage} from "../../../src/middleware/upload.js";
import {serve, type Served} from "../serve.js";

describe("singleImage", () => {
    let server: Served;

    beforeAll(async () => {
        const app = express();
        app.post("/upload", singleImage("photo"), (req, res) => {
            res.json({
                uploadError: req.uploadError ?? null,
                ...(req.fieldTooLarge ? {fieldTooLarge: true} : {}),
                file: req.file ? {size: req.file.size, mimetype: req.file.mimetype} : null,
                body: req.body,
            });
        });
        server = await serve(app);
    });

    afterAll(() => server.close());

    const upload = async (size: number | null, fields: Record<string, string> = {}) => {
        const form = new FormData();
        for (const [key, value] of Object.entries(fields)) form.set(key, value);
        if (size !== null) form.set("photo", new Blob([Buffer.alloc(size)], {type: "image/png"}), "a.png");
        const res = await fetch(`${server.url}/upload`, {method: "POST", body: form});
        return res.json();
    };

    it("keeps an image within the limit in memory, next to the other fields", async () => {
        expect(await upload(1024, {title: "t"})).toEqual({
            uploadError: null,
            file: {size: 1024, mimetype: "image/png"},
            body: {title: "t"},
        });
    });

    it("accepts an image of exactly the limit", async () => {
        expect((await upload(MAX_UPLOAD_BYTES)).uploadError).toBeNull();
    });

    it("turns an oversized image into a form error instead of an error page", async () => {
        const result = await upload(MAX_UPLOAD_BYTES + 1);

        expect(result.uploadError).toBe("Image must be 10MB or smaller");
        expect(result.file).toBeNull();
    });

    it("keeps a text field over multer's 1mb default, like a long post", async () => {
        const content = "x".repeat(1.5 * 1024 * 1024);

        const result = await upload(null, {content});

        expect(result.uploadError).toBeNull();
        expect(result.body.content).toHaveLength(content.length);
    });

    it("flags a text field over the form limit as too large, not as an image error", async () => {
        const result = await upload(null, {title: "t", content: "x".repeat(MAX_FORM_BYTES + 1)});

        expect(result.fieldTooLarge).toBe(true);
        expect(result.uploadError).toBeNull();
        expect(result.body.content).toBeUndefined();
    });

    it("refuses a form with more than 20 fields, so it can't buffer an unbounded body", async () => {
        const fields = Object.fromEntries(Array.from({length: 21}, (_, i) => [`f${i}`, "x"]));

        const result = await upload(null, fields);

        expect(result.uploadError).toBe("Upload failed, try again");
    });

    it("accepts a form of 20 fields", async () => {
        const fields = Object.fromEntries(Array.from({length: 20}, (_, i) => [`f${i}`, "x"]));

        expect((await upload(null, fields)).uploadError).toBeNull();
    });

    it("passes a form without a file through untouched", async () => {
        expect(await upload(null, {title: "t"})).toEqual({uploadError: null, file: null, body: {title: "t"}});
    });
});
