import http from 'http';
import express, { static as expressStatic } from 'express';
import cookieParser from 'cookie-parser';
import { BaseExpressService } from '@lindeneg/funkallero';

class ExpressService extends BaseExpressService {
    public async setup() {
        this.server = http.createServer(this.app);

        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(cookieParser());
        this.app.use(expressStatic('public'));
    }
}

export default ExpressService;
