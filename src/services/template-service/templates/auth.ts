import {createHandlebarTemplate} from '@lindeneg/funkallero';
import TEMPLATE_NAME from '@/enums/template-name';

const TEMPLATE_AUTH = {
    [TEMPLATE_NAME.LOGIN]: createHandlebarTemplate<{ isDev: boolean }>({
        path: 'templates/pages/auth/login.hbs',
    }),
} as const;

export default TEMPLATE_AUTH;
