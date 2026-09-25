import type {ValueOf} from "./types.js";

export const AppError = {
    NOT_FOUND: "not_found",
    CONFLICT: "conflict",
    DB_ERROR: "db_error",
    UPLOAD_ERROR: "upload_error",
} as const;

export type AppError = ValueOf<typeof AppError>;

// the subset a repository can fail with, see DataService.run
export type DbError = typeof AppError.NOT_FOUND | typeof AppError.CONFLICT | typeof AppError.DB_ERROR;
