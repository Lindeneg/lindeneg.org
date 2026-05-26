export type MaybeNull<T> = T | null;

type NullableToOptional<T> = {
    [K in keyof T as null extends T[K] ? never : K]: T[K];
} & {
    [K in keyof T as null extends T[K] ? K : never]?: Exclude<T[K], null>;
};

export type RawModelBase<T extends Record<"id", string | number>> = Omit<
    T,
    "id" | "updatedAt" | "createdAt"
>;

export type RawModel<T extends Record<"id", string | number>> = NullableToOptional<RawModelBase<T>>;

export type NodeEnv = "test" | "development" | "production";
