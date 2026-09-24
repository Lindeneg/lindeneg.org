import {startApp} from "../../src/app.js";
import {isInTestMode, loadAppEnv} from "../../src/lib/env.js";
import LoggerService from "../../src/services/logger-service.js";
import FakeImageStore from "./fake-image-store.js";

if (!isInTestMode()) {
    throw new Error("the e2e server must run with NODE_ENV=test");
}

const env = loadAppEnv();
startApp(env, new LoggerService(env.NODE_ENV), new FakeImageStore());
