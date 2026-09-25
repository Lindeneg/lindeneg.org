import {success, emptySuccess, failure, type EmptyResult, type AsyncResult} from "../lib/result.js";
import {AppError} from "../lib/errors.js";
import {paginate, toSkipTake, type Paginated, type PaginationParams} from "../lib/pagination.js";
import {CacheTag} from "../lib/page-cache.js";
import type PageCache from "../lib/page-cache.js";
import {slugify} from "../lib/slugify.js";
import type {MaybeUndefined, RawModelUpdate} from "../lib/types.js";
import type {Post} from "../generated/prisma/client.js";
import type PostRepository from "../repositories/post-repository.js";
import type {PostWithRelations, TagWithCount} from "../repositories/post-repository.js";
import type {ImageFile, ImageStore} from "./image-store.js";
import type LoggerService from "./logger-service.js";

export type ThumbnailChange = {kind: "keep"} | {kind: "remove"} | {kind: "replace"; file: ImageFile};

export interface CreatePostInput {
    title: string;
    // derived from the title when blank
    slug?: string;
    content: string;
    published: boolean;
    tags: string[];
    thumbnail?: ImageFile;
}

export interface UpdatePostInput {
    title: string;
    // derived from the title when blank
    slug?: string;
    content: string;
    published: boolean;
    tags: string[];
    thumbnail: ThumbnailChange;
}

// e.g. ["Error Handling", "jazz", "", "Jazz"] -> ["error-handling", "jazz"]
function normalizeTags(tags: string[]): string[] {
    return [...new Set(tags.map(slugify).filter((tag) => tag !== ""))];
}

export function postSlug(input: {title: string; slug?: string}): string {
    return slugify(input.slug?.trim() || input.title);
}

class PostService {
    constructor(
        private readonly postRepo: PostRepository,
        private readonly imageStore: ImageStore,
        private readonly cache: PageCache,
        private readonly log: LoggerService
    ) {}

    async list(pagination: PaginationParams): AsyncResult<Paginated<PostWithRelations>, AppError> {
        const result = await this.postRepo.list(toSkipTake(pagination));
        if (!result.ok) return result;
        return success(paginate(result.data.data, result.data.total, pagination));
    }

    async listPublished(
        pagination: PaginationParams,
        tag: MaybeUndefined<string>
    ): AsyncResult<Paginated<PostWithRelations>, AppError> {
        const result = await this.postRepo.list(toSkipTake(pagination), {published: true, tag}, "publishedAt");
        if (!result.ok) return result;
        return success(paginate(result.data.data, result.data.total, pagination));
    }

    async listPublishedTags(): AsyncResult<TagWithCount[], AppError> {
        return this.postRepo.listPublishedTags();
    }

    async get(id: string): AsyncResult<PostWithRelations, AppError> {
        const result = await this.postRepo.getById(id);
        if (!result.ok) return result;
        if (!result.data) return failure(AppError.NOT_FOUND);
        return success(result.data);
    }

    async getPublishedBySlug(slug: string): AsyncResult<PostWithRelations, AppError> {
        const result = await this.postRepo.getBySlug(slug);
        if (!result.ok) return result;
        if (!result.data || !result.data.published) return failure(AppError.NOT_FOUND);
        return success(result.data);
    }

    async create(authorId: string, input: CreatePostInput): AsyncResult<PostWithRelations, AppError> {
        let thumbnail = null;
        if (input.thumbnail) {
            const upload = await this.imageStore.upload(input.thumbnail);
            if (!upload.ok) return failure(AppError.UPLOAD_ERROR);
            thumbnail = upload.data;
        }

        const result = await this.postRepo.create(
            {
                title: input.title,
                slug: postSlug(input),
                content: input.content,
                published: input.published,
                publishedAt: input.published ? new Date() : undefined,
                thumbnail: thumbnail?.url,
                thumbnailId: thumbnail?.publicId,
                authorId,
            },
            normalizeTags(input.tags)
        );
        if (!result.ok) {
            if (thumbnail) await this.#deleteImage(thumbnail.publicId);
            return result;
        }

        this.cache.invalidate([CacheTag.blogList]);
        return success(result.data);
    }

    async update(id: string, input: UpdatePostInput): AsyncResult<PostWithRelations, AppError> {
        const existing = await this.get(id);
        if (!existing.ok) return existing;

        const payload: RawModelUpdate<Post> = {
            title: input.title,
            slug: postSlug(input),
            content: input.content,
            published: input.published,
        };
        // the first publish dates the post; unpublishing and publishing again keeps that date
        if (input.published && !existing.data.publishedAt) payload.publishedAt = new Date();

        let uploadedId: string | null = null;
        if (input.thumbnail.kind === "remove") {
            payload.thumbnail = null;
            payload.thumbnailId = null;
        } else if (input.thumbnail.kind === "replace") {
            const upload = await this.imageStore.upload(input.thumbnail.file);
            if (!upload.ok) return failure(AppError.UPLOAD_ERROR);
            uploadedId = upload.data.publicId;
            payload.thumbnail = upload.data.url;
            payload.thumbnailId = upload.data.publicId;
        }

        const result = await this.postRepo.update(id, payload, normalizeTags(input.tags));
        if (!result.ok) {
            if (uploadedId) await this.#deleteImage(uploadedId);
            return result;
        }

        const oldId = existing.data.thumbnailId;
        if (input.thumbnail.kind !== "keep" && oldId) await this.#deleteImage(oldId);

        this.cache.invalidate([CacheTag.post(id), CacheTag.blogList]);
        return success(result.data);
    }

    async delete(id: string): Promise<EmptyResult<AppError>> {
        const result = await this.postRepo.delete(id);
        if (!result.ok) return result;

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
