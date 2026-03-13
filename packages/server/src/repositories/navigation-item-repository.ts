import { success, failure, type Result, type RawModel } from '@lindeneg/shared';
import type { NavigationItem } from '../generated/prisma/index.js';
import type DataService from '../services/data-service.js';
import type LoggerService from '../services/logger-service.js';

class NavigationItemRepository {
  constructor(
    private readonly db: DataService,
    private readonly log: LoggerService
  ) {}

  async create(data: RawModel<NavigationItem>): Promise<Result<NavigationItem>> {
    try {
      const navigationItem = await this.db.p.navigationItem.create({ data });
      return success(navigationItem);
    } catch (err) {
      this.log.error(err, 'nav-item-repo.create');
      return failure('failed to create navigation item');
    }
  }

  async update(id: string, data: Partial<RawModel<NavigationItem>>) {
    try {
      const navigationItem = await this.db.p.navigationItem.update({ where: { id }, data });
      return success(navigationItem);
    } catch (err) {
      this.log.error(err, 'nav-item-repo.update');
      return failure('failed to update navigation item');
    }
  }

  async delete(id: string) {
    try {
      const navigationItem = await this.db.p.navigationItem.delete({ where: { id } });
      return success(navigationItem);
    } catch (err) {
      this.log.error(err, 'nav-item-repo.delete');
      return failure('failed to delete navigation item');
    }
  }
}

export default NavigationItemRepository;
