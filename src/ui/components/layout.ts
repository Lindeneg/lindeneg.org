import type {NavigationWithItems} from "../../services/template-service.js";
import {esc} from "../lib.js";
import {Nav} from "./nav.js";
import {Footer} from "./footer.js";

export type LayoutProps = {
    title: string;
    description?: string | null;
    nav: NavigationWithItems;
    currentPath: string;
    children: string;
};

export function Layout({title, description, nav, currentPath, children}: LayoutProps): string {
    const desc = description ? `<meta name="description" content="${esc(description)}" />` : "";
    return `<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    ${desc}
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap" />
    <link rel="stylesheet" href="/highlight-github-dark.css" />
    <link rel="stylesheet" href="/styles.css" />
    <script src="/theme-boot.js"></script>
    <title>${esc(title)}</title>
</head>
<body>
    ${Nav(nav, currentPath)}
    <main class="site-main">${children}</main>
    ${Footer()}
    <script src="/client.js" defer></script>
</body>
</html>`;
}
