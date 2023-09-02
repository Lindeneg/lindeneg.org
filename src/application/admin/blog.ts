import { ACTION_RESULT, MediatorResultSuccess, MediatorResultFailure } from '@lindeneg/funkallero';
import BaseAction from '../base-action';

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
