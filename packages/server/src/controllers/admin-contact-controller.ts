import type { Request, Response, NextFunction } from 'express';
import z from 'zod';
import type { Paginated, ContactMessageResponse } from '@lindeneg/shared';
import { HttpException } from '../lib/http-exception.js';
import { parsePagination } from '../lib/pagination.js';
import { parseRequestObj } from '../lib/parse.js';
import type ContactService from '../services/contact-service.js';

const updateContactSchema = z.object({
  read: z.boolean(),
});

function mapContactError(req: Request, error: string): HttpException {
  req.log.error(error);
  return HttpException.internal();
}

class AdminContactController {
  constructor(private readonly contactService: ContactService) {}

  listMessages = async (req: Request, res: Response<Paginated<ContactMessageResponse>>, next: NextFunction) => {
    const pagination = parsePagination(req);
    const result = await this.contactService.listMessages(pagination);
    if (!result.ok) return next(mapContactError(req, result.ctx));

    res.json(result.data);
  };

  updateMessage = async (req: Request, res: Response<ContactMessageResponse>, next: NextFunction) => {
    const id = req.params.id as string;
    const parsed = await parseRequestObj(req.body, updateContactSchema);
    if (!parsed.ok) return next(parsed.ctx);

    const result = await this.contactService.updateMessage(id, parsed.data);
    if (!result.ok) return next(mapContactError(req, result.ctx));

    res.json(result.data);
  };

  deleteMessage = async (req: Request, res: Response<{ success: true }>, next: NextFunction) => {
    const id = req.params.id as string;
    const result = await this.contactService.deleteMessage(id);
    if (!result.ok) return next(mapContactError(req, result.ctx));

    res.json({ success: true });
  };
}

export default AdminContactController;
