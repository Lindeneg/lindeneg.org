import type {User} from "@prisma/client";
import {esc, initials} from "../lib.js";

export function AuthorAvatar(author: User, size: "sm" | "md" = "md"): string {
    const cls = `author-avatar author-avatar--${size}`;
    if (author.photo) {
        return `<img src="${esc(author.photo)}" alt="${esc(author.name)}" class="${cls}" loading="lazy" />`;
    }
    return `<div class="${cls} author-avatar--initials">${esc(initials(author.name))}</div>`;
}
