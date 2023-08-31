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
import updateNavigationDto from '@/contracts/update-navigation-dto';
import updateNavigationItemDto from '@/contracts/update-navigation-item-dto';
import createNavigationItemDto from '@/contracts/create-navigation-item-dto';
import createNavigationDto from '@/contracts/create-navigation-dto';

@controller()
class AdminNavigationController extends BaseController {
    @httpGet('/navigation')
    @auth(AUTH.POLICY.IS_ADMIN)
    public async getNavigation() {
        return this.mediator.send('GetNavigationQuery');
    }

    @httpPost('/navigation')
    @auth(AUTH.POLICY.IS_ADMIN)
    public async createNavigation(@body(createNavigationDto) navigationDto: ParsedSchema<typeof createNavigationDto>) {
        return this.mediator.send('CreateNavigationCommand', navigationDto);
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
}
