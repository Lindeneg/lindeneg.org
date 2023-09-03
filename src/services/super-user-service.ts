import { Role } from '@prisma/client';
import { z } from 'zod';
import { injectService, SingletonService, type ILoggerService, type ITokenService } from '@lindeneg/funkallero';
import SERVICE from '@/enums/service';
import type DataContextService from '@/services/data-context-service';

const userSchema = z.object({
    email: z.string().email(),
    name: z.string().trim().min(5).max(12),
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

        const { email, name, password } = parsedPayload;

        await this.createSuperUser(email, name, await this.tokenService.hashPassword(password));
    }

    private getPayloadFromEnvironment() {
        const superUser = process.env['FUNKALLERO_SUPER_USER'];

        if (!superUser) return null;

        const [email, name, password] = superUser.split(',');

        return this.parsePayload({
            email,
            name,
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
                    name: user.name,
                },
            })
        );

        if (existingUser) {
            this.logger.verbose(`super-user '${existingUser.name}' already created`);
            return true;
        }

        return false;
    }

    private async createSuperUser(email: string, name: string, password: string) {
        const result = await this.dataContext.exec(async (p) => {
            const blog = await p.blog.create({});
            return p.user.create({
                data: {
                    email,
                    name,
                    password,
                    blogId: blog.id,
                    role: Role.ADMIN,
                },
            });
        });

        if (!result) {
            this.logger.error(
                'an error occurred during super-user creation, run with FUNKALLERO_DEBUG=on for more logs'
            );
            return;
        }

        this.logger.verbose(`super-user '${result.name}' successfully created`);
    }
}

export default SuperUserService;
