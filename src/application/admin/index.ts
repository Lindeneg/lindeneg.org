import {
    ACTION_RESULT,
    MediatorResultSuccess,
    MediatorResultFailure,
} from '@lindeneg/funkallero';
import BaseAction from '../base-action';

export class GetNavigationQuery extends BaseAction {
    public async execute() {
        const navigation = await this.dataContext.exec((p) =>
            p.navigation.findFirst({ include: { navItems: true } })
        );

        if (!navigation)
            return new MediatorResultFailure(ACTION_RESULT.ERROR_NOT_FOUND);

        return new MediatorResultSuccess(navigation);
    }
}

export class GetNavigationItemColumnsQuery extends BaseAction {
    private static readonly ignoreColumns = ['id', 'navigationId'];

    public async execute() {
        const itemFields = await this.dataContext.exec(
            async (p) => p.navigationItem.fields
        );

        if (!itemFields) {
            return new MediatorResultFailure(ACTION_RESULT.ERROR_NOT_FOUND);
        }

        const fields = Object.entries(itemFields)
            .map(([_, value]) => value.name)
            .filter(
                (e) => !GetNavigationItemColumnsQuery.ignoreColumns.includes(e)
            );

        return new MediatorResultSuccess(fields);
    }
}

export class GetPagesQuery extends BaseAction {
    public async execute() {
        const pages = await this.dataContext.exec((p) =>
            p.page.findMany({ include: { sections: true } })
        );

        if (!pages)
            return new MediatorResultFailure(ACTION_RESULT.ERROR_NOT_FOUND);

        return new MediatorResultSuccess(pages);
    }
}

export class GetPagesColumnsQuery extends BaseAction {
    private static readonly ignoreColumns = ['id', 'createdAt', 'updatedAt'];

    public async execute() {
        const pageFields = await this.dataContext.exec(
            async (p) => p.page.fields
        );

        if (!pageFields) {
            return new MediatorResultFailure(ACTION_RESULT.ERROR_NOT_FOUND);
        }

        const fields = Object.entries(pageFields)
            .map(([_, value]) => value.name)
            .filter((e) => !GetPagesColumnsQuery.ignoreColumns.includes(e));

        fields.push('sections');

        return new MediatorResultSuccess(fields);
    }
}

export class GetPageSectionColumnsQuery extends BaseAction {
    private static readonly ignoreColumns = [
        'id',
        'pageId',
        'createdAt',
        'updatedAt',
    ];

    public async execute() {
        const pageFields = await this.dataContext.exec(
            async (p) => p.pageSection.fields
        );

        if (!pageFields) {
            return new MediatorResultFailure(ACTION_RESULT.ERROR_NOT_FOUND);
        }

        const fields = Object.entries(pageFields)
            .map(([_, value]) => value.name)
            .filter(
                (e) => !GetPageSectionColumnsQuery.ignoreColumns.includes(e)
            );

        return new MediatorResultSuccess(fields);
    }
}
