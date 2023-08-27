import type { User } from '@prisma/client';
import { BaseAuthenticationService } from '@lindeneg/funkallero-auth-service';
import AUTH from '@/enums/auth';
import type IAuthModel from '@/contracts/auth-model';
import type DataContextService from './data-context-service';

class AuthenticationService extends BaseAuthenticationService<
    User,
    IAuthModel,
    DataContextService
> {
    protected getEncodedToken(): string | null {
        const encodedToken = this.request.cookies[AUTH.COOKIE_NAME];

        if (!encodedToken) return null;

        return encodedToken;
    }

    protected async getUserFromDecodedToken(decodedToken: IAuthModel): Promise<User | null> {
        return this.dataContext.exec((p) =>
            p.user.findFirst({ where: { id: decodedToken.id, email: decodedToken.email } })
        );
    }
}

export default AuthenticationService;
