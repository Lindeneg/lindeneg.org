import {
    unwrap,
    loadEnv,
    withRequired,
    withDefault,
    refine,
    toString,
    nonEmpty,
    toEnum,
} from "@lindeneg/cl-env";
import DataService from "../packages/server/src/services/data-service.js";

(async () => {
    const env = unwrap(
        loadEnv(
            {
                files: [],
                optionalFiles: [".env", ".env.default", ".env.local", ".env.test"],
                includeProcessEnv: false,
                transformKeys: false,
            },
            {
                DATABASE_URL: withRequired(refine(toString(), nonEmpty())),
                NODE_ENV: withDefault(toEnum("test", "development", "production"), "development"),
            }
        )
    );

    const db = new DataService(env.DATABASE_URL, env.NODE_ENV);

    const fixes = [
        {slug: "dynamic-steering", createdAt: "2024-06-17T18:01:42.206Z"},
        {slug: "the-maestro", createdAt: "2023-09-11T17:13:28.548Z"},
        {slug: "the-genius", createdAt: "2023-09-09T23:24:10.256Z"},
        {slug: "the-harmonious", createdAt: "2023-09-26T20:41:13.650Z"},
        {slug: "the-current", createdAt: "2023-09-08T21:23:05.128Z"},
    ];

    for (const fix of fixes) {
        await db.p.post.update({
            where: {slug: fix.slug},
            data: {createdAt: new Date(fix.createdAt), updatedAt: new Date(fix.createdAt)},
        });
        console.log(`Updated: ${fix.slug} → ${fix.createdAt}`);
    }

    await db.teardown();
})();
