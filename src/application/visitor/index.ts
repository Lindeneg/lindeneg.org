import UAParser from 'ua-parser-js';
import { ACTION_RESULT, MediatorResultSuccess } from '@lindeneg/funkallero';
import BaseAction from '../base-action';

interface ICoreVisitorPayload {
    path: string;
    ts: number;
    http: string;
    tls: string;
    uag: string;
}


interface IKnownVisitorPayload extends ICoreVisitorPayload {
    id: string;
}

interface IUnknownVisitorPayload extends ICoreVisitorPayload {
    ip: string;
    loc: string;
}

interface IExecutePayload {
    buffer: Buffer | null;
    uag: string | null;
}

export class HandleVisitorCommand extends BaseAction {
    private static readonly parser = new UAParser();

    public async execute({ buffer, uag }: IExecutePayload) {
        if (!buffer) return new MediatorResultSuccess(ACTION_RESULT.UNIT);

        const parsed = this.parsePayload(buffer);

        if (!parsed) return new MediatorResultSuccess(ACTION_RESULT.UNIT);

        if (!parsed.uag && uag) {
            parsed.uag = uag;
        }

        if (parsed.id) return this.handleKnownVisitor(parsed);

        return this.handleUnknownVisitor(parsed);
    }

    private async handleKnownVisitor(payload: IKnownVisitorPayload) {
        const knownVisitor = await this.dataContext.exec(p => p.visitor.findUnique({ where: { id: payload.id } }));

        if (!knownVisitor) return new MediatorResultSuccess(ACTION_RESULT.UNIT);

        const result = await this.dataContext.exec(p => p.visit.create({
            data: {
                visitorId: knownVisitor.id,
                timestamp: payload.ts,
                pathname: payload.path,
                http: payload.http ?? 'unknown',
                tls: payload.tls ?? 'unknown',
            },
        }));

        if (!result) return new MediatorResultSuccess(ACTION_RESULT.UNIT);

        return new MediatorResultSuccess(ACTION_RESULT.UNIT);
    }

    private async handleUnknownVisitor(payload: IUnknownVisitorPayload) {
        if (!payload.uag) return new MediatorResultSuccess(ACTION_RESULT.UNIT);

        const parsed = this.parseUserAgent(payload.uag);

        if (!parsed) return new MediatorResultSuccess(ACTION_RESULT.UNIT);

        const { browser, device, os, cpu } = parsed;

        const knownVisitor = await this.dataContext.exec(p => p.visitor.findUnique({ where: { ip: payload.ip } }));

        if (knownVisitor) return this.handleKnownVisitor({ ...payload, id: knownVisitor.id });

        const result = await this.dataContext.exec(p => p.visitor.create({
            data: {
                ip: payload.ip,
                userAgent: payload.uag,
                location: payload.loc ?? 'unknown',
                browser: browser.name ?? 'unknown',
                device: device.model ?? 'unknown',
                os: os.name ?? 'unknown',
                cpu: cpu.architecture ?? 'unknown',
            },
        }));

        if (!result) return new MediatorResultSuccess(ACTION_RESULT.UNIT);

        await this.dataContext.exec(p => p.visit.create({
            data: {
                visitorId: result.id,
                timestamp: payload.ts,
                pathname: payload.path,
                http: payload.http ?? 'unknown',
                tls: payload.tls ?? 'unknown',
            },
        }));

        return new MediatorResultSuccess(result.id, ACTION_RESULT.SUCCESS_CREATE);
    }

    private parsePayload(buffer: Buffer) {
        try {
            return JSON.parse(atob(buffer.toString()));

        } catch (err) {
        }
        return null;
    }

    private parseUserAgent(uag: string) {
        try {
            return HandleVisitorCommand.parser.setUA(uag).getResult();
        } catch (err) {
            return null;
        }
    }
}
