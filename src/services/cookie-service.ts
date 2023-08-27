import {
    injectService,
    MiddlewareSingletonService,
    MediatorResultSuccess,
    ACTION_RESULT,
    type IConfigurationService,
    type ITokenService,
    type Request,
    type Response,
    type MediatorResult,
} from '@lindeneg/funkallero';
import { BaseTokenConfiguration } from '@lindeneg/funkallero-auth-service';
import SERVICE from '@/enums/service';
import AUTH from '@/enums/auth';
import type IAuthModel from '@/contracts/auth-model';

class CookieService extends MiddlewareSingletonService {
    @injectService(SERVICE.TOKEN)
    private readonly tokenService: ITokenService;

    @injectService(SERVICE.CONFIGURATION)
    private readonly config: IConfigurationService;

    public async afterRequestHandler(
        _: Request,
        response: Response,
        result: MediatorResult<IAuthModel>
    ) {
        if (result.success) {
            const token = await this.tokenService.createToken(result.value);
            response.setHeader('Set-Cookie', this.createCookieString(token));
            return new MediatorResultSuccess(ACTION_RESULT.UNIT, result.context);
        }
        return result;
    }

    private createCookieString(token: string) {
        const secure =
            this.config.meta.mode === 'production' || this.config.https !== null
                ? 'Secure=true;'
                : '';

        return `${AUTH.COOKIE_NAME}=${token}; Max-Age=${BaseTokenConfiguration.expiresIn}; Path=/; SameSite=Strict; ${secure} HttpOnly=true;`;
    }
}

export default CookieService;
