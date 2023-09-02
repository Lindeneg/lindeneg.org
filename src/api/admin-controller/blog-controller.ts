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
}
