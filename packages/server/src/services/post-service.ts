import {
    success,
    emptySuccess,
    failure,
    slugify,
    type Result,
    type EmptyResult,
    type Paginated,
    type PaginationParams,
    type PostResponse,
    type PostSummaryResponse,
    type CreatePostInput,
    type UpdatePostInput,
    type UserResponse,
    type RawModel,
} from "@lindeneg/shared";
import type {Post, User} from "../generated/prisma/index.js";
import type PostRepository from "../repositories/post-repository.js";
import type {PostWithAuthor} from "../repositories/post-repository.js";
import type CloudinaryService from "./cloudinary-service.js";
import type LoggerService from "./logger-service.js";
import {toSkipTake, paginate} from "../lib/pagination.js";

export const PostError = {
    NOT_FOUND: "not_found",
    DB_ERROR: "db_error",
    UPLOAD_ERROR: "upload_error",
} as const;

export type PostError = (typeof PostError)[keyof typeof PostError];

function toAuthorResponse(user: User): UserResponse {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        photo: user.photo,
        role: user.role,
    };
}

function toPostResponse(post: PostWithAuthor): PostResponse {
    return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        published: post.published,
        thumbnail: post.thumbnail,
        thumbnailId: post.thumbnailId,
        author: toAuthorResponse(post.author),
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
    };
}

function toPostSummaryResponse(post: PostWithAuthor): PostSummaryResponse {
    return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        published: post.published,
        thumbnail: post.thumbnail,
        author: toAuthorResponse(post.author),
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
    };
}

class PostService {
    constructor(
        private readonly postRepo: PostRepository,
        private readonly cloudinary: CloudinaryService,
        private readonly log: LoggerService
    ) {}

    async listPosts(
        pagination: PaginationParams,
        publishedOnly: boolean
    ): Promise<Result<Paginated<PostSummaryResponse>, PostError>> {
        const where = publishedOnly ? {published: true} : {};
        const result = await this.postRepo.list(toSkipTake(pagination), where);
        if (!result.ok) return failure(PostError.DB_ERROR);

        return success(
            paginate(result.data.data.map(toPostSummaryResponse), result.data.total, pagination)
        );
    }

    async getPostBySlug(
        slug: string,
        publishedOnly: boolean
    ): Promise<Result<PostResponse, PostError>> {
        const result = await this.postRepo.getBySlug(slug);
        if (!result.ok) return failure(PostError.DB_ERROR);
        if (!result.data) return failure(PostError.NOT_FOUND);
        if (publishedOnly && !result.data.published) return failure(PostError.NOT_FOUND);

        return success(toPostResponse(result.data));
    }

    async createPost(
        authorId: string,
        input: CreatePostInput
    ): Promise<Result<PostResponse, PostError>> {
        console.log("CREATE POST", {authorId, input});
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

        return success(toPostResponse(result.data));
    }

    async updatePost(id: string, input: UpdatePostInput): Promise<Result<PostResponse, PostError>> {
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

        return success(toPostResponse(result.data));
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
