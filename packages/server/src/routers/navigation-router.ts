import { Router } from 'express';
import type NavigationController from '../controllers/navigation-controller.js';

export function makeNavigationRouter(controller: NavigationController) {
  const router = Router();

  router.get('/', controller.get);

  return router;
}
