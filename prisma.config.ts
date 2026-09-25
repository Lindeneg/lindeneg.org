import {defineConfig} from "prisma/config";
import {unwrap, loadEnv, withRequired, toString, refine, nonEmpty} from "@lindeneg/cl-env";

// mirrors envFiles() in src/lib/env.ts
const envFiles = process.env.NODE_ENV === "test" ? [".env.test"] : [".env", ".env.default", ".env.local", ".env.prod"];

const env = unwrap(
    loadEnv(
        {
            files: [],
            optionalFiles: envFiles,
            includeProcessEnv: false,
            transformKeys: false,
        },
        {
            DATABASE_URL: withRequired(refine(toString(), nonEmpty())),
        }
    )
);

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
    },
    datasource: {
        url: env.DATABASE_URL,
    },
});
