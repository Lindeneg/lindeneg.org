import type {PostWithRelations} from "../../repositories/post-repository.js";
import {esc, localDate} from "../lib.js";
import {TopicLabel} from "./tags.js";

export function PostCard(post: PostWithRelations): string {
    const thumb = post.thumbnail
        ? `<div class="post-card-thumb"><img src="${esc(post.thumbnail)}" alt="${esc(post.title)}" loading="lazy" /></div>`
        : "";
    return `
        <a href="/blog/${esc(post.slug)}" class="post-card">
            ${thumb}
            <div class="post-card-body">
                ${TopicLabel(post.tags)}
                <h2 class="post-card-title">${esc(post.title)}</h2>
                <p class="post-card-author">${esc(post.author.name)}</p>
                <p class="post-card-date">${localDate(post.publishedAt ?? post.createdAt)}</p>
            </div>
        </a>
    `;
}
