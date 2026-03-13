export type ResultSuccess<TData> = {
    data: TData;
    ok: true;
};

export interface ResultFailure<TCtx> {
    ctx: TCtx;
    ok: false;
}

export type Result<TData, TErrorCtx = string> = ResultSuccess<TData> | ResultFailure<TErrorCtx>;

export type EmptyResult<TErrorCtx = string> = Result<void, TErrorCtx>;

export function success<TData>(data: TData): ResultSuccess<TData> {
    return {data, ok: true};
}

export function emptySuccess(): ResultSuccess<void> {
    return {data: undefined, ok: true};
}

export function failure<TCtx>(ctx: TCtx): ResultFailure<TCtx> {
    return {ok: false, ctx};
}

export function unwrap<T extends Result<any, any>>(
    r: T
): [T] extends [Result<infer TData, any>] ? TData : never {
    if (!r.ok) throw new Error(r.ctx);
    return r.data;
}
