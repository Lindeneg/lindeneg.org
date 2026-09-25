import {beforeEach, describe, expect, it, vi, type Mock} from "vitest";
import {emptySuccess, failure, success} from "../../../src/lib/result.js";
import {AppError} from "../../../src/lib/errors.js";
import UserService from "../../../src/services/user-service.js";
import type UserRepository from "../../../src/repositories/user-repository.js";
import type {ImageStore} from "../../../src/services/image-store.js";
import {fake, fakeCache, fakeLog, makeUser} from "../helpers.js";

const file = {buffer: Buffer.from("img"), mimetype: "image/png"};
const uploaded = {url: "https://img/new.png", publicId: "new-id"};

describe("UserService", () => {
    let update: Mock;
    let store: Record<"upload" | "delete", Mock>;
    let invalidate: Mock;
    let log: ReturnType<typeof fakeLog>;
    let service: UserService;

    beforeEach(() => {
        update = vi.fn().mockResolvedValue(success(makeUser()));
        store = {
            upload: vi.fn().mockResolvedValue(success(uploaded)),
            delete: vi.fn().mockResolvedValue(emptySuccess()),
        };
        const c = fakeCache();
        invalidate = c.invalidate;
        log = fakeLog();
        service = new UserService(fake<UserRepository>({update}), fake<ImageStore>(store), c.cache, log);
    });

    describe("uploadPhoto", () => {
        const user = makeUser({photo: "https://img/old.png", photoId: "old-id"});

        it("uploads, updates the user, then deletes the old photo", async () => {
            const result = await service.uploadPhoto(user, file);

            expect(result.ok).toBe(true);
            expect(update).toHaveBeenCalledWith(user.id, {photo: uploaded.url, photoId: uploaded.publicId});
            expect(store.upload.mock.invocationCallOrder[0]).toBeLessThan(update.mock.invocationCallOrder[0]);
            expect(update.mock.invocationCallOrder[0]).toBeLessThan(store.delete.mock.invocationCallOrder[0]);
            expect(store.delete).toHaveBeenCalledWith("old-id");
            expect(invalidate).toHaveBeenCalledExactlyOnceWith(["user:user-1"]);
        });

        it("keeps the old photo when the upload fails", async () => {
            store.upload.mockResolvedValue(failure("boom"));

            expect(await service.uploadPhoto(user, file)).toEqual(failure(AppError.UPLOAD_ERROR));
            expect(update).not.toHaveBeenCalled();
            expect(store.delete).not.toHaveBeenCalled();
        });

        it("deletes the new upload and keeps the old photo when the update fails", async () => {
            update.mockResolvedValue(failure(AppError.DB_ERROR));

            expect(await service.uploadPhoto(user, file)).toEqual(failure(AppError.DB_ERROR));
            expect(store.delete).toHaveBeenCalledOnce();
            expect(store.delete).toHaveBeenCalledWith(uploaded.publicId);
            expect(invalidate).not.toHaveBeenCalled();
        });

        it("deletes nothing when there was no previous photo", async () => {
            await service.uploadPhoto(makeUser(), file);

            expect(store.delete).not.toHaveBeenCalled();
        });

        it("logs when the old photo can't be deleted", async () => {
            store.delete.mockResolvedValue(failure("cdn down"));

            expect((await service.uploadPhoto(user, file)).ok).toBe(true);
            expect(log.error).toHaveBeenCalled();
        });
    });

    describe("deletePhoto", () => {
        const user = makeUser({photo: "https://img/old.png", photoId: "old-id"});

        it("clears the user's photo, then deletes the image", async () => {
            expect((await service.deletePhoto(user)).ok).toBe(true);
            expect(update).toHaveBeenCalledWith(user.id, {photo: null, photoId: null});
            expect(store.delete).toHaveBeenCalledWith("old-id");
            expect(invalidate).toHaveBeenCalledExactlyOnceWith(["user:user-1"]);
        });

        it("keeps the image when the update fails", async () => {
            update.mockResolvedValue(failure(AppError.DB_ERROR));

            expect(await service.deletePhoto(user)).toEqual(failure(AppError.DB_ERROR));
            expect(store.delete).not.toHaveBeenCalled();
        });
    });
});
