import { z } from 'zod';
import createPageSchema from '@/contracts/create-page-dto';

const updatePageSchema = createPageSchema.partial().superRefine((data, ctx) => {
    if (!data.title && !data.slug && !data.name && !data.description && typeof data.published === 'undefined') {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['title', 'slug', 'name', 'description', 'published'],
            message: 'Please provide at least one field to update',
        });
    }
});

export interface IUpdatePageDto extends z.infer<typeof updatePageSchema> {
    id: string;
}

export default updatePageSchema;
