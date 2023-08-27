import { z } from 'zod';
import createPageSectionSchema from '@/contracts/create-page-section-dto';

const updatePageSectionSchema = createPageSectionSchema.partial().superRefine((data, ctx) => {
    if (!data.content && typeof data.published === 'undefined' && typeof data.published === 'undefined') {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['content', 'position', 'published'],
            message: 'Please provide at least one field to update',
        });
    }
});

export interface IUpdatePageSectionDto extends z.infer<typeof updatePageSectionSchema> {
    id: string;
}

export default updatePageSectionSchema;
