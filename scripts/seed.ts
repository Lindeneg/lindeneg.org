import {
    unwrap,
    success,
    failure,
    loadEnv,
    withRequired,
    refine,
    toString,
    nonEmpty,
} from "@lindeneg/cl-env";
import {PrismaBetterSqlite3} from "@prisma/adapter-better-sqlite3";
import {PrismaClient} from "@prisma/client";
import {randomUUID} from "crypto";
import {hash} from "bcrypt";

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

                SUPER_USER: function (_, value) {
                    if (value === undefined) return failure("must have SUPER_USER in environment");
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

    const adapter = new PrismaBetterSqlite3({url: env.DATABASE_URL});
    const prisma = new PrismaClient({adapter});

    const {name, email, password} = env.SUPER_USER;

    // Create a seed user
    const userId = randomUUID();
    const hashedPassword = await hash(password, 6);

    await prisma.user.upsert({
        where: {email},
        update: {},
        create: {
            id: userId,
            email,
            name,
            password: hashedPassword,
            role: "ADMIN",
        },
    });

    // Pages (25) - these also serve as nav targets
    const pageTopics = [
        {name: "About", title: "About Us", desc: "Learn more about who we are and what we do."},
        {name: "Contact", title: "Get in Touch", desc: "Reach out to us for any inquiries."},
        {name: "Portfolio", title: "Our Work", desc: "A showcase of our recent projects."},
        {name: "Services", title: "What We Offer", desc: "Our range of professional services."},
        {name: "Pricing", title: "Plans & Pricing", desc: "Find the right plan for your needs."},
        {name: "FAQ", title: "Frequently Asked Questions", desc: "Common questions answered."},
        {name: "Team", title: "Meet the Team", desc: "The people behind the work."},
        {name: "Careers", title: "Join Us", desc: "Current job openings and opportunities."},
        {name: "Privacy Policy", title: "Privacy Policy", desc: "How we handle your data."},
        {name: "Terms of Service", title: "Terms of Service", desc: "Our terms and conditions."},
        {name: "Blog Landing", title: "Our Blog", desc: "Thoughts, tutorials, and updates."},
        {name: "Case Studies", title: "Case Studies", desc: "In-depth looks at our projects."},
        {name: "Testimonials", title: "What People Say", desc: "Feedback from our clients."},
        {name: "Partners", title: "Our Partners", desc: "Organizations we collaborate with."},
        {name: "Events", title: "Upcoming Events", desc: "Conferences and meetups."},
        {name: "Resources", title: "Resources", desc: "Guides, tools, and downloads."},
        {name: "Support", title: "Support Center", desc: "Get help with our products."},
        {name: "Changelog", title: "Changelog", desc: "Recent updates and improvements."},
        {name: "Roadmap", title: "Product Roadmap", desc: "What we are working on next."},
        {
            name: "Documentation",
            title: "Documentation",
            desc: "Technical documentation and guides.",
        },
        {name: "API Reference", title: "API Reference", desc: "Endpoints and usage examples."},
        {name: "Status", title: "System Status", desc: "Current uptime and incidents."},
        {name: "Newsletter", title: "Newsletter", desc: "Subscribe for updates."},
        {name: "Legal", title: "Legal Information", desc: "Legal notices and disclaimers."},
        {
            name: "Accessibility",
            title: "Accessibility Statement",
            desc: "Our commitment to accessibility.",
        },
    ];

    const slugify = (s: string) =>
        s
            .toLowerCase()
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-");

    for (let i = 0; i < pageTopics.length; i++) {
        const topic = pageTopics[i];
        const pageId = randomUUID();
        const published = i < 20; // last 5 unpublished

        await prisma.page.create({
            data: {
                id: pageId,
                name: topic.name,
                slug: slugify(topic.name),
                title: topic.title,
                description: topic.desc,
                published,
                createdAt: daysAgo(pageTopics.length - i),
                updatedAt: daysAgo(Math.max(0, pageTopics.length - i - 3)),
                sections: {
                    create: Array.from({length: 2 + (i % 4)}, (_, si) => ({
                        content: sectionContent(topic.name, si),
                        position: si,
                        published: si < 2 + (i % 3), // most published, some not
                        createdAt: daysAgo(pageTopics.length - i),
                        updatedAt: daysAgo(Math.max(0, pageTopics.length - i - 1)),
                    })),
                },
            },
        });
    }
    console.log(`Created ${pageTopics.length} pages with sections`);

    // Navigation with many items across both sides, linking to pages
    const navId = randomUUID();
    await prisma.navigation.create({
        data: {
            id: navId,
            brandName: "Seed Site",
            items: {
                create: [
                    // LEFT items
                    {name: "Home", href: "/", position: 0, alignment: "LEFT"},
                    {name: "Blog", href: "/blog", position: 1, alignment: "LEFT"},
                    {name: "About", href: "/about", position: 2, alignment: "LEFT"},
                    {name: "Portfolio", href: "/portfolio", position: 3, alignment: "LEFT"},
                    {name: "Services", href: "/services", position: 4, alignment: "LEFT"},
                    {name: "Team", href: "/team", position: 5, alignment: "LEFT"},
                    {name: "Case Studies", href: "/case-studies", position: 6, alignment: "LEFT"},
                    {name: "Events", href: "/events", position: 7, alignment: "LEFT"},
                    // RIGHT items
                    {name: "Contact", href: "/contact", position: 0, alignment: "RIGHT"},
                    {name: "FAQ", href: "/faq", position: 1, alignment: "RIGHT"},
                    {name: "Pricing", href: "/pricing", position: 2, alignment: "RIGHT"},
                    {name: "Careers", href: "/careers", position: 3, alignment: "RIGHT"},
                    {name: "Resources", href: "/resources", position: 4, alignment: "RIGHT"},
                    {name: "Support", href: "/support", position: 5, alignment: "RIGHT"},
                    {name: "Docs", href: "/documentation", position: 6, alignment: "RIGHT"},
                    {
                        name: "GitHub",
                        href: "https://github.com",
                        position: 7,
                        alignment: "RIGHT",
                        newTab: true,
                    },
                ],
            },
        },
    });
    console.log("Created navigation with 16 items (8 left, 8 right)");

    // Blog posts (40)
    const postTitles = [
        "Getting Started with TypeScript",
        "Understanding React Hooks",
        "Building REST APIs with Express",
        "A Guide to Prisma ORM",
        "CSS Grid vs Flexbox",
        "Authentication Patterns in Node.js",
        "Introduction to Docker",
        "Testing Strategies for Web Apps",
        "State Management in React",
        "PostgreSQL vs SQLite",
        "Deploying with GitHub Actions",
        "Web Performance Optimization",
        "Accessible Web Design",
        "GraphQL vs REST",
        "Migrating to ESM",
        "Error Handling Best Practices",
        "Caching Strategies",
        "WebSocket Real-Time Apps",
        "Monorepo Setup with npm Workspaces",
        "Writing Clean Code",
        "Database Indexing Explained",
        "Responsive Design in 2024",
        "Server-Side Rendering Demystified",
        "Security Headers Every Site Needs",
        "Continuous Integration Pipelines",
        "Working with Markdown",
        "Environment Variable Management",
        "Logging and Observability",
        "Rate Limiting and Throttling",
        "File Upload Handling",
        "Pagination Done Right",
        "Role-Based Access Control",
        "Building a CLI Tool in Node",
        "Understanding CORS",
        "Browser DevTools Tips",
        "Git Workflow Strategies",
        "API Versioning Approaches",
        "Dark Mode Implementation",
        "Form Validation Patterns",
        "The Art of Code Review",
    ];

    for (let i = 0; i < postTitles.length; i++) {
        const title = postTitles[i];
        const published = i < 32; // last 8 drafts

        await prisma.post.create({
            data: {
                title,
                slug: slugify(title),
                content: postContent(title, i),
                published,
                thumbnail: `https://picsum.photos/seed/${slugify(title)}/800/400`,
                thumbnailId: "",
                authorId: userId,
                createdAt: daysAgo(postTitles.length - i),
                updatedAt: daysAgo(Math.max(0, postTitles.length - i - 2)),
            },
        });
    }
    console.log(`Created ${postTitles.length} blog posts`);

    // Contact messages (50)
    const names = [
        "Alice",
        "Bob",
        "Charlie",
        "Diana",
        "Eve",
        "Frank",
        "Grace",
        "Hank",
        "Ivy",
        "Jack",
    ];
    const domains = ["gmail.com", "outlook.com", "company.co", "example.org", "test.dev"];
    const subjects = [
        "Love the new blog design!",
        "Question about your services",
        "Interested in collaboration",
        "Found a bug on the contact page",
        "Can I repost your article?",
        "Speaking engagement inquiry",
        "Partnership proposal",
        "Feedback on the portfolio section",
        "Job application follow-up",
        "Just wanted to say thanks",
        "Issue with page loading speed",
        "Request for a consultation",
        "Newsletter subscription issue",
        "Accessibility concern on mobile",
        "General inquiry",
    ];

    for (let i = 0; i < 50; i++) {
        const name = names[i % names.length];
        const domain = domains[i % domains.length];
        const subject = subjects[i % subjects.length];

        await prisma.contactMessage.create({
            data: {
                name: `${name} ${String.fromCharCode(65 + (i % 26))}`,
                email: `${name.toLowerCase()}${i}@${domain}`,
                message: `${subject}\n\nHi there,\n\nI wanted to reach out regarding the above. ${loremSentences(2 + (i % 3))}\n\nBest regards,\n${name}`,
                read: i < 15, // first 15 read, rest unread
                createdAt: daysAgo(50 - i),
            },
        });
    }
    console.log("Created 50 contact messages");

    await prisma.$disconnect();
    console.log("Done.");
})();

function daysAgo(n: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
}

function loremSentences(n: number): string {
    const sentences = [
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
        "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum.",
        "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia.",
        "Curabitur pretium tincidunt lacus, nec facilisis nulla vehicula at.",
        "Maecenas sed diam eget risus varius blandit sit amet non magna.",
    ];
    return Array.from({length: n}, (_, i) => sentences[i % sentences.length]).join(" ");
}

function sectionContent(pageName: string, index: number): string {
    const intros = [
        `## Welcome to ${pageName}\n\nThis is the introductory section. ${loremSentences(3)}`,
        `## More about ${pageName}\n\n${loremSentences(4)}\n\n### Key Points\n\n- First important point\n- Second important point\n- Third important point`,
        `## Details\n\n${loremSentences(3)}\n\n> A relevant quote about ${pageName.toLowerCase()} that provides additional context.`,
        `## Additional Information\n\n${loremSentences(2)}\n\n| Feature | Status |\n|---------|--------|\n| Alpha | Complete |\n| Beta | In Progress |\n| Release | Planned |`,
        `## Resources\n\n${loremSentences(2)}\n\n1. First resource item\n2. Second resource item\n3. Third resource item`,
    ];
    return intros[index % intros.length];
}

function postContent(title: string, index: number): string {
    const depth = 3 + (index % 4);
    const parts = [`# ${title}\n\n${loremSentences(3)}`];

    for (let i = 0; i < depth; i++) {
        parts.push(`## Section ${i + 1}\n\n${loremSentences(3 + (i % 2))}`);
        if (i % 2 === 0) {
            parts.push(
                '```typescript\nconst example = {\n  key: "value",\n  count: 42,\n};\nconsole.log(example);\n```'
            );
        }
        if (i % 3 === 0) {
            parts.push(`### Subsection\n\n- Point A\n- Point B\n- Point C\n\n${loremSentences(2)}`);
        }
    }

    return parts.join("\n\n");
}
