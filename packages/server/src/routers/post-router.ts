import { Router } from 'express';
import type PostController from '../controllers/post-controller.js';

export function makePostRouter(controller: PostController) {
  const router = Router();

  router.get('/', controller.list);
  router.get('/:slug', controller.getBySlug);

  return router;
}
