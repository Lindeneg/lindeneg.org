import type {Request} from "express";

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export interface PaginationParams {
    page: number;
    pageSize: number;
}

export interface Paginated<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export type SkipTake = {skip: number; take: number};

export type PaginatedResult<T> = {data: T[]; total: number};

export function parsePagination(req: Request): PaginationParams {
    const page = Math.max(1, parseInt(req.query.page as string) || DEFAULT_PAGE);
    const pageSize = Math.min(
        MAX_PAGE_SIZE,
        Math.max(1, parseInt(req.query.pageSize as string) || DEFAULT_PAGE_SIZE)
    );
    return {page, pageSize};
}

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
