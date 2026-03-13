import type { Request, Response, NextFunction } from 'express';
import z from 'zod';
import { HttpException } from '../lib/http-exception.js';
import { parseRequestObj } from '../lib/parse.js';
import { UserError } from '../services/user-service.js';
import type UserService from '../services/user-service.js';

const uploadPhotoSchema = z.object({
  image: z.string().min(1),
});

function mapUserError(req: Request, error: string): HttpException {
  req.log.error(error);
  if (error === UserError.USER_NOT_FOUND) return HttpException.notFound();
  if (error === UserError.UPLOAD_ERROR) return HttpException.unprocessable();
  return HttpException.internal();
}

class AdminUserController {
  constructor(private readonly userService: UserService) {}

  getPhoto = async (req: Request, res: Response<{ photo: string | null }>, next: NextFunction) => {
    if (!req.auth) return next(HttpException.unauthorized());

    const result = await this.userService.getPhoto(req.auth.userId);
    if (!result.ok) return next(mapUserError(req, result.ctx));

    res.json({ photo: result.data });
  };

  uploadPhoto = async (req: Request, res: Response<{ photo: string }>, next: NextFunction) => {
    if (!req.auth) return next(HttpException.unauthorized());

    const parsed = await parseRequestObj(req.body, uploadPhotoSchema);
    if (!parsed.ok) return next(parsed.ctx);

    const result = await this.userService.uploadPhoto(req.auth.userId, parsed.data.image);
    if (!result.ok) return next(mapUserError(req, result.ctx));

    res.json({ photo: result.data });
  };

  deletePhoto = async (req: Request, res: Response<{ success: true }>, next: NextFunction) => {
    if (!req.auth) return next(HttpException.unauthorized());

    const result = await this.userService.deletePhoto(req.auth.userId);
    if (!result.ok) return next(mapUserError(req, result.ctx));

    res.json({ success: true });
  };

  bustCache = async (_req: Request, res: Response<{ success: true }>, _next: NextFunction) => {
    // TODO implement cache busting
    res.json({ success: true });
  };
}

export default AdminUserController;
