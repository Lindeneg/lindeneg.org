import { z } from 'zod';

const updateNavigationSchema = z.object({
    brandName: z.string().min(1).max(255),
});

export interface IUpdateNavigationDto extends z.infer<typeof updateNavigationSchema> {
    id: string;
}

export default updateNavigationSchema;
