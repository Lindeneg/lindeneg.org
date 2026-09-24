import {success, emptySuccess, failure, type EmptyResult, type AsyncResult} from "../lib/result.js";
import type {ValueOf} from "../lib/types.js";
import {paginate, toSkipTake, type Paginated, type PaginationParams} from "../lib/pagination.js";
import type {ContactMessage} from "@prisma/client";
import type ContactRepository from "../repositories/contact-repository.js";

export const MessageError = {
    NOT_FOUND: "not_found",
    DB_ERROR: "db_error",
} as const;

export type MessageError = ValueOf<typeof MessageError>;

class MessageService {
    constructor(private readonly contactRepo: ContactRepository) {}

    async list(pagination: PaginationParams): AsyncResult<Paginated<ContactMessage>, MessageError> {
        const result = await this.contactRepo.list(toSkipTake(pagination));
        if (!result.ok) return failure(MessageError.DB_ERROR);
        return success(paginate(result.data.data, result.data.total, pagination));
    }

    async toggleRead(id: string): Promise<EmptyResult<MessageError>> {
        const found = await this.contactRepo.getById(id);
        if (!found.ok) return failure(MessageError.DB_ERROR);
        if (!found.data) return failure(MessageError.NOT_FOUND);

        const result = await this.contactRepo.update(id, {read: !found.data.read});
        if (!result.ok) return failure(MessageError.DB_ERROR);
        return emptySuccess();
    }

    async delete(id: string): Promise<EmptyResult<MessageError>> {
        const result = await this.contactRepo.delete(id);
        if (!result.ok) return failure(MessageError.DB_ERROR);
        return emptySuccess();
    }
}

export default MessageService;
