import { z } from 'zod';
import { injectService, SingletonService, type ILoggerService, type ITokenService } from '@lindeneg/funkallero';
import SERVICE from '@/enums/service';
import USER_ROLE from '@/enums/user-role';
import type DataContextService from '@/services/data-context-service';

const userSchema = z.object({
    email: z.string().email(),
    firstname: z.string().trim().min(5).max(12),
    lastname: z.string().trim().min(5).max(12),
    password: z.string().trim().min(6).max(28),
});

class SuperUserService extends SingletonService {
    @injectService(SERVICE.DATA_CONTEXT)
    private readonly dataContext: DataContextService;

    @injectService(SERVICE.TOKEN)
    private readonly tokenService: ITokenService;

    @injectService(SERVICE.LOGGER)
    private readonly logger: ILoggerService;

    public async create() {
        const parsedPayload = this.getPayloadFromEnvironment();

        if (!parsedPayload || (await this.isSuperUserCreated(parsedPayload))) return;

        const { email, firstname, lastname, password } = parsedPayload;

        await this.createSuperUser(email, firstname, lastname, await this.tokenService.hashPassword(password));
    }

    private getPayloadFromEnvironment() {
        const superUser = process.env['FUNKALLERO_SUPER_USER'];

        if (!superUser) return null;

        const [email, firstname, lastname, password] = superUser.split(',');

        return this.parsePayload({
            email,
            firstname,
            lastname,
            password,
        });
    }

    private parsePayload(payload: z.infer<typeof userSchema>) {
        const parsedPayload = userSchema.safeParse(payload);

        if (!parsedPayload.success) {
            this.logger.error({
                msg: 'Failed to create super-user',
                error: parsedPayload.error,
                payload,
            });
            return null;
        }

        return parsedPayload.data;
    }

    private async isSuperUserCreated(user: z.infer<typeof userSchema>) {
        const existingUser = await this.dataContext.exec((p) =>
            p.user.findFirst({
                where: {
                    email: user.email,
                },
            })
        );

        if (existingUser) {
            this.logger.verbose(`super-user '${existingUser.email}' already created`);
            return true;
        }

        return false;
    }

    private async createSuperUser(email: string, firstname: string, lastname: string, password: string) {
        const result = await this.dataContext.exec(async (p) => {
            return p.blog.create({
                data: { user: { create: { email, firstname, lastname, password, role: USER_ROLE.ADMIN } } },
                select: { user: true },
            });
        });

        if (!result) {
            this.logger.error(
                'an error occurred during super-user creation, run with FUNKALLERO_DEBUG=on for more logs'
            );
            return;
        }

        this.logger.verbose(`super-user '${result.user[0].email}' successfully created`);
    }
}

export default SuperUserService;
