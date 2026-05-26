import {success, emptySuccess, failure, type Result, type EmptyResult} from "../lib/result.js";
import {slugify} from "../lib/slugify.js";
import type {RawModel} from "../lib/types.js";
import type {Post} from "@prisma/client";
import type PostRepository from "../repositories/post-repository.js";
import type {PostWithAuthor} from "../repositories/post-repository.js";
import type CloudinaryService from "./cloudinary-service.js";
import type LoggerService from "./logger-service.js";

export const PostError = {
    NOT_FOUND: "not_found",
    DB_ERROR: "db_error",
    UPLOAD_ERROR: "upload_error",
} as const;

export type PostError = (typeof PostError)[keyof typeof PostError];

export interface CreatePostInput {
    title: string;
    content: string;
    published: boolean;
    thumbnail?: string;
}

export interface UpdatePostInput {
    title?: string;
    content?: string;
    published?: boolean;
    thumbnail?: string;
}

class PostService {
    constructor(
        private readonly postRepo: PostRepository,
        private readonly cloudinary: CloudinaryService,
        private readonly log: LoggerService
    ) {}

    async createPost(
        authorId: string,
        input: CreatePostInput
    ): Promise<Result<PostWithAuthor, PostError>> {
        const result = await this.postRepo.create({
            title: input.title,
            slug: slugify(input.title),
            content: input.content,
            published: input.published,
            thumbnail: "",
            authorId,
        });
        if (!result.ok) return failure(PostError.DB_ERROR);

        if (input.thumbnail) {
            const upload = await this.cloudinary.upload(input.thumbnail);
            if (upload.ok) {
                await this.postRepo.update(result.data.id, {
                    thumbnail: upload.data.url,
                    thumbnailId: upload.data.publicId,
                });
                result.data.thumbnail = upload.data.url;
                result.data.thumbnailId = upload.data.publicId;
            }
        }

        return success(result.data);
    }

    async updatePost(
        id: string,
        input: UpdatePostInput
    ): Promise<Result<PostWithAuthor, PostError>> {
        const existing = await this.postRepo.getById(id);
        if (!existing.ok) return failure(PostError.DB_ERROR);
        if (!existing.data) return failure(PostError.NOT_FOUND);

        const {thumbnail, ...rest} = input;
        const payload: Partial<RawModel<Post>> = {...rest};

        if (payload.title) payload.slug = slugify(payload.title);

        if (thumbnail === "" && existing.data.thumbnailId) {
            const deleteResult = await this.cloudinary.delete(existing.data.thumbnailId);
            if (!deleteResult.ok) return failure(PostError.UPLOAD_ERROR);
            payload.thumbnail = "";
            payload.thumbnailId = "";
        } else if (thumbnail) {
            const upload = await this.cloudinary.upload(thumbnail);
            if (!upload.ok) return failure(PostError.UPLOAD_ERROR);

            if (existing.data.thumbnailId) {
                const deleteResult = await this.cloudinary.delete(existing.data.thumbnailId);
                if (!deleteResult.ok) return failure(PostError.UPLOAD_ERROR);
            }

            payload.thumbnail = upload.data.url;
            payload.thumbnailId = upload.data.publicId;
        }

        const result = await this.postRepo.update(id, payload);
        if (!result.ok) return failure(PostError.DB_ERROR);

        return success(result.data);
    }

    async deletePost(id: string): Promise<EmptyResult<PostError>> {
        const result = await this.postRepo.delete(id);
        if (!result.ok) return failure(PostError.DB_ERROR);

        if (result.data.thumbnailId) {
            const deleteResult = await this.cloudinary.delete(result.data.thumbnailId);
            if (!deleteResult.ok)
                this.log.error("post-service.deletePost", "failed to delete thumbnail");
        }

        return emptySuccess();
    }
}

export default PostService;
