import { z } from 'zod';

const createBlogPostSchema = z.object({
    content: z.string().min(1),
    title: z.string().min(1).max(255),
    thumbnail: z.string().optional(),
    published: z.boolean(),
});

export interface ICreateBlogPostDto extends z.infer<typeof createBlogPostSchema> {
    userId: string;
}

export default createBlogPostSchema;
