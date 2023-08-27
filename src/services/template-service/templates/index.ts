import TEMPLATE_PAGE from './page';
import TEMPLATE_ADMIN from './admin';
import TEMPLATE_AUTH from './auth';
import TEMPLATE_PARTIALS from './partials';

const TEMPLATES = {
    ...TEMPLATE_ADMIN,
    ...TEMPLATE_PAGE,
    ...TEMPLATE_AUTH,
    ...TEMPLATE_PARTIALS,
} as const;

export default TEMPLATES;
