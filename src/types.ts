import type {Logger as PinoLogger} from "pino";

declare global {
    type AccessTokenPayload = {
        userId: string;
        name: string;
        role: string;
    };

    namespace Express {
        interface Request {
            log: PinoLogger;
            auth?: AccessTokenPayload;
        }
    }
}
