import type {Server} from "node:http";
import express, {static as expressStatic, type Request, type Response, type NextFunction, type Router} from "express";
import compression from "compression";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import {failure, emptySuccess, type EmptyResult} from "../lib/result.js";
import type {MaybeNull} from "../lib/types.js";
import type LoggerService from "./logger-service.js";
import type {GlobalErrorHandler} from "../lib/error-handler.js";

export type ExpressOpts = {
    port: number;
    production: boolean;
    staticPublicRoot?: string;
    // express "trust proxy", needed behind nginx for the client ip (rate limits, logs)
    trustProxy?: number | string;
};

export type AppRouters = {
    health: Router;
    api: Router;
    admin: Router;
    public: Router;
};

const YOUTUBE = [
    "https://www.youtube.com",
    "https://youtube.com",
    "https://www.youtube-nocookie.com",
    "https://youtube-nocookie.com",
];

class ExpressService {
    #server: MaybeNull<Server> = null;
    readonly app;

    constructor(
        private readonly opts: ExpressOpts,
        private readonly log: LoggerService,
        errorHandler: GlobalErrorHandler,
        routers: AppRouters
    ) {
        this.app = express();

        if (opts.trustProxy !== undefined) this.app.set("trust proxy", opts.trustProxy);

        this.app.use(
            helmet({
                contentSecurityPolicy: {
                    directives: {
                        // the post and section editors load marked and highlight.js from jsdelivr
                        "script-src": ["'self'", "https://cdn.jsdelivr.net"],
                        "style-src": ["'self'"],
                        "font-src": ["'self'"],
                        // markdown may embed images from anywhere, thumbnails come from cloudinary
                        "img-src": ["'self'", "data:", "https:"],
                        "frame-src": YOUTUBE,
                        "upgrade-insecure-requests": opts.production ? [] : null,
                    },
                },
                // other lindeneg.org subdomains are not ours to force onto https
                hsts: opts.production ? {includeSubDomains: false} : false,
            })
        );
        this.app.use(compression());

        // before the request logger, so health checks don't flood the logs
        this.app.use(routers.health);
        this.app.use(this.log.makeRequestLogger());

        if (opts.staticPublicRoot) {
            this.app.use(expressStatic(opts.staticPublicRoot, {index: false, fallthrough: true}));
        }

        // before the form and cookie parsers: the api only takes json, which its own router parses
        this.app.use("/api", routers.api);

        this.app.use(express.urlencoded({extended: true, limit: "2mb"}));
        this.app.use(cookieParser());

        this.app.use("/admin", routers.admin);
        this.app.use(routers.public);

        this.app.use((err: any, request: Request, response: Response, next: NextFunction) =>
            errorHandler(err, request, response, next)
        );
    }

    // resolves once the port is bound, or with a failure if it can't be (e.g. already in use)
    start(): Promise<EmptyResult> {
        return new Promise((resolve) => {
            const server = this.app.listen(this.opts.port, (err?: Error) => {
                if (err) {
                    this.log.error(err, "failed to start server");
                    return resolve(failure(err.message));
                }
                this.#server = server;
                this.log.info(`server listening on http://localhost:${this.opts.port}`);
                resolve(emptySuccess());
            });
        });
    }

    // stops accepting connections and waits for in-flight requests to finish
    async teardown(): Promise<void> {
        return new Promise((resolve) => {
            if (!this.#server) return resolve();
            this.#server.close(() => resolve());
            this.#server.closeIdleConnections();
        });
    }
}

export default ExpressService;
