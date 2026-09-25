import type {Logger as PinoLogger} from "pino";
import type {User} from "./repositories/user-repository.js";

declare global {
    namespace Express {
        interface Request {
            log: PinoLogger;
            auth?: User;
            // set by singleImage when multer rejects the file
            uploadError?: string;
            // set by singleImage when a text field is over MAX_FORM_BYTES; its value is not in req.body
            fieldTooLarge?: boolean;
        }
    }
}
