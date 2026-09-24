import {emptySuccess, failure, type EmptyResult} from "../lib/result.js";
import type {ValueOf} from "../lib/types.js";
import {CacheTag} from "../lib/page-cache.js";
import type PageCache from "../lib/page-cache.js";
import type UserRepository from "../repositories/user-repository.js";
import type {User} from "../repositories/user-repository.js";
import type {ImageFile, ImageStore} from "./image-store.js";
import type LoggerService from "./logger-service.js";

export const UserError = {
    DB_ERROR: "db_error",
    UPLOAD_ERROR: "upload_error",
} as const;

export type UserError = ValueOf<typeof UserError>;

class UserService {
    constructor(
        private readonly userRepo: UserRepository,
        private readonly imageStore: ImageStore,
        private readonly cache: PageCache,
        private readonly log: LoggerService
    ) {}

    async uploadPhoto(user: User, file: ImageFile): Promise<EmptyResult<UserError>> {
        const uploadResult = await this.imageStore.upload(file);
        if (!uploadResult.ok) return failure(UserError.UPLOAD_ERROR);

        const updateResult = await this.userRepo.update(user.id, {
            photo: uploadResult.data.url,
            photoId: uploadResult.data.publicId,
        });
        if (!updateResult.ok) {
            await this.#deleteImage(uploadResult.data.publicId);
            return failure(UserError.DB_ERROR);
        }

        if (user.photoId) await this.#deleteImage(user.photoId);
        this.cache.invalidate([CacheTag.user(user.id)]);
        return emptySuccess();
    }

    async deletePhoto(user: User): Promise<EmptyResult<UserError>> {
        const updateResult = await this.userRepo.update(user.id, {photo: null, photoId: null});
        if (!updateResult.ok) return failure(UserError.DB_ERROR);

        if (user.photoId) await this.#deleteImage(user.photoId);
        this.cache.invalidate([CacheTag.user(user.id)]);
        return emptySuccess();
    }

    async #deleteImage(publicId: string): Promise<void> {
        const result = await this.imageStore.delete(publicId);
        if (!result.ok) this.log.error({publicId}, "user-service: failed to delete image");
    }
}

export default UserService;
