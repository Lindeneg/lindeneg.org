import {
    controller,
    httpGet,
    httpPatch,
    httpDelete,
    auth,
    MediatorResultSuccess,
    httpPost,
    body,
    ParsedSchema,
    params,
} from '@lindeneg/funkallero';
import BaseController from './base-controller';
import AUTH from '@/enums/auth';
import createPageDto from '@/contracts/create-page-dto';
import updatePageDto from '@/contracts/update-page-dto';

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

    @httpPost('/pages')
    @auth(AUTH.POLICY.IS_ADMIN)
    public async createPage(@body(createPageDto) pageDto: ParsedSchema<typeof createPageDto>) {
        return this.mediator.send('CreatePageCommand', pageDto);
    }

    @httpPatch('/pages/:id')
    @auth(AUTH.POLICY.IS_ADMIN)
    public async updatePage(
        @params('id') id: string,
        @body(updatePageDto) pageDto: ParsedSchema<typeof updatePageDto>
    ) {
        return this.mediator.send('UpdatePageCommand', { ...pageDto, id });
    }

    @httpDelete('/pages/:id')
    @auth(AUTH.POLICY.IS_ADMIN)
    public async deletePage(@params('id') id: string) {
        return this.mediator.send('DeletePageCommand', { id });
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
