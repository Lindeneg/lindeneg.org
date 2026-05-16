import type {NavigationWithItems} from "../../services/template-service.js";
import {Layout} from "../components/layout.js";

export function NotFound(nav: NavigationWithItems, currentPath: string): string {
    return Layout({
        title: `Not Found — ${nav.brandName}`,
        nav,
        currentPath,
        children: `
            <div class="not-found">
                <h1 class="not-found-title">404</h1>
                <p class="not-found-text">This page doesn't exist.</p>
                <a href="/" class="not-found-link">Go home</a>
            </div>
        `,
    });
}
