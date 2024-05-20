import { z } from 'zod';

const createClSoftwareMsgSchema = z.object({
    name: z.string().min(1),
    email: z.string().min(1),
    message: z.string().min(1),
});

export interface ICreateClSoftwareMsgDto extends z.infer<typeof createClSoftwareMsgSchema> {}

export default createClSoftwareMsgSchema;
