import {
    ACTION_RESULT,
    MediatorResultSuccess,
    setHeaders,
    after,
    body,
    controller,
    httpPost,
    httpGet,
    type ParsedSchema,
} from '@lindeneg/funkallero';
import BaseController from './base-controller';
import SERVICE from '@/enums/service';
import AUTH from '@/enums/auth';
import loginSchema from '@/contracts/login-dto';

@controller()
class AuthController extends BaseController {
    @httpPost('/login')
    @after(SERVICE.COOKIE)
    public async login(@body(loginSchema) loginDto: ParsedSchema<typeof loginSchema>) {
        return this.mediator.send('LoginCommand', loginDto);
    }

    @httpGet('/logout')
    @setHeaders({
        'Set-Cookie': `${AUTH.COOKIE_NAME}=; Path=/; Max-Age=0;`,
    })
    public async logout() {
        return new MediatorResultSuccess(ACTION_RESULT.UNIT);
    }
}
