import { z } from 'zod';
import ALIGNMENT from '@/enums/alignment';

const createNavigationItemSchema = z.object({
    name: z.string().trim().min(3).max(255),
    href: z.string().trim().min(1).max(255),
    navigationId: z.string().uuid(),
    position: z.number().int(),
    alignment: z.enum([ALIGNMENT.LEFT, ALIGNMENT.RIGHT]),
    newTab: z.boolean(),
});

export interface ICreateNavigationItemDto extends z.infer<typeof createNavigationItemSchema> {}

export default createNavigationItemSchema;
