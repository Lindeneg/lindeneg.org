import z from 'zod';
import { success, failure, type Result } from '@lindeneg/shared';
import { HttpException } from '../lib/http-exception.js';

const DEFAULT_PARSE_ERROR = 'An error occurred.';

export async function parseRequestObj<TSchema extends z.core.$ZodType>(
  obj: unknown,
  schema: TSchema
): Promise<Result<z.core.output<TSchema>, HttpException>> {
  const parsed = z.safeParse(schema, obj);
  if (!parsed.success) {
    const treeifiedError = z.treeifyError(parsed.error);
    let err: unknown = DEFAULT_PARSE_ERROR;
    if ('properties' in treeifiedError && treeifiedError.properties !== undefined) {
      err = { ...treeifiedError.properties };
    }
    return failure(HttpException.malformedBody(err));
  }
  return success(parsed.data);
}
