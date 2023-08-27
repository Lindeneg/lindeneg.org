import {
    ACTION_RESULT,
    MediatorResultSuccess,
    MediatorResultFailure,
    injectService,
    type ITokenService,
} from '@lindeneg/funkallero';
import BaseAction from '../base-action';
import SERVICE from '@/enums/service';
import type { ILoginDto } from '@/contracts/login-dto';

export class LoginCommand extends BaseAction {
    @injectService(SERVICE.TOKEN)
    private readonly tokenService: ITokenService;

    public async execute({ email, password }: ILoginDto) {
        const user = await this.dataContext.exec((p) =>
            p.user.findUnique({
                where: { email },
            })
        );

        if (!user) return new MediatorResultFailure(ACTION_RESULT.ERROR_NOT_FOUND);

        const isValidPassword = await this.tokenService.comparePassword(password, user.password);

        if (!isValidPassword) return new MediatorResultFailure(ACTION_RESULT.ERROR_NOT_FOUND);

        return new MediatorResultSuccess({ id: user.id, email: user.email });
    }
}
