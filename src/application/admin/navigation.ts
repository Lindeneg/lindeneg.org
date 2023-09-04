import { ACTION_RESULT, MediatorResultSuccess, MediatorResultFailure } from '@lindeneg/funkallero';
import BaseAction from '../base-action';
import { ICreateNavigationItemDto } from '@/contracts/create-navigation-item-dto';
import { IUpdateNavigationItemDto } from '@/contracts/update-navigation-item-dto';
import { IUpdateNavigationDto } from '@/contracts/update-navigation-dto';
import { ICreateNavigationDto } from '@/contracts/create-navigation-dto';

export class GetNavigationQuery extends BaseAction {
    public async execute() {
        const navigation = await this.dataContext.exec((p) => p.navigation.findFirst({ include: { navItems: true } }));

        if (!navigation) return new MediatorResultFailure(ACTION_RESULT.ERROR_NOT_FOUND);

        return new MediatorResultSuccess(navigation);
    }
}

export class GetNavigationItemColumnsQuery extends BaseAction {
    private static readonly ignoreColumns = ['id', 'navigationId'];

    public async execute() {
        const itemFields = await this.dataContext.exec(async (p) => p.navigationItem.fields);

        if (!itemFields) {
            return new MediatorResultFailure(ACTION_RESULT.ERROR_NOT_FOUND);
        }

        const fields = Object.entries(itemFields)
            .map(([_, value]) => value.name)
            .filter((e) => !GetNavigationItemColumnsQuery.ignoreColumns.includes(e));

        return new MediatorResultSuccess(fields);
    }
}

export class CreateNavigationCommand extends BaseAction {
    public async execute(navigationDto: ICreateNavigationDto) {
        const navigation = await this.dataContext.exec((p) => p.navigation.create({ data: navigationDto }));

        if (!navigation) return new MediatorResultFailure(ACTION_RESULT.ERROR_NOT_FOUND);

        return new MediatorResultSuccess(navigation.id);
    }
}

export class UpdateNavigationCommand extends BaseAction {
    public async execute({ id, ...dto }: IUpdateNavigationDto) {
        const navigation = await this.dataContext.exec((p) =>
            p.navigation.update({ where: { id }, data: this.createUpdatePayload(dto) })
        );
        if (!navigation) return new MediatorResultFailure(ACTION_RESULT.ERROR_NOT_FOUND);

        return new MediatorResultSuccess(navigation);
    }
}

export class CreateNavigationItemCommand extends BaseAction {
    public async execute(navigationDto: ICreateNavigationItemDto) {
        const navigation = await this.dataContext.exec((p) => p.navigationItem.create({ data: navigationDto }));

        if (!navigation) {
            return new MediatorResultFailure(ACTION_RESULT.ERROR_INTERNAL_ERROR);
        }

        return new MediatorResultSuccess(navigation.id);
    }
}

export class DeleteNavigationItemCommand extends BaseAction {
    public async execute({ id }: Record<'id', string>) {
        const navigation = await this.dataContext.exec((p) => p.navigationItem.delete({ where: { id } }));

        if (!navigation) {
            return new MediatorResultFailure(ACTION_RESULT.ERROR_INTERNAL_ERROR);
        }

        return new MediatorResultSuccess(ACTION_RESULT.UNIT);
    }
}

export class UpdateNavigationItemCommand extends BaseAction {
    public async execute({ id, ...data }: IUpdateNavigationItemDto) {
        const navigation = await this.dataContext.exec((p) =>
            p.navigationItem.update({ where: { id }, data: this.createUpdatePayload(data) })
        );

        if (!navigation) {
            return new MediatorResultFailure(ACTION_RESULT.ERROR_INTERNAL_ERROR);
        }

        return new MediatorResultSuccess(ACTION_RESULT.UNIT);
    }
}
