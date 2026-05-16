import type {User} from "@prisma/client";
import {esc} from "../lib.js";
import {Sidebar} from "./sidebar.js";
import {Topbar} from "./topbar.js";

type Shell = {
    title: string;
    children: string;
};

function head(title: string, extraCss = ""): string {
    return `
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap" />
    <link rel="stylesheet" href="/styles.css" />
    <link rel="stylesheet" href="/admin.css" />
    ${extraCss}
    <script src="/theme-boot.js"></script>
    <title>${esc(title)}</title>`;
}

export type AdminShellProps = Shell & {
    user: User;
    currentPath: string;
};

export function AdminShell({title, user, currentPath, children}: AdminShellProps): string {
    return `<!doctype html>
<html lang="en">
<head>${head(title)}</head>
<body class="admin-body">
    ${Sidebar(currentPath)}
    <div class="admin-main">
        ${Topbar(user)}
        <div class="admin-content">${children}</div>
    </div>
    <script src="/admin.js" defer></script>
</body>
</html>`;
}

export function AuthShell({title, children}: Shell): string {
    return `<!doctype html>
<html lang="en">
<head>${head(title)}</head>
<body class="admin-auth-body">
    <main class="admin-auth-main">${children}</main>
</body>
</html>`;
}

export type EditorShellProps = Shell & {
    headerBar: string;
};

export function EditorShell({title, headerBar, children}: EditorShellProps): string {
    const previewAssets = `
    <link rel="stylesheet" href="/highlight-github-dark.css" />
    <script src="https://cdn.jsdelivr.net/npm/marked@18.0.3/lib/marked.umd.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.11.1/highlight.min.js"></script>`;
    return `<!doctype html>
<html lang="en">
<head>${head(title, previewAssets)}</head>
<body class="admin-editor-body">
    ${headerBar}
    <div class="admin-editor-body-inner">${children}</div>
    <script src="/admin.js" defer></script>
</body>
</html>`;
}
