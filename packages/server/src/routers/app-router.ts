import { Router, type RequestHandler } from 'express';
import type AuthController from '../controllers/auth-controller.js';
import type NavigationController from '../controllers/navigation-controller.js';
import type PageController from '../controllers/page-controller.js';
import type PostController from '../controllers/post-controller.js';
import type ContactController from '../controllers/contact-controller.js';
import type AdminPageController from '../controllers/admin-page-controller.js';
import type AdminNavigationController from '../controllers/admin-navigation-controller.js';
import type AdminPostController from '../controllers/admin-post-controller.js';
import type AdminContactController from '../controllers/admin-contact-controller.js';
import type AdminUserController from '../controllers/admin-user-controller.js';
import { makeAuthRouter } from './auth-router.js';
import { makeNavigationRouter } from './navigation-router.js';
import { makePageRouter } from './page-router.js';
import { makePostRouter } from './post-router.js';
import { makeContactRouter } from './contact-router.js';
import { makeAdminRouter } from './admin-router.js';

export function makeAppRouter(
  authCtrl: AuthController,
  navigationCtrl: NavigationController,
  pageCtrl: PageController,
  postCtrl: PostController,
  contactCtrl: ContactController,
  adminPageCtrl: AdminPageController,
  adminNavCtrl: AdminNavigationController,
  adminPostCtrl: AdminPostController,
  adminContactCtrl: AdminContactController,
  adminUserCtrl: AdminUserController,
  authenticate: RequestHandler
) {
  const router = Router();

  router.use('/auth', makeAuthRouter(authCtrl, authenticate));
  router.use('/navigation', makeNavigationRouter(navigationCtrl));
  router.use('/pages', makePageRouter(pageCtrl));
  router.use('/blog/posts', makePostRouter(postCtrl));
  router.use('/contact', makeContactRouter(contactCtrl));

  router.use(
    '/admin',
    authenticate,
    makeAdminRouter(adminPageCtrl, adminNavCtrl, adminPostCtrl, adminContactCtrl, adminUserCtrl)
  );

  return router;
}
