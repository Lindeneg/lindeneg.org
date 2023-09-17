import { createHandlebarTemplate } from '@lindeneg/funkallero';
import TEMPLATE_NAME from '@/enums/template-name';

const TEMPLATE_PARTIALS = {
    [TEMPLATE_NAME.HEAD]: createHandlebarTemplate({
        path: 'templates/partials/head.hbs',
        partial: true,
    }),
    [TEMPLATE_NAME.NAV]: createHandlebarTemplate({
        path: 'templates/partials/nav.hbs',
        partial: true,
    }),
    [TEMPLATE_NAME.NAV_BAR_ENTRIES]: createHandlebarTemplate({
        path: 'templates/partials/nav-bar-entries.hbs',
        partial: true,
    }),
    [TEMPLATE_NAME.FOOTER]: createHandlebarTemplate({
        path: 'templates/partials/footer.hbs',
        partial: true,
    }),
    [TEMPLATE_NAME.ANALYTICS]: createHandlebarTemplate({
        path: 'templates/partials/analytics.hbs',
        partial: true,
    }),
} as const;

export default TEMPLATE_PARTIALS;
