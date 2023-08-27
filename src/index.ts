import Funkallero, {
    BaseZodParserService,
    BaseLoggerServicePalette,
    LOG_LEVEL,
} from '@lindeneg/funkallero';
import { BaseTokenService } from '@lindeneg/funkallero-auth-service';
import TemplateService from './services/template-service';
import SERVICE from '@/enums/service';
import ExpressService from './services/express-service';
import MediatorService from '@/services/mediator-service';
import DataContextService from '@/services/data-context-service';
import AuthenticationService from '@/services/authentication-service';
import AuthorizationService from '@/services/authorization-service';
import SuperUserService from './services/super-user-service';
import CookieService from './services/cookie-service';
import CachingService from './services/caching-service';
import '@/api/view-controller';
import '@/api/auth-controller';
import '@/api/admin-controller';

BaseLoggerServicePalette.useDefaultPalette();

const funkallero = await Funkallero.create({
    basePath: '/api',

    logLevel: LOG_LEVEL.VERBOSE,

    meta: {
        mode: process.env['FUNKALLERO_MODE'], // local or production
        isDev: process.argv.includes('--dev'), // hot-rebuilding for development
    },

    setup(service) {
        service.registerSingletonService(SERVICE.MEDIATOR, MediatorService);
        service.registerSingletonService(SERVICE.DATA_CONTEXT, DataContextService);
        service.registerSingletonService(SERVICE.SUPER_USER, SuperUserService);
        service.registerSingletonService(SERVICE.EXPRESS, ExpressService);
        service.registerSingletonService(SERVICE.TEMPLATE, TemplateService);
        service.registerSingletonService(SERVICE.SCHEMA_PARSER, BaseZodParserService);
        service.registerSingletonService(SERVICE.TOKEN, BaseTokenService);
        service.registerSingletonService(SERVICE.COOKIE, CookieService);
        service.registerSingletonService(SERVICE.CACHING, CachingService);

        service.registerScopedService(SERVICE.AUTHENTICATION, AuthenticationService);
        service.registerScopedService(SERVICE.AUTHORIZATION, AuthorizationService);
    },

    async startup(service) {
        await Promise.all([
            // initialize handlebar templates
            service.getSingletonService<TemplateService>(SERVICE.TEMPLATE)?.initializeTemplates(),
            // create super user from environment, if not already created
            service.getSingletonService<SuperUserService>(SERVICE.SUPER_USER)?.create(),
        ]);
    },
});

await funkallero.start();
