import {describe, expect, it} from "vitest";
import {failure, success} from "../../../src/lib/result.js";
import {AppError} from "../../../src/lib/errors.js";
import {Prisma} from "../../../src/generated/prisma/client.js";
import DataService from "../../../src/services/data-service.js";
import {fakeLog} from "../helpers.js";

// constructing the client does not open a connection, and run() never touches it
function setup() {
    const log = fakeLog();
    return {log, db: new DataService("file:./unused.db", "test", log)};
}

describe("DataService.run", () => {
    it("wraps a resolved query in a success", async () => {
        const {db, log} = setup();

        expect(await db.run("label", Promise.resolve(42))).toEqual(success(42));
        expect(log.error).not.toHaveBeenCalled();
    });

    it("turns a rejected query into a db error and logs it under the label", async () => {
        const {db, log} = setup();
        const error = new Error("disk I/O error");

        expect(await db.run("post-repo.create", Promise.reject(error))).toEqual(failure(AppError.DB_ERROR));
        expect(log.error).toHaveBeenCalledWith(error, "post-repo.create");
    });

    it("turns a unique violation into a conflict, logged as a warning", async () => {
        const {db, log} = setup();
        const error = new Prisma.PrismaClientKnownRequestError("unique", {code: "P2002", clientVersion: "test"});

        expect(await db.run("post-repo.create", Promise.reject(error))).toEqual(failure(AppError.CONFLICT));
        expect(log.warn).toHaveBeenCalled();
        expect(log.error).not.toHaveBeenCalled();
    });

    it("turns a missing record into not found", async () => {
        const {db} = setup();
        const error = new Prisma.PrismaClientKnownRequestError("missing", {code: "P2025", clientVersion: "test"});

        expect(await db.run("post-repo.delete", Promise.reject(error))).toEqual(failure(AppError.NOT_FOUND));
    });

    it("catches a rejection from combined queries", async () => {
        const {db} = setup();
        const combined = Promise.all([Promise.resolve(1), Promise.reject(new Error("boom"))]).then(([a, b]) => a + b);

        expect((await db.run("combined", combined)).ok).toBe(false);
    });

    it("runs a lazy thenable inside the try", async () => {
        const {db} = setup();
        let executed = false;
        const lazy: PromiseLike<never> = {
            then(_resolve, reject) {
                executed = true;
                return Promise.reject(new Error("lazy failure")).then(undefined, reject);
            },
        };

        const result = await db.run("lazy", lazy);

        expect(executed).toBe(true);
        expect(result.ok).toBe(false);
    });
});
