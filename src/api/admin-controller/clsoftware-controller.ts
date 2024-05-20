import { controller, httpGet, httpDelete, auth, httpPost, body, ParsedSchema, params } from '@lindeneg/funkallero';
import BaseController from '../base-controller';
import AUTH from '@/enums/auth';
import createClSoftwareMsgSchema from '@/contracts/create-clsoftware-msg-dto';

@controller()
class ClSoftwareController extends BaseController {
    @httpGet('/cl-software')
    @auth(AUTH.POLICY.IS_ADMIN)
    public async getMessages() {
        return this.mediator.send('GetClSoftwareMessagesQuery');
    }

    @httpPost('/cl-software')
    public async createMessage(@body(createClSoftwareMsgSchema) dto: ParsedSchema<typeof createClSoftwareMsgSchema>) {
        return this.mediator.send('CreateClSoftwareMessageCommand', dto);
    }

    @httpDelete('/cl-software/:id')
    @auth(AUTH.POLICY.IS_ADMIN)
    public async deleteMessage(@params('id') id: string) {
        return this.mediator.send('DeleteClSoftwareMessageCommand', { id });
    }
}
