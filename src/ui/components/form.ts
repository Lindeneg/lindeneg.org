import type {MaybeNull, MaybeUndefined} from "../../lib/types.js";
import {esc} from "../lib.js";

function formRow(name: string, label: string, control: string, error?: string): string {
    const errorHtml = error ? `<p class="form-error">${esc(error)}</p>` : "";
    const invalid = error ? " is-invalid" : "";
    return `
        <div class="form-row${invalid}">
            <label class="form-label" for="f_${esc(name)}">${esc(label)}</label>
            ${control}
            ${errorHtml}
        </div>
    `;
}

export type FieldProps = {
    name: string;
    label: string;
    value?: MaybeNull<string | number>;
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
    const control = `
            <input
                class="form-input"
                id="f_${esc(props.name)}"
                name="${esc(props.name)}"
                type="${type}"
                value="${esc(value)}"
                ${placeholder}${autocomplete}${required}
            />`;
    return formRow(props.name, props.label, control, props.error);
}

export type TextAreaProps = {
    name: string;
    label: string;
    value?: MaybeNull<string>;
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
    const control = `
            <textarea
                class="form-input form-textarea"
                id="f_${esc(props.name)}"
                name="${esc(props.name)}"
                rows="${rows}"
                ${placeholder}${required}
            >${esc(value)}</textarea>`;
    return formRow(props.name, props.label, control, props.error);
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
    const control = `
            <select class="form-input" id="f_${esc(props.name)}" name="${esc(props.name)}">
                ${opts}
            </select>`;
    return formRow(props.name, props.label, control, props.error);
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

export function TopError(message: MaybeUndefined<string>): string {
    if (!message) return "";
    return `<div class="form-top-error">${esc(message)}</div>`;
}
