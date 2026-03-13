import type { Request, Response, NextFunction } from 'express';
import z from 'zod';
import { HttpException } from '../lib/http-exception.js';
import { parseRequestObj } from '../lib/parse.js';
import type ContactService from '../services/contact-service.js';

const createContactSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  message: z.string().min(1),
});

function mapContactError(req: Request, error: string): HttpException {
  req.log.error(error);
  return HttpException.internal();
}


class ContactController {
  constructor(private readonly contactService: ContactService) {}

  create = async (req: Request, res: Response<{ success: true }>, next: NextFunction) => {
    const parsed = await parseRequestObj(req.body, createContactSchema);
    if (!parsed.ok) return next(parsed.ctx);

    const result = await this.contactService.createMessage(parsed.data);
    if (!result.ok) return next(mapContactError(req, result.ctx));

    res.json({ success: true });
  };
}

export { mapContactError };
export default ContactController;
