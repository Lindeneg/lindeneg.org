import {
    unwrap,
    loadEnv,
    toString,
    toInt,
    toStringArray,
    toEnum,
    withRequired,
    withDefault,
    failure,
    success,
    refine,
    nonEmpty,
    inRange,
    withOptional,
} from "@lindeneg/cl-env";

export function isInTestMode(): boolean {
    return process.env.NODE_ENV === "test";
}

export function envFiles(): string[] {
    return isInTestMode() ? [".env.test"] : [".env", ".env.default", ".env.local", ".env.prod"];
}

export function loadAppEnv() {
    return unwrap(
        loadEnv(
            {
                files: [],
                optionalFiles: envFiles(),
                transformKeys: false,
                logger: true,
            },
            {
                DATABASE_URL: withRequired(refine(toString(), nonEmpty())),
                JWT_SECRET: withRequired(toString()),
                JWT_EXPIRE_MS: withRequired(toInt()),
                CLOUDINARY_NAME: withRequired(refine(toString(), nonEmpty())),
                CLOUDINARY_KEY: withRequired(refine(toString(), nonEmpty())),
                CLOUDINARY_SECRET: withRequired(refine(toString(), nonEmpty())),
                PORT: withRequired(toInt()),

                ORIGINS: withDefault(toStringArray(), []),
                JWT_COOKIE_NAME: withDefault(toString(), "lindeneg-org-auth"),
                JWT_SALT_ROUNDS: withDefault(refine(toInt(), inRange(4, 12)), 6),
                NODE_ENV: withDefault(toEnum("test", "development", "production"), "development"),

                PUBLIC_STATIC_ROOT: withOptional(toString()),

                SUPER_USER: function (_, value) {
                    if (value === undefined) return success(undefined);
                    const splitted = value.split(",");
                    if (splitted.length !== 4) return failure("must have exactly 4 values");
                    return success({
                        email: splitted[0],
                        name: splitted[1] + " " + splitted[2],
                        password: splitted[3],
                    });
                },
            }
        )
    );
}

export type AppEnv = ReturnType<typeof loadAppEnv>;
