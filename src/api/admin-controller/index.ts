import { controller, httpGet, httpPost, httpDelete, auth, body } from '@lindeneg/funkallero';
import BaseController from '../base-controller';
import AUTH from '@/enums/auth';
import './navigation-controller';
import './page-controller';
import './blog-controller';

@controller()
class AdminController extends BaseController {
    private userId: string;

    @httpPost('/bust-cache')
    @auth(AUTH.POLICY.IS_ADMIN)
    public async bustCache() {
        return this.mediator.send('ClearCacheCommand');
    }

    @httpGet('/user-photo')
    @auth(AUTH.POLICY.IS_ADMIN, { srcProperty: 'id', destProperty: 'userId' })
    public async getUserPhoto() {
        return this.mediator.send('GetUserPhotoQuery', { userId: this.userId });
    }

    @httpPost('/user-photo')
    @auth(AUTH.POLICY.IS_ADMIN, { srcProperty: 'id', destProperty: 'userId' })
    public async addUserPhoto(@body('image') image: string) {
        return this.mediator.send('AddUserPhotoCommand', { userId: this.userId, image });
    }

    @httpDelete('/user-photo')
    @auth(AUTH.POLICY.IS_ADMIN, { srcProperty: 'id', destProperty: 'userId' })
    public async deleteUserPhoto() {
        return this.mediator.send('DeleteUserPhotoCommand', { userId: this.userId });
    }
}
