import { controller, httpGet, auth, MediatorResultSuccess } from '@lindeneg/funkallero';
import BaseController from './base-controller';
import AUTH from '@/enums/auth';

@controller()
class AdminController extends BaseController {
    @httpGet('/navigation')
    @auth(AUTH.POLICY.IS_ADMIN)
    public async getNavigation() {
        return this.mediator.send('GetNavigationQuery');
    }

    @httpGet('/navigation-columns')
    @auth(AUTH.POLICY.IS_ADMIN)
    public async getNavigationColumns() {
        return this.mediator.send('GetNavigationItemColumnsQuery');
    }

    @httpGet('/pages')
    @auth(AUTH.POLICY.IS_ADMIN)
    public async getPages() {
        return this.mediator.send('GetPagesQuery');
    }

    @httpGet('/pages-columns')
    @auth(AUTH.POLICY.IS_ADMIN)
    public async getPagesColumns() {
        return this.mediator.send('GetPagesColumnsQuery');
    }

    @httpGet('/pages-section-columns')
    @auth(AUTH.POLICY.IS_ADMIN)
    public async getPageSectionColumns() {
        return this.mediator.send('GetPageSectionColumnsQuery');
    }

    @httpGet('/bust-cache')
    @auth(AUTH.POLICY.IS_ADMIN)
    public async bustCache() {
        return new MediatorResultSuccess('');
    }
}
