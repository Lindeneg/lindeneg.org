import {success, emptySuccess, failure, type EmptyResult, type AsyncResult} from "../lib/result.js";
import {paginate, toSkipTake, type Paginated, type PaginationParams} from "../lib/pagination.js";
import {CacheTag} from "../lib/page-cache.js";
import type PageCache from "../lib/page-cache.js";
import {slugify} from "../lib/slugify.js";
import type {ValueOf, RawModelUpdate} from "../lib/types.js";
import type {Post} from "@prisma/client";
import type PostRepository from "../repositories/post-repository.js";
import type {PostWithAuthor} from "../repositories/post-repository.js";
import type {ImageFile, ImageStore} from "./image-store.js";
import type LoggerService from "./logger-service.js";

export const PostError = {
    NOT_FOUND: "not_found",
    DB_ERROR: "db_error",
    UPLOAD_ERROR: "upload_error",
} as const;

export type PostError = ValueOf<typeof PostError>;

export type ThumbnailChange = {kind: "keep"} | {kind: "remove"} | {kind: "replace"; file: ImageFile};

export interface CreatePostInput {
    title: string;
    content: string;
    published: boolean;
    thumbnail?: ImageFile;
}

export interface UpdatePostInput {
    title: string;
    content: string;
    published: boolean;
    thumbnail: ThumbnailChange;
}

class PostService {
    constructor(
        private readonly postRepo: PostRepository,
        private readonly imageStore: ImageStore,
        private readonly cache: PageCache,
        private readonly log: LoggerService
    ) {}

    async list(pagination: PaginationParams): AsyncResult<Paginated<PostWithAuthor>, PostError> {
        const result = await this.postRepo.list(toSkipTake(pagination));
        if (!result.ok) return failure(PostError.DB_ERROR);
        return success(paginate(result.data.data, result.data.total, pagination));
    }

    async get(id: string): AsyncResult<PostWithAuthor, PostError> {
        const result = await this.postRepo.getById(id);
        if (!result.ok) return failure(PostError.DB_ERROR);
        if (!result.data) return failure(PostError.NOT_FOUND);
        return success(result.data);
    }

    async create(authorId: string, input: CreatePostInput): AsyncResult<PostWithAuthor, PostError> {
        let thumbnail = {url: "", publicId: ""};
        if (input.thumbnail) {
            const upload = await this.imageStore.upload(input.thumbnail);
            if (!upload.ok) return failure(PostError.UPLOAD_ERROR);
            thumbnail = upload.data;
        }

        const result = await this.postRepo.create({
            title: input.title,
            slug: slugify(input.title),
            content: input.content,
            published: input.published,
            thumbnail: thumbnail.url,
            thumbnailId: thumbnail.publicId,
            authorId,
        });
        if (!result.ok) {
            if (thumbnail.publicId) await this.#deleteImage(thumbnail.publicId);
            return failure(PostError.DB_ERROR);
        }

        this.cache.invalidate([CacheTag.blogList]);
        return success(result.data);
    }

    async update(id: string, input: UpdatePostInput): AsyncResult<PostWithAuthor, PostError> {
        const existing = await this.get(id);
        if (!existing.ok) return existing;

        const payload: RawModelUpdate<Post> = {
            title: input.title,
            slug: slugify(input.title),
            content: input.content,
            published: input.published,
        };

        let uploadedId = "";
        if (input.thumbnail.kind === "remove") {
            payload.thumbnail = "";
            payload.thumbnailId = "";
        } else if (input.thumbnail.kind === "replace") {
            const upload = await this.imageStore.upload(input.thumbnail.file);
            if (!upload.ok) return failure(PostError.UPLOAD_ERROR);
            uploadedId = upload.data.publicId;
            payload.thumbnail = upload.data.url;
            payload.thumbnailId = upload.data.publicId;
        }

        const result = await this.postRepo.update(id, payload);
        if (!result.ok) {
            if (uploadedId) await this.#deleteImage(uploadedId);
            return failure(PostError.DB_ERROR);
        }

        const oldId = existing.data.thumbnailId;
        if (input.thumbnail.kind !== "keep" && oldId) await this.#deleteImage(oldId);

        this.cache.invalidate([CacheTag.post(id), CacheTag.blogList]);
        return success(result.data);
    }

    async delete(id: string): Promise<EmptyResult<PostError>> {
        const result = await this.postRepo.delete(id);
        if (!result.ok) return failure(PostError.DB_ERROR);

        if (result.data.thumbnailId) await this.#deleteImage(result.data.thumbnailId);

        this.cache.invalidate([CacheTag.post(id), CacheTag.blogList]);
        return emptySuccess();
    }

    async #deleteImage(publicId: string): Promise<void> {
        const result = await this.imageStore.delete(publicId);
        if (!result.ok) this.log.error({publicId}, "post-service: failed to delete image");
    }
}

export default PostService;
