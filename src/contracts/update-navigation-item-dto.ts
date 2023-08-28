import { z } from 'zod';
import createNavigationItemSchema from '@/contracts/create-navigation-item-dto';

const updateNavigationItemSchema = createNavigationItemSchema.partial().superRefine((data, ctx) => {
    if (
        !data.name &&
        !data.href &&
        !data.alignment &&
        typeof data.position === 'undefined' &&
        typeof data.newTab === 'undefined'
    ) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['name', 'href', 'alignment', 'position', 'newTab'],
            message: 'Please provide at least one field to update',
        });
    }
});

export interface IUpdateNavigationItemDto extends z.infer<typeof updateNavigationItemSchema> {
    id: string;
}

export default updateNavigationItemSchema;
