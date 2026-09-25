import {PrismaBetterSqlite3} from "@prisma/adapter-better-sqlite3";
import {PrismaClient} from "../src/generated/prisma/client.js";
import {loadDatabaseEnv} from "../src/lib/env.js";

(async () => {
    const env = loadDatabaseEnv();

    const adapter = new PrismaBetterSqlite3({
        url: env.DATABASE_URL,
    });
    const prisma = new PrismaClient({adapter});

    // the home page's title is used as written; other titles end in the brand, e.g. "Blog — Lindeneg"
    const home = {
        title: "Christian Lindeneg — Code, Sailing and Jazz",
        description:
            "Christian Lindeneg, a Dane in Copenhagen who loves management, coding, sailing and music. Open source projects and a blog on programming, management and jazz.",
    };
    const brandName = "Lindeneg";

    const page = await prisma.page.findUnique({where: {slug: "home"}});
    if (page) {
        await prisma.page.update({where: {id: page.id}, data: home});
        console.log(`Updated: home page → "${home.title}"`);
    } else {
        console.log("Skipped: home page (not found)");
    }

    const nav = await prisma.navigation.findFirst();
    if (nav) {
        await prisma.navigation.update({where: {id: nav.id}, data: {brandName}});
        console.log(`Updated: brand → "${brandName}"`);
    } else {
        console.log("Skipped: brand (no navigation)");
    }
})();
