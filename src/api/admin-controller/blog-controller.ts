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

@controller()
class AdminBlogController extends BaseController {
    private userId: string;

    @httpGet('/blog')
    @auth(AUTH.POLICY.IS_ADMIN, { srcProperty: 'id', destProperty: 'userId' })
    public async getBlog() {
        return this.mediator.send('GetBlogQuery', { id: this.userId });
    }

    // @httpPatch('/blog')
    // @auth(AUTH.POLICY.IS_ADMIN, { srcProperty: 'id', destProperty: 'userId' })
    // public async updateBlog() {
    //     return this.mediator.send('UpdateBlogCommand', { id: this.userId });
    // }

    @httpPost('/blog-post')
    @auth(AUTH.POLICY.IS_ADMIN, { srcProperty: 'id', destProperty: 'userId' })
    public async createBlogPost() {
        return this.mediator.send('CreateBlogPostCommand', { id: this.userId });
    }

    // @httpPatch('/blog-post/:id')
    // @auth(AUTH.POLICY.IS_ADMIN, { srcProperty: 'id', destProperty: 'userId' })
    // public async updateBlogPost() {
    //     return this.mediator.send('UpdateBlogPostCommand', { id: this.userId });
    // }

    // @httpDelete('/blog-post/:id')
    // @auth(AUTH.POLICY.IS_ADMIN, { srcProperty: 'id', destProperty: 'userId' })
    // public async deleteBlogPost() {
    //     return this.mediator.send('DeleteBlogPostCommand', { id: this.userId });
    // }

    @httpGet('/blog-columns')
    @auth(AUTH.POLICY.IS_ADMIN)
    public async getBlogColumns() {
        return this.mediator.send('GetBlogColumnsQuery');
    }
}
