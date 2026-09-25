import {PrismaBetterSqlite3} from "@prisma/adapter-better-sqlite3";
import {PrismaClient} from "../src/generated/prisma/client.js";
import {loadDatabaseEnv} from "../src/lib/env.js";

(async () => {
    const env = loadDatabaseEnv();

    const adapter = new PrismaBetterSqlite3({
        url: env.DATABASE_URL,
    });
    const prisma = new PrismaClient({adapter});

    // tag names must already be normalized (lowercase, dash-separated), as PostService stores them
    const fixes = [
        {slug: "the-maestro", tags: ["music", "jazz"]},
        {slug: "the-genius", tags: ["music", "jazz"]},
        {slug: "the-harmonious", tags: ["music", "jazz"]},
        {slug: "the-current", tags: ["music", "jazz"]},
        {slug: "dynamic-steering", tags: ["management"]},
        {slug: "part-1-explicit-failure", tags: ["programming", "typescript"]},
        {slug: "part-2-happy-cats", tags: ["programming", "typescript"]},
        {slug: "the-beautiful-game", tags: ["sports", "football"]},
    ];

    for (const fix of fixes) {
        const post = await prisma.post.findUnique({where: {slug: fix.slug}});
        if (!post) {
            console.log(`Skipped: ${fix.slug} (not found)`);
            continue;
        }
        await prisma.$transaction(async (tx) => {
            for (const name of fix.tags) {
                await tx.tag.upsert({where: {name}, create: {name}, update: {}});
            }
            await tx.post.update({
                where: {id: post.id},
                data: {tags: {set: fix.tags.map((name) => ({name}))}},
            });
        });
        console.log(`Updated: ${fix.slug} → ${fix.tags.join(", ")}`);
    }

    const removed = await prisma.tag.deleteMany({where: {posts: {none: {}}}});
    console.log(`Removed ${removed.count} unused tag(s)`);
})();
