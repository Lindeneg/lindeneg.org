import {success, failure, type AsyncResult} from "../lib/result.js";
import type {RawModel, MaybeNull, RawModelUpdate} from "../lib/types.js";
import type { Page, PageSection } from '@prisma/client';
import type DataService from '../services/data-service.js';
import type LoggerService from '../services/logger-service.js';

export type SectionWithPage = PageSection & { page: Page };

class SectionRepository {
  constructor(
    private readonly db: DataService,
    private readonly log: LoggerService
  ) {}

  async getById(id: string): AsyncResult<MaybeNull<SectionWithPage>> {
    try {
      const section = await this.db.p.pageSection.findUnique({ where: { id }, include: { page: true } });
      return success(section);
    } catch (err) {
      this.log.error(err, 'section-repo.getById');
      return failure('failed to get section');
    }
  }

  async create(data: RawModel<PageSection>): AsyncResult<PageSection> {
    try {
      const section = await this.db.p.pageSection.create({ data });
      return success(section);
    } catch (err) {
      this.log.error(err, 'section-repo.create');
      return failure('failed to create section');
    }
  }

  async update(id: string, data: RawModelUpdate<PageSection>): AsyncResult<PageSection> {
    try {
      const section = await this.db.p.pageSection.update({ where: { id }, data });
      return success(section);
    } catch (err) {
      this.log.error(err, 'section-repo.update');
      return failure('failed to update section');
    }
  }

  async delete(id: string): AsyncResult<PageSection> {
    try {
      const section = await this.db.p.pageSection.delete({ where: { id } });
      return success(section);
    } catch (err) {
      this.log.error(err, 'section-repo.delete');
      return failure('failed to delete section');
    }
  }
}

export default SectionRepository;
