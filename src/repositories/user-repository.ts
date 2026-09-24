import type {AsyncResult} from "../lib/result.js";
import type {RawModel, RawModelUpdate, MaybeNull} from "../lib/types.js";
import type {User as UserModel} from "@prisma/client";
import type DataService from "../services/data-service.js";

export type User = Omit<UserModel, "password">;
export type UserWithPassword = UserModel;

export const userOmit = {password: true} as const;

class UserRepository {
    constructor(private readonly db: DataService) {}

    get(id: string): AsyncResult<MaybeNull<User>> {
        return this.db.run("user-repo.get", this.db.p.user.findUnique({where: {id}, omit: userOmit}));
    }

    getWithPasswordByEmail(email: string): AsyncResult<MaybeNull<UserWithPassword>> {
        return this.db.run("user-repo.getWithPasswordByEmail", this.db.p.user.findUnique({where: {email}}));
    }

    hasAdmin(): AsyncResult<boolean> {
        return this.db.run(
            "user-repo.hasAdmin",
            this.db.p.user.count({where: {role: "ADMIN"}}).then((count) => count > 0)
        );
    }

    create(data: RawModel<UserWithPassword>): AsyncResult<User> {
        return this.db.run("user-repo.create", this.db.p.user.create({data, omit: userOmit}));
    }

    update(id: string, data: RawModelUpdate<Omit<UserModel, "password">>): AsyncResult<User> {
        return this.db.run("user-repo.update", this.db.p.user.update({where: {id}, data, omit: userOmit}));
    }
}

export default UserRepository;
