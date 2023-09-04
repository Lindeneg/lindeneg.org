import Handlebars from 'handlebars';
import { Converter } from 'showdown';
import { NavItemAlignment, type Navigation, type NavigationItem, type Page, type PageSection } from '@prisma/client';
import { IConfigurationService, injectService, SingletonService } from '@lindeneg/funkallero';
import SERVICE from '@/enums/service';
import type DataContextService from '@/services/data-context-service';

export interface NavigationWithItems extends Navigation {
    navItems: NavigationItem[];
}

export interface PageWithSections extends Page {
    sections: PageSection[];
}

export interface CachedNavigation {
    brandName: string;
    leftNavEntries: NavigationItem[];
    rightNavEntries: NavigationItem[];
}

export interface CachedPage {
    name: string;
    title: string;
    slug: string;
    description: string;
    sections: Handlebars.SafeString[];
}

interface ICacheEntry<T = any> {
    value: T;
    expires: number;
}

export const md2htmlConverter = new Converter();

class CachingService extends SingletonService {
    @injectService(SERVICE.DATA_CONTEXT)
    private readonly dataContext: DataContextService;

    @injectService(SERVICE.CONFIGURATION)
    private readonly config: IConfigurationService;

    private readonly cache: Map<string, ICacheEntry> = new Map();

    public clearCache() {
        this.cache.clear();
    }

    public async getNavigation(): Promise<CachedNavigation | null> {
        const cached = this.cache.get('navigation');

        if (cached && !this.isExpired(cached)) {
            return cached.value;
        }

        return this.setNavigation();
    }

    public async getPage(key: string): Promise<CachedPage | null> {
        const cached = this.cache.get(key);

        if (cached && !this.isExpired(cached)) {
            return cached.value;
        }

        return this.setPage(key);
    }

    private isExpired(entry: ICacheEntry): boolean {
        return this.config.meta.isDev || entry.expires < this.now();
    }

    private async setNavigation() {
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

        const entry = this.createEntry({
            brandName: navigation.brandName,
            leftNavEntries: leftNavEntries.sort((a, b) => a.position - b.position),
            rightNavEntries: rightNavEntries.sort((a, b) => a.position - b.position),
        });

        this.cache.set('navigation', entry);

        return entry.value;
    }

    private async setPage(slug: string) {
        const page = (await this.dataContext.exec((p) =>
            p.page.findFirst({ where: { slug, published: true }, include: { sections: true } })
        )) as PageWithSections;

        if (!page) return null;

        const entry = this.createEntry({
            name: page.name,
            title: page.title,
            slug: page.slug,
            description: page.description,
            sections: page.sections
                .filter((section) => section.published)
                .sort((a, b) => a.position - b.position)
                .map((section) => new Handlebars.SafeString(md2htmlConverter.makeHtml(section.content))),
        });

        this.cache.set(slug, entry);

        return entry.value;
    }

    private createEntry<T>(value: T): ICacheEntry<T> {
        return {
            value,
            expires: this.now() + 60 * 60 * 24 * 7,
        };
    }

    private now() {
        return Date.now() / 1000;
    }
}

export default CachingService;
