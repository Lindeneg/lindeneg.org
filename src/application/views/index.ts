import Handlebars from 'handlebars';
import { ACTION_RESULT, MediatorResultSuccess, MediatorResultFailure, injectService } from '@lindeneg/funkallero';
import BaseAction from '../base-action';
import SERVICE from '@/enums/service';
import TEMPLATE_NAME from '@/enums/template-name';
import type TemplateService from '@/services/template-service';
import type CachingService from '@/services/caching-service';
import { Blog, Post } from '@prisma/client';
import { CachedNavigation, md2htmlConverter } from '@/services/caching-service';

abstract class BaseViewAction extends BaseAction {
    @injectService(SERVICE.TEMPLATE)
    protected readonly templateService: TemplateService;
}

export class GetPage extends BaseViewAction {
    @injectService(SERVICE.CACHING)
    protected readonly cachingService: CachingService;

    public async execute({ name }: Record<'name', string>) {
        const navigation = await this.cachingService.getNavigation();

        // TODO cache
        const blog = await this.dataContext.exec((p) =>
            p.blog.findFirst({ include: { posts: { where: { published: true } } } })
        );

        if (blog?.enabled && blog.path && name.includes(blog.path)) return this.handleBlogOverview(blog, navigation);

        const page = await this.cachingService.getPage(name);

        if (!page) return new MediatorResultFailure(ACTION_RESULT.ERROR_NOT_FOUND);

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

    private async handleBlogOverview(blog: Blog & { posts: Post[] }, navigation: CachedNavigation | null) {
        const posts = blog.posts.map((e) => ({
            title: e.title,
            thumbnail: e.thumbnail,
            dateString: e.createdAt.toLocaleDateString(),
        }));

        const template = await this.templateService.render(TEMPLATE_NAME.BLOG, {
            brandName: navigation?.brandName ?? '',
            blogHref: blog.path,
            thumbPosts: posts.length ? posts : null,
            leftNavEntries: navigation?.leftNavEntries ?? [],
            rightNavEntries: navigation?.rightNavEntries ?? [],
        });

        if (!template) return new MediatorResultFailure(ACTION_RESULT.ERROR_NOT_FOUND);

        return new MediatorResultSuccess(template);
    }
}

export class GetBlogPage extends BaseViewAction {
    @injectService(SERVICE.CACHING)
    protected readonly cachingService: CachingService;

    public async execute({ blogName, blogPath }: Record<'blogName' | 'blogPath', string>) {
        const navigation = await this.cachingService.getNavigation();

        // TODO cache
        const blog = await this.dataContext.exec((p) =>
            p.blog.findFirst({
                where: { enabled: true },
                select: {
                    path: true,
                    user: { select: { name: true, photo: true } },
                    posts: { where: { published: true, name: blogName } },
                },
            })
        );

        console.log({ blogPath, blog, user: blog?.user });

        if (blog?.path !== '/' + blogPath || !blog.posts.length || !blog.user.length) {
            return new MediatorResultFailure(ACTION_RESULT.ERROR_NOT_FOUND);
        }

        const user = blog.user[0];
        const post = blog.posts[0];

        // TODO cache
        const template = await this.templateService.render(TEMPLATE_NAME.BLOG_POST, {
            brandName: navigation?.brandName ?? '',
            blogHref: blog.path,
            leftNavEntries: navigation?.leftNavEntries ?? [],
            rightNavEntries: navigation?.rightNavEntries ?? [],
            blogTitle: post.title,
            authorName: user.name,
            authorImage: user.photo,
            dateString: post.createdAt.toLocaleDateString(),
            markdown: new Handlebars.SafeString(md2htmlConverter.makeHtml(post.content)),
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
