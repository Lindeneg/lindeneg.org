import {success, failure, type AsyncResult} from "../lib/result.js";
import type {RawModel, MaybeNull, RawModelUpdate} from "../lib/types.js";
import type {Post, Tag} from "@prisma/client";
import type DataService from "../services/data-service.js";
import type LoggerService from "../services/logger-service.js";
import type {SkipTake, PaginatedResult} from "../lib/pagination.js";
import {userOmit, type User} from "./user-repository.js";

export type PostWithRelations = Post & {author: User; tags: Tag[]};

export type TagWithCount = {name: string; count: number};

type PostWhere = {published?: boolean; tag?: string};

const include = {author: {omit: userOmit}, tags: {orderBy: {name: "asc"}}} as const;

function toWhere({published, tag}: PostWhere) {
    return {published, ...(tag ? {tags: {some: {name: tag}}} : {})};
}

class PostRepository {
    constructor(
        private readonly db: DataService,
        private readonly log: LoggerService
    ) {}

    async list(
        opts: Partial<SkipTake> = {},
        where: PostWhere = {}
    ): AsyncResult<PaginatedResult<PostWithRelations>> {
        try {
            const [data, total] = await Promise.all([
                this.db.p.post.findMany({
                    where: toWhere(where),
                    include,
                    orderBy: {createdAt: "desc"},
                    skip: opts.skip,
                    take: opts.take,
                }),
                this.db.p.post.count({where: toWhere(where)}),
            ]);
            return success({data, total});
        } catch (err) {
            this.log.error(err, "post-repo.list");
            return failure("failed to list posts");
        }
    }

    async count(where: PostWhere = {}): AsyncResult<number> {
        try {
            const count = await this.db.p.post.count({where: toWhere(where)});
            return success(count);
        } catch (err) {
            this.log.error(err, "post-repo.count");
            return failure("failed to count posts");
        }
    }

    async listPublishedTags(): AsyncResult<TagWithCount[]> {
        try {
            const tags = await this.db.p.tag.findMany({
                where: {posts: {some: {published: true}}},
                select: {name: true, _count: {select: {posts: {where: {published: true}}}}},
                orderBy: {name: "asc"},
            });
            return success(tags.map((t) => ({name: t.name, count: t._count.posts})));
        } catch (err) {
            this.log.error(err, "post-repo.listPublishedTags");
            return failure("failed to list tags");
        }
    }

    async getById(id: string): AsyncResult<MaybeNull<PostWithRelations>> {
        try {
            const post = await this.db.p.post.findUnique({where: {id}, include});
            return success(post);
        } catch (err) {
            this.log.error(err, "post-repo.getById");
            return failure("failed to get post");
        }
    }

    async getBySlug(slug: string): AsyncResult<MaybeNull<PostWithRelations>> {
        try {
            const post = await this.db.p.post.findUnique({where: {slug}, include});
            return success(post);
        } catch (err) {
            this.log.error(err, "post-repo.getBySlug");
            return failure("failed to get post by slug");
        }
    }

    async create(data: RawModel<Post>, tags: string[]): AsyncResult<PostWithRelations> {
        try {
            const post = await this.db.p.post.create({
                data: {
                    ...data,
                    tags: {connectOrCreate: tags.map((name) => ({where: {name}, create: {name}}))},
                },
                include,
            });
            return success(post);
        } catch (err) {
            this.log.error(err, "post-repo.create");
            return failure("failed to create post");
        }
    }

    async update(id: string, data: RawModelUpdate<Post>, tags: string[]): AsyncResult<PostWithRelations> {
        try {
            const post = await this.db.p.$transaction(async (tx) => {
                for (const name of tags) {
                    await tx.tag.upsert({where: {name}, create: {name}, update: {}});
                }
                return tx.post.update({
                    where: {id},
                    data: {...data, tags: {set: tags.map((name) => ({name}))}},
                    include,
                });
            });
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
