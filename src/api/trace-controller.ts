import {
    controller,
    httpPost,
} from '@lindeneg/funkallero';
import BaseController from './base-controller';

@controller()
class TraceController extends BaseController {
    @httpPost('/trace')
    public async trace() {
        return this.mediator.send('HandleVisitorCommand', {
            buffer: this.request.read() ?? null,
            uag: this.request.headers['user-agent'] ?? null,
        });
    }
}
