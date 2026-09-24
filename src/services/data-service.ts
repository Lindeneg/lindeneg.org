import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import {success, failure, type AsyncResult} from "../lib/result.js";
import type {NodeEnv} from "../lib/types.js";
import { PrismaClient, Prisma } from '@prisma/client';
import type LoggerService from './logger-service.js';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const levels: Record<NodeEnv, Prisma.LogLevel[]> = {
  test: [],
  development: ['query', 'warn', 'error'],
  production: ['warn', 'error'],
};

class DataService {
  #prisma: PrismaClient;

  constructor(
    databaseUrl: string,
    nodeEnv: NodeEnv,
    private readonly log: LoggerService
  ) {
    if (globalForPrisma.prisma) {
      this.#prisma = globalForPrisma.prisma;
    } else {
      const adapter = new PrismaBetterSqlite3({
        url: databaseUrl,
      });
      this.#prisma = new PrismaClient({
        adapter,
        log: levels[nodeEnv],
      });
      if (nodeEnv !== 'production') {
        globalForPrisma.prisma = this.#prisma;
      }
    }
  }

  // for building queries only; always await them through run() so failures become Results
  get p() {
    return this.#prisma;
  }

  // a single prisma query is lazy and runs inside this try; combined ones (Promise.all, .then, $transaction)
  // start right away, but their rejection still lands in this await, so every failure becomes a Result
  async run<T>(label: string, query: PromiseLike<T>): AsyncResult<T> {
    try {
      return success(await query);
    } catch (err) {
      this.log.error(err, label);
      return failure(`${label} failed`);
    }
  }

  async checkHealth(): AsyncResult<number> {
    const result = await this.run('data-service.checkHealth', this.p.$queryRaw`SELECT 1`);
    return result.ok ? success(0) : result;
  }

  async teardown(): Promise<void> {
    await this.#prisma.$disconnect();
  }
}

export default DataService;
