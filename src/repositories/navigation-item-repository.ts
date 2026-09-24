import {success, failure, type AsyncResult} from "../lib/result.js";
import type {RawModel, RawModelUpdate} from "../lib/types.js";
import type { NavigationItem } from '@prisma/client';
import type DataService from '../services/data-service.js';
import type LoggerService from '../services/logger-service.js';

class NavigationItemRepository {
  constructor(
    private readonly db: DataService,
    private readonly log: LoggerService
  ) {}

  async create(data: RawModel<NavigationItem>): AsyncResult<NavigationItem> {
    try {
      const navigationItem = await this.db.p.navigationItem.create({ data });
      return success(navigationItem);
    } catch (err) {
      this.log.error(err, 'nav-item-repo.create');
      return failure('failed to create navigation item');
    }
  }

  async update(id: string, data: RawModelUpdate<NavigationItem>): AsyncResult<NavigationItem> {
    try {
      const navigationItem = await this.db.p.navigationItem.update({ where: { id }, data });
      return success(navigationItem);
    } catch (err) {
      this.log.error(err, 'nav-item-repo.update');
      return failure('failed to update navigation item');
    }
  }

  async delete(id: string): AsyncResult<NavigationItem> {
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
