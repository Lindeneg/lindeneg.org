import type {Logger as PinoLogger} from "pino";
import type {User} from "./repositories/user-repository.js";

declare global {
    namespace Express {
        interface Request {
            log: PinoLogger;
            auth?: User;
            // set by singleImage when multer rejects the file
            uploadError?: string;
        }
    }
}
