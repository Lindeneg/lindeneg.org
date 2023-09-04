import { controller, httpPost, auth } from '@lindeneg/funkallero';
import BaseController from '../base-controller';
import AUTH from '@/enums/auth';
import './navigation-controller';
import './page-controller';
import './blog-controller';

@controller()
class AdminController extends BaseController {
    @httpPost('/bust-cache')
    @auth(AUTH.POLICY.IS_ADMIN)
    public async bustCache() {
        return this.mediator.send('ClearCacheCommand');
    }
}
