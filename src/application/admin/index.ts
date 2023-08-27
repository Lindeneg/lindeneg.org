import { ACTION_RESULT, MediatorResultSuccess, MediatorResultFailure } from '@lindeneg/funkallero';
import BaseAction from '../base-action';

export class GetNavigationQuery extends BaseAction {
    public async execute() {
        const navigation = await this.dataContext.exec((p) =>
            p.navigation.findFirst({ include: { navItems: true } })
        );

        if (!navigation) return new MediatorResultFailure(ACTION_RESULT.ERROR_NOT_FOUND);

        return new MediatorResultSuccess(navigation);
    }
}
