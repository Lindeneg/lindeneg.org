import { ACTION_RESULT, MediatorResultSuccess, MediatorResultFailure, injectService } from '@lindeneg/funkallero';
import BaseAction from '../base-action';
import SERVICE from '@/enums/service';
import type CloudinaryService from '@/services/cloudinary-service';
import type { ICreateBlogPostDto } from '@/contracts/create-blog-post-dto';
import type { IUpdateBlogPostSchema } from '@/contracts/update-blog-post-dto';
import { Post } from '@prisma/client';
import { toKebabCase } from '@/services/template-service';

export class GetBlogQuery extends BaseAction {
    public async execute({ id }: Record<'id', string>) {
        const blog = await this.dataContext.exec((p) =>
            p.blog.findFirst({
                where: {
                    user: {
                        some: {
                            id,
                        },
                    },
                },
                include: { posts: true },
            })
        );

        if (!blog) return new MediatorResultFailure(ACTION_RESULT.ERROR_NOT_FOUND);

        return new MediatorResultSuccess(blog);
    }
}

export class UpdateBlogCommand extends BaseAction {
    public async execute({ userId, path }: Record<'userId' | 'path', string>) {
        const blog = await this.dataContext.exec((p) =>
            p.blog.findFirst({
                where: {
                    user: {
                        some: {
                            id: userId,
                        },
                    },
                },
                select: { id: true },
            })
        );

        if (!blog) return new MediatorResultFailure(ACTION_RESULT.ERROR_NOT_FOUND);

        const updatedBlog = await this.dataContext.exec((p) =>
            p.blog.update({
                where: { id: blog.id },
                data: {
                    path,
                    enabled: !!path,
                },
            })
        );

        if (!updatedBlog) return new MediatorResultFailure(ACTION_RESULT.ERROR_UNPROCESSABLE);

        return new MediatorResultSuccess(ACTION_RESULT.UNIT);
    }
}

export class CreateBlogPostCommand extends BaseAction {
    @injectService(SERVICE.CLOUDINARY)
    private readonly cloudinaryService: CloudinaryService;

    public async execute({ userId, ...dto }: ICreateBlogPostDto) {
        const blog = await this.dataContext.exec((p) =>
            p.blog.findFirst({ where: { user: { some: { id: userId } } } })
        );

        if (!blog) {
            return new MediatorResultFailure(ACTION_RESULT.ERROR_NOT_FOUND);
        }

        const uploadResult = dto.thumbnail ? await this.cloudinaryService.uploadImage(dto.thumbnail) : null;
        const thumbnailUrl = uploadResult ? uploadResult.url : '';

        const post = await this.dataContext.exec((p) =>
            p.post.create({
                data: {
                    ...dto,
                    name: toKebabCase(dto.title),
                    blogId: blog.id,
                    thumbnail: thumbnailUrl,
                    thumbnailId: uploadResult?.public_id || '',
                },
            })
        );

        if (!post) {
            await (uploadResult?.public_id
                ? this.cloudinaryService.removeImage(uploadResult?.public_id || '')
                : Promise.resolve());

            return new MediatorResultFailure(ACTION_RESULT.ERROR_NOT_FOUND);
        }

        return new MediatorResultSuccess(post.id);
    }
}

export class UpdateBlogPostCommand extends BaseAction {
    @injectService(SERVICE.CLOUDINARY)
    private readonly cloudinaryService: CloudinaryService;

    public async execute({ id, ...dto }: IUpdateBlogPostSchema) {
        const payload = this.createUpdatePayload(dto) as Partial<Post>;

        const post = await this.dataContext.exec((p) =>
            p.post.findFirst({
                where: {
                    id,
                },
            })
        );

        if (!post) return new MediatorResultFailure(ACTION_RESULT.ERROR_NOT_FOUND);

        if (payload.thumbnail === '' && post.thumbnailId) {
            await this.cloudinaryService.removeImage(post.thumbnailId);
        }

        if (payload.thumbnail) {
            const upload = await this.cloudinaryService.uploadImage(payload.thumbnail);

            if (upload) {
                if (post.thumbnailId) {
                    await this.cloudinaryService.removeImage(post.thumbnailId);
                }

                payload.thumbnail = upload.url;
                payload.thumbnailId = upload.public_id;
            }
        }

        if (payload.title) {
            payload.name = toKebabCase(payload.title);
        }

        const updatedPost = await this.dataContext.exec((p) =>
            p.post.update({
                where: {
                    id,
                },
                data: payload,
            })
        );

        if (!updatedPost) return new MediatorResultFailure(ACTION_RESULT.ERROR_UNPROCESSABLE);

        return new MediatorResultSuccess(ACTION_RESULT.UNIT);
    }
}

export class DeleteBlogPostCommand extends BaseAction {
    @injectService(SERVICE.CLOUDINARY)
    private readonly cloudinaryService: CloudinaryService;

    public async execute({ id }: Record<'id', string>) {
        const post = await this.dataContext.exec((p) =>
            p.post.delete({ where: { id }, select: { thumbnailId: true } })
        );

        if (!post) {
            return new MediatorResultFailure(ACTION_RESULT.ERROR_NOT_FOUND);
        }

        if (post.thumbnailId) {
            await this.cloudinaryService.removeImage(post.thumbnailId);
        }

        return new MediatorResultSuccess(ACTION_RESULT.UNIT);
    }
}

export class GetBlogColumnsQuery extends BaseAction {
    private static readonly ignoreColumns = [
        'id',
        'content',
        'name',
        'blogId',
        'createdAt',
        'updatedAt',
        'thumbnailId',
    ];

    public async execute() {
        const itemFields = await this.dataContext.exec(async (p) => p.post.fields);

        if (!itemFields) {
            return new MediatorResultFailure(ACTION_RESULT.ERROR_NOT_FOUND);
        }

        const fields = Object.entries(itemFields)
            .map(([_, value]) => value.name)
            .filter((e) => !GetBlogColumnsQuery.ignoreColumns.includes(e));

        return new MediatorResultSuccess(fields);
    }
}
