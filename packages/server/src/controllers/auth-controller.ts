import type { Request, Response, NextFunction } from 'express';
import z from 'zod';
import type { UserResponse } from '@lindeneg/shared';
import { HttpException } from '../lib/http-exception.js';
import { parseRequestObj } from '../lib/parse.js';
import { UserError } from '../services/user-service.js';
import type UserService from '../services/user-service.js';
import type AuthService from '../services/auth-service.js';

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

function mapUserError(req: Request, error: string): HttpException {
  req.log.error(error);
  switch (error) {
    case UserError.INVALID_CREDENTIALS:
    case UserError.USER_NOT_FOUND:
      return HttpException.unauthorized();
  }
  return HttpException.internal();
}

class AuthController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService
  ) {}

  login = async (req: Request, res: Response<UserResponse>, next: NextFunction) => {
    const parsed = await parseRequestObj(req.body, loginSchema);
    if (!parsed.ok) return next(parsed.ctx);

    const result = await this.userService.login(parsed.data);
    if (!result.ok) return next(mapUserError(req, result.ctx));

    this.authService.setAuthCookies(res, result.data.accessToken);

    res.json(result.data.user);
  };

  logout = async (_req: Request, res: Response<{ success: true }>, _next: NextFunction) => {
    this.authService.clearAuthCookies(res);
    res.json({ success: true });
  };

  me = async (req: Request, res: Response<UserResponse>, next: NextFunction) => {
    if (!req.auth) return next(HttpException.unauthorized());

    const result = await this.userService.getMe(req.auth.userId);
    if (!result.ok) return next(mapUserError(req, result.ctx));

    res.json(result.data);
  };
}

export default AuthController;
