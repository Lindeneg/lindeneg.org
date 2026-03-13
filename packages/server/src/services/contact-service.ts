import {
  success,
  emptySuccess,
  failure,
  type Result,
  type EmptyResult,
  type Paginated,
  type PaginationParams,
  type ContactMessageResponse,
  type CreateContactInput,
  type UpdateContactInput,
} from '@lindeneg/shared';
import type { ContactMessage } from '../generated/prisma/index.js';
import type ContactRepository from '../repositories/contact-repository.js';
import { toSkipTake, paginate } from '../lib/pagination.js';

function toContactResponse(msg: ContactMessage): ContactMessageResponse {
  return {
    id: msg.id,
    name: msg.name,
    email: msg.email,
    message: msg.message,
    read: msg.read,
    createdAt: msg.createdAt.toISOString(),
  };
}

class ContactService {
  constructor(private readonly contactRepo: ContactRepository) {}

  async createMessage(input: CreateContactInput): Promise<EmptyResult> {
    const result = await this.contactRepo.create({
      name: input.name,
      email: input.email,
      message: input.message,
      read: false,
    });
    if (!result.ok) return failure('failed to create contact message');

    return emptySuccess();
  }

  async listMessages(
    pagination: PaginationParams
  ): Promise<Result<Paginated<ContactMessageResponse>>> {
    const result = await this.contactRepo.list(toSkipTake(pagination));
    if (!result.ok) return failure('failed to list contact messages');

    return success(
      paginate(result.data.data.map(toContactResponse), result.data.total, pagination)
    );
  }

  async updateMessage(
    id: string,
    input: UpdateContactInput
  ): Promise<Result<ContactMessageResponse>> {
    const result = await this.contactRepo.update(id, { read: input.read });
    if (!result.ok) return failure('failed to update contact message');

    return success(toContactResponse(result.data));
  }

  async deleteMessage(id: string): Promise<EmptyResult> {
    const result = await this.contactRepo.delete(id);
    if (!result.ok) return failure('failed to delete contact message');

    return emptySuccess();
  }
}

export default ContactService;
