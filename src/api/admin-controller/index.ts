import { controller, httpGet, auth, MediatorResultSuccess } from '@lindeneg/funkallero';
import BaseController from '../base-controller';
import AUTH from '@/enums/auth';
import './navigation-controller';
import './page-controller';

@controller()
class AdminController extends BaseController {
    @httpGet('/bust-cache')
    @auth(AUTH.POLICY.IS_ADMIN)
    public async bustCache() {
        return new MediatorResultSuccess('');
    }
}
