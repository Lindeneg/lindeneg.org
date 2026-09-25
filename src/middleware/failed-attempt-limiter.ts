import type {Request, Response} from "express";
import {rateLimit, type RateLimitRequestHandler} from "express-rate-limit";

const WINDOW_MINUTES = 15;

export const TOO_MANY_FAILED_ATTEMPTS = `Too many failed attempts, try again in ${WINDOW_MINUTES} minutes`;

// brute-force protection for password checks (login, password change): every rejected attempt counts (any 4xx or
// 5xx, so a form error too, not only a wrong password), per client ip, and after 10 in the window onLimit answers
// every attempt from that client until the window has passed
export function failedAttemptLimiter(onLimit: (req: Request, res: Response) => void): RateLimitRequestHandler {
    return rateLimit({
        windowMs: WINDOW_MINUTES * 60 * 1000,
        limit: 10,
        skipSuccessfulRequests: true,
        standardHeaders: "draft-7",
        legacyHeaders: false,
        handler: onLimit,
    });
}
