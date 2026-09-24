import {esc} from "../lib.js";

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
