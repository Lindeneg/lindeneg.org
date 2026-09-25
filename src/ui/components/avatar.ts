import type {MaybeNull} from "../../lib/types.js";
import {esc, initials} from "../lib.js";

export type AvatarProps = {
    person: {name: string; photo: MaybeNull<string>};
    block: string;
    modifier?: string;
    alt?: string;
    lazy?: boolean;
};

export function Avatar({person, block, modifier, alt = "", lazy = false}: AvatarProps): string {
    const cls = modifier ? `${block} ${block}--${modifier}` : block;
    if (person.photo) {
        const loading = lazy ? ` loading="lazy"` : "";
        return `<img src="${esc(person.photo)}" alt="${esc(alt)}" class="${cls}"${loading} />`;
    }
    return `<div class="${cls} ${block}--initials">${esc(initials(person.name))}</div>`;
}
