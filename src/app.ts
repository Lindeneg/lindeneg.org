import type {AppEnv} from "./lib/env.js";
import PageCache from "./lib/page-cache.js";
import {makeGlobalErrorHandler} from "./lib/error-handler.js";
import type LoggerService from "./services/logger-service.js";
import type {ImageStore} from "./services/image-store.js";
import DataService from "./services/data-service.js";
import AuthService from "./services/auth-service.js";
import ExpressService from "./services/express-service.js";
import UserService from "./services/user-service.js";
import PostService from "./services/post-service.js";
import PageService from "./services/page-service.js";
import NavigationService from "./services/navigation-service.js";
import MessageService from "./services/message-service.js";
import DashboardService from "./services/dashboard-service.js";
import TemplateService from "./services/template-service.js";
import UserRepository from "./repositories/user-repository.js";
import NavigationRepository from "./repositories/navigation-repository.js";
import NavigationItemRepository from "./repositories/navigation-item-repository.js";
import PageRepository from "./repositories/page-repository.js";
import SectionRepository from "./repositories/section-repository.js";
import PostRepository from "./repositories/post-repository.js";
import ContactRepository from "./repositories/contact-repository.js";
import {createAdminAuth} from "./middleware/admin-auth.js";
import {makeAdminRouter} from "./routers/admin-router.js";
import {makeSitePublicRouter} from "./routers/public-router.js";
import {loginRouter, logoutRouter} from "./routers/admin/auth.js";
import {dashboardRouter} from "./routers/admin/dashboard.js";
import {pagesRouter} from "./routers/admin/pages.js";
import {blogRouter} from "./routers/admin/blog.js";
import {navigationRouter} from "./routers/admin/navigation.js";
import {messagesRouter} from "./routers/admin/messages.js";
import {settingsRouter} from "./routers/admin/settings.js";

export async function startApp(env: AppEnv, log: LoggerService, imageStore: ImageStore): Promise<void> {
    const dataService = new DataService(env.DATABASE_URL, env.NODE_ENV, log);

    const userRepo = new UserRepository(dataService);
    const navigationRepo = new NavigationRepository(dataService);
    const navigationItemRepo = new NavigationItemRepository(dataService);
    const pageRepo = new PageRepository(dataService);
    const sectionRepo = new SectionRepository(dataService);
    const postRepo = new PostRepository(dataService);
    const contactRepo = new ContactRepository(dataService);

    const cache = new PageCache(500);

    const authService = new AuthService(
        userRepo,
        {
            cookieName: env.JWT_COOKIE_NAME,
            secret: env.JWT_SECRET,
            saltRounds: env.JWT_SALT_ROUNDS,
            expiryMs: env.JWT_EXPIRE_MS,
            mode: env.NODE_ENV,
        },
        log
    );
    const userService = new UserService(userRepo, imageStore, cache, log);
    const postService = new PostService(postRepo, imageStore, cache, log);
    const pageService = new PageService(pageRepo, sectionRepo, cache);
    const navigationService = new NavigationService(navigationRepo, navigationItemRepo, cache);
    const messageService = new MessageService(contactRepo);
    const dashboardService = new DashboardService(pageRepo, postRepo, contactRepo);
    const templateService = new TemplateService(pageRepo, navigationRepo, postRepo, cache);

    const adminRouter = makeAdminRouter(
        loginRouter(authService, templateService),
        createAdminAuth(authService),
        [
            logoutRouter(authService),
            dashboardRouter(dashboardService, templateService),
            pagesRouter(pageService, templateService),
            blogRouter(postService, templateService),
            navigationRouter(navigationService, templateService),
            messagesRouter(messageService, templateService),
            settingsRouter(userService, templateService),
        ]
    );

    const publicRouter = makeSitePublicRouter(templateService);

    await navigationService.ensureExists();
    if (env.SUPER_USER) {
        const superUser = await authService.createSuperUserOnce(
            env.SUPER_USER.email,
            env.SUPER_USER.name,
            env.SUPER_USER.password
        );
        if (superUser.ok) {
            log.debug("seeded super user");
        }
    }

    const expressService = new ExpressService(
        env.PORT,
        env.ORIGINS,
        log,
        makeGlobalErrorHandler(log),
        adminRouter,
        publicRouter,
        env.PUBLIC_STATIC_ROOT
    );

    const startResult = expressService.start();
    if (!startResult.ok) {
        log.error(startResult.ctx);
        process.exit(1);
    }

    const shutdown = async (signal: string) => {
        log.info(`received ${signal}, shutting down...`);
        await dataService.teardown();
        process.exit(0);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
}
