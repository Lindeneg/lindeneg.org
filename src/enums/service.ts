import { SERVICE as BASE_SERVICE } from '@lindeneg/funkallero';

const SERVICE = {
    ...BASE_SERVICE,
    SUPER_USER: 'SUPER_USER',
    TEMPLATE: 'TEMPLATE',
    COOKIE: 'COOKIE',
    CACHING: 'CACHING',
    CLOUDINARY: 'CLOUDINARY',
} as const;

export default SERVICE;
