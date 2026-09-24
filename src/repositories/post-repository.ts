import {success, failure, type AsyncResult} from "../lib/result.js";
import type {RawModel, MaybeNull, RawModelUpdate} from "../lib/types.js";
import type {Post} from "@prisma/client";
import type DataService from "../services/data-service.js";
import type LoggerService from "../services/logger-service.js";
import type {SkipTake, PaginatedResult} from "../lib/pagination.js";
import {userOmit, type User} from "./user-repository.js";

export type PostWithAuthor = Post & {author: User};

type PostWhere = {published?: boolean};

const includeAuthor = {author: {omit: userOmit}} as const;

class PostRepository {
    constructor(
        private readonly db: DataService,
        private readonly log: LoggerService
    ) {}

    async list(
        opts: Partial<SkipTake> = {},
        where: PostWhere = {}
    ): AsyncResult<PaginatedResult<PostWithAuthor>> {
        try {
            const [data, total] = await Promise.all([
                this.db.p.post.findMany({
                    where,
                    include: includeAuthor,
                    orderBy: {createdAt: "desc"},
                    skip: opts.skip,
                    take: opts.take,
                }),
                this.db.p.post.count({where}),
            ]);
            return success({data, total});
        } catch (err) {
            this.log.error(err, "post-repo.list");
            return failure("failed to list posts");
        }
    }

    async count(where: PostWhere = {}): AsyncResult<number> {
        try {
            const count = await this.db.p.post.count({where});
            return success(count);
        } catch (err) {
            this.log.error(err, "post-repo.count");
            return failure("failed to count posts");
        }
    }

    async getById(id: string): AsyncResult<MaybeNull<PostWithAuthor>> {
        try {
            const post = await this.db.p.post.findUnique({where: {id}, include: includeAuthor});
            return success(post);
        } catch (err) {
            this.log.error(err, "post-repo.getById");
            return failure("failed to get post");
        }
    }

    async getBySlug(slug: string): AsyncResult<MaybeNull<PostWithAuthor>> {
        try {
            const post = await this.db.p.post.findUnique({where: {slug}, include: includeAuthor});
            return success(post);
        } catch (err) {
            this.log.error(err, "post-repo.getBySlug");
            return failure("failed to get post by slug");
        }
    }

    async create(data: RawModel<Post>): AsyncResult<PostWithAuthor> {
        try {
            const post = await this.db.p.post.create({data, include: includeAuthor});
            return success(post);
        } catch (err) {
            this.log.error(err, "post-repo.create");
            return failure("failed to create post");
        }
    }

    async update(id: string, data: RawModelUpdate<Post>): AsyncResult<PostWithAuthor> {
        try {
            const post = await this.db.p.post.update({where: {id}, data, include: includeAuthor});
            return success(post);
        } catch (err) {
            this.log.error(err, "post-repo.update");
            return failure("failed to update post");
        }
    }

    async delete(id: string): AsyncResult<Post> {
        try {
            const post = await this.db.p.post.delete({where: {id}});
            return success(post);
        } catch (err) {
            this.log.error(err, "post-repo.delete");
            return failure("failed to delete post");
        }
    }
}

export default PostRepository;
