import { ACTION_RESULT, MediatorResultSuccess, MediatorResultFailure, injectService } from '@lindeneg/funkallero';
import BaseAction from '../base-action';
import SERVICE from '@/enums/service';
import type CloudinaryService from '@/services/cloudinary-service';

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

// export class UpdateBlogCommand extends BaseAction {
//     public async execute({ id }: Record<'id', string>) {
//         const blog = await this.dataContext.exec((p) =>
//             p.blog.findFirst({
//                 where: {
//                     user: {
//                         some: {
//                             id,
//                         },
//                     },
//                 },
//                 include: { posts: true },
//             })
//         );

//         if (!blog) return new MediatorResultFailure(ACTION_RESULT.ERROR_NOT_FOUND);

//         return new MediatorResultSuccess(blog);
//     }
// }

export class CreateBlogPostCommand extends BaseAction {
    @injectService(SERVICE.CLOUDINARY)
    private readonly cloudinaryService: CloudinaryService;

    public async execute({ id }: Record<'id', string>) {
        // const blog = await this.dataContext.exec((p) =>
        //     p.post.create({
        //         data:
        //     })
        // );
        // if (!blog) return new MediatorResultFailure(ACTION_RESULT.ERROR_NOT_FOUND);
        return new MediatorResultSuccess('');
    }
}

// export class UpdateBlogPostCommand extends BaseAction {
//     public async execute({ id }: Record<'id', string>) {
//         const blog = await this.dataContext.exec((p) =>
//             p.blog.findFirst({
//                 where: {
//                     user: {
//                         some: {
//                             id,
//                         },
//                     },
//                 },
//                 include: { posts: true },
//             })
//         );

//         if (!blog) return new MediatorResultFailure(ACTION_RESULT.ERROR_NOT_FOUND);

//         return new MediatorResultSuccess(blog);
//     }
// }

// export class DeleteBlogPostCommand extends BaseAction {
//     public async execute({ id }: Record<'id', string>) {
//         const blog = await this.dataContext.exec((p) =>
//             p.blog.findFirst({
//                 where: {
//                     user: {
//                         some: {
//                             id,
//                         },
//                     },
//                 },
//                 include: { posts: true },
//             })
//         );

//         if (!blog) return new MediatorResultFailure(ACTION_RESULT.ERROR_NOT_FOUND);

//         return new MediatorResultSuccess(blog);
//     }
// }

export class GetBlogColumnsQuery extends BaseAction {
    private static readonly ignoreColumns = ['id', 'content', 'blogId', 'createdAt', 'updatedAt'];

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
