import {beforeEach, describe, expect, it, vi, type Mock} from "vitest";
import {emptySuccess, failure, success} from "../../../src/lib/result.js";
import PostService, {PostError} from "../../../src/services/post-service.js";
import type PostRepository from "../../../src/repositories/post-repository.js";
import type {ImageStore} from "../../../src/services/image-store.js";
import {fake, fakeCache, fakeLog, makePost} from "../helpers.js";

const file = {buffer: Buffer.from("img"), mimetype: "image/png"};
const uploaded = {url: "https://img/new.png", publicId: "new-id"};

describe("PostService", () => {
    let repo: Record<"getById" | "create" | "update" | "delete", Mock>;
    let store: Record<"upload" | "delete", Mock>;
    let invalidate: Mock;
    let log: ReturnType<typeof fakeLog>;
    let service: PostService;

    beforeEach(() => {
        repo = {
            getById: vi.fn().mockResolvedValue(success(makePost({thumbnail: "https://img/old.png", thumbnailId: "old-id"}))),
            create: vi.fn().mockResolvedValue(success(makePost())),
            update: vi.fn().mockResolvedValue(success(makePost())),
            delete: vi.fn().mockResolvedValue(success(makePost({thumbnailId: "old-id"}))),
        };
        store = {
            upload: vi.fn().mockResolvedValue(success(uploaded)),
            delete: vi.fn().mockResolvedValue(emptySuccess()),
        };
        const c = fakeCache();
        invalidate = c.invalidate;
        log = fakeLog();
        service = new PostService(fake<PostRepository>(repo), fake<ImageStore>(store), c.cache, log);
    });

    describe("create", () => {
        it("uploads the thumbnail before creating the post", async () => {
            const result = await service.create("user-1", {title: "My Post!", content: "c", published: true, thumbnail: file});

            expect(result.ok).toBe(true);
            expect(store.upload.mock.invocationCallOrder[0]).toBeLessThan(repo.create.mock.invocationCallOrder[0]);
            expect(repo.create).toHaveBeenCalledWith({
                title: "My Post!",
                slug: "my-post",
                content: "c",
                published: true,
                thumbnail: uploaded.url,
                thumbnailId: uploaded.publicId,
                authorId: "user-1",
            });
            expect(invalidate).toHaveBeenCalledExactlyOnceWith(["blog-list"]);
        });

        it("does not create the post when the upload fails", async () => {
            store.upload.mockResolvedValue(failure("boom"));

            const result = await service.create("user-1", {title: "t", content: "c", published: false, thumbnail: file});

            expect(result).toEqual(failure(PostError.UPLOAD_ERROR));
            expect(repo.create).not.toHaveBeenCalled();
            expect(invalidate).not.toHaveBeenCalled();
        });

        it("deletes the uploaded image when the post can't be created", async () => {
            repo.create.mockResolvedValue(failure("unique constraint"));

            const result = await service.create("user-1", {title: "t", content: "c", published: false, thumbnail: file});

            expect(result).toEqual(failure(PostError.DB_ERROR));
            expect(store.delete).toHaveBeenCalledWith(uploaded.publicId);
            expect(invalidate).not.toHaveBeenCalled();
        });

        it("creates without a thumbnail", async () => {
            await service.create("user-1", {title: "t", content: "c", published: false});

            expect(store.upload).not.toHaveBeenCalled();
            expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({thumbnail: "", thumbnailId: ""}));
        });
    });

    describe("update", () => {
        const input = {title: "New Title", content: "c", published: true};

        it("returns NOT_FOUND for a missing post", async () => {
            repo.getById.mockResolvedValue(success(null));

            const result = await service.update("post-1", {...input, thumbnail: {kind: "keep"}});

            expect(result).toEqual(failure(PostError.NOT_FOUND));
            expect(repo.update).not.toHaveBeenCalled();
        });

        it("keeps the thumbnail untouched", async () => {
            await service.update("post-1", {...input, thumbnail: {kind: "keep"}});

            expect(store.upload).not.toHaveBeenCalled();
            expect(store.delete).not.toHaveBeenCalled();
            expect(repo.update).toHaveBeenCalledWith("post-1", {
                title: "New Title",
                slug: "new-title",
                content: "c",
                published: true,
            });
            expect(invalidate).toHaveBeenCalledExactlyOnceWith(["post:post-1", "blog-list"]);
        });

        it("replaces: uploads, updates, then deletes the old image", async () => {
            await service.update("post-1", {...input, thumbnail: {kind: "replace", file}});

            expect(repo.update).toHaveBeenCalledWith(
                "post-1",
                expect.objectContaining({thumbnail: uploaded.url, thumbnailId: uploaded.publicId})
            );
            expect(store.delete).toHaveBeenCalledWith("old-id");
            expect(repo.update.mock.invocationCallOrder[0]).toBeLessThan(store.delete.mock.invocationCallOrder[0]);
        });

        it("keeps the old image and removes the new one when the update fails", async () => {
            repo.update.mockResolvedValue(failure("db"));

            const result = await service.update("post-1", {...input, thumbnail: {kind: "replace", file}});

            expect(result).toEqual(failure(PostError.DB_ERROR));
            expect(store.delete).toHaveBeenCalledOnce();
            expect(store.delete).toHaveBeenCalledWith(uploaded.publicId);
            expect(invalidate).not.toHaveBeenCalled();
        });

        it("removes: clears the fields, then deletes the old image", async () => {
            await service.update("post-1", {...input, thumbnail: {kind: "remove"}});

            expect(store.upload).not.toHaveBeenCalled();
            expect(repo.update).toHaveBeenCalledWith("post-1", expect.objectContaining({thumbnail: "", thumbnailId: ""}));
            expect(store.delete).toHaveBeenCalledWith("old-id");
        });

        it("fails without touching the post when the new upload fails", async () => {
            store.upload.mockResolvedValue(failure("boom"));

            const result = await service.update("post-1", {...input, thumbnail: {kind: "replace", file}});

            expect(result).toEqual(failure(PostError.UPLOAD_ERROR));
            expect(repo.update).not.toHaveBeenCalled();
        });
    });

    describe("delete", () => {
        it("deletes the post and its thumbnail", async () => {
            const result = await service.delete("post-1");

            expect(result.ok).toBe(true);
            expect(store.delete).toHaveBeenCalledWith("old-id");
            expect(invalidate).toHaveBeenCalledExactlyOnceWith(["post:post-1", "blog-list"]);
        });

        it("logs but still succeeds when the thumbnail can't be deleted", async () => {
            store.delete.mockResolvedValue(failure("cdn down"));

            const result = await service.delete("post-1");

            expect(result.ok).toBe(true);
            expect(log.error).toHaveBeenCalled();
        });

        it("reports db errors", async () => {
            repo.delete.mockResolvedValue(failure("db"));

            expect(await service.delete("post-1")).toEqual(failure(PostError.DB_ERROR));
            expect(store.delete).not.toHaveBeenCalled();
        });
    });
});
