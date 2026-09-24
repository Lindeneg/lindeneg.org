import type {AsyncResult} from "../lib/result.js";
import type {RawModel, RawModelUpdate} from "../lib/types.js";
import type { NavigationItem } from '@prisma/client';
import type DataService from '../services/data-service.js';

class NavigationItemRepository {
  constructor(private readonly db: DataService) {}

  create(data: RawModel<NavigationItem>): AsyncResult<NavigationItem> {
    return this.db.run('nav-item-repo.create', this.db.p.navigationItem.create({ data }));
  }

  update(id: string, data: RawModelUpdate<NavigationItem>): AsyncResult<NavigationItem> {
    return this.db.run('nav-item-repo.update', this.db.p.navigationItem.update({ where: { id }, data }));
  }

  delete(id: string): AsyncResult<NavigationItem> {
    return this.db.run('nav-item-repo.delete', this.db.p.navigationItem.delete({ where: { id } }));
  }
}

export default NavigationItemRepository;
