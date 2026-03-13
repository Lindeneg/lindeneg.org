import {success, failure, type Result, type RawModel, type MaybeNull} from "@lindeneg/shared";
import type {Post, User} from "../generated/prisma/index.js";
import type DataService from "../services/data-service.js";
import type LoggerService from "../services/logger-service.js";
import type {SkipTake, PaginatedResult} from "../lib/pagination.js";

export type PostWithAuthor = Post & {author: User};

class PostRepository {
    constructor(
        private readonly db: DataService,
        private readonly log: LoggerService
    ) {}

    async list(
        opts: Partial<SkipTake> = {},
        where: {published?: boolean} = {}
    ): Promise<Result<PaginatedResult<PostWithAuthor>>> {
        try {
            const [data, total] = await Promise.all([
                this.db.p.post.findMany({
                    where,
                    include: {author: true},
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

    async getById(id: string): Promise<Result<MaybeNull<PostWithAuthor>>> {
        try {
            const post = await this.db.p.post.findUnique({where: {id}, include: {author: true}});
            return success(post);
        } catch (err) {
            this.log.error(err, "post-repo.getById");
            return failure("failed to get post");
        }
    }

    async getBySlug(slug: string): Promise<Result<MaybeNull<PostWithAuthor>>> {
        try {
            const post = await this.db.p.post.findUnique({where: {slug}, include: {author: true}});
            return success(post);
        } catch (err) {
            this.log.error(err, "post-repo.getBySlug");
            return failure("failed to get post by slug");
        }
    }

    async create(data: RawModel<Omit<Post, "thumbnailId">>): Promise<Result<PostWithAuthor>> {
        try {
            const post = await this.db.p.post.create({data, include: {author: true}});
            return success(post);
        } catch (err) {
            this.log.error(err, "post-repo.create");
            return failure("failed to create post");
        }
    }

    async update(id: string, data: Partial<RawModel<Post>>): Promise<Result<PostWithAuthor>> {
        try {
            const post = await this.db.p.post.update({where: {id}, data, include: {author: true}});
            return success(post);
        } catch (err) {
            this.log.error(err, "post-repo.update");
            return failure("failed to update post");
        }
    }

    async delete(id: string): Promise<Result<Post>> {
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
