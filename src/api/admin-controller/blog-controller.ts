import {
    controller,
    httpGet,
    httpPatch,
    httpDelete,
    auth,
    httpPost,
    body,
    ParsedSchema,
    params,
} from '@lindeneg/funkallero';
import BaseController from '../base-controller';
import AUTH from '@/enums/auth';
import createBlogPostSchema from '@/contracts/create-blog-post-dto';
import updateBlogPostSchema from '@/contracts/update-blog-post-dto';

@controller()
class AdminBlogController extends BaseController {
    private userId: string;

    @httpGet('/blog')
    @auth(AUTH.POLICY.IS_ADMIN, { srcProperty: 'id', destProperty: 'userId' })
    public async getBlog() {
        return this.mediator.send('GetBlogQuery', { id: this.userId });
    }

    @httpPatch('/blog/:id')
    @auth(AUTH.POLICY.IS_ADMIN, { srcProperty: 'id', destProperty: 'userId' })
    public async updateBlog(@body('path') path: string) {
        return this.mediator.send('UpdateBlogCommand', { userId: this.userId, path });
    }

    @httpPost('/blog-post')
    @auth(AUTH.POLICY.IS_ADMIN, { srcProperty: 'id', destProperty: 'userId' })
    public async createBlogPost(@body(createBlogPostSchema) dto: ParsedSchema<typeof createBlogPostSchema>) {
        return this.mediator.send('CreateBlogPostCommand', { userId: this.userId, ...dto });
    }

    @httpPatch('/blog-post/:id')
    @auth(AUTH.POLICY.IS_ADMIN)
    public async updateBlogPost(
        @params('id') id: string,
        @body(updateBlogPostSchema) dto: ParsedSchema<typeof updateBlogPostSchema>
    ) {
        return this.mediator.send('UpdateBlogPostCommand', { id, ...dto });
    }

    @httpDelete('/blog-post/:id')
    @auth(AUTH.POLICY.IS_ADMIN)
    public async deleteBlogPost(@params('id') id: string) {
        return this.mediator.send('DeleteBlogPostCommand', { id });
    }

    @httpGet('/blog-columns')
    @auth(AUTH.POLICY.IS_ADMIN)
    public async getBlogColumns() {
        return this.mediator.send('GetBlogColumnsQuery');
    }
}
