import type {Navigation, NavigationItem, User} from "@prisma/client";
import {AdminShell} from "../layout.js";
import {Checkbox, ConfirmForm, Field, PageHeader, Select, TopError} from "../components.js";

export type NavItemFormValues = {
    name?: string;
    href?: string;
    position?: number;
    alignment?: string;
    newTab?: boolean;
};

export type NavItemFormViewProps = {
    user: User;
    currentPath: string;
    mode: "create" | "edit";
    nav: Navigation;
    item?: NavigationItem;
    values?: NavItemFormValues;
    errors?: Record<string, string>;
    topError?: string;
};

export function NavItemFormView({
    user,
    currentPath,
    mode,
    nav,
    item,
    values,
    errors,
    topError,
}: NavItemFormViewProps): string {
    const v: NavItemFormValues = values ?? {
        name: item?.name ?? "",
        href: item?.href ?? "",
        position: item?.position ?? 0,
        alignment: item?.alignment ?? "RIGHT",
        newTab: item?.newTab ?? false,
    };
    const e = errors ?? {};
    const action = mode === "create" ? "/admin/nav-items/new" : `/admin/nav-items/${item!.id}/edit`;
    const deleteBlock =
        mode === "edit" && item
            ? `
                <hr class="form-divider" />
                <div class="danger-zone">
                    ${ConfirmForm({action: `/admin/nav-items/${item.id}/delete`, confirm: `Delete "${item.name}"?`, label: "Delete item", variant: "danger"})}
                </div>
            `
            : "";

    return AdminShell({
        title: mode === "create" ? "New nav item" : `Edit: ${item!.name}`,
        user,
        currentPath,
        children: `
            ${PageHeader({
                title: mode === "create" ? "New nav item" : `Edit: ${item!.name}`,
                back: {href: "/admin/navigation", label: "Back to navigation"},
            })}
            <form method="post" action="${action}" class="admin-form">
                ${TopError(topError)}
                <input type="hidden" name="navigationId" value="${nav.id}" />
                ${Field({name: "name", label: "Name", value: v.name, error: e.name, required: true})}
                ${Field({name: "href", label: "Href", value: v.href, error: e.href, required: true, placeholder: "/about or https://..."})}
                ${Field({name: "position", label: "Position", type: "number", value: v.position, error: e.position, required: true})}
                ${Select({name: "alignment", label: "Alignment", value: v.alignment, error: e.alignment, options: [{value: "LEFT", label: "Left"}, {value: "RIGHT", label: "Right"}]})}
                ${Checkbox({name: "newTab", label: "Open in new tab", checked: !!v.newTab})}
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">${mode === "create" ? "Create item" : "Save changes"}</button>
                </div>
            </form>
            ${deleteBlock}
        `,
    });
}
