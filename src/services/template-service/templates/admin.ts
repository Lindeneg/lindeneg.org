import { createHandlebarTemplate } from '@lindeneg/funkallero';
import TEMPLATE_NAME from '@/enums/template-name';

const TEMPLATE_ADMIN = {
    [TEMPLATE_NAME.ADMIN]: createHandlebarTemplate({
        path: 'templates/pages/admin/index.hbs',
    }),
} as const;

export default TEMPLATE_ADMIN;
