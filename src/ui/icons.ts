export type IconName =
    | "sun"
    | "moon"
    | "menu"
    | "close"
    | "ext"
    | "arrow-left"
    | "copy"
    | "check"
    | "link"
    | "dashboard"
    | "file"
    | "nav"
    | "post"
    | "mail"
    | "settings"
    | "logout"
    | "github"
    | "linkedin";

export function icon(name: IconName, className = "icon"): string {
    return `<svg class="${className}" aria-hidden="true"><use href="/icons.svg#${name}"/></svg>`;
}
