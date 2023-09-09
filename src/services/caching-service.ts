import Handlebars from 'handlebars';
import { Converter } from 'showdown';
import { NavItemAlignment, Post, type NavigationItem } from '@prisma/client';
import { IConfigurationService, injectService, SingletonService } from '@lindeneg/funkallero';
import SERVICE from '@/enums/service';
import TEMPLATE_NAME from '@/enums/template-name';
import type DataContextService from '@/services/data-context-service';
import type TemplateService from './template-service';

interface INavigationCache {
    brandName: string;
    leftNavEntries: NavigationItem[];
    rightNavEntries: NavigationItem[];
}

interface IBlogCache {
    enabled: boolean;
    path: string;
    posts: Post[];
}

interface ICacheEntry<T = any> {
    value: T;
    expires: number;
}

const md2htmlConverter = new Converter();

class CachingService extends SingletonService {
    private static ttl = 60 * 60 * 24 * 2;

    @injectService(SERVICE.DATA_CONTEXT)
    private readonly dataContext: DataContextService;

    @injectService(SERVICE.CONFIGURATION)
    private readonly config: IConfigurationService;

    @injectService(SERVICE.TEMPLATE)
    protected readonly templateService: TemplateService;

    private readonly pageCache: Map<string, ICacheEntry<string>> = new Map();
    private navigationCache: ICacheEntry<INavigationCache> | null = null;
    private blogCache: ICacheEntry<IBlogCache> | null = null;

    public clearCache() {
        this.pageCache.clear();
        this.blogCache = null;
        this.navigationCache = null;
    }

    public async getBlog() {
        if (this.blogCache && !this.isExpired(this.blogCache)) return this.blogCache.value;

        const blog = await this.dataContext.exec((p) =>
            p.blog.findFirst({ include: { posts: { where: { published: true } } } })
        );

        if (!blog) return null;

        this.blogCache = this.createEntry(blog);

        return this.blogCache.value;
    }

    public async getStaticPage(name: 'admin' | 'login') {
        const cached = this.pageCache.get(name);

        if (cached && !this.isExpired(cached)) return cached.value;

        const template = await this.templateService.render(name);

        if (!template) return null;

        this.pageCache.set(name, this.createEntry(template));

        return template;
    }

    public async getBlogOverviewPage() {
        const blog = await this.getBlog();

        if (!blog) return null;

        const cached = this.pageCache.get(blog.path);

        if (cached && !this.isExpired(cached)) return cached.value;

        const navigation = await this.getNavigation();

        const template = await this.templateService.render(TEMPLATE_NAME.BLOG, {
            brandName: navigation?.brandName ?? '',
            metaTitle: 'Lindeneg | Blog',
            metaDescription: 'A blog about music and software and other things',
            blogHref: blog.path,
            thumbPosts: blog.posts
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                .map((e) => ({
                    title: e.title,
                    thumbnail: e.thumbnail,
                    dateString: e.createdAt.toDateString(),
                })),
            leftNavEntries: navigation?.leftNavEntries ?? [],
            rightNavEntries: navigation?.rightNavEntries ?? [],
        });

        if (!template) return null;

        this.pageCache.set(blog.path, this.createEntry(template));

        return template;
    }

    public async getNavigation() {
        if (this.navigationCache && !this.isExpired(this.navigationCache)) return this.navigationCache.value;

        const navigation = (await this.dataContext.exec((p) =>
            p.navigation.findFirst({ include: { navItems: true } })
        )) as NavigationWithItems;

        if (!navigation) return null;

        const [leftNavEntries, rightNavEntries] = navigation.navItems.reduce(
            (acc, item) => {
                if (item.alignment === NavItemAlignment.LEFT) acc[0].push(item);
                else acc[1].push(item);
                return acc;
            },
            [[], []] as [NavigationItem[], NavigationItem[]]
        );

        this.navigationCache = this.createEntry({
            brandName: navigation.brandName,
            leftNavEntries: leftNavEntries.sort((a, b) => a.position - b.position),
            rightNavEntries: rightNavEntries.sort((a, b) => a.position - b.position),
        });

        return this.navigationCache.value;
    }

    public async getPage(slug: string) {
        const cached = this.pageCache.get(slug);

        if (cached && !this.isExpired(cached)) return cached.value;

        const page = (await this.dataContext.exec((p) =>
            p.page.findFirst({ where: { slug, published: true }, include: { sections: true } })
        )) as PageWithSections;

        if (!page) return null;

        const navigation = await this.getNavigation();

        const template = await this.templateService.render(TEMPLATE_NAME.PAGE, {
            name: page.name,
            slug: page.slug,
            brandName: navigation?.brandName ?? '',
            title: page.title,
            description: page.description,
            markdownSections: page.sections
                .filter((section) => section.published)
                .sort((a, b) => a.position - b.position)
                .map((section) => new Handlebars.SafeString(md2htmlConverter.makeHtml(section.content))),
            leftNavEntries: navigation?.leftNavEntries ?? [],
            rightNavEntries: navigation?.rightNavEntries ?? [],
        });

        if (!template) return null;

        this.pageCache.set(slug, this.createEntry(template));

        return template;
    }

    public async getBlogPostPage(blogName: string, blogPath: string) {
        const key = `${blogName}/${blogPath}`;
        const cached = this.pageCache.get(key);

        if (cached && !this.isExpired(cached)) return cached.value;

        const blog = await this.dataContext.exec((p) =>
            p.blog.findFirst({
                where: { enabled: true },
                select: {
                    path: true,
                    user: { select: { firstname: true, lastname: true, photo: true } },
                    posts: { where: { published: true, name: blogName } },
                },
            })
        );

        if (blog?.path !== '/' + blogPath || !blog.posts.length || !blog.user.length) {
            return null;
        }

        const user = blog.user[0];
        const post = blog.posts[0];
        const navigation = await this.getNavigation();

        const template = await this.templateService.render(TEMPLATE_NAME.BLOG_POST, {
            brandName: navigation?.brandName ?? '',
            blogHref: blog.path,
            leftNavEntries: navigation?.leftNavEntries ?? [],
            rightNavEntries: navigation?.rightNavEntries ?? [],
            blogTitle: post.title,
            blogMetaTitle: 'Lindeneg | Blog | ' + post.title,
            blogMetaDescription: `Article '${post.title}' by ${user.firstname}`,
            authorName: `${this.capitalize(user.firstname)} ${this.capitalize(user.lastname)}`,
            authorImage: user.photo,
            dateString: post.createdAt.toDateString(),
            markdown: new Handlebars.SafeString(md2htmlConverter.makeHtml(post.content)),
        });

        if (!template) return null;

        this.pageCache.set(key, this.createEntry(template));

        return template;
    }

    private capitalize(str: string) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    private isExpired(entry: ICacheEntry): boolean {
        return this.config.meta.isDev || entry.expires < this.now();
    }

    private createEntry<T>(value: T): ICacheEntry<T> {
        return {
            value,
            expires: this.now() + CachingService.ttl,
        };
    }

    private now() {
        return Date.now() / 1000;
    }
}

export default CachingService;
