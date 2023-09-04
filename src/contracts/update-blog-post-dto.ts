import { z } from 'zod';
import createBlogPostSchema from '@/contracts/create-blog-post-dto';

const updateBlogPostSchema = createBlogPostSchema.partial().superRefine((data, ctx) => {
    if (!data.content && !data.title && !data.thumbnail && typeof data.published === 'undefined') {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['content', 'title', 'thumbnail', 'published', 'newTab'],
            message: 'Please provide at least one field to update',
        });
    }
});

export interface IUpdateBlogPostSchema extends z.infer<typeof updateBlogPostSchema> {
    id: string;
}

export default updateBlogPostSchema;
