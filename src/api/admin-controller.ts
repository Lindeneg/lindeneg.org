import { controller, httpGet, auth } from '@lindeneg/funkallero';
import BaseController from './base-controller';
import AUTH from '@/enums/auth';

@controller()
class AdminController extends BaseController {
    @httpGet('/navigation')
    @auth(AUTH.POLICY.IS_ADMIN)
    public async getNavigation() {
        return this.mediator.send('GetNavigationQuery');
    }
}
