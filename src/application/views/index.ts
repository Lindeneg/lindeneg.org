import { ACTION_RESULT, MediatorResultSuccess, MediatorResultFailure, injectService } from '@lindeneg/funkallero';
import BaseAction from '../base-action';
import SERVICE from '@/enums/service';
import TEMPLATE_NAME from '@/enums/template-name';
import type TemplateService from '@/services/template-service';
import type CachingService from '@/services/caching-service';

abstract class BaseViewAction extends BaseAction {
    @injectService(SERVICE.TEMPLATE)
    protected readonly templateService: TemplateService;
}

export class GetPage extends BaseViewAction {
    @injectService(SERVICE.CACHING)
    protected readonly cachingService: CachingService;

    public async execute({ name }: Record<'name', string>) {
        const page = await this.cachingService.getPage(name);

        if (!page) return new MediatorResultFailure(ACTION_RESULT.ERROR_NOT_FOUND);

        const navigation = await this.cachingService.getNavigation();

        const template = await this.templateService.render(TEMPLATE_NAME.PAGE, {
            name: page.name,
            slug: page.slug,
            brandName: navigation?.brandName ?? '',
            title: page.title,
            description: page.description,
            markdownSections: page.sections,
            leftNavEntries: navigation?.leftNavEntries ?? [],
            rightNavEntries: navigation?.rightNavEntries ?? [],
        });

        if (!template) return new MediatorResultFailure(ACTION_RESULT.ERROR_NOT_FOUND);

        return new MediatorResultSuccess(template);
    }
}

export class GetLoginPage extends BaseViewAction {
    public async execute() {
        const template = await this.templateService.render(TEMPLATE_NAME.LOGIN);

        if (!template) return new MediatorResultFailure(ACTION_RESULT.ERROR_NOT_FOUND);

        return new MediatorResultSuccess(template);
    }
}

export class GetAdminPage extends BaseViewAction {
    public async execute() {
        const template = await this.templateService.render(TEMPLATE_NAME.ADMIN);

        if (!template) return new MediatorResultFailure(ACTION_RESULT.ERROR_NOT_FOUND);

        return new MediatorResultSuccess(template);
    }
}
