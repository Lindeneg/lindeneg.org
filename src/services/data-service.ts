import {PrismaBetterSqlite3} from "@prisma/adapter-better-sqlite3";
import {success, failure, type AsyncResult} from "../lib/result.js";
import {AppError, type DbError} from "../lib/errors.js";
import type {NodeEnv} from "../lib/types.js";
import {PrismaClient, Prisma} from "../generated/prisma/client.js";
import type LoggerService from "./logger-service.js";

const levels: Record<NodeEnv, Prisma.LogLevel[]> = {
    test: [],
    development: ["query", "warn", "error"],
    production: ["warn", "error"],
};

class DataService {
    readonly #prisma: PrismaClient;

    constructor(
        databaseUrl: string,
        nodeEnv: NodeEnv,
        private readonly log: LoggerService
    ) {
        this.#prisma = new PrismaClient({
            adapter: new PrismaBetterSqlite3({url: databaseUrl}),
            log: levels[nodeEnv],
        });
    }

    // for building queries only; always await them through run() so failures become Results
    get p() {
        return this.#prisma;
    }

    // a single prisma query is lazy and runs inside this try; combined ones (Promise.all, .then, $transaction)
    // start right away, but their rejection still lands in this await, so every failure becomes a Result
    async run<T>(label: string, query: PromiseLike<T>): AsyncResult<T, DbError> {
        try {
            return success(await query);
        } catch (err) {
            const known = err instanceof Prisma.PrismaClientKnownRequestError ? err.code : null;
            // a unique violation or a missing record is caused by the request, not by the database
            if (known === "P2002") {
                this.log.warn({code: known, meta: (err as Prisma.PrismaClientKnownRequestError).meta}, label);
                return failure(AppError.CONFLICT);
            }
            if (known === "P2025") {
                this.log.warn({code: known}, label);
                return failure(AppError.NOT_FOUND);
            }
            this.log.error(err, label);
            return failure(AppError.DB_ERROR);
        }
    }

    async checkHealth(): AsyncResult<number, DbError> {
        const result = await this.run("data-service.checkHealth", this.p.$queryRaw`SELECT 1`);
        return result.ok ? success(0) : result;
    }

    async teardown(): Promise<void> {
        await this.#prisma.$disconnect();
    }
}

export default DataService;
