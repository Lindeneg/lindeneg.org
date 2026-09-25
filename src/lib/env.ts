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
    minLength,
    inRange,
    withOptional,
} from "@lindeneg/cl-env";

export function isInTestMode(): boolean {
    return process.env.NODE_ENV === "test";
}

export function envFiles(): string[] {
    return isInTestMode() ? [".env.test"] : [".env", ".env.default", ".env.local", ".env.prod"];
}

// email,firstname,lastname,password; everything after the third comma is the password, so it may contain commas
export function parseSuperUser(value: string) {
    const [email, firstName, lastName, ...rest] = value.split(",");
    const password = rest.join(",");
    if (!email || !firstName || !lastName || !password) {
        return failure("must be email,firstname,lastname,password");
    }
    // bcrypt only uses the first 72 bytes of a password, and a letter like æ is 2 of them
    if (Buffer.byteLength(password, "utf8") > 72) {
        return failure("Use at most 72 bytes (letters like æøå count as 2)");
    }
    return success({email, name: `${firstName} ${lastName}`, password});
}

// SUPER_USER may be left out; when it's set it has to parse
function optionalSuperUser(_: string, value: string | undefined) {
    if (value === undefined) return success(undefined);
    return parseSuperUser(value);
}

// process.env wins over the files, so the server's environment can override an env file
const options = {
    files: [] as string[],
    optionalFiles: envFiles(),
    includeProcessEnv: "override" as const,
    transformKeys: false as const,
};

export function loadAppEnv() {
    return unwrap(
        loadEnv(
            {...options, logger: true},
            {
                DATABASE_URL: withRequired(refine(toString(), nonEmpty())),
                JWT_SECRET: withRequired(refine(toString(), minLength(32))),
                JWT_EXPIRE_MS: withRequired(toInt()),
                CLOUDINARY_NAME: withRequired(refine(toString(), nonEmpty())),
                CLOUDINARY_KEY: withRequired(refine(toString(), nonEmpty())),
                CLOUDINARY_SECRET: withRequired(refine(toString(), nonEmpty())),
                PORT: withRequired(toInt()),
                NODE_ENV: withRequired(toEnum("test", "development", "production")),

                ORIGINS: withDefault(toStringArray(), []),
                JWT_COOKIE_NAME: withDefault(toString(), "lindeneg-org-auth"),
                BCRYPT_ROUNDS: withDefault(refine(toInt(), inRange(4, 12)), 12),

                PUBLIC_STATIC_ROOT: withOptional(toString()),
                LOG_LEVEL: withOptional(toEnum("fatal", "error", "warn", "info", "debug", "trace", "silent")),

                // express "trust proxy": a hop count ("1") or addresses/presets ("loopback, uniquelocal"); loopback
                // by default, so nginx on the same host passes the client ip, and without a proxy nothing is trusted
                TRUST_PROXY: function (_, value) {
                    if (value === undefined || value.trim() === "") return success("loopback");
                    return success(/^\d+$/.test(value) ? Number(value) : value);
                },

                SUPER_USER: optionalSuperUser,
            }
        )
    );
}

export type AppEnv = ReturnType<typeof loadAppEnv>;

// for scripts that only talk to the database
export function loadDatabaseEnv() {
    return unwrap(
        loadEnv(options, {
            DATABASE_URL: withRequired(refine(toString(), nonEmpty())),
            SUPER_USER: optionalSuperUser,
        })
    );
}
