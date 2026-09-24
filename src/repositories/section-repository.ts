import type {AsyncResult} from "../lib/result.js";
import type {RawModel, MaybeNull, RawModelUpdate} from "../lib/types.js";
import type { Page, PageSection } from '@prisma/client';
import type DataService from '../services/data-service.js';

export type SectionWithPage = PageSection & { page: Page };

class SectionRepository {
  constructor(private readonly db: DataService) {}

  getById(id: string): AsyncResult<MaybeNull<SectionWithPage>> {
    return this.db.run(
      'section-repo.getById',
      this.db.p.pageSection.findUnique({ where: { id }, include: { page: true } })
    );
  }

  create(data: RawModel<PageSection>): AsyncResult<PageSection> {
    return this.db.run('section-repo.create', this.db.p.pageSection.create({ data }));
  }

  update(id: string, data: RawModelUpdate<PageSection>): AsyncResult<PageSection> {
    return this.db.run('section-repo.update', this.db.p.pageSection.update({ where: { id }, data }));
  }

  delete(id: string): AsyncResult<PageSection> {
    return this.db.run('section-repo.delete', this.db.p.pageSection.delete({ where: { id } }));
  }
}

export default SectionRepository;
