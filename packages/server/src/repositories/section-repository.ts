import { success, failure, type Result, type RawModel } from '@lindeneg/shared';
import type { PageSection } from '@prisma/client';
import type DataService from '../services/data-service.js';
import type LoggerService from '../services/logger-service.js';

class SectionRepository {
  constructor(
    private readonly db: DataService,
    private readonly log: LoggerService
  ) {}

  async create(data: RawModel<PageSection>): Promise<Result<PageSection>> {
    try {
      const section = await this.db.p.pageSection.create({ data });
      return success(section);
    } catch (err) {
      this.log.error(err, 'section-repo.create');
      return failure('failed to create section');
    }
  }

  async update(id: string, data: Partial<RawModel<PageSection>>): Promise<Result<PageSection>> {
    try {
      const section = await this.db.p.pageSection.update({ where: { id }, data });
      return success(section);
    } catch (err) {
      this.log.error(err, 'section-repo.update');
      return failure('failed to update section');
    }
  }

  async delete(id: string): Promise<Result<PageSection>> {
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
