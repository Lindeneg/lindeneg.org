import { createHandlebarTemplate } from '@lindeneg/funkallero';
import TEMPLATE_NAME from '@/enums/template-name';
import type { SafeString } from 'handlebars';

interface PageNavProps {
    name: string;
    href: string;
    newTab: boolean;
}

interface BaseProps {
    title: string;
    brandName: string;
    leftNavEntries: PageNavProps[];
    rightNavEntries: PageNavProps[];
}

interface PageProps extends BaseProps {
    name: string;
    slug: string;
    description: string;
    markdownSections: SafeString[];
}

interface ThumbPosts {
    title: string;
    href: string;
    dateString: string;
    thumbnail: string;
}

interface BlogProps extends BaseProps {
    blogHref: string;
    thumbPosts: ThumbPosts[];
}

const TEMPLATE_PAGE = {
    [TEMPLATE_NAME.PAGE]: createHandlebarTemplate<PageProps>({
        path: 'templates/pages/page.hbs',
    }),
    [TEMPLATE_NAME.BLOG]: createHandlebarTemplate<BlogProps>({
        path: 'templates/pages/blog.hbs',
    }),
} as const;

export default TEMPLATE_PAGE;
