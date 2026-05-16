import type {PostWithAuthor} from "../../services/template-service.js";
import {esc, formatDate} from "../lib.js";

export function PostCard(post: PostWithAuthor): string {
    const thumb = post.thumbnail
        ? `<div class="post-card-thumb"><img src="${esc(post.thumbnail)}" alt="${esc(post.title)}" loading="lazy" /></div>`
        : "";
    return `
        <a href="/blog/${esc(post.slug)}" class="post-card">
            ${thumb}
            <div class="post-card-body">
                <h2 class="post-card-title">${esc(post.title)}</h2>
                <p class="post-card-author">${esc(post.author.name)}</p>
                <p class="post-card-date">${esc(formatDate(post.createdAt))}</p>
            </div>
        </a>
    `;
}
