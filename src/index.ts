import Funkallero, { BaseZodParserService, BaseLoggerServicePalette, LOG_LEVEL } from '@lindeneg/funkallero';
import { BaseTokenService, BaseTokenConfiguration } from '@lindeneg/funkallero-auth-service';
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
import CloudinaryService from './services/cloudinary-service';
import '@/api/auth-controller';
import '@/api/admin-controller';
import '@/api/view-controller';

BaseLoggerServicePalette.useDefaultPalette();
BaseTokenConfiguration.secret = process.env['LINDENEG_JWT_SECRET']!;

const funkallero = await Funkallero.create({
    basePath: '/api',

    port: Number(process.env['PORT']) || Number(process.env['FUNKALLERO_PORT']) || 5000,

    logLevel: LOG_LEVEL.VERBOSE,

    meta: {
        mode: process.env['FUNKALLERO_MODE'],
        isDev: process.env['FUNKALLERO_MODE'] === 'dev',
        cloudinary: {
            cloudName: process.env['CLOUDINARY_NAME'],
            apiKey: process.env['CLOUDINARY_KEY'],
            apiSecret: process.env['CLOUDINARY_SECRET'],
        },
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
        service.registerSingletonService(SERVICE.CLOUDINARY, CloudinaryService);

        service.registerScopedService(SERVICE.AUTHENTICATION, AuthenticationService);
        service.registerScopedService(SERVICE.AUTHORIZATION, AuthorizationService);
    },

    async startup(service) {
        await Promise.all([
            service.getSingletonService<TemplateService>(SERVICE.TEMPLATE)?.initializeTemplates(),
            service.getSingletonService<CloudinaryService>(SERVICE.CLOUDINARY)?.initialize(),
            service.getSingletonService<SuperUserService>(SERVICE.SUPER_USER)?.create(),
        ]);
    },
});

await funkallero.start();
