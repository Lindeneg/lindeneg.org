import type {Page, PageSection, User} from "@prisma/client";
import {esc, formatDate} from "../../lib.js";
import {AdminShell} from "../layout.js";
import {Checkbox, ConfirmForm, Field, PageHeader, TextArea, TopError} from "../components.js";

export type PageFormValues = {
    name?: string;
    slug?: string;
    title?: string;
    description?: string;
    published?: boolean;
};

export type PageFormViewProps = {
    user: User;
    currentPath: string;
    mode: "create" | "edit";
    page?: Page & {sections: PageSection[]};
    values?: PageFormValues;
    errors?: Record<string, string>;
    topError?: string;
};

function sectionRow(s: PageSection): string {
    const preview = s.content.slice(0, 120).replace(/\s+/g, " ");
    return `
        <li class="section-row">
            <div class="section-row-main">
                <a href="/admin/sections/${esc(s.id)}/edit" class="row-link">Section #${s.position}</a>
                <p class="row-sub">${esc(preview)}${s.content.length > 120 ? "…" : ""}</p>
            </div>
            <div class="section-row-meta">
                <span class="badge ${s.published ? "badge-on" : "badge-off"}">${s.published ? "Published" : "Draft"}</span>
                <span class="row-sub">${esc(formatDate(s.updatedAt))}</span>
            </div>
            <div class="row-actions">
                <a href="/admin/sections/${esc(s.id)}/edit" class="btn btn-ghost btn-sm">Edit</a>
                ${ConfirmForm({action: `/admin/sections/${s.id}/delete`, confirm: `Delete section #${s.position}?`, label: "Delete", variant: "danger"})}
            </div>
        </li>
    `;
}

export function PageFormView({user, currentPath, mode, page, values, errors, topError}: PageFormViewProps): string {
    const v: PageFormValues = values ?? {
        name: page?.name,
        slug: page?.slug,
        title: page?.title,
        description: page?.description,
        published: page?.published,
    };
    const action = mode === "create" ? "/admin/pages/new" : `/admin/pages/${page!.id}/edit`;
    const e = errors ?? {};

    const sections = mode === "edit" && page
        ? `
            <section class="admin-sections">
                <div class="admin-sections-head">
                    <h2 class="admin-h2">Sections</h2>
                    <a href="/admin/pages/${esc(page.id)}/sections/new" class="btn btn-primary btn-sm">New section</a>
                </div>
                ${page.sections.length === 0
                    ? `<p class="empty-state">No sections yet.</p>`
                    : `<ul class="section-list">${[...page.sections]
                          .sort((a, b) => a.position - b.position)
                          .map(sectionRow)
                          .join("")}</ul>`}
            </section>
        `
        : "";

    const deleteAction =
        mode === "edit" && page
            ? `
                <hr class="form-divider" />
                <div class="danger-zone">
                    <h3>Danger zone</h3>
                    ${ConfirmForm({action: `/admin/pages/${page.id}/delete`, confirm: `Delete page "${page.name}" and all its sections?`, label: "Delete page", variant: "danger"})}
                </div>
            `
            : "";

    return AdminShell({
        title: mode === "create" ? "New page" : `Edit: ${page!.name}`,
        user,
        currentPath,
        children: `
            ${PageHeader({
                title: mode === "create" ? "New page" : `Edit: ${page!.name}`,
                back: {href: "/admin/pages", label: "Back to pages"},
            })}
            <form method="post" action="${action}" class="admin-form">
                ${TopError(topError)}
                ${Field({name: "name", label: "Name", value: v.name, error: e.name, required: true})}
                ${Field({name: "slug", label: "Slug", value: v.slug, error: e.slug, required: true, placeholder: "auto-derived from name if blank"})}
                ${Field({name: "title", label: "Title (shown in browser tab)", value: v.title, error: e.title, required: true})}
                ${TextArea({name: "description", label: "Description (meta)", value: v.description, error: e.description, rows: 2})}
                ${Checkbox({name: "published", label: "Published", checked: !!v.published})}
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">${mode === "create" ? "Create page" : "Save changes"}</button>
                </div>
            </form>
            ${sections}
            ${deleteAction}
        `,
    });
}
