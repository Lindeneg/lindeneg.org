import { Router } from 'express';
import type AdminPageController from '../controllers/admin-page-controller.js';
import type AdminNavigationController from '../controllers/admin-navigation-controller.js';
import type AdminPostController from '../controllers/admin-post-controller.js';
import type AdminContactController from '../controllers/admin-contact-controller.js';
import type AdminUserController from '../controllers/admin-user-controller.js';

export function makeAdminRouter(
  pageCtrl: AdminPageController,
  navCtrl: AdminNavigationController,
  postCtrl: AdminPostController,
  contactCtrl: AdminContactController,
  userCtrl: AdminUserController
) {
  const router = Router();

  // pages
  router.get('/pages', pageCtrl.listPages);
  router.post('/pages', pageCtrl.createPage);
  router.patch('/pages/:id', pageCtrl.updatePage);
  router.delete('/pages/:id', pageCtrl.deletePage);

  // sections
  router.post('/sections', pageCtrl.createSection);
  router.patch('/sections/:id', pageCtrl.updateSection);
  router.delete('/sections/:id', pageCtrl.deleteSection);

  // navigation
  router.patch('/navigation/:id', navCtrl.updateNavigation);

  // nav items
  router.post('/nav-items', navCtrl.createNavItem);
  router.patch('/nav-items/:id', navCtrl.updateNavItem);
  router.delete('/nav-items/:id', navCtrl.deleteNavItem);

  // posts
  router.get('/posts/:slug', postCtrl.getPost);
  router.get('/posts', postCtrl.listPosts);
  router.post('/posts', postCtrl.createPost);
  router.patch('/posts/:id', postCtrl.updatePost);
  router.delete('/posts/:id', postCtrl.deletePost);

  // messages
  router.get('/messages', contactCtrl.listMessages);
  router.patch('/messages/:id', contactCtrl.updateMessage);
  router.delete('/messages/:id', contactCtrl.deleteMessage);

  // user photo
  router.get('/user/photo', userCtrl.getPhoto);
  router.post('/user/photo', userCtrl.uploadPhoto);
  router.delete('/user/photo', userCtrl.deletePhoto);

  // cache
  router.post('/bust-cache', userCtrl.bustCache);

  return router;
}
