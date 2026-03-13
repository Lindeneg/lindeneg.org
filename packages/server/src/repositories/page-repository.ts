import { success, failure, type Result, type RawModel, type MaybeNull } from '@lindeneg/shared';
import type { Page, PageSection } from '../generated/prisma/index.js';
import type DataService from '../services/data-service.js';
import type LoggerService from '../services/logger-service.js';
import type { SkipTake, PaginatedResult } from '../lib/pagination.js';

type PageWithSections = Page & { sections: PageSection[] };

class PageRepository {
  constructor(
    private readonly db: DataService,
    private readonly log: LoggerService
  ) {}

  async list(opts: Partial<SkipTake> = {}): Promise<Result<PaginatedResult<PageWithSections>>> {
    try {
      const [data, total] = await Promise.all([
        this.db.p.page.findMany({
          include: { sections: true },
          orderBy: { createdAt: 'desc' },
          skip: opts.skip,
          take: opts.take,
        }),
        this.db.p.page.count(),
      ]);
      return success({ data, total });
    } catch (err) {
      this.log.error(err, 'page-repo.list');
      return failure('failed to list pages');
    }
  }

  async getById(id: string): Promise<Result<MaybeNull<PageWithSections>>> {
    try {
      const page = await this.db.p.page.findUnique({ where: { id }, include: { sections: true } });
      return success(page);
    } catch (err) {
      this.log.error(err, 'page-repo.getById');
      return failure('failed to get page');
    }
  }

  async getBySlug(slug: string): Promise<Result<MaybeNull<PageWithSections>>> {
    try {
      const page = await this.db.p.page.findUnique({ where: { slug }, include: { sections: true } });
      return success(page);
    } catch (err) {
      this.log.error(err, 'page-repo.getBySlug');
      return failure('failed to get page by slug');
    }
  }

  async create(data: RawModel<Page>): Promise<Result<PageWithSections>> {
    try {
      const page = await this.db.p.page.create({ data, include: { sections: true } });
      return success(page);
    } catch (err) {
      this.log.error(err, 'page-repo.create');
      return failure('failed to create page');
    }
  }

  async update(id: string, data: Partial<RawModel<Page>>): Promise<Result<PageWithSections>> {
    try {
      const page = await this.db.p.page.update({ where: { id }, data, include: { sections: true } });
      return success(page);
    } catch (err) {
      this.log.error(err, 'page-repo.update');
      return failure('failed to update page');
    }
  }

  async delete(id: string): Promise<Result<Page>> {
    try {
      const page = await this.db.p.page.delete({ where: { id } });
      return success(page);
    } catch (err) {
      this.log.error(err, 'page-repo.delete');
      return failure('failed to delete page');
    }
  }
}

export default PageRepository;
