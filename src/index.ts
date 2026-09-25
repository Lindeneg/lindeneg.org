import {startApp} from "./app.js";
import {loadAppEnv} from "./lib/env.js";
import LoggerService from "./services/logger-service.js";
import CloudinaryService from "./services/cloudinary-service.js";

const env = loadAppEnv();
const log = new LoggerService(env.NODE_ENV, env.LOG_LEVEL);
const imageStore = new CloudinaryService(
    env.CLOUDINARY_NAME,
    env.CLOUDINARY_KEY,
    env.CLOUDINARY_SECRET,
    env.NODE_ENV,
    log
);

startApp(env, log, imageStore);
