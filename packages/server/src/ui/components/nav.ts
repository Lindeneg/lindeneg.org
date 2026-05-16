import type {NavigationWithItems} from "../../services/template-service.js";
import {ICON_CLOSE, ICON_EXT, ICON_MENU, ICON_MOON, ICON_SUN} from "../icons.js";
import {esc, isActive} from "../lib.js";

type NavItem = NavigationWithItems["items"][number];

function navLink(item: NavItem, currentPath: string, mobile = false): string {
    const isExternal = item.newTab || /^https?:\/\//i.test(item.href);
    const target = isExternal ? ` target="_blank" rel="noopener noreferrer"` : "";
    const current = isActive(item.href, currentPath) ? ` aria-current="page"` : "";
    const cls = mobile ? "nav-link nav-link--mobile" : "nav-link";
    const ext = isExternal ? ICON_EXT : "";
    return `<a href="${esc(item.href)}" class="${cls}"${target}${current}>${esc(item.name)}${ext}</a>`;
}

export function Nav(nav: NavigationWithItems, currentPath: string): string {
    const sorted = [...nav.items].sort((a, b) => a.position - b.position);
    const left = sorted.filter((i) => i.alignment?.toUpperCase() === "LEFT");
    const right = sorted.filter((i) => i.alignment?.toUpperCase() !== "LEFT");

    const leftDesktop = left.map((i) => navLink(i, currentPath)).join("");
    const rightDesktop = right.map((i) => navLink(i, currentPath)).join("");
    const allMobile = sorted.map((i) => navLink(i, currentPath, true)).join("");

    return `
        <nav class="site-nav">
            <div class="site-nav-inner">
                <div class="site-nav-group">
                    <a href="/" class="site-brand">${esc(nav.brandName)}</a>
                    <div class="site-nav-items site-nav-items--desktop">${leftDesktop}</div>
                </div>
                <div class="site-nav-group">
                    <div class="site-nav-items site-nav-items--desktop">${rightDesktop}</div>
                    <button class="icon-btn" type="button" data-theme-toggle aria-label="Toggle theme">
                        <span class="icon-slot icon-slot--sun">${ICON_SUN}</span>
                        <span class="icon-slot icon-slot--moon">${ICON_MOON}</span>
                    </button>
                    <button class="icon-btn site-mobile-toggle" type="button" data-mobile-open aria-label="Open menu">
                        ${ICON_MENU}
                    </button>
                </div>
            </div>
        </nav>
        <div class="mobile-drawer" data-mobile-drawer hidden>
            <div class="mobile-drawer-overlay" data-mobile-close></div>
            <aside class="mobile-drawer-panel" role="dialog" aria-modal="true" aria-label="Site navigation">
                <div class="mobile-drawer-head">
                    <span class="mobile-drawer-title">${esc(nav.brandName)}</span>
                    <button class="icon-btn" type="button" data-mobile-close aria-label="Close menu">${ICON_CLOSE}</button>
                </div>
                <div class="mobile-drawer-items">${allMobile}</div>
            </aside>
        </div>
    `;
}
