import {PrismaBetterSqlite3} from "@prisma/adapter-better-sqlite3";
import {PrismaClient} from "../src/generated/prisma/client.js";
import {loadDatabaseEnv} from "../src/lib/env.js";

(async () => {
    const env = loadDatabaseEnv();

    const adapter = new PrismaBetterSqlite3({
        url: env.DATABASE_URL,
    });
    const prisma = new PrismaClient({adapter});

    const fixes = [
        {slug: "dynamic-steering", createdAt: "2024-06-04T18:01:42.206Z"},
        {slug: "the-maestro", createdAt: "2022-02-03T17:13:28.548Z"},
        {slug: "the-genius", createdAt: "2022-03-03T23:24:10.256Z"},
        {slug: "the-harmonious", createdAt: "2023-09-17T20:41:13.650Z"},
        {slug: "the-current", createdAt: "2022-03-06T21:23:05.128Z"},
    ];

    // publishedAt is the date the site shows, so it gets the original date too
    for (const fix of fixes) {
        const date = new Date(fix.createdAt);
        await prisma.post.update({
            where: {slug: fix.slug},
            data: {createdAt: date, updatedAt: date, publishedAt: date},
        });
        console.log(`Updated: ${fix.slug} → ${fix.createdAt}`);
    }
})();
