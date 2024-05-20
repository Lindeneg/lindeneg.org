import { ACTION_RESULT, MediatorResultSuccess, MediatorResultFailure } from '@lindeneg/funkallero';
import BaseAction from '../base-action';
import type { ICreateClSoftwareMsgDto } from '@/contracts/create-clsoftware-msg-dto';

export class GetClSoftwareMessagesQuery extends BaseAction {
    public async execute() {
        const messages = await this.dataContext.exec((p) => p.cLSoftwareContact.findMany());

        if (!messages) return new MediatorResultFailure(ACTION_RESULT.ERROR_NOT_FOUND);

        return new MediatorResultSuccess(messages);
    }
}

export class CreateClSoftwareMessageCommand extends BaseAction {
    public async execute(dto: ICreateClSoftwareMsgDto) {
        const message = await this.dataContext.exec((p) =>
            p.cLSoftwareContact.create({
                data: {
                    ...dto,
                },
            })
        );

        if (!message) return new MediatorResultFailure(ACTION_RESULT.ERROR_NOT_FOUND);

        return new MediatorResultSuccess(ACTION_RESULT.UNIT);
    }
}

export class DeleteClSoftwareMessageCommand extends BaseAction {
    public async execute({ id }: Record<'id', string>) {
        const message = await this.dataContext.exec((p) =>
            p.cLSoftwareContact.delete({
                where: {
                    id,
                },
            })
        );

        if (!message) return new MediatorResultFailure(ACTION_RESULT.ERROR_NOT_FOUND);

        return new MediatorResultSuccess(ACTION_RESULT.UNIT);
    }
}
