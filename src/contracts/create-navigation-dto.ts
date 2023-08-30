import { z } from 'zod';

const createNavigationSchema = z.object({
    brandName: z.string().min(1).max(255),
});

export interface ICreateNavigationDto extends z.infer<typeof createNavigationSchema> {}

export default createNavigationSchema;
