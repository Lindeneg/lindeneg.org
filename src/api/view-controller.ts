import { MediatorResultFailure, ACTION_RESULT, controller, injectService, view, params } from '@lindeneg/funkallero';
import SERVICE from '@/enums/service';
import USER_ROLE from '@/enums/user-role';
import BaseController from '@/api/base-controller';
import type AuthenticationService from '@/services/authentication-service';

@controller()
class ViewWithAuthController extends BaseController {
    @injectService(SERVICE.AUTHENTICATION)
    private readonly authService: AuthenticationService;

    @view('/admin/site')
    public async admin() {
        const user = await this.authService.getUser();

        if (!user) {
            return this.mediator.send('GetLoginPage');
        }

        if (user.role !== USER_ROLE.ADMIN) return new MediatorResultFailure(ACTION_RESULT.ERROR_UNAUTHORIZED);

        return this.mediator.send('GetAdminPage');
    }
}

@controller()
class ViewController extends BaseController {
    @view('/:name?')
    public async page(@params('name') name?: string) {
        return this.mediator.send('GetPage', { name: name ? '/' + name : '/' });
    }
}

@controller()
class ViewBlogController extends BaseController {
    @view('/:blogPath/post/:blogName')
    public async page(@params() { blogName, blogPath }: Record<string, string>) {
        return this.mediator.send('GetBlogPage', { blogName, blogPath });
    }
}
