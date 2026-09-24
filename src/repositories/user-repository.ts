import {success, failure, type AsyncResult} from "../lib/result.js";
import type {RawModel, RawModelUpdate, MaybeNull} from "../lib/types.js";
import type {User as UserModel} from "@prisma/client";
import type DataService from "../services/data-service.js";
import type LoggerService from "../services/logger-service.js";

export type User = Omit<UserModel, "password">;
export type UserWithPassword = UserModel;

export const userOmit = {password: true} as const;

class UserRepository {
    constructor(
        private readonly db: DataService,
        private readonly log: LoggerService
    ) {}

    async get(id: string): AsyncResult<MaybeNull<User>> {
        try {
            const user = await this.db.p.user.findUnique({where: {id}, omit: userOmit});
            return success(user);
        } catch (err) {
            this.log.error(err, "user-repo.get");
            return failure("failed to get user");
        }
    }

    async getWithPasswordByEmail(email: string): AsyncResult<MaybeNull<UserWithPassword>> {
        try {
            const user = await this.db.p.user.findUnique({where: {email}});
            return success(user);
        } catch (err) {
            this.log.error(err, "user-repo.getWithPasswordByEmail");
            return failure("failed to get user by email");
        }
    }

    async hasAdmin(): AsyncResult<boolean> {
        try {
            const count = await this.db.p.user.count({where: {role: "ADMIN"}});
            return success(count > 0);
        } catch (err) {
            this.log.error(err, "user-repo.hasAdmin");
            return failure("failed to check admin user");
        }
    }

    async create(data: RawModel<UserWithPassword>): AsyncResult<User> {
        try {
            const user = await this.db.p.user.create({data, omit: userOmit});
            return success(user);
        } catch (err) {
            this.log.error(err, "user-repo.create");
            return failure("failed to create user");
        }
    }

    async update(
        id: string,
        data: RawModelUpdate<Omit<UserModel, "password">>
    ): AsyncResult<User> {
        try {
            const user = await this.db.p.user.update({where: {id}, data, omit: userOmit});
            return success(user);
        } catch (err) {
            this.log.error(err, "user-repo.update");
            return failure("failed to update user");
        }
    }
}

export default UserRepository;
