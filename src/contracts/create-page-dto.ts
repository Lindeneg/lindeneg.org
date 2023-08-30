import { z } from 'zod';

const createPageSchema = z.object({
    title: z.string().trim().min(3).max(255),
    slug: z.string().trim().min(1).max(255),
    name: z.string().trim().min(3).max(255),
    description: z.string().trim().min(3).max(255),
    published: z.boolean(),
});

export interface ICreatePageDto extends z.infer<typeof createPageSchema> {}

export default createPageSchema;
