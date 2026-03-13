import {
    unwrap,
    loadEnv,
    toString,
    toInt,
    toStringArray,
    toEnum,
    withRequired,
    withDefault,
    failure,
    success,
    refine,
    nonEmpty,
    inRange,
    withOptional,
} from "@lindeneg/cl-env";
import LoggerService from "./services/logger-service.js";
import DataService from "./services/data-service.js";
import AuthService from "./services/auth-service.js";
import CloudinaryService from "./services/cloudinary-service.js";
import ExpressService from "./services/express-service.js";
import UserRepository from "./repositories/user-repository.js";
import NavigationRepository from "./repositories/navigation-repository.js";
import NavigationItemRepository from "./repositories/navigation-item-repository.js";
import PageRepository from "./repositories/page-repository.js";
import SectionRepository from "./repositories/section-repository.js";
import PostRepository from "./repositories/post-repository.js";
import ContactRepository from "./repositories/contact-repository.js";
import UserService from "./services/user-service.js";
import NavigationService from "./services/navigation-service.js";
import PageService from "./services/page-service.js";
import PostService from "./services/post-service.js";
import ContactService from "./services/contact-service.js";
import AuthController from "./controllers/auth-controller.js";
import NavigationController from "./controllers/navigation-controller.js";
import PageController from "./controllers/page-controller.js";
import PostController from "./controllers/post-controller.js";
import ContactController from "./controllers/contact-controller.js";
import AdminPageController from "./controllers/admin-page-controller.js";
import AdminNavigationController from "./controllers/admin-navigation-controller.js";
import AdminPostController from "./controllers/admin-post-controller.js";
import AdminContactController from "./controllers/admin-contact-controller.js";
import AdminUserController from "./controllers/admin-user-controller.js";
import {createAuthenticate} from "./middleware/authenticate.js";
import {globalErrorHandler} from "./lib/error-handler.js";
import {makeAppRouter} from "./routers/app-router.js";

async function main() {
    const env = unwrap(
        loadEnv(
            {
                files: [],
                optionalFiles: [".env", ".env.default", ".env.local", ".env.test"],
                transformKeys: false,
                logger: true,
            },
            {
                DATABASE_URL: withRequired(refine(toString(), nonEmpty())),
                JWT_SECRET: withRequired(toString()),
                JWT_EXPIRE_MS: withRequired(toInt()),
                CLOUDINARY_NAME: withRequired(refine(toString(), nonEmpty())),
                CLOUDINARY_KEY: withRequired(refine(toString(), nonEmpty())),
                CLOUDINARY_SECRET: withRequired(refine(toString(), nonEmpty())),
                PORT: withRequired(toInt()),

                ORIGINS: withDefault(toStringArray(), []),
                JWT_COOKIE_NAME: withDefault(toString(), "lindeneg-org-auth"),
                JWT_SALT_ROUNDS: withDefault(refine(toInt(), inRange(4, 12)), 6),
                NODE_ENV: withDefault(toEnum("test", "development", "production"), "development"),

                PUBLIC_STATIC_ROOT: withOptional(toString()),

                SUPER_USER: function (_, value) {
                    if (value === undefined) return success(undefined);
                    const splitted = value.split(",");
                    if (splitted.length !== 4) return failure("must have exactly 4 values");
                    return success({
                        email: splitted[0],
                        name: splitted[1] + " " + splitted[2],
                        password: splitted[3],
                    });
                },
            }
        )
    );

    const log = new LoggerService(env.NODE_ENV);
    const dataService = new DataService(env.DATABASE_URL, env.NODE_ENV);

    const userRepo = new UserRepository(dataService, log);
    const navigationRepo = new NavigationRepository(dataService, log);
    const navigationItemRepo = new NavigationItemRepository(dataService, log);
    const pageRepo = new PageRepository(dataService, log);
    const sectionRepo = new SectionRepository(dataService, log);
    const postRepo = new PostRepository(dataService, log);
    const contactRepo = new ContactRepository(dataService, log);

    const authService = new AuthService(
        {
            cookieName: env.JWT_COOKIE_NAME,
            secret: env.JWT_SECRET,
            saltRounds: env.JWT_SALT_ROUNDS,
            expiryMs: env.JWT_EXPIRE_MS,
            mode: env.NODE_ENV,
        },
        log
    );
    const cloudinaryService = new CloudinaryService(
        env.CLOUDINARY_NAME,
        env.CLOUDINARY_KEY,
        env.CLOUDINARY_SECRET,
        env.NODE_ENV,
        log
    );
    const userService = new UserService(userRepo, authService, cloudinaryService);
    const navigationService = new NavigationService(navigationRepo, navigationItemRepo);
    const pageService = new PageService(pageRepo, sectionRepo);
    const postService = new PostService(postRepo, cloudinaryService, log);
    const contactService = new ContactService(contactRepo);

    const authController = new AuthController(userService, authService);
    const navigationController = new NavigationController(navigationService);
    const pageController = new PageController(pageService);
    const postController = new PostController(postService);
    const contactController = new ContactController(contactService);
    const adminPageController = new AdminPageController(pageService);
    const adminNavigationController = new AdminNavigationController(navigationService);
    const adminPostController = new AdminPostController(postService);
    const adminContactController = new AdminContactController(contactService);
    const adminUserController = new AdminUserController(userService);

    const authenticate = createAuthenticate(authService, userRepo, env.JWT_COOKIE_NAME);

    const router = makeAppRouter(
        authController,
        navigationController,
        pageController,
        postController,
        contactController,
        adminPageController,
        adminNavigationController,
        adminPostController,
        adminContactController,
        adminUserController,
        authenticate
    );

    // TODO maybe make a seed service
    await navigationRepo.createOnce();
    if (env.SUPER_USER) {
        const superUser = await userService.createSuperUserOnce(
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
        globalErrorHandler,
        router,
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

main();
