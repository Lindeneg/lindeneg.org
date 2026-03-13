import {
    success,
    failure,
    type Result,
    type RawModel,
    type RawModelBase,
    type MaybeNull,
} from "@lindeneg/shared";
import type {User} from "../generated/prisma/index.js";
import type DataService from "../services/data-service.js";
import type LoggerService from "../services/logger-service.js";

class UserRepository {
    constructor(
        private readonly db: DataService,
        private readonly log: LoggerService
    ) {}

    async get(id: string): Promise<Result<MaybeNull<User>>> {
        try {
            const user = await this.db.p.user.findUnique({where: {id}});
            return success(user);
        } catch (err) {
            this.log.error(err, "user-repo.get");
            return failure("failed to get user");
        }
    }

    async hasAdmin(): Promise<Result<boolean>> {
        try {
            const user = await this.db.p.user.findFirst({where: {role: "ADMIN"}});
            return success(!!user);
        } catch (err) {
            this.log.error(err, "user-repo.hasAdmin");
            return failure("failed to check admin user");
        }
    }

    async create(data: RawModel<User>): Promise<Result<MaybeNull<User>>> {
        try {
            const user = await this.db.p.user.create({data});
            return success(user);
        } catch (err) {
            this.log.error(err, "user-repo.create");
            return failure("failed to create user");
        }
    }

    async getByEmail(email: string): Promise<Result<MaybeNull<User>>> {
        try {
            const user = await this.db.p.user.findUnique({where: {email}});
            return success(user);
        } catch (err) {
            this.log.error(err, "user-repo.getByEmail");
            return failure("failed to get user by email");
        }
    }

    async update(
        id: string,
        data: Partial<Omit<RawModelBase<User>, "password">>
    ): Promise<Result<MaybeNull<User>>> {
        try {
            const user = await this.db.p.user.update({where: {id}, data});
            return success(user);
        } catch (err) {
            this.log.error(err, "user-repo.update");
            return failure("failed to update user");
        }
    }
}

export default UserRepository;
