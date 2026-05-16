import type {Page, PageSection} from "@prisma/client";
import {esc} from "../../lib.js";
import {EditorShell} from "../layout.js";
import {TopError} from "../components.js";

export type SectionFormValues = {
    content?: string;
    position?: number;
    published?: boolean;
};

export type SectionFormViewProps = {
    mode: "create" | "edit";
    page: Page;
    section?: PageSection;
    values?: SectionFormValues;
    errors?: Record<string, string>;
    topError?: string;
};

export function SectionFormView({mode, page, section, values, errors, topError}: SectionFormViewProps): string {
    const v: SectionFormValues = values ?? {
        content: section?.content ?? "",
        position: section?.position ?? 0,
        published: section?.published ?? false,
    };
    const e = errors ?? {};
    const action =
        mode === "create"
            ? `/admin/pages/${page.id}/sections/new`
            : `/admin/sections/${section!.id}/edit`;
    const positionError = e.position ? `<span class="form-error-inline">${esc(e.position)}</span>` : "";
    const contentError = e.content ? `<div class="form-top-error">${esc(e.content)}</div>` : "";

    const headerBar = `
        <header class="md-editor-bar">
            <a href="/admin/pages/${esc(page.id)}/edit" class="back-link">← ${esc(page.name)}</a>
            <h1 class="md-editor-title">${mode === "create" ? "New section" : `Section #${section!.position}`}</h1>
            <div class="md-editor-controls">
                <label class="md-editor-position">
                    Position
                    <input type="number" name="position" form="md-form" value="${v.position ?? 0}" min="0" step="1" />
                    ${positionError}
                </label>
                <label class="md-editor-publish">
                    <input type="checkbox" name="published" form="md-form" value="1"${v.published ? " checked" : ""} />
                    Published
                </label>
                <button type="submit" form="md-form" class="btn btn-primary">Save</button>
            </div>
        </header>
    `;

    const editorBody = `
        ${TopError(topError)}
        ${contentError}
        <form id="md-form" method="post" action="${action}" class="md-editor-form">
            <div class="md-editor-split">
                <textarea
                    class="md-editor-source"
                    name="content"
                    data-md-source
                    required
                    spellcheck="false"
                >${esc(v.content ?? "")}</textarea>
                <div class="md-editor-preview markdown" data-md-preview></div>
            </div>
        </form>
    `;

    return EditorShell({
        title: mode === "create" ? `New section · ${page.name}` : `Section #${section!.position} · ${page.name}`,
        headerBar,
        children: editorBody,
    });
}
