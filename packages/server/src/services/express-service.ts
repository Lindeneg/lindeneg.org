import type {Server} from "node:http";
import express, {
    static as expressStatic,
    type Request,
    type Response,
    type NextFunction,
    type Router,
} from "express";
import compression from "compression";
import cors from "cors";
import cookieParser from "cookie-parser";
import {failure, emptySuccess, type EmptyResult} from "../lib/result.js";
import {slugify} from "../lib/slugify.js";
import type LoggerService from "./logger-service.js";
import type {GlobalErrorHandler} from "../lib/error-handler.js";
import type TemplateService from "./template-service.js";

class ExpressService {
    #server: Server | null = null;
    readonly app;

    constructor(
        private readonly port: number,
        private readonly origins: string[],
        private readonly templateService: TemplateService,
        private readonly log: LoggerService,
        errorHandler: GlobalErrorHandler,
        router: Router,
        adminRouter: Router,
        staticPublicRoot?: string
    ) {
        this.app = express();

        this.app.use(
            cors({
                origin: this.origins,
            })
        );

        this.app.use(compression());
        this.app.use(express.json({limit: "50mb"}));
        this.app.use(express.urlencoded({extended: true, limit: "50mb"}));
        this.app.use(cookieParser());
        this.app.use(this.log.makeRequestLogger());

        if (staticPublicRoot) {
            this.app.use(expressStatic(staticPublicRoot, {index: false, fallthrough: true}));
        }

        this.app.use("/api", router);
        this.app.use("/admin", adminRouter);

        const sendNotFound = async (res: Response, currentPath: string) => {
            const notFound = await this.templateService.getNotFound(currentPath);
            res.status(404).type("html").send(notFound);
        };

        this.app.get("/blog", async (req, res) => {
            const page = Number(req.query.page) || 1;
            const result = await this.templateService.getBlogList(page, req.path);
            if (result.ok) return res.type("html").send(result.data);
            await sendNotFound(res, req.path);
        });

        this.app.get("/blog/:slug", async (req, res) => {
            const result = await this.templateService.getBlogPost(req.params.slug, req.path);
            if (result.ok) return res.type("html").send(result.data);
            await sendNotFound(res, req.path);
        });

        this.app.use(async (req, res, next) => {
            if (req.method !== "GET" && req.method !== "HEAD") return next();
            const name = slugify(req.path) || "home";
            const result = await this.templateService.getPage(name, req.path);
            if (result.ok) {
                res.type("html").send(result.data);
                return;
            }
            await sendNotFound(res, req.path);
        });

        this.app.use((err: any, request: Request, response: Response, next: NextFunction) =>
            errorHandler(err, request, response, next)
        );
    }

    start(): EmptyResult {
        try {
            this.#server = this.app.listen(this.port, () => {
                this.log.info(`server listening on http://localhost:${this.port}`);
            });
            return emptySuccess();
        } catch (err) {
            this.log.error(err, "failed to start server");
            return failure(err instanceof Error ? err.message : "failed to start server");
        }
    }

    async teardown(): Promise<void> {
        return new Promise((resolve) => {
            if (!this.#server) return resolve();
            this.#server.close(() => resolve());
        });
    }
}

export default ExpressService;
