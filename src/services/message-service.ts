import {success, emptySuccess, failure, type EmptyResult, type AsyncResult} from "../lib/result.js";
import {AppError} from "../lib/errors.js";
import {paginate, toSkipTake, type Paginated, type PaginationParams} from "../lib/pagination.js";
import type {ContactMessage} from "../generated/prisma/client.js";
import type ContactRepository from "../repositories/contact-repository.js";

export interface MessageInput {
    name: string;
    email: string;
    message: string;
}

class MessageService {
    constructor(private readonly contactRepo: ContactRepository) {}

    async list(pagination: PaginationParams): AsyncResult<Paginated<ContactMessage>, AppError> {
        const result = await this.contactRepo.list(toSkipTake(pagination));
        if (!result.ok) return result;
        return success(paginate(result.data.data, result.data.total, pagination));
    }

    async create(input: MessageInput): Promise<EmptyResult<AppError>> {
        const result = await this.contactRepo.create({...input, read: false});
        if (!result.ok) return result;
        return emptySuccess();
    }

    async toggleRead(id: string): Promise<EmptyResult<AppError>> {
        const found = await this.contactRepo.getById(id);
        if (!found.ok) return found;
        if (!found.data) return failure(AppError.NOT_FOUND);

        const result = await this.contactRepo.update(id, {read: !found.data.read});
        if (!result.ok) return result;
        return emptySuccess();
    }

    async delete(id: string): Promise<EmptyResult<AppError>> {
        const result = await this.contactRepo.delete(id);
        if (!result.ok) return result;
        return emptySuccess();
    }
}

export default MessageService;
