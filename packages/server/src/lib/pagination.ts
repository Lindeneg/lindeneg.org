import type { Request } from 'express';
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  type PaginationParams,
  type Paginated,
} from '@lindeneg/shared';

export function parsePagination(req: Request): PaginationParams {
  const page = Math.max(1, parseInt(req.query.page as string) || DEFAULT_PAGE);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(req.query.pageSize as string) || DEFAULT_PAGE_SIZE)
  );
  return { page, pageSize };
}

export type SkipTake = { skip: number; take: number };

export type PaginatedResult<T> = { data: T[]; total: number };

export function toSkipTake(params: PaginationParams): SkipTake {
  return {
    skip: (params.page - 1) * params.pageSize,
    take: params.pageSize,
  };
}

export function paginate<T>(data: T[], total: number, params: PaginationParams): Paginated<T> {
  return {
    data,
    total,
    page: params.page,
    pageSize: params.pageSize,
    totalPages: Math.ceil(total / params.pageSize),
  };
}
