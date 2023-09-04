import { ACTION_RESULT, MediatorResultSuccess, MediatorResultFailure, injectService } from '@lindeneg/funkallero';
import BaseAction from '../base-action';
import SERVICE from '@/enums/service';
import type CachingService from '@/services/caching-service';

abstract class BaseViewAction extends BaseAction {
    @injectService(SERVICE.CACHING)
    protected readonly cachingService: CachingService;
}

export class GetPage extends BaseViewAction {
    public async execute({ name }: Record<'name', string>) {
        const blog = await this.cachingService.getBlog();

        if (blog?.enabled && blog.path && name === blog.path) return this.handleBlogOverview();

        const page = await this.cachingService.getPage(name);

        if (!page) return new MediatorResultFailure(ACTION_RESULT.ERROR_NOT_FOUND);

        return new MediatorResultSuccess(page);
    }

    private async handleBlogOverview() {
        const blogOverviewPage = await this.cachingService.getBlogOverviewPage();

        if (!blogOverviewPage) return new MediatorResultFailure(ACTION_RESULT.ERROR_NOT_FOUND);

        return new MediatorResultSuccess(blogOverviewPage);
    }
}

export class GetBlogPage extends BaseViewAction {
    public async execute({ blogName, blogPath }: Record<'blogName' | 'blogPath', string>) {
        const blogPostPage = await this.cachingService.getBlogPostPage(blogName, blogPath);

        if (!blogPostPage) return new MediatorResultFailure(ACTION_RESULT.ERROR_NOT_FOUND);

        return new MediatorResultSuccess(blogPostPage);
    }
}

export class GetLoginPage extends BaseViewAction {
    public async execute() {
        const template = await this.cachingService.getStaticPage('login');

        if (!template) return new MediatorResultFailure(ACTION_RESULT.ERROR_NOT_FOUND);

        return new MediatorResultSuccess(template);
    }
}

export class GetAdminPage extends BaseViewAction {
    public async execute() {
        const template = await this.cachingService.getStaticPage('admin');

        if (!template) return new MediatorResultFailure(ACTION_RESULT.ERROR_NOT_FOUND);

        return new MediatorResultSuccess(template);
    }
}
