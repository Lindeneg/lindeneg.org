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
import createPageSectionDto from '@/contracts/create-page-section-dto';
import updatePageSectionDto from '@/contracts/update-page-section-dto';
import updateNavigationDto from '@/contracts/update-navigation-dto';
import updateNavigationItemDto from '@/contracts/update-navigation-item-dto';
import createNavigationItemDto from '@/contracts/create-navigation-item-dto';

@controller()
class AdminController extends BaseController {
    @httpGet('/navigation')
    @auth(AUTH.POLICY.IS_ADMIN)
    public async getNavigation() {
        return this.mediator.send('GetNavigationQuery');
    }

    @httpPatch('/navigation/:id')
    @auth(AUTH.POLICY.IS_ADMIN)
    public async updateNavigation(
        @params('id') id: string,
        @body(updateNavigationDto) navigationDto: ParsedSchema<typeof updateNavigationDto>
    ) {
        return this.mediator.send('UpdateNavigationCommand', { ...navigationDto, id });
    }

    @httpGet('/navigation-columns')
    @auth(AUTH.POLICY.IS_ADMIN)
    public async getNavigationColumns() {
        return this.mediator.send('GetNavigationItemColumnsQuery');
    }

    @httpPost('/navigation-item')
    @auth(AUTH.POLICY.IS_ADMIN)
    public async createNavigationItem(
        @body(createNavigationItemDto) navigationDto: ParsedSchema<typeof createNavigationItemDto>
    ) {
        return this.mediator.send('CreateNavigationItemCommand', navigationDto);
    }

    @httpPatch('/navigation-item/:id')
    @auth(AUTH.POLICY.IS_ADMIN)
    public async updateNavigationItem(
        @params('id') id: string,
        @body(updateNavigationItemDto) navigationDto: ParsedSchema<typeof updateNavigationItemDto>
    ) {
        return this.mediator.send('UpdateNavigationItemCommand', { ...navigationDto, id });
    }

    @httpDelete('/navigation-item/:id')
    @auth(AUTH.POLICY.IS_ADMIN)
    public async deleteNavigationItem(@params('id') id: string) {
        return this.mediator.send('DeleteNavigationItemCommand', { id });
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

    @httpPost('/page-sections')
    @auth(AUTH.POLICY.IS_ADMIN)
    public async createPageSection(@body(createPageSectionDto) sectionDto: ParsedSchema<typeof createPageSectionDto>) {
        return this.mediator.send('CreatePageSectionCommand', sectionDto);
    }

    @httpPatch('/page-sections/:id')
    @auth(AUTH.POLICY.IS_ADMIN)
    public async updatePageSection(
        @params('id') id: string,
        @body(updatePageSectionDto) sectionDto: ParsedSchema<typeof updatePageSectionDto>
    ) {
        return this.mediator.send('UpdatePageSectionCommand', { ...sectionDto, id });
    }

    @httpDelete('/page-sections/:id')
    @auth(AUTH.POLICY.IS_ADMIN)
    public async deletePageSection(@params('id') id: string) {
        return this.mediator.send('DeletePageSectionCommand', { id });
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
