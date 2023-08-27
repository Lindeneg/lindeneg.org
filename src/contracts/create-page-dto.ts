import { z } from 'zod';

const createPageSchema = z.object({
    title: z.string().min(3).max(255),
    slug: z.string().min(3).max(255),
    name: z.string().min(3).max(255),
    description: z.string().min(3).max(255),
    published: z.boolean(),
});

export interface ICreatePageDto extends z.infer<typeof createPageSchema> {}

export default createPageSchema;
