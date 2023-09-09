import { createHandlebarTemplate } from '@lindeneg/funkallero';
import TEMPLATE_NAME from '@/enums/template-name';
import type { SafeString } from 'handlebars';

interface PageNavProps {
    name: string;
    href: string;
    newTab: boolean;
}

interface BaseProps {
    brandName: string;
    leftNavEntries: PageNavProps[];
    rightNavEntries: PageNavProps[];
}

interface PageProps extends BaseProps {
    name: string;
    title: string;
    slug: string;
    description: string;
    markdownSections: SafeString[];
}

interface ThumbPosts {
    title: string;
    dateString: string;
    thumbnail: string;
}

interface BlogProps extends BaseProps {
    blogHref: string;
    metaTitle: string;
    metaDescription: string;
    thumbPosts: ThumbPosts[] | null;
}

interface BlogPostProps extends BaseProps {
    blogHref: string;
    blogTitle: string;
    blogMetaTitle: string;
    blogMetaDescription: string;
    authorImage: string | null;
    authorName: string;
    dateString: string;
    markdown: SafeString;
}

const TEMPLATE_PAGE = {
    [TEMPLATE_NAME.PAGE]: createHandlebarTemplate<PageProps>({
        path: 'templates/pages/page.hbs',
    }),
    [TEMPLATE_NAME.BLOG]: createHandlebarTemplate<BlogProps>({
        path: 'templates/pages/blog.hbs',
    }),
    [TEMPLATE_NAME.BLOG_POST]: createHandlebarTemplate<BlogPostProps>({
        path: 'templates/pages/blog-post.hbs',
    }),
} as const;

export default TEMPLATE_PAGE;
