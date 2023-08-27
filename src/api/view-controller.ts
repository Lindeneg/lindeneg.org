import {
    ACTION_RESULT,
    controller,
    injectService,
    view,
    auth,
    MediatorResultSuccess,
    type IConfigurationService,
    params,
} from '@lindeneg/funkallero';
import SERVICE from '@/enums/service';
import BaseController from '@/api/base-controller';
import type AuthenticationService from '@/services/authentication-service';

@controller()
class ViewWithAuthController extends BaseController {
    @injectService(SERVICE.AUTHENTICATION)
    private readonly authService: AuthenticationService;

    @view('/admin')
    public async admin() {
        const user = await this.authService.getUser();

        if (!user) {
            return this.mediator.send('GetLoginPage');
        }

        return this.mediator.send('GetAdminPage');
    }
}

@controller()
class ViewController extends BaseController {
    @injectService(SERVICE.CONFIGURATION)
    private readonly config: IConfigurationService;

    @view('/')
    public async index(@params('name') name?: string) {
        return this.mediator.send('GetPage', { name: 'home' });
    }

    @view('/:name')
    public async page(@params('name') name: string) {
        return this.mediator.send('GetPage', { name });
    }
}
