import { Role } from '@prisma/client';
import {
    BaseAuthorizationService,
    type AuthorizationPolicyHandlerFn,
} from '@lindeneg/funkallero-auth-service';
import AUTH from '@/enums/auth';
import type IAuthModel from '@/contracts/auth-model';
import type AuthenticationService from './authentication-service';

type AuthHandler = AuthorizationPolicyHandlerFn<{ authService: AuthenticationService }, IAuthModel>;

class AuthorizationService extends BaseAuthorizationService<AuthHandler, AuthenticationService> {
    protected async getCustomPolicyArgs() {
        return {
            authService: this.authService,
        };
    }
}

const authenticatedPolicy: AuthHandler = async ({ authService }) => {
    const user = await authService.getUser();

    return user !== null;
};

const isAdminPolicy: AuthHandler = async ({ authService }) => {
    const user = await authService.getUser();

    return user !== null && user.role === Role.ADMIN;
};

AuthorizationService.addPolicy(
    [AUTH.POLICY.AUTHENTICATED, authenticatedPolicy],
    [AUTH.POLICY.IS_ADMIN, isAdminPolicy]
);

export default AuthorizationService;
