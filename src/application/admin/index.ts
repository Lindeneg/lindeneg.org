import { ACTION_RESULT, MediatorResultSuccess, MediatorResultFailure } from '@lindeneg/funkallero';
import BaseAction from '../base-action';
import { ICreatePageDto } from '@/contracts/create-page-dto';
import { IUpdatePageDto } from '@/contracts/update-page-dto';
import { ICreatePageSectionDto } from '@/contracts/create-page-section-dto';
import { IUpdatePageSectionDto } from '@/contracts/update-page-section-dto';
import { ICreateNavigationItemDto } from '@/contracts/create-navigation-item-dto';
import { IUpdateNavigationItemDto } from '@/contracts/update-navigation-item-dto';
import { IUpdateNavigationDto } from '@/contracts/update-navigation-dto';

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

export class GetPagesQuery extends BaseAction {
    public async execute() {
        const pages = await this.dataContext.exec((p) => p.page.findMany({ include: { sections: true } }));

        if (!pages) return new MediatorResultFailure(ACTION_RESULT.ERROR_NOT_FOUND);

        return new MediatorResultSuccess(pages);
    }
}

export class GetPagesColumnsQuery extends BaseAction {
    private static readonly ignoreColumns = ['id', 'createdAt', 'updatedAt'];

    public async execute() {
        const pageFields = await this.dataContext.exec(async (p) => p.page.fields);

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
    private static readonly ignoreColumns = ['id', 'pageId', 'createdAt', 'updatedAt'];

    public async execute() {
        const pageFields = await this.dataContext.exec(async (p) => p.pageSection.fields);

        if (!pageFields) {
            return new MediatorResultFailure(ACTION_RESULT.ERROR_NOT_FOUND);
        }

        const fields = Object.entries(pageFields)
            .map(([_, value]) => value.name)
            .filter((e) => !GetPageSectionColumnsQuery.ignoreColumns.includes(e));

        return new MediatorResultSuccess(fields);
    }
}

export class CreatePageCommand extends BaseAction {
    public async execute(pageDto: ICreatePageDto) {
        const existingPage = await this.dataContext.exec((p) => p.page.findFirst({ where: { name: pageDto.name } }));

        if (existingPage) {
            return new MediatorResultFailure(ACTION_RESULT.ERROR_UNPROCESSABLE);
        }

        const page = await this.dataContext.exec((p) => p.page.create({ data: pageDto }));

        if (!page) {
            return new MediatorResultFailure(ACTION_RESULT.ERROR_INTERNAL_ERROR);
        }

        return new MediatorResultSuccess(page.id);
    }
}

export class DeletePageCommand extends BaseAction {
    public async execute({ id }: Record<'id', string>) {
        const page = await this.dataContext.exec((p) => p.page.delete({ where: { id } }));

        if (!page) {
            return new MediatorResultFailure(ACTION_RESULT.ERROR_INTERNAL_ERROR);
        }

        return new MediatorResultSuccess(ACTION_RESULT.UNIT);
    }
}

export class UpdatePageCommand extends BaseAction {
    public async execute({ id, ...data }: IUpdatePageDto) {
        const page = await this.dataContext.exec((p) =>
            p.page.update({ where: { id }, data: this.createUpdatePayload(data) })
        );

        if (!page) {
            return new MediatorResultFailure(ACTION_RESULT.ERROR_INTERNAL_ERROR);
        }

        return new MediatorResultSuccess(ACTION_RESULT.UNIT);
    }
}

export class CreatePageSectionCommand extends BaseAction {
    public async execute(pageSectionDto: ICreatePageSectionDto) {
        const section = await this.dataContext.exec((p) => p.pageSection.create({ data: pageSectionDto }));

        if (!section) {
            return new MediatorResultFailure(ACTION_RESULT.ERROR_INTERNAL_ERROR);
        }

        return new MediatorResultSuccess(section.id);
    }
}

export class DeletePageSectionCommand extends BaseAction {
    public async execute({ id }: Record<'id', string>) {
        const section = await this.dataContext.exec((p) => p.pageSection.delete({ where: { id } }));

        if (!section) {
            return new MediatorResultFailure(ACTION_RESULT.ERROR_INTERNAL_ERROR);
        }

        return new MediatorResultSuccess(ACTION_RESULT.UNIT);
    }
}

export class UpdatePageSectionCommand extends BaseAction {
    public async execute({ id, ...data }: IUpdatePageSectionDto) {
        const section = await this.dataContext.exec((p) =>
            p.pageSection.update({ where: { id }, data: this.createUpdatePayload(data) })
        );

        if (!section) {
            return new MediatorResultFailure(ACTION_RESULT.ERROR_INTERNAL_ERROR);
        }

        return new MediatorResultSuccess(ACTION_RESULT.UNIT);
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
        const navigation = await this.dataContext.exec((p) => p.pageSection.delete({ where: { id } }));

        if (!navigation) {
            return new MediatorResultFailure(ACTION_RESULT.ERROR_INTERNAL_ERROR);
        }

        return new MediatorResultSuccess(ACTION_RESULT.UNIT);
    }
}

export class UpdateNavigationItemCommand extends BaseAction {
    public async execute({ id, ...data }: IUpdateNavigationItemDto) {
        const navigation = await this.dataContext.exec((p) =>
            p.pageSection.update({ where: { id }, data: this.createUpdatePayload(data) })
        );

        if (!navigation) {
            return new MediatorResultFailure(ACTION_RESULT.ERROR_INTERNAL_ERROR);
        }

        return new MediatorResultSuccess(ACTION_RESULT.UNIT);
    }
}
