import http from 'http';
import express, { static as expressStatic } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { BaseExpressService } from '@lindeneg/funkallero';

class ExpressService extends BaseExpressService {
    public async setup() {
        this.server = http.createServer(this.app);

        this.app.use(
            cors({
                //@ts-expect-error forgot to make config protected instead of private
                origin: this.config.meta.origins,
            })
        );
        //@ts-expect-error forgot to make logger protected instead of private
        this.logger.info({
            msg: 'CORS enabled for origins',
            //@ts-expect-error forgot to make config protected instead of private
            origins: this.config.meta.origins,
        });
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(cookieParser());
        this.app.use(expressStatic('public'));
        this.app.use(expressStatic('shared'));
    }
}

export default ExpressService;
