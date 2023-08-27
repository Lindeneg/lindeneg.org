import { z } from 'zod';

const createPageSectionSchema = z.object({
    content: z.string(),
    position: z.number().int(),
    pageId: z.string().uuid(),
    published: z.boolean(),
});

export interface ICreatePageSectionDto extends z.infer<typeof createPageSectionSchema> {}

export default createPageSectionSchema;
