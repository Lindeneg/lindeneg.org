import type {AsyncResult} from "../lib/result.js";
import type {DbError} from "../lib/errors.js";
import type {RawModel, MaybeNull, RawModelUpdate} from "../lib/types.js";
import type {Post, Tag} from "../generated/prisma/client.js";
import type DataService from "../services/data-service.js";
import type {SkipTake, PaginatedResult} from "../lib/pagination.js";
import {userOmit, type User} from "./user-repository.js";

export type PostWithRelations = Post & {author: User; tags: Tag[]};

export type TagWithCount = {name: string; count: number};

type PostWhere = {published?: boolean; tag?: string};

export type PostOrder = "createdAt" | "publishedAt";

const include = {author: {omit: userOmit}, tags: {orderBy: {name: "asc"}}} as const;

// tags only exist through their posts, so ones left without any are removed
const pruneOrphanTags = {where: {posts: {none: {}}}} as const;

function toWhere({published, tag}: PostWhere) {
    return {published, ...(tag ? {tags: {some: {name: tag}}} : {})};
}

class PostRepository {
    constructor(private readonly db: DataService) {}

    list(
        opts: Partial<SkipTake> = {},
        where: PostWhere = {},
        order: PostOrder = "createdAt"
    ): AsyncResult<PaginatedResult<PostWithRelations>, DbError> {
        return this.db.run(
            "post-repo.list",
            Promise.all([
                this.db.p.post.findMany({
                    where: toWhere(where),
                    include,
                    orderBy: [{[order]: "desc"}, {createdAt: "desc"}],
                    skip: opts.skip,
                    take: opts.take,
                }),
                this.db.p.post.count({where: toWhere(where)}),
            ]).then(([data, total]) => ({data, total}))
        );
    }

    count(where: PostWhere = {}): AsyncResult<number, DbError> {
        return this.db.run("post-repo.count", this.db.p.post.count({where: toWhere(where)}));
    }

    listPublishedTags(): AsyncResult<TagWithCount[], DbError> {
        return this.db.run(
            "post-repo.listPublishedTags",
            this.db.p.tag
                .findMany({
                    where: {posts: {some: {published: true}}},
                    select: {name: true, _count: {select: {posts: {where: {published: true}}}}},
                    orderBy: {name: "asc"},
                })
                .then((tags) => tags.map((t) => ({name: t.name, count: t._count.posts})))
        );
    }

    getById(id: string): AsyncResult<MaybeNull<PostWithRelations>, DbError> {
        return this.db.run("post-repo.getById", this.db.p.post.findUnique({where: {id}, include}));
    }

    getBySlug(slug: string): AsyncResult<MaybeNull<PostWithRelations>, DbError> {
        return this.db.run("post-repo.getBySlug", this.db.p.post.findUnique({where: {slug}, include}));
    }

    create(data: RawModel<Post>, tags: string[]): AsyncResult<PostWithRelations, DbError> {
        return this.db.run(
            "post-repo.create",
            this.db.p.post.create({
                data: {
                    ...data,
                    tags: {connectOrCreate: tags.map((name) => ({where: {name}, create: {name}}))},
                },
                include,
            })
        );
    }

    update(id: string, data: RawModelUpdate<Post>, tags: string[]): AsyncResult<PostWithRelations, DbError> {
        return this.db.run(
            "post-repo.update",
            this.db.p.$transaction(async (tx) => {
                for (const name of tags) {
                    await tx.tag.upsert({where: {name}, create: {name}, update: {}});
                }
                const post = await tx.post.update({
                    where: {id},
                    data: {...data, tags: {set: tags.map((name) => ({name}))}},
                    include,
                });
                await tx.tag.deleteMany(pruneOrphanTags);
                return post;
            })
        );
    }

    delete(id: string): AsyncResult<Post, DbError> {
        return this.db.run(
            "post-repo.delete",
            this.db.p.$transaction(async (tx) => {
                const post = await tx.post.delete({where: {id}});
                await tx.tag.deleteMany(pruneOrphanTags);
                return post;
            })
        );
    }
}

export default PostRepository;
