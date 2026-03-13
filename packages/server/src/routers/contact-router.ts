import { Router } from 'express';
import type ContactController from '../controllers/contact-controller.js';

export function makeContactRouter(controller: ContactController) {
  const router = Router();

  router.post('/', controller.create);

  return router;
}
