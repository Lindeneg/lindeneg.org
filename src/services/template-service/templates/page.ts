import { createHandlebarTemplate } from '@lindeneg/funkallero';
import TEMPLATE_NAME from '@/enums/template-name';
import type { SafeString } from 'handlebars';

interface PageNavProps {
    name: string;
    href: string;
    newTab: boolean;
}

interface PageProps {
    name: string;
    brandName: string;
    title: string;
    description: string;
    markdownSections: SafeString[];
    leftNavEntries?: PageNavProps[];
    rightNavEntries?: PageNavProps[];
}

const TEMPLATE_PAGE = {
    [TEMPLATE_NAME.PAGE]: createHandlebarTemplate<PageProps>({
        path: 'templates/pages/page.hbs',
    }),
} as const;

export default TEMPLATE_PAGE;
