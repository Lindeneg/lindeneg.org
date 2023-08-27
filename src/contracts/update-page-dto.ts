import { z } from 'zod';

const updatePageSchema = z
    .object({
        title: z.string().trim().min(3).max(255),
        slug: z.string().trim().min(3).max(255),
        name: z.string().trim().min(3).max(255),
        description: z.string().trim().min(3).max(255),
        published: z.boolean(),
    })
    .partial()
    .superRefine((data, ctx) => {
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
