import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { success, failure, type Result, type NodeEnv } from '@lindeneg/shared';
import { PrismaClient, Prisma } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const levels: Record<NodeEnv, Prisma.LogLevel[]> = {
  test: [],
  development: ['query', 'warn', 'error'],
  production: ['warn', 'error'],
};

class DataService {
  #prisma: PrismaClient;

  constructor(databaseUrl: string, nodeEnv: NodeEnv) {
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

  get p() {
    return this.#prisma;
  }

  async checkHealth(): Promise<Result<number>> {
    try {
      await this.p.$queryRaw`SELECT 1`;
      return success(0);
    } catch (err) {
      console.error('database health check failed', err);
      return failure('database health check failed');
    }
  }

  async teardown(): Promise<void> {
    await this.#prisma.$disconnect();
  }
}

export default DataService;
