import { Router, type RequestHandler } from 'express';
import type AuthController from '../controllers/auth-controller.js';

export function makeAuthRouter(controller: AuthController, authenticate: RequestHandler) {
  const router = Router();

  router.post('/login', controller.login);
  router.post('/logout', authenticate, controller.logout);
  router.get('/me', authenticate, controller.me);

  return router;
}
