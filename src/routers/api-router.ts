import express, {Router, type NextFunction, type Request, type Response} from "express";
import cors from "cors";
import {rateLimit} from "express-rate-limit";
import z from "zod";
import {fieldErrors, requiredText} from "../lib/validation.js";
import type MessageService from "../services/message-service.js";

const ContactSchema = z.object({
    name: requiredText().max(200),
    email: z.email().max(320),
    message: requiredText().max(10_000),
});

// called cross-origin from the sites in ORIGINS (the freelance site's contact form)
export function makeApiRouter(messageService: MessageService, origins: string[]): Router {
    const router = Router();

    const contactLimiter = rateLimit({
        windowMs: 10 * 60 * 1000,
        limit: 5,
        standardHeaders: "draft-7",
        legacyHeaders: false,
        message: {error: "too many requests, try again later"},
    });

    // the only cross-origin and json route, so cors and the json parser live here instead of on the whole app
    router.use("/cl-software", cors({origin: origins}));

    router.post("/cl-software", contactLimiter, express.json({limit: "32kb"}), async (req, res) => {
        const parsed = ContactSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({errors: fieldErrors(parsed.error)});
            return;
        }
        const result = await messageService.create(parsed.data);
        if (!result.ok) {
            res.status(500).json({error: "failed to save message"});
            return;
        }
        res.json({success: true});
    });

    // the caller reads json, so a body the parser rejects gets a json error instead of the html error page
    router.use("/cl-software", (err: unknown, _req: Request, res: Response, next: NextFunction) => {
        const type = (err as {type?: string})?.type;
        if (type === "entity.too.large") {
            res.status(413).json({error: "message too large"});
            return;
        }
        if (type === "entity.parse.failed") {
            res.status(400).json({error: "invalid json"});
            return;
        }
        next(err);
    });

    return router;
}
