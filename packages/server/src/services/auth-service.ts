import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { Response } from 'express';
import { success, failure, type Result, type NodeEnv } from '@lindeneg/shared';
import type LoggerService from './logger-service.js';

export interface AuthServiceOpts {
  cookieName: string;
  secret: string;
  saltRounds: number;
  expiryMs: number;
  mode: NodeEnv;
}

export type AccessTokenPayload = {
  userId: string;
  name: string;
  role: string;
};


class AuthService {
  constructor(
    private readonly opts: AuthServiceOpts,
    private readonly log: LoggerService
  ) {}

  async hashPassword(password: string): Promise<Result<string>> {
    try {
      const hash = await bcrypt.hash(password, this.opts.saltRounds);
      return success(hash);
    } catch (err) {
      this.log.error(err, 'auth-service.hashPassword');
      return failure('failed to hash password');
    }
  }

  async comparePassword(password: string, hash: string): Promise<Result<boolean>> {
    try {
      const match = await bcrypt.compare(password, hash);
      return success(match);
    } catch (err) {
      this.log.error(err, 'auth-service.comparePassword');
      return failure('failed to compare password');
    }
  }

  generateAccessToken(payload: AccessTokenPayload): Result<string> {
    try {
      const token = jwt.sign(payload, this.opts.secret, {
        expiresIn: Math.floor(this.opts.expiryMs / 1000),
      });
      return success(token);
    } catch (err) {
      this.log.error(err, 'auth-service.generateAccessToken');
      return failure('failed to generate access token');
    }
  }

  verifyAccessToken(token: string): Result<AccessTokenPayload> {
    try {
      const payload = jwt.verify(token, this.opts.secret) as AccessTokenPayload;
      return success(payload);
    } catch (err) {
      this.log.error(err, 'auth-service.verifyAccessToken');
      return failure('invalid or expired access token');
    }
  }

  setAuthCookies(res: Response, accessToken: string): void {
    const secure = this.opts.mode === 'production';
    res.cookie(this.opts.cookieName, accessToken, {
      httpOnly: true,
      secure,
      sameSite: 'strict',
      maxAge: this.opts.expiryMs,
    });
  }

  clearAuthCookies(res: Response): void {
    res.clearCookie(this.opts.cookieName);
  }
}

export default AuthService;
