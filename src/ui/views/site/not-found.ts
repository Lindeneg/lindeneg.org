import type {NavigationWithItems} from "../../../repositories/navigation-repository.js";
import {SiteLayout} from "../../components/layout.js";

export type NotFoundViewProps = {
    nav: NavigationWithItems;
    currentPath: string;
};

export function NotFoundView({nav, currentPath}: NotFoundViewProps): string {
    return SiteLayout({
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
