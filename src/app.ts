import type {AppEnv} from "./lib/env.js";
import {makeGlobalErrorHandler} from "./lib/error-handler.js";
import type LoggerService from "./services/logger-service.js";
import type {ImageStore} from "./services/image-store.js";
import DataService from "./services/data-service.js";
import AuthService, {AuthError} from "./services/auth-service.js";
import ExpressService from "./services/express-service.js";
import UserService from "./services/user-service.js";
import PostService from "./services/post-service.js";
import PageService from "./services/page-service.js";
import NavigationService from "./services/navigation-service.js";
import MessageService from "./services/message-service.js";
import DashboardService from "./services/dashboard-service.js";
import TemplateService from "./services/template-service.js";
import PageCacheService from "./services/page-cache-service.js";
import UserRepository from "./repositories/user-repository.js";
import NavigationRepository from "./repositories/navigation-repository.js";
import NavigationItemRepository from "./repositories/navigation-item-repository.js";
import PageRepository from "./repositories/page-repository.js";
import SectionRepository from "./repositories/section-repository.js";
import PostRepository from "./repositories/post-repository.js";
import ContactRepository from "./repositories/contact-repository.js";
import {createAdminAuth} from "./middleware/admin-auth.js";
import {makeAdminRouter} from "./routers/admin-router.js";
import {makeApiRouter} from "./routers/api-router.js";
import {makeHealthRouter} from "./routers/health-router.js";
import {makeSitePublicRouter} from "./routers/public-router.js";
import {loginRouter, logoutRouter} from "./routers/admin/auth.js";
import {dashboardRouter} from "./routers/admin/dashboard.js";
import {pagesRouter} from "./routers/admin/pages.js";
import {blogRouter} from "./routers/admin/blog.js";
import {navigationRouter} from "./routers/admin/navigation.js";
import {messagesRouter} from "./routers/admin/messages.js";
import {settingsRouter} from "./routers/admin/settings.js";
import {notFoundRouter} from "./routers/admin/not-found.js";

export async function startApp(env: AppEnv, log: LoggerService, imageStore: ImageStore): Promise<void> {
    const dataService = new DataService(env.DATABASE_URL, env.NODE_ENV, log);

    const userRepo = new UserRepository(dataService);
    const navigationRepo = new NavigationRepository(dataService);
    const navigationItemRepo = new NavigationItemRepository(dataService);
    const pageRepo = new PageRepository(dataService);
    const sectionRepo = new SectionRepository(dataService);
    const postRepo = new PostRepository(dataService);
    const contactRepo = new ContactRepository(dataService);

    const pageCacheService = new PageCacheService(500);

    const authService = new AuthService(
        userRepo,
        {
            cookieName: env.JWT_COOKIE_NAME,
            secret: env.JWT_SECRET,
            bcryptRounds: env.BCRYPT_ROUNDS,
            expiryMs: env.JWT_EXPIRE_MS,
            mode: env.NODE_ENV,
        },
        log
    );
    const userService = new UserService(userRepo, imageStore, log);
    const postService = new PostService(postRepo, imageStore, log);
    const pageService = new PageService(pageRepo, sectionRepo);
    const navigationService = new NavigationService(navigationRepo, navigationItemRepo);
    const messageService = new MessageService(contactRepo);
    const dashboardService = new DashboardService(pageRepo, postRepo, contactRepo);
    const templateService = new TemplateService(pageService, postService, navigationService, pageCacheService);

    const adminRouter = makeAdminRouter(loginRouter(authService), createAdminAuth(authService), [
        logoutRouter(authService),
        dashboardRouter(dashboardService),
        pagesRouter(pageService),
        blogRouter(postService),
        navigationRouter(navigationService),
        messagesRouter(messageService),
        settingsRouter(userService, authService, templateService),
        notFoundRouter(),
    ]);

    const publicRouter = makeSitePublicRouter(templateService);

    // a database that can't be read at boot is fatal; the container restarts and the healthcheck reports it
    const nav = await navigationService.ensureExists();
    if (!nav.ok) {
        log.fatal("failed to prepare the navigation, is the database reachable and migrated?");
        process.exit(1);
    }
    if (env.SUPER_USER) {
        const superUser = await authService.createSuperUserOnce(
            env.SUPER_USER.email,
            env.SUPER_USER.name,
            env.SUPER_USER.password
        );
        if (superUser.ok) {
            log.info("seeded super user");
        } else if (superUser.ctx !== AuthError.ADMIN_ALREADY_CREATED) {
            log.fatal({reason: superUser.ctx}, "failed to create the super user");
            process.exit(1);
        }
    }

    const expressService = new ExpressService(
        {
            port: env.PORT,
            production: env.NODE_ENV === "production",
            staticPublicRoot: env.PUBLIC_STATIC_ROOT,
            trustProxy: env.TRUST_PROXY,
        },
        log,
        makeGlobalErrorHandler(log),
        {
            health: makeHealthRouter(dataService),
            api: makeApiRouter(messageService, env.ORIGINS),
            admin: adminRouter,
            public: publicRouter,
        }
    );

    const startResult = await expressService.start();
    if (!startResult.ok) {
        await dataService.teardown();
        process.exit(1);
    }

    let shuttingDown = false;
    const shutdown = async (signal: string) => {
        if (shuttingDown) return;
        shuttingDown = true;
        log.info(`received ${signal}, shutting down...`);
        await expressService.teardown();
        await dataService.teardown();
        process.exit(0);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
}
