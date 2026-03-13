import { Router } from 'express';
import type PageController from '../controllers/page-controller.js';

export function makePageRouter(controller: PageController) {
  const router = Router();

  router.get('/:slug', controller.getBySlug);

  return router;
}
