import {esc} from "../lib.js";

export type FieldProps = {
    name: string;
    label: string;
    value?: string | number | null;
    error?: string;
    type?: "text" | "email" | "password" | "number" | "url";
    placeholder?: string;
    required?: boolean;
    autocomplete?: string;
};

export function Field(props: FieldProps): string {
    const value = props.value == null ? "" : String(props.value);
    const type = props.type ?? "text";
    const required = props.required ? " required" : "";
    const autocomplete = props.autocomplete ? ` autocomplete="${esc(props.autocomplete)}"` : "";
    const placeholder = props.placeholder ? ` placeholder="${esc(props.placeholder)}"` : "";
    const errorHtml = props.error
        ? `<p class="form-error">${esc(props.error)}</p>`
        : "";
    const invalid = props.error ? " is-invalid" : "";
    return `
        <div class="form-row${invalid}">
            <label class="form-label" for="f_${esc(props.name)}">${esc(props.label)}</label>
            <input
                class="form-input"
                id="f_${esc(props.name)}"
                name="${esc(props.name)}"
                type="${type}"
                value="${esc(value)}"
                ${placeholder}${autocomplete}${required}
            />
            ${errorHtml}
        </div>
    `;
}

export type TextAreaProps = {
    name: string;
    label: string;
    value?: string | null;
    error?: string;
    rows?: number;
    placeholder?: string;
    required?: boolean;
};

export function TextArea(props: TextAreaProps): string {
    const value = props.value ?? "";
    const rows = props.rows ?? 4;
    const required = props.required ? " required" : "";
    const placeholder = props.placeholder ? ` placeholder="${esc(props.placeholder)}"` : "";
    const errorHtml = props.error
        ? `<p class="form-error">${esc(props.error)}</p>`
        : "";
    const invalid = props.error ? " is-invalid" : "";
    return `
        <div class="form-row${invalid}">
            <label class="form-label" for="f_${esc(props.name)}">${esc(props.label)}</label>
            <textarea
                class="form-input form-textarea"
                id="f_${esc(props.name)}"
                name="${esc(props.name)}"
                rows="${rows}"
                ${placeholder}${required}
            >${esc(value)}</textarea>
            ${errorHtml}
        </div>
    `;
}

export type CheckboxProps = {
    name: string;
    label: string;
    checked?: boolean;
};

export function Checkbox(props: CheckboxProps): string {
    const checked = props.checked ? " checked" : "";
    return `
        <label class="form-check">
            <input type="checkbox" name="${esc(props.name)}" value="1"${checked} />
            <span>${esc(props.label)}</span>
        </label>
    `;
}

export type SelectProps = {
    name: string;
    label: string;
    value?: string;
    error?: string;
    options: Array<{value: string; label: string}>;
};

export function Select(props: SelectProps): string {
    const opts = props.options
        .map(
            (o) =>
                `<option value="${esc(o.value)}"${o.value === props.value ? " selected" : ""}>${esc(o.label)}</option>`
        )
        .join("");
    const errorHtml = props.error ? `<p class="form-error">${esc(props.error)}</p>` : "";
    const invalid = props.error ? " is-invalid" : "";
    return `
        <div class="form-row${invalid}">
            <label class="form-label" for="f_${esc(props.name)}">${esc(props.label)}</label>
            <select class="form-input" id="f_${esc(props.name)}" name="${esc(props.name)}">
                ${opts}
            </select>
            ${errorHtml}
        </div>
    `;
}

export function TopError(message: string | undefined): string {
    if (!message) return "";
    return `<div class="form-top-error">${esc(message)}</div>`;
}

export type ConfirmFormProps = {
    action: string;
    confirm: string;
    label: string;
    variant?: "danger" | "default";
};

export function ConfirmForm({action, confirm, label, variant = "default"}: ConfirmFormProps): string {
    const cls = variant === "danger" ? "btn btn-danger btn-sm" : "btn btn-ghost btn-sm";
    return `
        <form method="post" action="${esc(action)}" data-confirm="${esc(confirm)}" class="inline-form">
            <button type="submit" class="${cls}">${esc(label)}</button>
        </form>
    `;
}

export type PaginationProps = {
    page: number;
    totalPages: number;
    basePath: string;
    extraQuery?: string;
};

export function Pagination({page, totalPages, basePath, extraQuery = ""}: PaginationProps): string {
    if (totalPages <= 1) return "";
    const q = extraQuery ? `&${extraQuery}` : "";
    const prev =
        page > 1
            ? `<a class="btn btn-ghost btn-sm" href="${esc(basePath)}?page=${page - 1}${q}">Previous</a>`
            : `<span class="btn btn-ghost btn-sm is-disabled">Previous</span>`;
    const next =
        page < totalPages
            ? `<a class="btn btn-ghost btn-sm" href="${esc(basePath)}?page=${page + 1}${q}">Next</a>`
            : `<span class="btn btn-ghost btn-sm is-disabled">Next</span>`;
    return `
        <div class="pager">
            ${prev}
            <span class="pager-info">Page ${page} of ${totalPages}</span>
            ${next}
        </div>
    `;
}

export function PageHeader(opts: {title: string; right?: string; back?: {href: string; label: string}}): string {
    const back = opts.back
        ? `<a href="${esc(opts.back.href)}" class="back-link">← ${esc(opts.back.label)}</a>`
        : "";
    const right = opts.right ?? "";
    return `
        <div class="admin-page-header">
            <div>
                ${back}
                <h1 class="admin-page-title">${esc(opts.title)}</h1>
            </div>
            <div class="admin-page-header-right">${right}</div>
        </div>
    `;
}
