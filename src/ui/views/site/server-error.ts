import type {NavigationWithItems} from "../../../repositories/navigation-repository.js";
import {SiteLayout} from "../../components/layout.js";

export type ServerErrorViewProps = {
    nav: NavigationWithItems;
    currentPath: string;
};

export function ServerErrorView({nav, currentPath}: ServerErrorViewProps): string {
    return SiteLayout({
        title: `Error — ${nav.brandName}`,
        nav,
        currentPath,
        children: `
            <div class="not-found">
                <h1 class="not-found-title">500</h1>
                <p class="not-found-text">Something went wrong, try again in a moment.</p>
                <a href="/" class="not-found-link">Go home</a>
            </div>
        `,
    });
}
