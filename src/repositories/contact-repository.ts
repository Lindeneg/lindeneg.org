import {success, failure, type AsyncResult} from "../lib/result.js";
import type {RawModel, MaybeNull, RawModelUpdate} from "../lib/types.js";
import type { ContactMessage } from '@prisma/client';
import type DataService from '../services/data-service.js';
import type LoggerService from '../services/logger-service.js';
import type { SkipTake, PaginatedResult } from '../lib/pagination.js';

class ContactRepository {
  constructor(
    private readonly db: DataService,
    private readonly log: LoggerService
  ) {}

  async list(opts: Partial<SkipTake> = {}): AsyncResult<PaginatedResult<ContactMessage>> {
    try {
      const [data, total] = await Promise.all([
        this.db.p.contactMessage.findMany({
          orderBy: { createdAt: 'desc' },
          skip: opts.skip,
          take: opts.take,
        }),
        this.db.p.contactMessage.count(),
      ]);
      return success({ data, total });
    } catch (err) {
      this.log.error(err, 'contact-repo.list');
      return failure('failed to list contact messages');
    }
  }

  async count(where: { read?: boolean } = {}): AsyncResult<number> {
    try {
      const count = await this.db.p.contactMessage.count({ where });
      return success(count);
    } catch (err) {
      this.log.error(err, 'contact-repo.count');
      return failure('failed to count contact messages');
    }
  }

  async getById(id: string): AsyncResult<MaybeNull<ContactMessage>> {
    try {
      const message = await this.db.p.contactMessage.findUnique({ where: { id } });
      return success(message);
    } catch (err) {
      this.log.error(err, 'contact-repo.getById');
      return failure('failed to get contact message');
    }
  }

  async create(data: RawModel<ContactMessage>): AsyncResult<ContactMessage> {
    try {
      const message = await this.db.p.contactMessage.create({ data });
      return success(message);
    } catch (err) {
      this.log.error(err, 'contact-repo.create');
      return failure('failed to create contact message');
    }
  }

  async update(id: string, data: RawModelUpdate<ContactMessage>): AsyncResult<ContactMessage> {
    try {
      const message = await this.db.p.contactMessage.update({ where: { id }, data });
      return success(message);
    } catch (err) {
      this.log.error(err, 'contact-repo.update');
      return failure('failed to update contact message');
    }
  }

  async delete(id: string): AsyncResult<ContactMessage> {
    try {
      const message = await this.db.p.contactMessage.delete({ where: { id } });
      return success(message);
    } catch (err) {
      this.log.error(err, 'contact-repo.delete');
      return failure('failed to delete contact message');
    }
  }
}

export default ContactRepository;
